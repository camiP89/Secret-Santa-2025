document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("naughty-form");
  const nameInput = document.getElementById("name-input");
  const reasonInput = document.getElementById("reason-input");
  const list = document.getElementById("naughty-list");

  let savedList = JSON.parse(localStorage.getItem("naughtyList")) || [];

  function saveList() {
    localStorage.setItem("naughtyList", JSON.stringify(savedList));
  }

  function createListItem(name, reason) {
    const li = document.createElement("li");
    li.textContent = `${name}: ${reason} `;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      li.remove();

      savedList = savedList.filter(item => item.name !== name || item.reason !== reason);
      saveList();
    });

    li.appendChild(deleteBtn);
    list.appendChild(li);
  }

  if (savedList.length === 0) {
    savedList = [
      { name: "Ollie", reason: "Not listening" },
      { name: "Louis", reason: "Waking up in the night" },
      { name: "Lily", reason: "Talking to boys on SnapChat" },
      { name: "Scarlet", reason: "Requesting too many game apps" },
    ];
    saveList();
  }

  savedList.forEach(item => createListItem(item.name, item.reason));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim() || "Anonymous";
    const reason = reasonInput.value.trim();

    if (reason) {
      const newItem = { name, reason };
      savedList.push(newItem);
      saveList();
      createListItem(name, reason);
      nameInput.value = "";
      reasonInput.value = "";
    }
  });
});
