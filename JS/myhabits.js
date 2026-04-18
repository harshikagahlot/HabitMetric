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
    const habitCategorySelect = document.getElementById("habit-category-select");

    // Planner UI
    const plannerZone = document.getElementById("planner-execution-zone");
    const plannerContainer = document.getElementById("planner-items-container");

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
       CONSTANTS & STATE
       ========================================== */
    const GENERAL_CAT_ID = "cat-general";
    let currentFilter = "all"; // "all", "cat-general", or a category ID

    /* ==========================================
       MIGRATION
       ========================================== */
    function migrateToRelationalModel() {
        console.log("[Migration] Checking data integrity...");
        
        // 1. Migrate Categories
        let categories = JSON.parse(localStorage.getItem("categories"));
        const defaultCats = [
            { id: "cat-fitness",     name: "🏃 Fitness",      icon: "🏃", isDefault: true },
            { id: "cat-study",       name: "📚 Study",        icon: "📚", isDefault: true },
            { id: "cat-mindfulness", name: "🧠 Mindfulness",  icon: "🧠", isDefault: true },
            { id: "cat-health",      name: "💧 Health",       icon: "💧", isDefault: true },
            { id: "cat-productivity",name: "💻 Productivity", icon: "💻", isDefault: true }
        ];

        // If categories is Array<String> or missing, convert it
        if (!categories || !categories.length || typeof categories[0] === "string") {
            const migratedCats = defaultCats;
            // If they had custom strings, we'd ideally map them, but for this MVP, 
            // we seeding defaults + General.
            localStorage.setItem("categories", JSON.stringify(migratedCats));
            categories = migratedCats;
        }

        // 2. Migrate Habits
        let habits = JSON.parse(localStorage.getItem("habits"));
        if (habits && habits.length) {
            let habitsChanged = false;
            habits = habits.map(h => {
                // If it doesn't have a categoryId, we need to map the old string 'category'
                if (!h.categoryId) {
                    habitsChanged = true;
                    // Find a category that matches the name string
                    const match = categories.find(c => c.name === h.category);
                    h.categoryId = match ? match.id : GENERAL_CAT_ID;
                    // Keep old h.category for backward compatibility with Dashboard/Analytics phases
                }
                if (!h.completions) h.completions = [];
                if (!h.id) h.id = generateId();
                return h;
            });
            if (habitsChanged) localStorage.setItem("habits", JSON.stringify(habits));
        }
    }
    migrateToRelationalModel();


    /* ==========================================
       CATEGORIES
       ========================================== */
    let savedCategories = JSON.parse(localStorage.getItem("categories")) || [];

    // Category Modal UI Triggers
    if (addCategoryBtn && addCategoryModal) {
        addCategoryBtn.onclick = () => {
            addCategoryModal.classList.add("show");
            if (categoryNameInput) categoryNameInput.focus();
        };
    }
    if (closeCategoryBtn && addCategoryModal) {
        closeCategoryBtn.onclick = () => {
            addCategoryModal.classList.remove("show");
            if (categoryNameInput) categoryNameInput.value = "";
        };
    }
    function renderCategoryChips() {
        // Clear except the last "Add" button
        const children = Array.from(categoryGrid.children);
        children.forEach(child => {
            if (!child.classList.contains("add")) child.remove();
        });

        // 1. "All Habits" chip
        const allChip = createCategoryChip({ id: "all", name: "All Habits" });
        categoryGrid.insertBefore(allChip, addCategoryBtn);

        // 2. Saved categories
        savedCategories.forEach(cat => {
            const chip = createCategoryChip(cat);
            categoryGrid.insertBefore(chip, addCategoryBtn);
        });

        // 3. "Uncategorized" chip (only if habits exist in it)
        const habits = getHabits();
        const hasUncategorized = habits.some(h => h.categoryId === GENERAL_CAT_ID);
        if (hasUncategorized || currentFilter === GENERAL_CAT_ID) {
            const genChip = createCategoryChip({ id: GENERAL_CAT_ID, name: "General" });
            categoryGrid.insertBefore(genChip, addCategoryBtn);
        }
    }

    function createCategoryChip(cat) {
        const wrapper = document.createElement("div");
        wrapper.className = "cat-actions-wrapper";

        const btn = document.createElement("button");
        btn.classList.add("category");
        if (currentFilter === cat.id) btn.classList.add("active");
        btn.textContent = cat.name;
        btn.onclick = () => {
            currentFilter = cat.id;
            renderCategoryChips();
            refreshHabitList();
        };

        wrapper.appendChild(btn);

        // Add 3-dot menu only for non-"all" and non-default categories
        if (cat.id !== "all" && cat.id !== GENERAL_CAT_ID) {
            const actionBtn = document.createElement("button");
            actionBtn.className = "cat-action-btn";
            actionBtn.textContent = "⋮";
            
            const menu = document.createElement("div");
            menu.className = "dropdown-menu";

            const renameItem = document.createElement("div");
            renameItem.className = "dropdown-item";
            renameItem.textContent = "Rename";
            renameItem.onclick = (e) => {
                e.stopPropagation();
                closeAllDropdowns();
                const newName = prompt("Rename category:", cat.name);
                if (newName && newName.trim()) {
                    cat.name = newName.trim();
                    saveCategories();
                    renderCategoryChips();
                    updateCategoryDropdown();
                    refreshHabitList();
                }
            };

            const deleteItem = document.createElement("div");
            deleteItem.className = "dropdown-item danger";
            deleteItem.textContent = "Delete";
            deleteItem.onclick = (e) => {
                e.stopPropagation();
                closeAllDropdowns();
                handleCategoryDelete(cat);
            };

            menu.appendChild(renameItem);
            menu.appendChild(deleteItem);
            wrapper.appendChild(actionBtn);
            wrapper.appendChild(menu);

            actionBtn.onclick = (e) => {
                e.stopPropagation();
                const wasOpen = menu.classList.contains("show");
                closeAllDropdowns();
                if (!wasOpen) menu.classList.add("show");
            };
        }

        return wrapper;
    }

    function handleCategoryDelete(cat) {
        const habits = getHabits();
        const linkedHabits = habits.filter(h => h.categoryId === cat.id);

        if (linkedHabits.length > 0) {
            if (confirm(`Category "${cat.name}" contains ${linkedHabits.length} habits. Move them to "General" and delete?`)) {
                linkedHabits.forEach(h => h.categoryId = GENERAL_CAT_ID);
                localStorage.setItem("habits", JSON.stringify(habits));
                finishDeletion();
            }
        } else {
            if (confirm(`Delete empty category "${cat.name}"?`)) {
                finishDeletion();
            }
        }

        function finishDeletion() {
            savedCategories = savedCategories.filter(c => c.id !== cat.id);
            saveCategories();
            if (currentFilter === cat.id) currentFilter = "all";
            renderCategoryChips();
            updateCategoryDropdown();
            refreshHabitList();
        }
    }

    function saveCategories() {
        localStorage.setItem("categories", JSON.stringify(savedCategories));
    }

    function updateCategoryDropdown() {
        if (!habitCategorySelect) return;
        const habits = getHabits();
        
        let options = savedCategories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        );
        // Add General option at the end
        options.push(`<option value="${GENERAL_CAT_ID}">General / Uncategorized</option>`);
        
        habitCategorySelect.innerHTML = options.join("");
        
        // Auto-select based on current filter
        if (currentFilter !== "all") {
            habitCategorySelect.value = currentFilter;
        }
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
                const habits = getHabits();
                const idx = habits.findIndex(h => h.id === currentHabitForEmoji.id);
                if (idx > -1) {
                    habits[idx].icon = newIcon;
                    localStorage.setItem("habits", JSON.stringify(habits));
                    currentHabitForEmoji.icon = newIcon;
                    if (currentHabitDOMElement) {
                        currentHabitDOMElement.querySelector(".habit-name").textContent =
                            (newIcon ? newIcon + " " : "") + currentHabitForEmoji.name;
                    }
                }
                emojiModal.classList.remove("show");
                currentHabitForEmoji = null;
                currentHabitDOMElement = null;
                refreshHabitList(); // Sync all views
            });
        });
    }


    /* ==========================================
       HABITS — Initial Load
       ========================================== */
    function getHabits() {
        return JSON.parse(localStorage.getItem("habits")) || [];
    }

    function refreshHabitList() {
        habitList.innerHTML = "";
        const habits = getHabits();
        
        // 1. Filter habits
        const filtered = habits.filter(h => {
            if (currentFilter === "all") return true;
            return h.categoryId === currentFilter;
        });

        // 2. Update Header Label
        const subtitle = document.querySelector(".page-subtitle");
        let filterName = "All Habits";
        if (currentFilter === GENERAL_CAT_ID) filterName = "General Habits";
        else if (currentFilter !== "all") {
            const cat = savedCategories.find(c => c.id === currentFilter);
            if (cat) filterName = cat.name + " Habits";
        }
        subtitle.textContent = filterName + " — Building consistency one day at a time";

        // 3. Render
        if (filtered.length === 0) {
            habitList.innerHTML = `<div class="empty-state">No habits found in this category. Click below to add one!</div>`;
        } else {
            filtered.forEach(h => addHabitToDOM(h));
        }
    }

    renderCategoryChips();
    updateCategoryDropdown();
    refreshHabitList();
    renderPlannerExecutionZone();


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
            const categoryId = habitCategorySelect ? habitCategorySelect.value : GENERAL_CAT_ID;

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

            // Find category object for backward compat string
            const catObj = savedCategories.find(c => c.id === categoryId);
            const catName = catObj ? catObj.name : "General";

            const newHabit = {
                id:          generateId(),
                name:        intentionString,
                categoryId:  categoryId,
                category:    catName, // Fallback for other pages
                createdAt:   getTodayString(),
                completions: []
            };

            const habits = getHabits();
            habits.push(newHabit);
            localStorage.setItem("habits", JSON.stringify(habits));
            
            addHabitModal.classList.remove("show");
            if (habitActionInput) { habitActionInput.style.borderBottom = ""; habitActionInput.value = ""; }
            if (habitTimeInput) habitTimeInput.value = "";
            if (habitLocationInput) habitLocationInput.value = "";
            
            refreshHabitList();
            renderCategoryChips(); // In case we added to Uncategorized for the first time
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
        const yesterdayStr   = formatLocalDate(yesterday);
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
            const habits = getHabits();
            const habitIdx = habits.findIndex(h => h.id === habit.id);
            if (habitIdx === -1) return;

            if (checkbox.checked) {
                if (!habits[habitIdx].completions.includes(today)) habits[habitIdx].completions.push(today);
                item.classList.add("done");
            } else {
                habits[habitIdx].completions = habits[habitIdx].completions.filter(d => d !== today);
                item.classList.remove("done");
            }
            localStorage.setItem("habits", JSON.stringify(habits));
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
                const habits = getHabits();
                const hIdx = habits.findIndex(h => h.id === habit.id);
                if (hIdx > -1) {
                    habits[hIdx].name = newName.trim();
                    localStorage.setItem("habits", JSON.stringify(habits));
                    habit.name = newName.trim();
                    item.querySelector(".habit-name").textContent = (emoji ? emoji + " " : "") + habit.name;
                }
            }
        });

        item.querySelector(".delete-btn").addEventListener("click", e => {
            e.stopPropagation();
            closeAllDropdowns();
            if (confirm(`Permanently delete "${habit.name}"?\nYou will lose all streak history.`)) {
                const habits = getHabits().filter(h => h.id !== habit.id);
                localStorage.setItem("habits", JSON.stringify(habits));
                item.remove();
            }
        });

        // Render strictly into the flat list (UI takes care of grouping visuals if needed)
        // Since we are now filtering by category, we don't need the old 'Divider' logic 
        // that was creating duplicate headers.
        habitList.appendChild(item);
    }

    // Modal Category Creation Sync
    if (saveCategoryBtn && addCategoryModal) {
        saveCategoryBtn.onclick = () => {
            const name = categoryNameInput ? categoryNameInput.value.trim() : "";
            if (!name) return;
            
            const newCat = {
                id: generateId(),
                name: name,
                icon: "✨",
                isDefault: false
            };
            
            savedCategories.push(newCat);
            saveCategories();
            addCategoryModal.classList.remove("show");
            categoryNameInput.value = "";
            
            renderCategoryChips();
            updateCategoryDropdown();
        };
    }

    // --- Smart Planner Execution Integration ---
    function renderPlannerExecutionZone() {
        // Re-query fresh inside the function to ensure we catch the new DOM
        const zone = document.getElementById("planner-execution-zone");
        const container = document.getElementById("planner-items-container");
        
        if (!zone || !container) {
            console.log("[MyHabits] Planner zone elements not found.");
            return;
        }

        const pItems = JSON.parse(localStorage.getItem("plannerItems")) || [];
        if (pItems.length === 0) {
            zone.classList.add("hidden");
            return;
        }

        zone.classList.remove("hidden");
        container.innerHTML = "";

        // Group by category (Match the targets used in planner.js)
        const groups = {
            "today_todo": { label: "Today's To-Do", items: [] },
            "weekly_todo": { label: "Weekly To-Do", items: [] },
            "monthly_todo": { label: "Monthly To-Do", items: [] }
        };

        pItems.forEach(it => {
            if (groups[it.category]) groups[it.category].items.push(it);
        });

        Object.keys(groups).forEach(key => {
            const group = groups[key];
            if (group.items.length === 0) return;

            const segment = document.createElement("div");
            segment.className = "planner-todo-segment";
            segment.innerHTML = `<span class="segment-label">${group.label}</span>`;

            group.items.forEach(task => {
                const itemDiv = document.createElement("div");
                itemDiv.className = `planner-task-item ${task.status === "done" ? "done" : ""}`;
                
                itemDiv.innerHTML = `
                    <input type="checkbox" ${task.status === "done" ? "checked" : ""}>
                    <span>${task.title}</span>
                `;

                const checkbox = itemDiv.querySelector("input");
                checkbox.onchange = () => {
                    togglePlannerTaskStatus(task.id);
                    itemDiv.classList.toggle("done", checkbox.checked);
                };

                segment.appendChild(itemDiv);
            });

            container.appendChild(segment);
        });
    }

    function togglePlannerTaskStatus(taskId) {
        const stored = localStorage.getItem("plannerItems");
        let items = [];
        try {
            items = JSON.parse(stored) || [];
        } catch (e) { return; }
        
        const taskIdx = items.findIndex(it => it.id === taskId);
        if (taskIdx > -1) {
            items[taskIdx].status = items[taskIdx].status === "done" ? "pending" : "done";
            localStorage.setItem("plannerItems", JSON.stringify(items));
            console.log(`[MyHabits] Task ${taskId} toggled to ${items[taskIdx].status}`);
        }
    }

}; // end initMyHabits
