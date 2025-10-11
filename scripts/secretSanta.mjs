const players = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

function generateAssignments(names) {
  let recipients;
  do {
    recipients = [...names].sort(() => Math.random() - 0.5);
  } while (names.some((n, i) => n === recipients[i]));
  return Object.fromEntries(names.map((n, i) => [n, recipients[i]]));
}

let assignments = JSON.parse(localStorage.getItem("secretSantaAssignments"));
if (!assignments) {
  assignments = generateAssignments(players);
  localStorage.setItem("secretSantaAssignments", JSON.stringify(assignments));
}

document.addEventListener("DOMContentLoaded", () => {
  const revealBox = document.getElementById("reveal");
  const buttons = document.querySelectorAll("button[data-player]");

  const revealedName = localStorage.getItem("secretSantaRevealed");
  const gameOver = localStorage.getItem("secretSantaGameOver");

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
    return;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.player;
      const target = assignments[name];

      revealBox.textContent = `${name}, you are Secret Santa for ${target}! 🎁`;

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

      localStorage.setItem("secretSantaRevealed", name);
      localStorage.setItem("secretSantaGameOver", "true");
    });
  });
});


