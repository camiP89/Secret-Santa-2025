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

// Utility: Generate Secret Santa assignments (no one gets themselves)
function generateAssignments(names) {
  let recipients;
  do {
    recipients = [...names].sort(() => Math.random() - 0.5);
  } while (names.some((n, i) => n === recipients[i]));
  return Object.fromEntries(names.map((n, i) => [n, recipients[i]]));
}

// -------------------------------------------
// DOM Ready
// -------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("Secret Santa script loaded.");

  const revealBox = document.getElementById("reveal");
  const buttons = document.querySelectorAll("button[data-player]");

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
    }

    // -------------------------------------------
    // Listen for revealed players in Firebase
    // -------------------------------------------
    onValue(revealedPlayersRef, (revealedSnapshot) => {
      const revealedStates = revealedSnapshot.val() || {};
      const totalRevealed = Object.keys(revealedStates).filter(
        (name) => revealedStates[name]
      ).length;
      const allPlayersRevealed = totalRevealed === players.length;

      // Reset buttons visually
      buttons.forEach((btn) => {
        const playerName = btn.dataset.player;
        btn.textContent = `Reveal for ${playerName}`;
        btn.disabled = false;
        btn.style.backgroundColor = "";
        btn.style.color = "";
      });
      revealBox.textContent = "";

      // Update button states based on revealed data
      buttons.forEach((btn) => {
        const playerName = btn.dataset.player;

        if (revealedStates[playerName]) {
          // 🔒 Player has revealed
          btn.textContent = `Revealed: ${playerName}`;
          btn.disabled = true;
          btn.style.backgroundColor = "var(--orange)";
          btn.style.color = "var(--dark-red)";
        } else if (allPlayersRevealed) {
          // 🔒 Game over: everyone has revealed
          btn.textContent = "Game Over 🔒";
          btn.disabled = true;
        }
      });

      // 🎄 All players revealed — show message
      if (allPlayersRevealed) {
        revealBox.textContent = "Everyone has revealed! Merry Christmas! 🎄";
        console.log("All players revealed! Game over.");
        return; // No more listeners needed
      }

      // -------------------------------------------
      // Attach click listeners for unrevealed players
      // -------------------------------------------
      buttons.forEach((btn) => {
        const playerName = btn.dataset.player;

        if (!revealedStates[playerName]) {
          btn.onclick = null; // Clear old handlers

          btn.addEventListener(
            "click",
            () => {
              console.log(`${playerName} clicked to reveal.`);

              // 🎁 Show assignment
              const target = assignments[playerName];
              revealBox.textContent = `${playerName}, you are Secret Santa for ${target}! 🎁`;

              // 🔒 Immediately lock ALL OTHER buttons locally
              buttons.forEach((b) => {
                if (b.dataset.player !== playerName) {
                  b.disabled = true;
                  b.textContent = `${b.dataset.player} 🔒`;
                }
              });

              // 🔄 Update Firebase (so everyone else sees it)
              update(revealedPlayersRef, { [playerName]: true })
                .then(() =>
                  console.log(`${playerName} marked as revealed in Firebase.`)
                )
                .catch((error) =>
                  console.error("Error updating revealed state:", error)
                );
            },
            { once: true }
          );
        }
      });
    }); // end revealedPlayers listener
  }); // end assignments listener
}); // end DOMContentLoaded
