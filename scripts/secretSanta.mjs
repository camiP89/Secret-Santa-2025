const players = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

// 🔐 Generate assignments once and save them in localStorage
function generateAssignments(names) {
  let recipients;
  do {
    recipients = [...names].sort(() => Math.random() - 0.5);
  } while (names.some((n, i) => n === recipients[i]));
  return Object.fromEntries(names.map((n, i) => [n, recipients[i]]));
}

// Load existing assignments or generate new ones
let assignments = JSON.parse(localStorage.getItem("secretSantaAssignments"));
if (!assignments) {
  assignments = generateAssignments(players);
  localStorage.setItem("secretSantaAssignments", JSON.stringify(assignments));
}

document.addEventListener("DOMContentLoaded", () => {
  const revealBox = document.getElementById("reveal");
  const buttons = document.querySelectorAll("button[data-player]");

  // Check if the game has already been completed
  const revealedName = localStorage.getItem("secretSantaRevealed");
  const gameOver = localStorage.getItem("secretSantaGameOver");

  // ✅ If someone already revealed before, restore the final locked state
  if (gameOver === "true" && revealedName) {
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
    return; // stop here — game already over
  }

  // 🧑‍🎄 Add click listeners (only if game not yet played)
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.player;
      const target = assignments[name];

      // Show result
      revealBox.textContent = `${name}, you are Secret Santa for ${target}! 🎁`;

      // Lock all buttons permanently
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

      // ✅ Save final state
      localStorage.setItem("secretSantaRevealed", name);
      localStorage.setItem("secretSantaGameOver", "true");
    });
  });
});

document.getElementById("reset-btn").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});
