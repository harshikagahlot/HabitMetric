/* ==========================================
   HabitMetric — My Habits Logic (myhabits.js)
   ========================================== */

window.initMyHabits = function () {

    // ---- DOM References — re-queried fresh every time initMyHabits() runs ----
    const categoryGrid    = document.querySelector(".category-grid");
    const addCategoryBtn  = document.querySelector(".category.add");
    const habitList       = document.querySelector(".habit-list");
    const addHabitBtn     = document.getElementById("add-habit-btn");

    // Modals live in myhabits.html
    const emojiModal        = document.getElementById("emoji-modal");
    const closeEmojiBtn     = document.getElementById("close-emoji-modal");
    const addHabitModal     = document.getElementById("add-habit-modal");
    const closeHabitBtn     = document.getElementById("close-habit-modal");
    const saveHabitBtn      = document.getElementById("save-habit-btn");
    const habitActionInput  = document.getElementById("habit-action");
    const habitTimeInput    = document.getElementById("habit-time");
    const habitLocationInput= document.getElementById("habit-location");
    const addCategoryModal  = document.getElementById("add-category-modal");
    const closeCategoryBtn  = document.getElementById("close-category-modal");
    const saveCategoryBtn   = document.getElementById("save-category-btn");
    const categoryNameInput = document.getElementById("category-name-input");

    // Guard: if critical elements are missing, bail out silently
    if (!categoryGrid || !addHabitBtn || !habitList) return;

    let currentHabitForEmoji   = null;
    let currentHabitDOMElement = null;

    /* ---- Close dropdowns on outside click (attach only once globally) ---- */
    function closeAllDropdowns() {
        document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
        document.querySelectorAll(".habit-item.z-elevate").forEach(i => i.classList.remove("z-elevate"));
    }
    if (!window._habitsGlobalClickAttached) {
        document.addEventListener("click", closeAllDropdowns);
        window._habitsGlobalClickAttached = true;
    }

    /* ==========================================
       MIGRATION
       ========================================== */
    function migrateHabitsIfNeeded(habits) {
        const today = getTodayString();
        return habits.map(h => {
            if (Array.isArray(h.completions)) return h;
            return {
                id:          generateId(),
                name:        h.name,
                category:    h.category || "general",
                createdAt:   today,
                completions: h.completed ? [today] : []
            };
        });
    }


    /* ==========================================
       CATEGORIES
       ========================================== */
    let savedCategories = JSON.parse(localStorage.getItem("categories"));
    if (!savedCategories || savedCategories.length === 0) {
        savedCategories = ["🏃 Fitness", "📚 Study", "🧠 Mindfulness", "💧 Health", "💻 Productivity"];
        localStorage.setItem("categories", JSON.stringify(savedCategories));
    }

    savedCategories.forEach(name => addCategoryToDOM(name));

    // Category Modal — wire up fresh every init (DOM is fresh after SPA swap)
    if (addCategoryBtn && addCategoryModal) {
        addCategoryBtn.addEventListener("click", () => {
            addCategoryModal.classList.add("show");
            if (categoryNameInput) categoryNameInput.focus();
        });
    }
    if (closeCategoryBtn && addCategoryModal) {
        closeCategoryBtn.addEventListener("click", () => {
            addCategoryModal.classList.remove("show");
            if (categoryNameInput) categoryNameInput.value = "";
        });
    }
    if (saveCategoryBtn && addCategoryModal) {
        saveCategoryBtn.addEventListener("click", () => {
            const name = categoryNameInput ? categoryNameInput.value.trim() : "";
            if (!name) {
                if (categoryNameInput) categoryNameInput.style.borderBottom = "2px solid #ef4444";
                return;
            }
            addCategoryToDOM(name);
            savedCategories.push(name);
            localStorage.setItem("categories", JSON.stringify(savedCategories));
            addCategoryModal.classList.remove("show");
            if (categoryNameInput) {
                categoryNameInput.value = "";
                categoryNameInput.style.borderBottom = "";
            }
        });
    }

    function addCategoryToDOM(name) {
        const wrapper = document.createElement("div");
        wrapper.className = "cat-actions-wrapper";

        const btn = document.createElement("button");
        btn.classList.add("category");
        btn.textContent = name;

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

        actionBtn.addEventListener("click", e => {
            e.stopPropagation();
            const wasOpen = menu.classList.contains("show");
            closeAllDropdowns();
            if (!wasOpen) menu.classList.add("show");
        });

        renameItem.addEventListener("click", e => {
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

        deleteItem.addEventListener("click", e => {
            e.stopPropagation();
            closeAllDropdowns();
            if (confirm(`Delete category "${name}"?`)) {
                const idx = savedCategories.indexOf(name);
                if (idx > -1) { savedCategories.splice(idx, 1); localStorage.setItem("categories", JSON.stringify(savedCategories)); }
                savedHabits.forEach(h => { if (h.category === name) h.category = "general"; });
                localStorage.setItem("habits", JSON.stringify(savedHabits));
                wrapper.remove();
            }
        });

        categoryGrid.insertBefore(wrapper, addCategoryBtn);
    }


    /* ==========================================
       EMOJI MODAL — wire fresh every init
       ========================================== */
    if (emojiModal && closeEmojiBtn) {
        closeEmojiBtn.addEventListener("click", () => {
            emojiModal.classList.remove("show");
            currentHabitForEmoji = null;
            currentHabitDOMElement = null;
        });
    }

    if (emojiModal) {
        document.querySelectorAll(".emoji-option").forEach(btn => {
            btn.addEventListener("click", function () {
                if (!currentHabitForEmoji) return;
                let newIcon = this.classList.contains("remove-emoji") ? "" : this.textContent.trim();
                const idx = savedHabits.findIndex(h => h.id === currentHabitForEmoji.id);
                if (idx > -1) {
                    savedHabits[idx].icon = newIcon;
                    localStorage.setItem("habits", JSON.stringify(savedHabits));
                    currentHabitForEmoji.icon = newIcon;
                    if (currentHabitDOMElement) {
                        currentHabitDOMElement.querySelector(".habit-name").textContent =
                            (newIcon ? newIcon + " " : "") + currentHabitForEmoji.name;
                    }
                }
                emojiModal.classList.remove("show");
                currentHabitForEmoji = null;
                currentHabitDOMElement = null;
            });
        });
    }


    /* ==========================================
       HABITS — Load + Seed
       ========================================== */
    let savedHabits = JSON.parse(localStorage.getItem("habits"));
    if (!savedHabits) {
        savedHabits = [
            { id: generateId(), name: "Morning Run",    category: "🏃 Fitness", createdAt: getTodayString(), completions: [] },
            { id: generateId(), name: "Drink 2L Water", category: "💧 Health",  createdAt: getTodayString(), completions: [] },
            { id: generateId(), name: "Read 20 Pages",  category: "📚 Study",   createdAt: getTodayString(), completions: [] }
        ];
        localStorage.setItem("habits", JSON.stringify(savedHabits));
    }
    savedHabits = migrateHabitsIfNeeded(savedHabits);
    localStorage.setItem("habits", JSON.stringify(savedHabits));
    savedHabits.forEach(h => addHabitToDOM(h));


    /* ==========================================
       ADD HABIT MODAL — wire fresh every init
       ========================================== */
    if (addHabitBtn && addHabitModal) {
        addHabitBtn.addEventListener("click", () => {
            addHabitModal.classList.add("show");
            if (habitActionInput) habitActionInput.focus();
        });
    }
    if (closeHabitBtn && addHabitModal) {
        closeHabitBtn.addEventListener("click", () => {
            addHabitModal.classList.remove("show");
            if (habitActionInput) habitActionInput.value = "";
            if (habitTimeInput) habitTimeInput.value = "";
            if (habitLocationInput) habitLocationInput.value = "";
        });
    }
    if (saveHabitBtn && addHabitModal) {
        saveHabitBtn.addEventListener("click", () => {
            const action   = habitActionInput ? habitActionInput.value.trim() : "";
            const time     = habitTimeInput   ? habitTimeInput.value : "";
            const location = habitLocationInput ? habitLocationInput.value.trim() : "";

            if (!action) {
                if (habitActionInput) habitActionInput.style.borderBottom = "2px solid #ef4444";
                return;
            }

            let formattedTime = time;
            if (time) {
                const [hours, minutes] = time.split(":");
                const h = parseInt(hours);
                formattedTime = `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
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

            addHabitModal.classList.remove("show");
            if (habitActionInput) { habitActionInput.style.borderBottom = ""; habitActionInput.value = ""; }
            if (habitTimeInput) habitTimeInput.value = "";
            if (habitLocationInput) habitLocationInput.value = "";
        });
    }


    /* ==========================================
       HABIT CARD RENDERER
       ========================================== */
    function addHabitToDOM(habit) {
        const today          = getTodayString();
        const isDoneToday    = habit.completions.includes(today);
        const streak         = calculateStreak(habit.completions);
        const yesterday      = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr   = yesterday.toISOString().slice(0, 10);
        const missedYesterday= !habit.completions.includes(yesterdayStr);
        const showWarning    = missedYesterday && !isDoneToday && habit.completions.length > 0;

        let emoji = habit.icon !== undefined ? habit.icon : "";
        if (habit.icon === undefined) {
            const cat = (habit.category || "").toLowerCase();
            if (cat.includes("🏃") || cat.includes("fitness"))      emoji = "🏃";
            else if (cat.includes("📚") || cat.includes("study"))   emoji = "📚";
            else if (cat.includes("💧") || cat.includes("health"))  emoji = "💧";
            else if (cat.includes("🧠") || cat.includes("mindful")) emoji = "🧠";
            else if (cat.includes("💻") || cat.includes("product")) emoji = "💻";
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
        checkbox.addEventListener("change", () => {
            const idx = savedHabits.findIndex(h => h.id === habit.id);
            if (checkbox.checked) {
                if (!savedHabits[idx].completions.includes(today)) savedHabits[idx].completions.push(today);
                item.classList.add("done");
            } else {
                savedHabits[idx].completions = savedHabits[idx].completions.filter(d => d !== today);
                item.classList.remove("done");
            }
            localStorage.setItem("habits", JSON.stringify(savedHabits));
        });

        const actionBtn = item.querySelector(".action-btn");
        const dropdown  = item.querySelector(".dropdown-menu");
        actionBtn.addEventListener("click", e => {
            e.stopPropagation();
            const wasOpen = dropdown.classList.contains("show");
            closeAllDropdowns();
            if (!wasOpen) { dropdown.classList.add("show"); item.classList.add("z-elevate"); }
        });

        item.querySelector(".icon-btn").addEventListener("click", e => {
            e.stopPropagation();
            closeAllDropdowns();
            if (emojiModal) {
                currentHabitForEmoji    = habit;
                currentHabitDOMElement  = item;
                emojiModal.classList.add("show");
            }
        });

        item.querySelector(".edit-btn").addEventListener("click", e => {
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

        item.querySelector(".delete-btn").addEventListener("click", e => {
            e.stopPropagation();
            closeAllDropdowns();
            if (confirm(`Permanently delete "${habit.name}"?\nYou will lose all streak history.`)) {
                savedHabits = savedHabits.filter(h => h.id !== habit.id);
                localStorage.setItem("habits", JSON.stringify(savedHabits));
                item.remove();
            }
        });

        habitList.appendChild(item);
    }

}; // end initMyHabits
