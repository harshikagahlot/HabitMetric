/* ==========================================
   HabitMetric — My Habits Logic (myhabits.js)
   Handles habit CRUD and category management.
   ========================================== */

window.initMyHabits = function() {
// ---- DOM References ----
const categoryGrid   = document.querySelector(".category-grid");
const addCategoryBtn = document.querySelector(".category.add");
const habitList      = document.querySelector(".habit-list");
const addHabitBtn    = document.getElementById("add-habit-btn");


/* ==========================================
   GLOBAL UTILITIES
   ========================================== */
   
// Close any open dropdowns if the user clicks anywhere else on the page
function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
    document.querySelectorAll(".habit-item.z-elevate").forEach(i => i.classList.remove("z-elevate"));
}
if (!window._habitsListenerAttached) {
    document.addEventListener("click", closeAllDropdowns);
    window._habitsListenerAttached = true;
}

// ---- Global Emoji Modal Logic ----
const emojiModal = document.getElementById("emoji-modal");
const closeEmojiBtn = document.getElementById("close-emoji-modal");
let currentHabitForEmoji = null;
let currentHabitDOMElement = null;

if (!window._emojiListenerAttached) {
    closeEmojiBtn.addEventListener("click", () => {
        emojiModal.classList.remove("show");
        currentHabitForEmoji = null;
        currentHabitDOMElement = null;
    });
    window._emojiListenerAttached = true;
}

document.querySelectorAll(".emoji-option").forEach(btn => {
    btn.addEventListener("click", function() {
        if (!currentHabitForEmoji) return;
        
        let newIcon = this.textContent.trim();
        if (this.classList.contains("remove-emoji")) {
            newIcon = "";
        }
        
        const idx = savedHabits.findIndex(h => h.id === currentHabitForEmoji.id);
        if (idx > -1) {
            savedHabits[idx].icon = newIcon;
            localStorage.setItem("habits", JSON.stringify(savedHabits));
            
            currentHabitForEmoji.icon = newIcon;
            let emoji = newIcon;
            currentHabitDOMElement.querySelector(".habit-name").textContent = (emoji ? emoji + " " : "") + currentHabitForEmoji.name;
        }
        
        emojiModal.classList.remove("show");
        currentHabitForEmoji = null;
        currentHabitDOMElement = null;
    });
});


/* ==========================================
   MIGRATION
   ========================================== */
function migrateHabitsIfNeeded(habits) {
    const today = getTodayString(); 
    return habits.map(function (habit) {
        if (Array.isArray(habit.completions)) return habit;
        return {
            id:          generateId(),
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

let savedCategories = JSON.parse(localStorage.getItem("categories"));

// Seed initial premium categories if none exist
if (!savedCategories || savedCategories.length === 0) {
    savedCategories = ["🏃 Fitness", "📚 Study", "🧠 Mindfulness", "💧 Health", "💻 Productivity"];
    localStorage.setItem("categories", JSON.stringify(savedCategories));
}

savedCategories.forEach(function (name) {
    addCategoryToDOM(name);
});

const addCategoryModal = document.getElementById("add-category-modal");
const closeCategoryBtn = document.getElementById("close-category-modal");
const saveCategoryBtn  = document.getElementById("save-category-btn");
const categoryNameInput = document.getElementById("category-name-input");

if (!window._categoryModalAttached) {
    addCategoryBtn.addEventListener("click", function () {
        addCategoryModal.classList.add("show");
        categoryNameInput.focus();
    });

    closeCategoryBtn.addEventListener("click", function () {
        addCategoryModal.classList.remove("show");
        categoryNameInput.value = "";
    });

    saveCategoryBtn.addEventListener("click", function () {
        const name = categoryNameInput.value.trim();
        if (!name) {
            categoryNameInput.style.borderBottom = "2px solid #ef4444";
            return;
        }

        addCategoryToDOM(name);
        savedCategories.push(name);
        localStorage.setItem("categories", JSON.stringify(savedCategories));

        addCategoryModal.classList.remove("show");
        categoryNameInput.value = "";
        categoryNameInput.style.borderBottom = "none";
    });
    window._categoryModalAttached = true;
}

function addCategoryToDOM(name) {
    const wrapper = document.createElement("div");
    wrapper.className = "cat-actions-wrapper";

    const btn = document.createElement("button");
    btn.classList.add("category");
    btn.textContent = name;
    
    // Add dropdown action button for category
    const actionBtn = document.createElement("button");
    actionBtn.className = "cat-action-btn";
    actionBtn.textContent = "⋮";
    
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    
    const renameItem = document.createElement("div");
    renameItem.className = "dropdown-item";
    renameItem.textContent = "Rename";
    
    const deleteItem = document.createElement("div");
    deleteItem.className = "dropdown-item danger";
    deleteItem.textContent = "Delete";
    
    menu.appendChild(renameItem);
    menu.appendChild(deleteItem);
    
    wrapper.appendChild(btn);
    wrapper.appendChild(actionBtn);
    wrapper.appendChild(menu);

    // Toggle logic
    actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = menu.classList.contains("show");
        closeAllDropdowns();
        if (!wasOpen) menu.classList.add("show");
    });

    renameItem.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        const newName = prompt("Rename category:", name);
        if (newName && newName.trim()) {
            const idx = savedCategories.indexOf(name);
            if (idx > -1) {
                savedCategories[idx] = newName.trim();
                localStorage.setItem("categories", JSON.stringify(savedCategories));
                btn.textContent = newName.trim();
                name = newName.trim(); 
            }
        }
    });

    deleteItem.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        if (confirm(`Delete category "${name}"? Habits inside it will default to general.`)) {
            const idx = savedCategories.indexOf(name);
            if (idx > -1) {
                savedCategories.splice(idx, 1);
                localStorage.setItem("categories", JSON.stringify(savedCategories));
            }
            // Update habits safety fallback
            savedHabits.forEach(h => {
                if(h.category === name) h.category = "general";
            });
            localStorage.setItem("habits", JSON.stringify(savedHabits));
            wrapper.remove();
        }
    });

    categoryGrid.insertBefore(wrapper, addCategoryBtn);
}


