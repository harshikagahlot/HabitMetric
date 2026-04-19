/* ==========================================
   HabitMetric — Smart Planner Logic (planner.js)
   Rule-based MVP for generating realistic execution plans.
   ========================================== */

window.initPlanner = function() {
    console.log("[Planner] Initializing foundation MVP...");
    
    // DOM Elements
    const modeTabs = document.querySelectorAll(".mode-tab");
    const rawPlanInput = document.getElementById("raw-plan");
    const topPriorityInput = document.getElementById("top-priority");
    const hoursInput = document.getElementById("available-hours");
    const intensityInput = document.getElementById("planning-intensity");
    const mustNotMissInput = document.getElementById("must-not-miss");
    
    const generateBtn = document.getElementById("generate-plan-btn");
    const outputArea = document.getElementById("plan-output");
    const outputList = document.getElementById("generated-items-list");
    const outputTitle = document.getElementById("output-title");
    const outputStats = document.getElementById("output-stats");
    
    const saveBtns = document.querySelectorAll(".btn-save-to-habits");

    if (!generateBtn) {
        console.warn("[Planner] Generate button not found in DOM");
        return;
    }

    // Load Last Mode from Storage
    let currentMode = localStorage.getItem("planner_last_mode") || "today";
    
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
        if (mode === "today") {
            rawPlanInput.placeholder = "Example: Revise Physics Unit 1, 2 hours of DSA, call mom at 8 PM...";
            outputTitle.textContent = "Your Today Plan";
        } else if (mode === "week") {
            rawPlanInput.placeholder = "Example: Finish Project X, 3 gym sessions, revise 5 units, prep for presentation...";
            outputTitle.textContent = "Weekly Execution Guide";
        } else {
            rawPlanInput.placeholder = "Example: Complete Milestone 1, build lifestyle habits, clear backlogs...";
            outputTitle.textContent = "Monthly Milestone View";
        }
    }

    setupTabs();

    let lastGeneratedItems = [];

    // 2. Generation Logic
    generateBtn.onclick = () => {
        const rawText = rawPlanInput.value.trim();
        const topPriority = topPriorityInput ? topPriorityInput.value.trim() : "";
        const mustNotMiss = mustNotMissInput ? mustNotMissInput.value.trim() : "";
        const hours = parseInt(hoursInput ? hoursInput.value : 4) || 4;
        const intensity = intensityInput ? intensityInput.value : "balanced";

        if (!rawText && !topPriority) {
            alert("Please enter your rough plan before generating.");
            return;
        }

        // Improved Parser: Split by newline, dots, commas, or list markers
        let items = rawText
            .split(/[\n,;•\-\d\.]+/ ) 
            .map(s => s.trim())
            .filter(s => s.length > 3); // Minimum length for a real task

        // Rank and Filter
        const structuredPlan = generateMVPPlan(items, topPriority, mustNotMiss, hours, intensity);
        
        // Render
        renderPreview(structuredPlan, intensity);
        lastGeneratedItems = structuredPlan;
    };

    function generateMVPPlan(items, priority, mustMiss, hours, intensity) {
        let result = [];
        
        // Multipliers based on intensity
        let capacityMultiplier = 1.5; 
        if (intensity === "light") capacityMultiplier = 1;
        if (intensity === "intense") capacityMultiplier = 3;
        
        const taskCap = Math.max(3, Math.min(12, Math.floor(hours * capacityMultiplier)));

        // 1. Add Priority if exists
        if (priority) {
            result.push({ title: priority, priority: "high", note: "Top Priority" });
        }

        // 2. Add Must-Not-Miss if exists
        if (mustMiss && !result.some(r => r.title === mustMiss)) {
            result.push({ title: mustMiss, priority: "high", note: "Strict Requirement" });
        }

        // 3. Process remaining items
        items.forEach(item => {
            if (result.length >= taskCap) return;
            if (result.some(r => r.title.toLowerCase() === item.toLowerCase())) return;
            
            result.push({
                title: item,
                priority: "medium",
                note: ""
            });
        });

        return result;
    }

    function renderPreview(planItems, intensity) {
        if (!outputList || !outputArea) return;
        outputList.innerHTML = "";
        outputArea.classList.remove("hidden");
        
        planItems.forEach((item, idx) => {
            const div = document.createElement("div");
            div.className = "planned-item";
            
            div.innerHTML = `
                <div class="badge ${item.priority === 'high' ? 'high' : 'med'}">${item.priority.toUpperCase()}</div>
                <div class="item-content">
                    <strong>${item.title}</strong>
                    ${item.note ? `<p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">${item.note}</p>` : ""}
                </div>
            `;
            outputList.appendChild(div);
        });

        if (outputStats) {
            outputStats.textContent = `${intensity.toUpperCase()} LOAD • ${planItems.length} ITEMS`;
            outputStats.className = "badge " + intensity;
        }
    }

    // 3. Save Logic
    saveBtns.forEach(btn => {
        btn.onclick = () => {
            const targetCategory = btn.dataset.target; // today_todo, weekly_todo, monthly_todo
            if (lastGeneratedItems.length === 0) {
                alert("Please generate a plan first!");
                return;
            }

            savePlanItemsToStorage(lastGeneratedItems, targetCategory);
            
            const originalText = btn.textContent;
            btn.textContent = "Added! ✓";
            btn.style.background = "var(--accent)";
            btn.style.color = "white";
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = "";
                btn.style.color = "";
            }, 2000);
        };
    });

    function savePlanItemsToStorage(items, category) {
        const storedHabits = localStorage.getItem("habits");
        let habits = [];
        try {
            habits = JSON.parse(storedHabits) || [];
        } catch (e) {
            habits = [];
        }

        const newItems = items.map(it => ({
            id: typeof generateId !== "undefined" ? generateId() : "plan-" + Math.random().toString(36).substr(2, 9),
            name: it.title,
            category: "planner", 
            createdAt: typeof getTodayString !== "undefined" ? getTodayString() : new Date().toISOString().slice(0, 10),
            completions: [],
            isSystemGenerated: true
        }));

        const finalStore = [...habits, ...newItems];
        localStorage.setItem("habits", JSON.stringify(finalStore));
        console.log(`[Planner] Committed ${newItems.length} Smart Planner items to habits.`);
    }
};
