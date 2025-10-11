document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("idea-form");
  const personSelect = document.getElementById("person-select");
  const ideaInput = document.getElementById("idea-input");

  const adults = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

  let savedIdeas = JSON.parse(localStorage.getItem("presentIdeas")) || {};
  adults.forEach(a => { if (!savedIdeas[a]) savedIdeas[a] = []; });

  function saveIdeas() {
    localStorage.setItem("presentIdeas", JSON.stringify(savedIdeas));
  }

  function renderIdeas() {
    adults.forEach(person => {
      const card = document.getElementById(person);
      const list = card.querySelector(".ideas-list");
      list.innerHTML = "";

      savedIdeas[person].forEach((idea, idx) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = idea;
        li.appendChild(span);

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.classList.add("edit-btn");
        editBtn.addEventListener("click", () => {
          const newIdea = prompt("Edit idea:", idea);
          if (newIdea !== null && newIdea.trim() !== "") {
            savedIdeas[person][idx] = newIdea.trim();
            saveIdeas();
            renderIdeas();
          }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => {
          savedIdeas[person].splice(idx, 1);
          saveIdeas();
          renderIdeas();
        });

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    });
  }

  renderIdeas();

  form.addEventListener("submit", e => {
    e.preventDefault();
    const person = personSelect.value;
    const idea = ideaInput.value.trim();

    if (!person) return alert("Please select a person");
    if (!idea) return;

    savedIdeas[person].push(idea);
    saveIdeas();
    renderIdeas();

    ideaInput.value = "";
    personSelect.value = "";
  });
});


