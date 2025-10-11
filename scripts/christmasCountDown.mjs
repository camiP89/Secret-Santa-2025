document.addEventListener("DOMContentLoaded", () => {
  const countdownElement = document.getElementById("countdown");

  function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let christmas = new Date(`December 25, ${currentYear} 00:00:00`);
    if (now > christmas) christmas = new Date(`December 25, ${currentYear + 1} 00:00:00`);

    const totalSeconds = Math.floor((christmas - now) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownElement.innerHTML = `
      <div class="countdown-box">
        <div class="number">${days}</div>
        <div class="label">Days</div>
      </div>
      <div class="countdown-box">
        <div class="number">${hours}</div>
        <div class="label">Hours</div>
      </div>
      <div class="countdown-box">
        <div class="number">${minutes}</div>
        <div class="label">Minutes</div>
      </div>
      <div class="countdown-box">
        <div class="number">${seconds}</div>
        <div class="label">Seconds</div>
      </div>
      <div class="message">until Christmas! 🎄</div>
    `;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
});