/* ==========================================
   HABITS — Load + Seed
   ========================================== */

let savedHabits = JSON.parse(localStorage.getItem("habits"));

if (!savedHabits) {
    savedHabits = [
        { id: generateId(), name: "Morning Run", category: "🏃 Fitness", createdAt: getTodayString(), completions: [] },
        { id: generateId(), name: "Drink 2L Water", category: "💧 Health", createdAt: getTodayString(), completions: [] },
        { id: generateId(), name: "Read 20 Pages", category: "📚 Study", createdAt: getTodayString(), completions: [] }
    ];
    localStorage.setItem("habits", JSON.stringify(savedHabits));
}

savedHabits = migrateHabitsIfNeeded(savedHabits);
localStorage.setItem("habits", JSON.stringify(savedHabits));

savedHabits.forEach(function (habit) {
    addHabitToDOM(habit);
});


/* ==========================================
   HABITS — Add New (Atomic Habits Intention)
   ========================================== */

const addHabitModal = document.getElementById("add-habit-modal");
const closeHabitBtn = document.getElementById("close-habit-modal");
const saveHabitBtn  = document.getElementById("save-habit-btn");

const habitActionInput   = document.getElementById("habit-action");
const habitTimeInput     = document.getElementById("habit-time");
const habitLocationInput = document.getElementById("habit-location");

if (!window._addHabitListenerAttached) {
    // Open Modal
    addHabitBtn.addEventListener("click", function () {
        addHabitModal.classList.add("show");
        habitActionInput.focus();
    });

    // Close Modal
    closeHabitBtn.addEventListener("click", function () {
        addHabitModal.classList.remove("show");
        habitActionInput.value = "";
        habitTimeInput.value = "";
        habitLocationInput.value = "";
    });

    // Save Habit
    saveHabitBtn.addEventListener("click", function () {
        const action = habitActionInput.value.trim();
        const time = habitTimeInput.value;
        const location = habitLocationInput.value.trim();
        
        // Ensure action is provided at minimum
        if (!action) {
            habitActionInput.style.borderBottom = "2px solid #ef4444";
            return;
        }

        // Format the "Implementation Intention" string
        let formattedTime = time;
        if (time) {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            formattedTime = `${h12}:${minutes} ${ampm}`;
        }

        let intentionString = action;
        if (time || location) {
            intentionString += " (";
            if (time) intentionString += `at ${formattedTime}`;
            if (time && location) intentionString += " ";
            if (location) intentionString += `in ${location}`;
            intentionString += ")";
        }

        const newHabit = {
            id:          generateId(),
            name:        intentionString,
            category:    "general",
            createdAt:   getTodayString(),
            completions: []
        };

        savedHabits.push(newHabit);
        localStorage.setItem("habits", JSON.stringify(savedHabits));
        addHabitToDOM(newHabit);

        // Reset and close
        addHabitModal.classList.remove("show");
        habitActionInput.style.borderBottom = "none";
        habitActionInput.value = "";
        habitTimeInput.value = "";
        habitLocationInput.value = "";
    });

    window._addHabitListenerAttached = true;
}


