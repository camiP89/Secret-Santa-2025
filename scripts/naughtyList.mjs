document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("naughty-form");
  const nameInput = document.getElementById("name-input");
  const reasonInput = document.getElementById("reason-input");
  const list = document.getElementById("naughty-list");

  function createListItem(name, reason) {
    const li = document.createElement("li");
    li.textContent = `${name}: ${reason} `;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => li.remove());

    li.appendChild(deleteBtn);
    list.appendChild(li);
  }

  const initialItems = [
    { name: "Ollie", reason: "Waking up in the night" },
    { name: "Louis", reason: "Waking up in the night" },
    { name: "Lily", reason: "Talking to boys on SnapChat" },
    { name: "Scarlet", reason: "Requesting too many game apps" },
  ];

  initialItems.forEach((item) => createListItem(item.name, item.reason));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const reason = reasonInput.value.trim();

    if (name || reason) {
      createListItem(name, reason);
      nameInput.value = "";
      reasonInput.value = "";
    }
  });
});
