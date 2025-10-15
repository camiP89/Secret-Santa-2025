// src/secretSanta.js
// --------------------------
// Secret Santa Game Script
// --------------------------

// Import Firebase setup
import { app, analytics, database } from "../src/firebase.js";
import { ref, onValue, set, update } from "firebase/database";

// Firebase references
const assignmentsRef = ref(database, "secretSanta/assignments");
const revealedPlayersRef = ref(database, "secretSanta/revealedPlayers");

// Player list
const players = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

// Global assignments variable to be set once loaded from Firebase
let currentAssignments = null;

// Utility: Generate Secret Santa assignments (no one gets themselves)
function generateAssignments(names) {
  let recipients;
  do {
    recipients = [...names].sort(() => Math.random() - 0.5);
  } while (names.some((n, i) => n === recipients[i]));
  return Object.fromEntries(names.map((n, i) => [n, recipients[i]]));
}

// Function to render button states based on Firebase data
function renderButtonStates(buttons, revealedStates, allPlayersRevealed) {
  buttons.forEach((btn) => {
    const playerName = btn.dataset.player;
    // Reset to default before applying current state
    btn.textContent = `Reveal for ${playerName}`;
    btn.disabled = false;
    btn.style.backgroundColor = "";
    btn.style.color = "";

    if (revealedStates[playerName]) {
      // Player has revealed
      btn.textContent = `Revealed: ${playerName}`;
      btn.disabled = true;
      btn.style.backgroundColor = "var(--orange)";
      btn.style.color = "var(--dark-red)";
    } else if (allPlayersRevealed) {
      // Game over: everyone has revealed
      btn.textContent = "Game Over 🔒";
      btn.disabled = true;
    }
    // IMPORTANT: Event listeners are NOT attached/detached here.
    // They are attached once during DOMContentLoaded.
  });
}

// Function to render revealBox content based on Firebase data and local storage
function renderRevealBox(revealBox, allPlayersRevealed) {
  const localRevealedPlayer = localStorage.getItem("secretSantaRevealedPlayer");
  const localAssignment = localStorage.getItem("secretSantaAssignment");

  if (allPlayersRevealed) {
    revealBox.textContent = "Everyone has revealed! Merry Christmas! 🎄";
    console.log("All players revealed! Game over.");
    // Clear local storage as the game has globally ended
    localStorage.removeItem("secretSantaRevealedPlayer");
    localStorage.removeItem("secretSantaAssignment");
  } else if (localRevealedPlayer && localAssignment) {
    // If a player has revealed locally and the game isn't over yet globally
    revealBox.textContent = `${localRevealedPlayer}, you are Secret Santa for ${localAssignment}! 🎁`;
  } else {
    // Default state: no local reveal and game not over
    revealBox.textContent = "";
  }
}

// -------------------------------------------
// DOM Ready
// -------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("Secret Santa script loaded.");

  const revealBox = document.getElementById("reveal");
  const buttons = document.querySelectorAll("button[data-player]");
  const resetGameBtn = document.getElementById("reset-game-btn");

  // 🔁 RESET BUTTON LOGIC
  if (resetGameBtn) {
    resetGameBtn.addEventListener("click", async () => {
      if (
        confirm(
          "Are you sure you want to reset the Secret Santa game? This will clear all assignments and revealed states for everyone!"
        )
      ) {
        try {
          await set(assignmentsRef, null); // Clear assignments
          await set(revealedPlayersRef, null); // Clear revealed states
          localStorage.removeItem("secretSantaRevealedPlayer"); // Clear local state
          localStorage.removeItem("secretSantaAssignment"); // Clear local state
          alert("Game has been reset!");
          console.log("Game data reset in Firebase.");
        } catch (error) {
          console.error("Error resetting game:", error);
          alert("Failed to reset game: " + error.message);
        }
      }
    });
  }

  // Attach click listeners to ALL buttons ONCE when the DOM is ready
  buttons.forEach((btn) => {
    const playerName = btn.dataset.player;
    btn.addEventListener("click", async () => {
      if (!currentAssignments) {
        console.warn("Assignments not yet loaded. Please wait a moment.");
        // Optionally, you might want to show a loading spinner or
        // temporary message in the UI to indicate data is still loading.
        return;
      }

      console.log(`${playerName} clicked to reveal.`);

      // --- IMMEDIATE LOCAL FEEDBACK (for user experience) ---
      // 1. Disable the clicked button and change its text
      btn.disabled = true;
      btn.textContent = "Revealing...";

      // 2. Lock ALL OTHER buttons locally with a padlock
      buttons.forEach((b) => {
        if (b.dataset.player !== playerName) {
          b.disabled = true;
          b.textContent = `${b.dataset.player} 🔒`;
        }
      });
      // --- END IMMEDIATE LOCAL FEEDBACK ---

      // Get the assignment from the globally available 'currentAssignments'
      const target = currentAssignments[playerName];

      // Store this player's reveal information in local storage for persistence
      localStorage.setItem("secretSantaRevealedPlayer", playerName);
      localStorage.setItem("secretSantaAssignment", target);
      // Display the personal assignment immediately
      revealBox.textContent = `${playerName}, you are Secret Santa for ${target}! 🎁`;

      try {
        // Update Firebase to mark this player as revealed
        await update(revealedPlayersRef, { [playerName]: true });
        console.log(`${playerName} marked as revealed in Firebase.`);
      } catch (error) {
        console.error("Error updating revealed state:", error);
        // If Firebase update fails, revert local UI state for all buttons
        // The renderButtonStates from the onValue listener will eventually
        // correct the state, but this helps immediate feedback.
        alert("Failed to reveal. Please try again.");
        buttons.forEach((b) => {
          const pName = b.dataset.player;
          b.disabled = false; // Re-enable all
          b.textContent = `Reveal for ${pName}`; // Reset text
        });
        localStorage.removeItem("secretSantaRevealedPlayer");
        localStorage.removeItem("secretSantaAssignment");
        revealBox.textContent = ""; // Clear personal message
      }
    });
  });

  // -------------------------------------------
  // Listen for assignments in Firebase
  // -------------------------------------------
  onValue(assignmentsRef, (assignmentsSnapshot) => {
    let assignments = assignmentsSnapshot.val();

    // Generate new assignments if none exist
    if (!assignments) {
      console.log("No assignments found — generating new ones...");
      assignments = generateAssignments(players);
      set(assignmentsRef, assignments)
        .then(() => console.log("Assignments saved to Firebase."))
        .catch((error) => console.error("Error saving assignments:", error));
    } else {
      console.log("Assignments loaded from Firebase.");
      currentAssignments = assignments; // Set the global variable
    }
    // This listener primarily ensures currentAssignments is available.
    // UI rendering is handled by the revealedPlayersRef listener.
  });

  // -------------------------------------------
  // Listen for revealed players in Firebase
  // -------------------------------------------
  onValue(revealedPlayersRef, (revealedSnapshot) => {
    const revealedStates = revealedSnapshot.val() || {};
    const totalRevealed = Object.keys(revealedStates).filter(
      (name) => revealedStates[name]
    ).length;
    const allPlayersRevealed = totalRevealed === players.length;

    // Use a dedicated function to render button states
    // This will *overwrite* the immediate local feedback
    // with the confirmed state from Firebase.
    renderButtonStates(buttons, revealedStates, allPlayersRevealed);

    // Use a dedicated function to render the revealBox content
    // This function will intelligently use local storage for persistence
    // and Firebase data for the "game over" state.
    renderRevealBox(revealBox, allPlayersRevealed);
  }); // end revealedPlayers listener
}); // end DOMContentLoaded
