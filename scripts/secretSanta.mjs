// ... (existing imports)
import { app, analytics, database } from '../src/firebase.js';
import { ref, onValue, set } from "firebase/database";
// ... (existing const players, generateAssignments function)


// Get references to the specific locations in your Realtime Database
const assignmentsRef = ref(database, "secretSanta/assignments");
const revealedStateRef = ref(database, "secretSanta/revealedState");

const players = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

function generateAssignments(names) {
  let recipients;
  do {
    recipients = [...names].sort(() => Math.random() - 0.5);
  } while (names.some((n, i) => n === recipients[i])); // Ensure no one gets themselves
  return Object.fromEntries(names.map((n, i) => [n, recipients[i]]));
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Secret Santa game script loaded and DOM parsed.");

  const revealBox = document.getElementById("reveal");
  const buttons = document.querySelectorAll("button[data-player]");

  // --- NEW: Get reference to the reset button ---
  const resetGameBtn = document.getElementById("reset-game-btn");

  // --- NEW: Add event listener for the reset button ---
  if (resetGameBtn) {
    resetGameBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to reset the Secret Santa game? This will clear all assignments and revealed states for everyone!")) {
        console.log("Resetting Secret Santa game data in Firebase...");
        try {
          // Setting a path to null in Realtime Database effectively deletes it
          await set(assignmentsRef, null);
          await set(revealedStateRef, null);
          console.log("Secret Santa game data successfully reset!");
          alert("Game has been reset!");
        } catch (error) {
          console.error("Error resetting Secret Santa game data:", error);
          alert("Failed to reset game: " + error.message);
        }
      }
    });
  }


  // Listen for changes to the assignments in Firebase
  onValue(assignmentsRef, (assignmentsSnapshot) => {
    let assignments = assignmentsSnapshot.val();

    // If assignments don't exist in Firebase yet, generate and save them
    if (!assignments) {
      console.log("No assignments found. Generating new ones...");
      assignments = generateAssignments(players);
      set(assignmentsRef, assignments)
        .then(() => console.log("Assignments generated and saved."))
        .catch(error => console.error("Error saving new assignments:", error));
    } else {
      console.log("Assignments loaded from Firebase.");
    }

    // Now, listen for changes to the revealed state in Firebase
    onValue(revealedStateRef, (revealedStateSnapshot) => {
      const revealedData = revealedStateSnapshot.val() || {
        name: null,
        isGameOver: false,
      };
      const revealedName = revealedData.name;
      const gameOver = revealedData.isGameOver;

      // Reset buttons and display for the current state from Firebase
      buttons.forEach((btn) => {
        const playerName = btn.dataset.player;
        btn.disabled = false; // Re-enable all buttons initially
        btn.style.backgroundColor = ""; // Reset styling
        btn.style.color = ""; // Reset styling
        btn.textContent = `Reveal for ${playerName}`; // Reset text
      });
      revealBox.textContent = ""; // Clear reveal box

      // If the game is already over (someone revealed), update UI accordingly
      if (gameOver === true && revealedName) {
        console.log(`Game is over. ${revealedName} revealed their assignment.`);
        const target = assignments[revealedName];
        revealBox.textContent = `${revealedName}, you are Secret Santa for ${target}! 🎁`;

        buttons.forEach((btn) => {
          const name = btn.dataset.player;
          if (name === revealedName) {
            btn.textContent = `Revealed: ${name}`;
            btn.disabled = true;
            btn.style.backgroundColor = "var(--orange)";
            btn.style.color = "var(--dark-red)";
          } else {
            btn.textContent = "Locked 🔒";
            btn.disabled = true;
          }
        });
        return; // Exit if game is already over
      }

      // If the game is not over, attach click listeners to the buttons
      buttons.forEach((btn) => {
        // Remove any previous event listeners to prevent duplicates if data changes
        btn.onclick = null;
        btn.addEventListener("click", () => {
          const name = btn.dataset.player;
          const target = assignments[name];

          revealBox.textContent = `${name}, you are Secret Santa for ${target}! 🎁`;

          // Update the UI for all buttons locally
          buttons.forEach((b) => {
            if (b !== btn) {
              b.textContent = "Locked 🔒";
              b.disabled = true;
            } else {
              b.textContent = `Revealed: ${name}`;
              b.disabled = true;
              b.style.backgroundColor = "var(--orange)";
              b.style.color = "var(--dark-red)";
            }
          });

          // --- IMPORTANT: Update Firebase with the revealed state ---
          // This will trigger the `onValue` listener on all connected clients,
          // including this one, and update their UI to reflect the "game over" state.
          console.log(`${name} is revealing their assignment.`);
          set(revealedStateRef, { name: name, isGameOver: true })
            .then(() => console.log("Revealed state updated in Firebase."))
            .catch(error => console.error("Error updating revealed state:", error));
        });
      });
    });
  });
});
