// src/presentIdeas.mjs

// Import the initialized Firebase app, analytics, and database from your firebase.js file
// The path '../src/firebase.js' assumes presentIdeas.mjs is in 'scripts/' and firebase.js is in 'src/'
import { app, analytics, database } from "../src/firebase.js";

// Import specific functions needed from the Firebase Realtime Database SDK
import { ref, push, remove, update, onValue } from "firebase/database";

// Define the adults for whom ideas are being generated
const adults = ["Andy", "Liz", "George", "Harriet", "Charlie", "Camilla"];

// Get a reference to the 'presentIdeas' path in your Realtime Database
const presentIdeasRef = ref(database, "presentIdeas");

// Event listener for when the DOM (HTML) is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get references to HTML elements
  const form = document.getElementById("idea-form");
  const personSelect = document.getElementById("person-select");
  const ideaInput = document.getElementById("idea-input");

  // --- Validate HTML elements are found ---
  if (!form) {
    console.error("ERROR: Form element with ID 'idea-form' not found!");
    return; // Stop execution if essential element is missing
  } else {
  }

  if (!personSelect) {
    console.error("ERROR: Select element with ID 'person-select' not found!");
    return; // Stop execution if essential element is missing
  } else {
  }

  // --- Populate the person select dropdown ---
  // Ensure the <option value="">Select a person</option> is the only hardcoded one in HTML
  adults.forEach((person) => {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    personSelect.appendChild(option);
  });

  // --- Real-time Listener for Present Ideas ---
  // This listens for any changes to the 'presentIdeas' path in Firebase
  // and updates the UI whenever data is added, changed, or removed.
  onValue(presentIdeasRef, (snapshot) => {
    // Clear all existing ideas from the UI before re-rendering
    adults.forEach((person) => {
      const card = document.getElementById(person);
      if (card) {
        const list = card.querySelector(".ideas-list");
        if (list) {
          list.innerHTML = ""; // Clear the <ul> for each person
        }
      }
    });

    // Iterate through the data from Firebase and render it
    const allIdeas = snapshot.val() || {}; // Get all ideas, or an empty object if none
    adults.forEach((person) => {
      const personIdeas = allIdeas[person] || {}; // Get ideas for this specific person, or empty object
      const card = document.getElementById(person);
      if (card) {
        const list = card.querySelector(".ideas-list");
        if (list) {
          // Iterate over each idea for the current person, using Firebase's unique keys
          Object.keys(personIdeas).forEach((ideaKey) => {
            const ideaData = personIdeas[ideaKey]; // { text: "idea text", addedBy: "Name" }
            createListItem(person, ideaKey, ideaData.text, ideaData.addedBy);
          });
        }
      }
    });
  });

  // --- Helper function to create a list item in the UI ---
  // It now handles rendering, edit, and delete actions directly to Firebase
  function createListItem(person, ideaKey, ideaText, addedBy) {
    const card = document.getElementById(person);
    if (!card) {
      console.warn(`Card for person ${person} not found.`);
      return;
    } // Defensive check
    const list = card.querySelector(".ideas-list");
    if (!list) {
      console.warn(`Ideas list for person ${person} not found.`);
      return;
    } // Defensive check

    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = `${ideaText} (added by: ${addedBy || "Unknown"})`;
    li.appendChild(span);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.classList.add("edit-btn");
    editBtn.addEventListener("click", () => {
      const newIdeaText = prompt("Edit idea:", ideaText);
      if (newIdeaText !== null && newIdeaText.trim() !== "") {
        update(ref(database, `presentIdeas/${person}/${ideaKey}`), {
          text: newIdeaText.trim(),
        })
          .then(() => console.log("Idea updated in Firebase successfully!"))
          .catch((error) =>
            console.error("Error updating idea in Firebase:", error)
          );
      }
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      remove(ref(database, `presentIdeas/${person}/${ideaKey}`))
        .then(() => console.log("Idea removed from Firebase successfully!"))
        .catch((error) =>
          console.error("Error removing idea from Firebase:", error)
        );
    });

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }

  // --- Form Submission Handler ---
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)

    const person = personSelect.value;
    const idea = ideaInput.value.trim();

    // Form validation
    if (!person || person === "") {
      // Check if a person was actually selected (not the default empty option)
      return alert("Please select a person from the dropdown.");
    }
    if (!idea) {
      return alert("Please enter a gift idea."); // Give feedback if idea is empty
    }

    // Define 'addedBy' as anonymous by default (can be updated with Auth later)
    const addedBy = "Anonymous";

    // ADD TO FIREBASE: Use push() to add a new idea object with a unique key
    push(ref(database, `presentIdeas/${person}`), {
      text: idea,
      addedBy: addedBy,
    })
      .then(() => {
        ideaInput.value = ""; // Clear input field
        personSelect.value = ""; // Reset dropdown to default "Select a person"
      })
      .catch((error) => {
        console.error("Firebase push failed:", error);
      });
  });
});
