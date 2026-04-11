/* ==========================================
   HabitMetric — My Habits Logic (myhabits.js)
   Handles habit CRUD and category management.

   DATA MODEL (new):
   Each habit object looks like this:
   {
     id:          "lf2k8r4ab"         ← unique, never changes
     name:        "Read 20 Pages"
     category:    "study"
     createdAt:   "2026-04-01"
     completions: ["2026-04-08", "2026-04-09"]  ← history lives here
   }

   WHY this is better than { completed: false }:
   - completed: false only knows about right now
   - completions[] remembers every past day → enables heatmap, streaks, analytics
   ========================================== */


// ---- DOM References ----
const categoryGrid   = document.querySelector(".category-grid");
const addCategoryBtn = document.querySelector(".category.add");
const habitList      = document.querySelector(".habit-list");
const addHabitBtn    = document.getElementById("add-habit-btn");


/* ==========================================
   MIGRATION
   Converts old-format habits ({ completed: bool })
   to new-format habits ({ completions: [] }).
   Runs automatically on load — safe to call multiple times.
   ========================================== */

/**
 * Takes the habits array from localStorage and upgrades any old-format
 * habits to the new format. Returns the updated array.
 *
 * Old format: { name, completed }
 * New format: { id, name, category, createdAt, completions[] }
 *
 * @param {Array} habits - raw habits array from localStorage
 * @returns {Array} - migrated habits array
 */
function migrateHabitsIfNeeded(habits) {
    const today = getTodayString(); // from app.js

    return habits.map(function (habit) {

        // If completions array already exists → habit is already new format, skip
        if (Array.isArray(habit.completions)) return habit;

        // Old format detected → convert it
        // If completed was true, we give it today's date as its only known completion
        // If completed was false, the completions array starts empty
        return {
            id:          generateId(),         // from app.js
            name:        habit.name,
            category:    habit.category || "general",
            createdAt:   today,
            completions: habit.completed ? [today] : []
        };
    });
}


/* ==========================================
   CATEGORIES
   ========================================== */

let savedCategories = JSON.parse(localStorage.getItem("categories")) || [];

savedCategories.forEach(function (name) {
    addCategoryToDOM(name);
});

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
 * @param {string} name
 */
function addCategoryToDOM(name) {
    const btn = document.createElement("button");
    btn.classList.add("category");
    btn.textContent = name;
    categoryGrid.insertBefore(btn, addCategoryBtn);
}


/* ==========================================
   HABITS — Load + Seed
   ========================================== */

// Step 1: Load raw data from localStorage
let savedHabits = JSON.parse(localStorage.getItem("habits"));

// Step 2: Seed defaults if first time
if (!savedHabits) {
    savedHabits = [
        {
            id:          generateId(),
            name:        "Morning Run",
            category:    "fitness",
            createdAt:   getTodayString(),
            completions: []
        },
        {
            id:          generateId(),
            name:        "Drink 2L Water",
            category:    "health",
            createdAt:   getTodayString(),
            completions: []
        },
        {
            id:          generateId(),
            name:        "Read 20 Pages",
            category:    "study",
            createdAt:   getTodayString(),
            completions: []
        }
    ];
    localStorage.setItem("habits", JSON.stringify(savedHabits));
}

// Step 3: Migrate any old-format habits before doing anything else
// This is safe to run even if all habits are already new format
savedHabits = migrateHabitsIfNeeded(savedHabits);
localStorage.setItem("habits", JSON.stringify(savedHabits)); // save migrated version

// Step 4: Render all habits on screen
savedHabits.forEach(function (habit) {
    addHabitToDOM(habit);
});


/* ==========================================
   HABITS — Add New
   ========================================== */

addHabitBtn.addEventListener("click", function () {
    const input = prompt("Enter new habit name:");
    if (!input || input.trim() === "") return;

    const newHabit = {
        id:          generateId(),
        name:        input.trim(),
        category:    "general",
        createdAt:   getTodayString(),
        completions: []           // starts with no history — honest
    };

    savedHabits.push(newHabit);
    localStorage.setItem("habits", JSON.stringify(savedHabits));

    addHabitToDOM(newHabit);
});


/* ==========================================
   HABITS — Render to DOM
   ========================================== */

/**
 * Creates a single habit card and appends it to the habit list.
 *
 * KEY CHANGE from old version:
 * - Takes a full habit object (not separate name/completed/index params)
 * - Determines checked state by checking if TODAY is in completions[]
 * - On checkbox change: ADDS or REMOVES today's date string from completions[]
 *   instead of setting a boolean
 * - Finds habit by habit.id — not by array index (much more reliable)
 *
 * @param {Object} habit - a full habit object from savedHabits
 */
function addHabitToDOM(habit) {
    const today       = getTodayString();
    const isDoneToday = habit.completions.includes(today); // true/false

    const item = document.createElement("div");
    item.classList.add("habit-item");

    item.innerHTML =
        "<label>" +
        "  <input type=\"checkbox\" " + (isDoneToday ? "checked" : "") + ">" +
        "  " + habit.name +
        "</label>";

    const checkbox = item.querySelector("input");

    checkbox.addEventListener("change", function () {

        // Find this habit in the array by its ID — not by index
        const idx = savedHabits.findIndex(function (h) { return h.id === habit.id; });

        if (checkbox.checked) {
            // Add today's date to completions (only if not already there)
            if (!savedHabits[idx].completions.includes(today)) {
                savedHabits[idx].completions.push(today);
            }
        } else {
            // Remove today's date from completions
            savedHabits[idx].completions = savedHabits[idx].completions.filter(
                function (date) { return date !== today; }
            );
        }

        localStorage.setItem("habits", JSON.stringify(savedHabits));
    });

    habitList.appendChild(item);
}
