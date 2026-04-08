/* ==========================================
   HabitMetric — My Habits Logic (myhabits.js)
   Handles habit CRUD and category management.
   ==========================================

   BUGS FIXED vs. original inline script:
   1. habitList was null (no .habit-list element existed in HTML) — fixed in HTML
   2. New habit checkbox used stale index (savedHabits.length - 1 computed at
      click time, not add time) — fixed by closing over index at creation time
      inside addHabitToDOM()
   ========================================== */


// ---- DOM References ----
const categoryGrid   = document.querySelector(".category-grid");
const addCategoryBtn = document.querySelector(".category.add");
const habitList      = document.querySelector(".habit-list");
const addHabitBtn    = document.getElementById("add-habit-btn");


/* ==========================================
   CATEGORIES
   ========================================== */

// Load any user-created categories saved in localStorage
let savedCategories = JSON.parse(localStorage.getItem("categories")) || [];

savedCategories.forEach(function (name) {
    addCategoryToDOM(name);
});

// "Add Category" button click
addCategoryBtn.addEventListener("click", function () {
    const input = prompt("Enter new category name:");
    if (!input || input.trim() === "") return;

    const name = input.trim();
    addCategoryToDOM(name);

    savedCategories.push(name);
    localStorage.setItem("categories", JSON.stringify(savedCategories));
});

/**
 * Creates a category button and inserts it before the "+ Add Category" button.
 * @param {string} name - Display text for the category
 */
function addCategoryToDOM(name) {
    const btn = document.createElement("button");
    btn.classList.add("category");
    btn.textContent = name;
    categoryGrid.insertBefore(btn, addCategoryBtn);
}


/* ==========================================
   HABITS
   ========================================== */

// Load saved habits OR seed defaults on first visit
let savedHabits = JSON.parse(localStorage.getItem("habits"));

if (!savedHabits) {
    savedHabits = [
        { name: "Morning Run",    completed: false },
        { name: "Drink 2L Water", completed: false },
        { name: "Read 20 Pages",  completed: false }
    ];
    localStorage.setItem("habits", JSON.stringify(savedHabits));
}

// Render all existing habits on page load
savedHabits.forEach(function (habit, index) {
    addHabitToDOM(habit.name, habit.completed, index);
});

// "Add Habit" button click
addHabitBtn.addEventListener("click", function () {
    const input = prompt("Enter new habit name:");
    if (!input || input.trim() === "") return;

    const name = input.trim();
    const newHabit = { name: name, completed: false };

    savedHabits.push(newHabit);
    localStorage.setItem("habits", JSON.stringify(savedHabits));

    // FIX: Capture index *here* (at push time), not inside the event listener.
    // The original code computed savedHabits.length - 1 inside the change listener,
    // which meant it always updated the *last* habit in the array instead of this one.
    const index = savedHabits.length - 1;
    addHabitToDOM(name, false, index);
});

/**
 * Creates a habit item and appends it to the habit list.
 *
 * @param {string}  name      - Display name of the habit
 * @param {boolean} completed - Whether to pre-check the checkbox
 * @param {number}  index     - Index in savedHabits array (closed over for save)
 */
function addHabitToDOM(name, completed, index) {
    const item = document.createElement("div");
    item.classList.add("habit-item");

    item.innerHTML =
        "<label>" +
        "  <input type=\"checkbox\" " + (completed ? "checked" : "") + ">" +
        "  " + name +
        "</label>";

    const checkbox = item.querySelector("input");

    // FIX: 'index' is correctly closed over from the parameter — not recomputed.
    checkbox.addEventListener("change", function () {
        savedHabits[index].completed = checkbox.checked;
        localStorage.setItem("habits", JSON.stringify(savedHabits));
    });

    habitList.appendChild(item);
}