/* ==========================================
   HABITS — Render to DOM
   ========================================== */

function addHabitToDOM(habit) {
    const today       = getTodayString();
    const isDoneToday = habit.completions.includes(today);

    const streak = calculateStreak(habit.completions);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const missedYesterday = !habit.completions.includes(yesterdayStr);
    
    const showWarning = missedYesterday && !isDoneToday && habit.completions.length > 0;

    // Pick emoji logic: use custom icon if defined, otherwise derive from category.
    let emoji = habit.icon !== undefined ? habit.icon : ""; 
    
    if (habit.icon === undefined) {
        const cat = habit.category ? habit.category.toLowerCase() : "";
        if (cat.includes("🏃") || cat.includes("fitness")) emoji = "🏃";
        else if (cat.includes("📚") || cat.includes("study")) emoji = "📚";
        else if (cat.includes("💧") || cat.includes("health")) emoji = "💧";
        else if (cat.includes("🧠") || cat.includes("mindfulness")) emoji = "🧠";
        else if (cat.includes("💻") || cat.includes("productivity")) emoji = "💻";
        // removed the fallback hardcoded red pin
    }

    const item = document.createElement("div");
    item.classList.add("habit-item");
    if (isDoneToday) item.classList.add("done");

    item.innerHTML = `
        <label class="smart-habit-card">
          <div class="habit-left">
            <input type="checkbox" ${isDoneToday ? "checked" : ""}>
            <div class="custom-checkbox"></div>
            <div class="habit-info">
              <span class="habit-name">${emoji ? emoji + " " : ""}${habit.name}</span>
            </div>
          </div>
          <div class="habit-right">
            ${streak > 0 ? `<span class="badge streak-chip">🔥 ${streak} Day Streak</span>` : ""}
            ${showWarning ? `<span class="badge warning-chip">⚠️ Missed Yesterday</span>` : ""}
          </div>
        </label>
        
        <div class="habit-actions-wrapper">
            <button class="action-btn" title="Habit Options">⋮</button>
            <div class="dropdown-menu">
                <div class="dropdown-item icon-btn">✨ Set Habit Icon</div>
                <div class="dropdown-item edit-btn">Edit Name</div>
                <div class="dropdown-item danger delete-btn">Delete</div>
            </div>
        </div>
    `;

    const checkbox = item.querySelector("input");
    checkbox.addEventListener("change", function () {
        const idx = savedHabits.findIndex(h => h.id === habit.id);

        if (checkbox.checked) {
            if (!savedHabits[idx].completions.includes(today)) {
                savedHabits[idx].completions.push(today);
            }
            item.classList.add("done");
        } else {
            savedHabits[idx].completions = savedHabits[idx].completions.filter(date => date !== today);
            item.classList.remove("done");
        }
        localStorage.setItem("habits", JSON.stringify(savedHabits));
    });

    // Menu logic
    const actionBtn = item.querySelector(".action-btn");
    const dropdown = item.querySelector(".dropdown-menu");
    
    actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault(); 
        const wasOpen = dropdown.classList.contains("show");
        closeAllDropdowns();
        if (!wasOpen) {
            dropdown.classList.add("show");
            item.classList.add("z-elevate"); // Ensures dropdown casts over elements below it safely
        }
    });

    const iconBtn = item.querySelector(".icon-btn");
    iconBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        
        // Open the slick visual modal instead of browser prompt
        currentHabitForEmoji = habit;
        currentHabitDOMElement = item;
        emojiModal.classList.add("show");
    });

    const editBtn = item.querySelector(".edit-btn");
    editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        const newName = prompt("Edit habit name:", habit.name);
        if (newName && newName.trim()) {
            const idx = savedHabits.findIndex(h => h.id === habit.id);
            savedHabits[idx].name = newName.trim();
            localStorage.setItem("habits", JSON.stringify(savedHabits));
            
            habit.name = newName.trim();
            item.querySelector(".habit-name").textContent = (emoji ? emoji + " " : "") + habit.name;
        }
    });

    const deleteBtn = item.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        if (confirm(`Permanently delete "${habit.name}"?\nYou will lose all stat history and streaks.`)) {
            savedHabits = savedHabits.filter(h => h.id !== habit.id);
            localStorage.setItem("habits", JSON.stringify(savedHabits));
            item.remove();
        }
    });

    habitList.appendChild(item);
}

}; // End of initMyHabits()
