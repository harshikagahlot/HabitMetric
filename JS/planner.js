/* ==========================================
   HabitMetric — Smart Planner Logic (Guided Guided Architecture)
   ========================================== */

window.initPlanner = function() {
    console.log("[Planner] Initializing Guided Execution Engine...");

    const modeTabs = document.querySelectorAll(".mode-tab");
    
    // UI Containers
    const step1Card = document.getElementById("step1-intention-card");
    const containerToday = document.getElementById("form-today");
    const containerWeek = document.getElementById("form-week");
    const containerMonth = document.getElementById("form-month");
    
    const inputToday = document.getElementById("raw-plan-today");
    const inputWeek = document.getElementById("raw-plan-week");
    const inputMonth = document.getElementById("raw-plan-month");

    // Breakdown Elements
    const step2Card = document.getElementById("step2-breakdown-card");
    const breakdownTitle = document.getElementById("breakdown-title");
    const breakdownSubtitle = document.getElementById("breakdown-subtitle");
    const dateSelectorTrack = document.getElementById("date-selector-track");
    const dateTaskForm = document.getElementById("date-task-form");
    const dateTaskLabel = document.getElementById("task-form-date-label");
    const backToStep1Btn = document.getElementById("btn-back-to-step1");
    
    // Task Input
    const taskTitle = document.getElementById("task-title");
    const taskNotes = document.getElementById("task-notes");
    const taskPriority = document.getElementById("task-priority");
    const taskCategory = document.getElementById("task-category");
    const btnSaveTask = document.getElementById("btn-save-task");
    const dailySavedItems = document.getElementById("daily-saved-items");

    const savedPlansContainer = document.getElementById("saved-plans-container");

    // State
    let currentMode = localStorage.getItem("planner_last_mode") || "week";
    let activePlanId = null; // Stays null until saved
    let activePlanIntent = "";
    let activeSelectedDateString = null; // YYYY-MM-DD
    let sessionPlannedItems = []; // Temporarily hold items for the breakdown UI before committing

    // 1. Initial State Hydration
    function setupIsolatedState() {
        if (inputToday) inputToday.value = localStorage.getItem("plannerDraftToday") || "";
        if (inputWeek) inputWeek.value = localStorage.getItem("plannerDraftWeek") || "";
        if (inputMonth) inputMonth.value = localStorage.getItem("plannerDraftMonth") || "";

        if (inputToday) inputToday.addEventListener("input", () => localStorage.setItem("plannerDraftToday", inputToday.value));
        if (inputWeek) inputWeek.addEventListener("input", () => localStorage.setItem("plannerDraftWeek", inputWeek.value));
        if (inputMonth) inputMonth.addEventListener("input", () => localStorage.setItem("plannerDraftMonth", inputMonth.value));
    }

    function switchMode(mode) {
        currentMode = mode;
        localStorage.setItem("planner_last_mode", currentMode);
        
        modeTabs.forEach(t => t.classList.remove("active"));
        const activeTab = document.querySelector(`.mode-tab[data-mode="${mode}"]`);
        if (activeTab) activeTab.classList.add("active");

        if(containerToday) containerToday.classList.add("hidden");
        if(containerWeek) containerWeek.classList.add("hidden");
        if(containerMonth) containerMonth.classList.add("hidden");

        if (mode === "today" && containerToday) containerToday.classList.remove("hidden");
        if (mode === "week" && containerWeek) containerWeek.classList.remove("hidden");
        if (mode === "month" && containerMonth) containerMonth.classList.remove("hidden");
        
        // Always reset UI to Step 1 on mode switch
        showStep1();
    }

    // Bind Tabs
    modeTabs.forEach(tab => {
        tab.onclick = () => switchMode(tab.dataset.mode);
    });

    // 2. Step 1 -> Step 2 Transitions
    function showStep1() {
        if(step1Card) step1Card.classList.remove("hidden");
        if(step2Card) step2Card.classList.add("hidden");
        activePlanId = null;
        activePlanIntent = "";
        activeSelectedDateString = null;
        sessionPlannedItems = [];
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function showStep2(mode, intentionText) {
        if (!intentionText.trim()) {
            alert("Please enter a goal or intention first.");
            return;
        }

        activePlanIntent = intentionText.trim();
        activePlanId = mode + "-" + generateId();
        
        if(step1Card) step1Card.classList.add("hidden");
        if(step2Card) step2Card.classList.remove("hidden");
        if(dateTaskForm) dateTaskForm.classList.add("hidden"); // Hide until date clicked

        if (mode === "today") {
            if(breakdownTitle) breakdownTitle.textContent = "Today's Action Plan";
            if(breakdownSubtitle) breakdownSubtitle.textContent = "Start adding specific tasks directly into today's queue.";
            if(dateSelectorTrack) dateSelectorTrack.classList.add("hidden");
            
            // Auto click today
            const tDate = new Date();
            selectDateForForm(tDate);
            
        } else if (mode === "week") {
            if(breakdownTitle) breakdownTitle.textContent = "Break Down The Week";
            if(breakdownSubtitle) breakdownSubtitle.textContent = "Select a date to attach a specific action task.";
            if(dateSelectorTrack) {
                dateSelectorTrack.classList.remove("hidden");
                renderDateSelectorTrack("week");
            }
        } else if (mode === "month") {
            if(breakdownTitle) breakdownTitle.textContent = "Break Down The Month";
            if(breakdownSubtitle) breakdownSubtitle.textContent = "Select a date to attach a specific action task.";
            if(dateSelectorTrack) {
                dateSelectorTrack.classList.remove("hidden");
                renderDateSelectorTrack("month");
            }
        }
    }

    const btnSaveToday = document.getElementById("btn-save-today");
    const btnSaveWeek = document.getElementById("btn-save-week");
    const btnSaveMonth = document.getElementById("btn-save-month");

    if(btnSaveToday) btnSaveToday.onclick = () => showStep2("today", inputToday.value);
    if(btnSaveWeek) btnSaveWeek.onclick = () => showStep2("week", inputWeek.value);
    if(btnSaveMonth) btnSaveMonth.onclick = () => showStep2("month", inputMonth.value);
    
    if (backToStep1Btn) backToStep1Btn.onclick = showStep1;

    // 3. Date Track Generation
    function renderDateSelectorTrack(scope) {
        if (!dateSelectorTrack) return;
        dateSelectorTrack.innerHTML = "";
        const now = new Date();
        const daysToRender = [];

        if (scope === "week") {
            // Find current week Monday to Sunday
            const dayOfWeek = now.getDay() || 7; // 1-7
            const monday = new Date(now);
            monday.setDate(now.getDate() - dayOfWeek + 1);
            
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                daysToRender.push(d);
            }
        } else if (scope === "month") {
            // Render from today until end of month (or next 30 days)
            // Let's do current month days from 1 to end
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            for (let i = 1; i <= daysInMonth; i++) {
                daysToRender.push(new Date(year, month, i));
            }
        }

        const daysOfWeekStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayStr = (typeof formatLocalDate === "function") ? formatLocalDate(now) : now.toISOString().slice(0, 10);

        daysToRender.forEach(d => {
            const dString = (typeof formatLocalDate === "function") ? formatLocalDate(d) : d.toISOString().slice(0, 10);
            
            const b = document.createElement("div");
            b.className = "date-bubble";
            if (dString === todayStr && scope !== "month") b.style.borderColor = "var(--accent)"; // highlight today lightly
            
            b.innerHTML = `
                <span class="db-day">${daysOfWeekStr[d.getDay()]}</span>
                <span class="db-num">${d.getDate()}</span>
            `;

            b.onclick = () => {
                document.querySelectorAll(".date-bubble").forEach(x => x.classList.remove("active"));
                b.classList.add("active");
                selectDateForForm(d);
            };

            dateSelectorTrack.appendChild(b);
        });
    }

    function selectDateForForm(dateObj) {
        activeSelectedDateString = (typeof formatLocalDate === "function") ? formatLocalDate(dateObj) : dateObj.toISOString().slice(0, 10);
        
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        if(dateTaskLabel) dateTaskLabel.textContent = "Tasks for " + dateObj.toLocaleDateString(undefined, options);
        if(dateTaskForm) dateTaskForm.classList.remove("hidden");
        
        if(taskTitle) {
            taskTitle.value = "";
            taskTitle.focus();
        }
        if(taskNotes) taskNotes.value = "";
        if(taskCategory) taskCategory.value = "";
        
        renderDailySavedItems();
    }

    // 4. Task Creation
    if (btnSaveTask) {
        btnSaveTask.onclick = () => {
            const title = taskTitle ? taskTitle.value.trim() : "";
            if (!title) return;
            
            const itemObj = {
                id: "pt-" + generateId(),
                title: title,
                notes: taskNotes ? taskNotes.value.trim() : "",
                priority: taskPriority ? taskPriority.value : "Medium",
                category: taskCategory ? taskCategory.value.trim() || undefined : undefined,
                dateStr: activeSelectedDateString,
                sourcePlanType: currentMode,
                parentPlanId: activePlanId
            };
            
            sessionPlannedItems.push(itemObj);
            
            if(taskTitle) {
                taskTitle.value = "";
                taskTitle.focus();
            }
            if(taskNotes) taskNotes.value = "";
            
            // Visual feedback
            btnSaveTask.textContent = "Saved! ✔";
            btnSaveTask.style.background = "#10b981";
            setTimeout(() => {
                btnSaveTask.textContent = "Save to Date";
                btnSaveTask.style.background = "";
            }, 1000);
            
            renderDailySavedItems();
        };
    }

    function renderDailySavedItems() {
        if(!dailySavedItems) return;
        dailySavedItems.innerHTML = "";
        const itemsForDate = sessionPlannedItems.filter(i => i.dateStr === activeSelectedDateString);
        
        if (itemsForDate.length === 0) return;
        
        itemsForDate.forEach(it => {
            const el = document.createElement("div");
            el.className = "planned-item"; // reuse css
            el.innerHTML = `
                <div class="item-content">
                    <strong>${it.title}</strong>
                    <div class="item-meta">
                        Priority: ${it.priority} ${it.category ? `&nbsp;•&nbsp; Cat: ${it.category}` : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-icon btn-delete-single">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            el.querySelector(".btn-delete-single").onclick = () => {
                sessionPlannedItems = sessionPlannedItems.filter(x => x.id !== it.id);
                renderDailySavedItems();
            };
            dailySavedItems.appendChild(el);
        });
        
        if (typeof lucide !== "undefined") lucide.createIcons();
    }

    // 5. Final Plan Commitment
    const btnFinishPlan = document.getElementById("btn-finish-plan");
    if(btnFinishPlan) {
        btnFinishPlan.onclick = () => {
            // 1. Save The Intention block
            if (currentMode === "week" || currentMode === "month") {
                const storageKey = currentMode === "week" ? "weeklyPlans" : "monthlyPlans";
                const plans = JSON.parse(localStorage.getItem(storageKey)) || [];
                plans.push({
                    id: activePlanId,
                    type: currentMode,
                    createdAt: new Date().toISOString(),
                    intention: activePlanIntent
                });
                localStorage.setItem(storageKey, JSON.stringify(plans));
            }
            
            // 2. Inject ALL the session items dynamically into the global Habits array
            // so that they sync with My Habits flawlessly.
            if (sessionPlannedItems.length > 0) {
                const habits = JSON.parse(localStorage.getItem("habits")) || [];
                
                const newHabits = sessionPlannedItems.map(it => {
                    return {
                        id: it.id, // mapped from plan task
                        name: it.title,
                        category: it.category || "planner", // Use general planner if missing, but we mapped it
                        createdAt: (typeof getTodayString !== "undefined") ? getTodayString() : new Date().toISOString().slice(0, 10),
                        completions: [],
                        isSystemGenerated: true,
                        recurrence: "once",
                        targetDate: it.dateStr,
                        parentPlanId: it.parentPlanId,
                        sourcePlanType: it.sourcePlanType,
                        priority: it.priority,
                        notes: it.notes
                    };
                });
                
                localStorage.setItem("habits", JSON.stringify([...habits, ...newHabits]));
            }
            
            // 3. Reset and refresh UI
            // Clear drafts because we successfully committed!
            if (currentMode === "today") { localStorage.removeItem("plannerDraftToday"); if(inputToday) inputToday.value = ""; }
            if (currentMode === "week") { localStorage.removeItem("plannerDraftWeek"); if(inputWeek) inputWeek.value = ""; }
            if (currentMode === "month") { localStorage.removeItem("plannerDraftMonth"); if(inputMonth) inputMonth.value = ""; }

            showStep1();
            renderHistoricalPlans();
        };
    }

    // 6. Historical Plans Rendering
    function renderHistoricalPlans() {
        if(!savedPlansContainer) return;
        savedPlansContainer.innerHTML = "";
        
        const wPlans = JSON.parse(localStorage.getItem("weeklyPlans")) || [];
        const mPlans = JSON.parse(localStorage.getItem("monthlyPlans")) || [];
        const allPlans = [...wPlans, ...mPlans].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const habits = JSON.parse(localStorage.getItem("habits")) || [];
        
        if (allPlans.length === 0) {
            savedPlansContainer.innerHTML = "<p style='color: var(--text-dim)'>No saved plans. Your active intentions will appear here.</p>";
            return;
        }

        allPlans.forEach(plan => {
            const card = document.createElement("div");
            card.className = "plan-block-card";
            
            const childrenTasks = habits.filter(h => h.parentPlanId === plan.id);
            const dateMap = {};
            childrenTasks.forEach(h => {
                const arr = dateMap[h.targetDate] || [];
                arr.push(h);
                dateMap[h.targetDate] = arr;
            });

            let childrenHTML = "";
            for (const [dateKey, tasks] of Object.entries(dateMap)) {
                childrenHTML += `<div style="margin-top: 10px;">
                    <strong style="color:var(--text-light); font-size:0.85rem;">Date: ${dateKey}</strong>
                    <ul style="list-style:inside; color:var(--text-dim); font-size:0.85rem; padding-left:5px;">`;
                tasks.forEach(t => {
                    const doneText = t.completions.includes(dateKey) ? " <span style='color:var(--accent)'>(Done)</span>" : "";
                    childrenHTML += `<li>${t.name}${doneText}</li>`;
                });
                childrenHTML += `</ul></div>`;
            }

            card.innerHTML = `
                <div class="plan-block-header">
                    <span class="plan-badge">${plan.type === 'week' ? 'Weekly Plan' : 'Monthly Plan'}</span>
                    <button class="btn-icon btn-delete-plan" style="color:#ef4444; border-color:#fca5a5;">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                <div class="plan-intention-view">"${plan.intention}"</div>
                ${childrenTasks.length > 0 ? `<div class="plan-children-list"><strong>Scheduled Actions:</strong>${childrenHTML}</div>` : ''}
            `;

            card.querySelector(".btn-delete-plan").onclick = () => {
                if(confirm("Delete this plan? (This will also delete the associated tasks)")) {
                    // Delete Plan Obj
                    const storageKey = plan.type === "week" ? "weeklyPlans" : "monthlyPlans";
                    const pList = JSON.parse(localStorage.getItem(storageKey));
                    localStorage.setItem(storageKey, JSON.stringify(pList.filter(p => p.id !== plan.id)));
                    
                    // Cascade Delete the physical Habits generated
                    const updatedHabits = habits.filter(h => h.parentPlanId !== plan.id);
                    localStorage.setItem("habits", JSON.stringify(updatedHabits));
                    
                    renderHistoricalPlans();
                }
            };

            savedPlansContainer.appendChild(card);
        });
        
        if (typeof lucide !== "undefined") lucide.createIcons();
    }


    // Boot Process
    setupIsolatedState();
    switchMode(currentMode);
    renderHistoricalPlans();

};
