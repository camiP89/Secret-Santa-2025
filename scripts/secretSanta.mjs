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
function renderRevealBox(revealBox, revealedStates, allPlayersRevealed) {
  const localRevealedPlayer = localStorage.getItem("secretSantaRevealedPlayer");
  const localAssignment = localStorage.getItem("secretSantaAssignment");

  // Check if the current user has revealed according to their local storage
  // AND if their revealed state is still true in Firebase (to prevent stale local data)
  const userHasRevealedLocallyAndFirebaseConfirms =
    localRevealedPlayer &&
    localAssignment &&
    revealedStates[localRevealedPlayer]; // Check Firebase for confirmation

  if (userHasRevealedLocallyAndFirebaseConfirms) {
    // Prioritize showing the personal assignment if the user has revealed
    revealBox.textContent = `${localRevealedPlayer}, you are Secret Santa for ${localAssignment}! 🎁`;
  } else if (allPlayersRevealed) {
    // If everyone has revealed, AND the current user hasn't revealed themselves (or their local data is stale),
    // THEN display the global "Everyone has revealed!" message.
    revealBox.textContent = "Everyone has revealed! Merry Christmas! 🎄";
    console.log("All players revealed! Game over.");
    // At this point, if there's any stale local reveal data for a user who hasn't actually revealed, clear it.
    localStorage.removeItem("secretSantaRevealedPlayer");
    localStorage.removeItem("secretSantaAssignment");
  } else {
    // Default state: no local reveal for current user, and game not over globally
    revealBox.textContent = "";
    // Ensure local storage is clear if no active reveal and game isn't over
    localStorage.removeItem("secretSantaRevealedPlayer");
    localStorage.removeItem("secretSantaAssignment");
  }
}

// -------------------------------------------
// DOM Ready
// -------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("Secret Santa script loaded.");

  const revealBox = document.getElementById("reveal");
  const buttons = document.querySelectorAll("button[data-player]");
  // Removed: const resetGameBtn = document.getElementById("reset-game-btn");

  // Removed: 🔁 RESET BUTTON LOGIC block

  // Attach click listeners to ALL buttons ONCE when the DOM is ready
  buttons.forEach((btn) => {
    const playerName = btn.dataset.player;
    btn.addEventListener("click", async () => {
      if (!currentAssignments) {
        console.warn("Assignments not yet loaded. Please wait a moment.");
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

    // Pass revealedStates to renderRevealBox
    renderRevealBox(revealBox, revealedStates, allPlayersRevealed);
  }); // end revealedPlayers listener
}); // end DOMContentLoaded
