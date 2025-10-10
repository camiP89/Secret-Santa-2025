document.addEventListener("DOMContentLoaded", () => {
  const countdownElement = document.getElementById("countdown");
  countdownElement.id = "countdown";
  countdownElement.textContent = "Loading...";
  document.body.appendChild(countdownElement);

  function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let christmas = new Date(`December 25, ${currentYear} 00:00:00`);

    if (now > christmas) {
      christmas = new Date(`December 25, ${currentYear + 1} 00:00:00`);
    }

    const totalSeconds = Math.floor((christmas - now) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s until Christmas!`;
  }

  updateCountdown();

  setInterval(updateCountdown, 1000);
});
