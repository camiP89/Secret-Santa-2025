// src/secretSanta.js (or main.js)

// Import the initialized Firebase app, analytics, and database from your firebase.js file
import { app, analytics, database } from "../src/firebase.js";

// Import specific functions needed from the Realtime Database SDK
// We now need 'update' to modify individual properties within a Firebase object
import { ref, onValue, set, update } from "firebase/database"; // <-- 'update' is added here

// Get references to the specific locations in your Realtime Database
const assignmentsRef = ref(database, "secretSanta/assignments");
// This reference will now store an object like { "Andy": true, "Liz": false, ... }
const revealedPlayersRef = ref(database, "secretSanta/revealedPlayers"); // <-- CHANGED REF NAME

const players = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

// Function to generate Secret Santa assignments
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
  const resetGameBtn = document.getElementById("reset-game-btn");

  // Add event listener for the reset button
  if (resetGameBtn) {
    resetGameBtn.addEventListener("click", async () => {
      if (
        confirm(
          "Are you sure you want to reset the Secret Santa game? This will clear all assignments and revealed states for everyone!"
        )
      ) {
        console.log("Resetting Secret Santa game data in Firebase...");
        try {
          // Setting paths to null effectively deletes the data
          await set(assignmentsRef, null);
          await set(revealedPlayersRef, null); // <-- Reset this new ref
          console.log("Secret Santa game data successfully reset!");
          alert("Game has been reset!");
        } catch (error) {
          console.error("Error resetting Secret Santa game data:", error);
          alert("Failed to reset game: " + error.message);
        }
      }
    });
  }

  // --- Main Game Logic Listener ---
  // This listener observes changes to the generated assignments
  onValue(assignmentsRef, (assignmentsSnapshot) => {
    let assignments = assignmentsSnapshot.val();

    // If assignments don't exist in Firebase yet, generate and save them
    if (!assignments) {
      console.log("No assignments found. Generating new ones...");
      assignments = generateAssignments(players);
      set(assignmentsRef, assignments)
        .then(() => console.log("Assignments generated and saved."))
        .catch((error) =>
          console.error("Error saving new assignments:", error)
        );
    } else {
      console.log("Assignments loaded from Firebase.");
    }

    // --- NEW: Listener for Individual Player Revealed States ---
    // This listener observes changes to which players have revealed their assignments
    onValue(revealedPlayersRef, (revealedPlayersSnapshot) => {
      // revealedStates will be an object like { "Andy": true, "Liz": false }
      const revealedStates = revealedPlayersSnapshot.val() || {};

      // Calculate how many players have revealed
      const totalRevealed = Object.keys(revealedStates).filter(
        (name) => revealedStates[name]
      ).length;
      const allPlayersRevealed = totalRevealed === players.length; // Check if everyone has revealed

      // Reset buttons to their default visual state before applying current states
      buttons.forEach((btn) => {
        const playerName = btn.dataset.player;
        btn.textContent = `Reveal for ${playerName}`;
        btn.disabled = false;
        btn.style.backgroundColor = "";
        btn.style.color = "";
      });
      revealBox.textContent = ""; // Clear the main reveal box initially

      // --- Apply current game state based on Firebase data ---
      buttons.forEach((btn) => {
        const playerName = btn.dataset.player; // The name associated with this button

        if (revealedStates[playerName]) {
          // If this player has already revealed (their status is 'true' in Firebase)
          btn.textContent = `Revealed: ${playerName}`;
          btn.disabled = true; // Disable their own button after revealing
          btn.style.backgroundColor = "var(--orange)";
          btn.style.color = "var(--dark-red)";
        } else if (allPlayersRevealed) {
          // If all players have revealed, and this button's player hasn't yet, lock it
          btn.textContent = "Game Over 🔒";
          btn.disabled = true;
        }
      });

      // --- Logic for when ALL players have revealed ---
      if (allPlayersRevealed) {
        console.log("All players have revealed! Game Over.");
        revealBox.textContent = "Everyone has revealed! Merry Christmas! 🎄";
        // All buttons will already be locked by the loop above, if not revealed.
      } else {
        // --- Attach Click Listeners for unrevealed players ---
        // We only add listeners to buttons for players who haven't revealed yet
        buttons.forEach((btn) => {
          const playerName = btn.dataset.player;
          if (!revealedStates[playerName]) {
            // If player hasn't revealed yet
            btn.onclick = null; // Remove any old click handlers first
            btn.addEventListener(
              "click",
              () => {
                console.log(
                  `${playerName} is attempting to reveal their assignment.`
                );

                // Show their assignment in the reveal box
                const target = assignments[playerName];
                revealBox.textContent = `${playerName}, you are Secret Santa for ${target}! 🎁`;

                // Mark this specific player as revealed in Firebase using 'update'
                // This is crucial: 'update' modifies only the specific property,
                // without overwriting other players' revealed statuses.
                update(revealedPlayersRef, { [playerName]: true })
                  .then(() =>
                    console.log(
                      `${playerName} revealed state updated in Firebase.`
                    )
                  )
                  .catch((error) =>
                    console.error("Error updating revealed state:", error)
                  );
              },
              { once: true }
            ); // Use { once: true } to ensure the event fires only once per click
          }
        });
      }
    }); // End of onValue(revealedPlayersRef) listener
  }); // End of onValue(assignmentsRef) listener
}); // End of DOMContentLoaded
