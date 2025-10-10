const players = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

function generateAssignments(names) {
  let recipients;
  do {
    recipients = [...names].sort(() => Math.random() - 0.5);
  } while (names.some((n, i) => n === recipients[i]));
  return Object.fromEntries(names.map((n, i) => [n, recipients[i]]));
}

const assignments = generateAssignments(players);

document.addEventListener("DOMContentLoaded", () => {
  const revealBox = document.getElementById("reveal");

  document.querySelectorAll("button[data-player]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.player;
      const target = assignments[name];
      revealBox.textContent = `${name}, you are Secret Santa for ${target}! 🎁`;
      btn.disabled = true; 
    });
  });
});
