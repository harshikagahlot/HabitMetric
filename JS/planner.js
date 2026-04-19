/* ==========================================
   HabitMetric — Smart Planner Logic (planner.js)
   Rule-based MVP for generating realistic execution plans.
   ========================================== */

window.initPlanner = function() {
    console.log("[Planner] Initializing clean planner MVP...");
    
    // DOM Elements
    const modeTabs = document.querySelectorAll(".mode-tab");
    const rawPlanInput = document.getElementById("raw-plan");
    const generateBtn = document.getElementById("generate-plan-btn");
    const outputArea = document.getElementById("plan-output");
    const outputList = document.getElementById("generated-items-list");
    const outputTitle = document.getElementById("output-title");
    const topAddAllBtn = document.getElementById("btn-add-all");

    if (!generateBtn) {
        console.warn("[Planner] Generate button not found in DOM");
        return;
    }

    // Load Last Mode from Storage
    let currentMode = localStorage.getItem("planner_last_mode");
    if (currentMode !== "week" && currentMode !== "month") {
        currentMode = "week"; // Default fallback
    }
    
    // 1. Tab Logic - Initialization
    function setupTabs() {
        modeTabs.forEach(tab => {
            if (tab.dataset.mode === currentMode) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }

            tab.onclick = () => {
                modeTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                currentMode = tab.dataset.mode;
                localStorage.setItem("planner_last_mode", currentMode);
                updateUIForMode(currentMode);
            };
        });
        updateUIForMode(currentMode);
    }

    function updateUIForMode(mode) {
        if (!rawPlanInput || !outputTitle) return;
        if (mode === "week") {
            rawPlanInput.placeholder = "Example:\n- 3 gym sessions\n- Read 10 pages daily\n- Code for 2 hours\n- Weekly budget review";
            outputTitle.textContent = "Weekly Execution Plan";
        } else {
            rawPlanInput.placeholder = "Example:\n- Complete Milestone 1\n- Build morning routine\n- Read 2 books\n- Save $500";
            outputTitle.textContent = "Monthly Milestone Plan";
        }
    }

    setupTabs();

    let lastGeneratedItems = [];

    // 2. Generation Logic
    generateBtn.onclick = () => {
        const rawText = rawPlanInput.value.trim();

        if (!rawText) {
            alert("Please enter a rough plan in the text box before generating.");
            return;
        }

        // Improved Parser: Split by newline, strip bullets, numbers, hyphens
        let items = rawText
            .split(/\n/)
            .map(s => s.replace(/^[•\-\*\d\.\)]+\s*/, '').trim())
            .filter(s => s.length > 2); // Minimum length to be considered a task

        if (items.length === 0) {
            alert("Could not find any clear tasks. Try listing them one per line.");
            return;
        }

        // Deduplicate
        let uniqueItems = [...new Set(items)];

        const structuredPlan = uniqueItems.map(item => {
            const lower = item.toLowerCase();
            
            // Guess priority
            let priority = "Medium";
            if (lower.includes("important") || lower.includes("must") || lower.includes("urgent")) priority = "High";
            if (lower.includes("optional") || lower.includes("if possible")) priority = "Low";

            // Guess frequency
            let frequency = "Daily";
            if (lower.includes("times") || lower.includes("weekly") || lower.includes("week")) frequency = "Multiple times a week";
            if (lower.includes("monthly") || lower.includes("month")) frequency = "Monthly";
            
            // Guess time block
            let timeBlock = "Anytime";
            if (lower.match(/morning|am\b/i)) timeBlock = "Morning";
            if (lower.match(/evening|pm\b|night/i)) timeBlock = "Evening";
            if (lower.match(/afternoon/i)) timeBlock = "Afternoon";

            return {
                id: "plan-" + Math.random().toString(36).substr(2, 9),
                title: item,
                priority: priority,
                frequency: frequency,
                timeBlock: timeBlock
            };
        });
        
        lastGeneratedItems = structuredPlan;
        renderPreview();
    };

    function renderPreview() {
        if (!outputList || !outputArea) return;
        outputList.innerHTML = "";
        
        if (lastGeneratedItems.length === 0) {
            outputArea.classList.add("hidden");
            return;
        }
        
        outputArea.classList.remove("hidden");
        
        lastGeneratedItems.forEach((item) => {
            const div = document.createElement("div");
            div.className = "planned-item";
            div.dataset.id = item.id;
            
            div.innerHTML = `
                <div class="item-content">
                    <strong>${item.title}</strong>
                    <div class="item-meta">
                        Priority: ${item.priority} &nbsp;•&nbsp; Freq: ${item.frequency} &nbsp;•&nbsp; Time: ${item.timeBlock}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-icon btn-add-single" title="Add to Habits" aria-label="Add to Habits">
                        <i data-lucide="plus"></i> Add
                    </button>
                    <button class="btn-icon btn-delete-single" title="Remove" aria-label="Remove">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            
            // Attach specific events
            div.querySelector(".btn-delete-single").onclick = () => {
                lastGeneratedItems = lastGeneratedItems.filter(it => it.id !== item.id);
                renderPreview();
            };
            
            div.querySelector(".btn-add-single").onclick = (e) => {
                savePlanItemsToStorage([item]);
                lastGeneratedItems = lastGeneratedItems.filter(it => it.id !== item.id);
                renderPreview();
            };

            outputList.appendChild(div);
        });
        
        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    // 3. Global Bulk Save Logic
    if (topAddAllBtn) {
        topAddAllBtn.onclick = () => {
            if (lastGeneratedItems.length === 0) return;
            
            savePlanItemsToStorage(lastGeneratedItems);    
            
            const originalText = topAddAllBtn.innerHTML;
            topAddAllBtn.innerHTML = "<i data-lucide='check'></i> Added All!";
            topAddAllBtn.style.background = "#10b981"; // success green
            topAddAllBtn.style.color = "white";
            lucide.createIcons();
            
            setTimeout(() => {
                topAddAllBtn.innerHTML = originalText;
                topAddAllBtn.style.background = "";
                topAddAllBtn.style.color = "";
                lucide.createIcons();
            }, 2000);

            // Empty the list
            lastGeneratedItems = [];
            renderPreview();
        };
    }

    function savePlanItemsToStorage(items) {
        const storedHabits = localStorage.getItem("habits");
        let habits = [];
        try {
            habits = JSON.parse(storedHabits) || [];
        } catch (e) {
            habits = [];
        }

        const newItems = items.map(it => {
            let rec = "daily";
            let wd = [];
            let md = [];
            
            if (it.frequency === "Multiple times a week") {
                rec = "weekly";
                wd = ["1","3","5"]; // arbitrary MWF default for planner
            } else if (it.frequency === "Monthly") {
                rec = "monthly";
                md = ["1"]; // arbitrary 1st of month default for planner
            }

            return {
                id: typeof generateId !== "undefined" ? generateId() : "plan-" + Math.random().toString(36).substr(2, 9),
                name: it.title,
                category: "planner", 
                createdAt: typeof getTodayString !== "undefined" ? getTodayString() : new Date().toISOString().slice(0, 10),
                completions: [],
                isSystemGenerated: true,
                recurrence: rec,
                weekdays: wd,
                monthDates: md,
                targetDate: null
            };
        });

        const finalStore = [...habits, ...newItems];
        localStorage.setItem("habits", JSON.stringify(finalStore));
        console.log(`[Planner] Committed ${newItems.length} Smart Planner items to habits.`);
    }
};
