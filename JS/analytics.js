/* ==========================================
   HabitMetric — Analytics & Context Logic (analytics.js)
   Handles daily context logging and productivity forecasting.
   ========================================== */

window.initAnalytics = function() {
    console.log("[Analytics] Initializing predictive context engine...");
    
    const moodBtns = document.querySelectorAll(".mood-btn");
    const moodLabel = document.getElementById("mood-label");
    const timeSlider = document.getElementById("time-loss");
    const timeValDisplay = document.getElementById("time-loss-val");
    const dailyNote = document.getElementById("daily-note");
    const restToggle = document.getElementById("rest-day-toggle");
    const probDisplay = document.getElementById("prob-percentage");
    const confidenceTag = document.getElementById("forecast-confidence");
    const saveBtn = document.getElementById("save-context-btn");

    if (!moodBtns || !saveBtn) return;

    let selectedMood = 3; // Neutral
    let selectedMoodLabel = "Neutral";

    // 1. Mood Interaction Logic
    moodBtns.forEach(btn => {
        // Hover behavior
        btn.addEventListener("mouseenter", () => {
            if (moodLabel) {
                moodLabel.textContent = btn.dataset.label;
                moodLabel.style.opacity = "0.7";
            }
        });
        
        btn.addEventListener("mouseleave", () => {
            if (moodLabel) {
                moodLabel.textContent = selectedMoodLabel;
                moodLabel.style.opacity = "1";
            }
        });

        // Selection logic
        btn.onclick = () => {
            moodBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedMood = parseInt(btn.dataset.mood);
            selectedMoodLabel = btn.dataset.label;
            if (moodLabel) {
                moodLabel.textContent = selectedMoodLabel;
                moodLabel.style.opacity = "1";
            }
            updateForecast();
            autoSaveMood(); // Ensure instant sync with Dashboard
        };
    });

    function autoSaveMood() {
        // Save the minimal mood state to localStorage instantly
        const today = getTodayString();
        const currentData = JSON.parse(localStorage.getItem("dailyContext")) || {};
        const activeBtn = document.querySelector(`.mood-btn[data-mood="${selectedMood}"]`);
        
        const d = currentData[today] || {
            note: "",
            timeLoss: 0,
            restDay: false,
            probability: 90
        };

        d.mood = selectedMood;
        d.moodEmoji = activeBtn ? activeBtn.textContent.trim() : "✨";
        d.moodLabel = selectedMoodLabel;

        currentData[today] = d;
        localStorage.setItem("dailyContext", JSON.stringify(currentData));

        // Let other components know the data changed
        if (typeof window.initDashboard === "function") window.initDashboard();
    }

    // 2. Real-time updates
    if (timeSlider) {
        timeSlider.addEventListener("input", () => {
            if (timeValDisplay) timeValDisplay.textContent = timeSlider.value;
            updateForecast();
        });
    }

    if (dailyNote) dailyNote.addEventListener("input", updateForecast);
    if (restToggle) restToggle.addEventListener("change", updateForecast);

    function calculateHistoricBonus() {
        const habits = JSON.parse(localStorage.getItem("habits")) || [];
        if (!habits.length) return { bonus: 0, level: "New User" };
        
        let totalPossible = 0;
        let totalDone = 0;
        const today = new Date();
        
        habits.forEach(h => {
            for (let i = 1; i <= 7; i++) {
                const day = new Date(today);
                day.setDate(today.getDate() - i);
                const ds = typeof formatLocalDate === "function" ? formatLocalDate(day) : day.toISOString().slice(0, 10);
                
                // Only expect completion if the habit was due that day
                const wasDue = typeof isHabitDueOnDate === "function" ? isHabitDueOnDate(h, ds) : true;
                
                if (wasDue) {
                    totalPossible++;
                    if (h.completions && h.completions.includes(ds)) {
                        totalDone++;
                    }
                }
            }
        });

        if (totalPossible === 0) return { bonus: 0, level: "No Valid Habits" };

        const rate = totalDone / totalPossible;
        if (rate > 0.8) return { bonus: 10, level: "High Confidence" };
        if (rate > 0.5) return { bonus: 5, level: "Moderate Confidence" };
        return { bonus: 0, level: "Establishing Pattern" };
    }

    function updateForecast() {
        let prob = 90; // Base

        // Mood Impact
        const moodImpacts = [0, -25, -15, 0, 2, 5];
        const mImpact = moodImpacts[selectedMood] || 0;
        prob += mImpact;

        // Time Loss Impact (hours)
        const hoursLost = timeSlider ? parseFloat(timeSlider.value) : 0;
        if (!isNaN(hoursLost) && hoursLost > 0) {
            prob -= (hoursLost * 8 + Math.pow(hoursLost, 1.5) * 2);
        }

        // Rest Day logic
        if (restToggle && restToggle.checked) {
            prob = Math.max(prob + 20, 85); 
        }

        // Historic Consistency Bonus
        const historic = calculateHistoricBonus();
        if (!isNaN(historic.bonus)) prob += historic.bonus;
        if (confidenceTag) confidenceTag.textContent = historic.level || "Establishing Pattern";

        // Clamp & UI Update
        prob = Math.max(5, Math.min(100, Math.round(prob)));
        if (isNaN(prob)) prob = 50; // Safety fallback

        if (probDisplay) {
            probDisplay.textContent = prob + "%";
            if (prob > 80) probDisplay.style.color = "#10b981";
            else if (prob > 50) probDisplay.style.color = "var(--accent)";
            else probDisplay.style.color = "#ef4444";
        }

        return prob;
    }

    // Initialize with existing data OR defaults
    const today = getTodayString();
    const contextData = JSON.parse(localStorage.getItem("dailyContext")) || {};
    
    if (contextData[today]) {
        const d = contextData[today];
        selectedMood = d.mood;
        selectedMoodLabel = d.moodLabel || "Neutral";
        dailyNote.value = d.note || "";
        restToggle.checked = d.restDay || false;
        if (timeSlider) {
            timeSlider.value = d.timeLoss || 0;
            if (timeValDisplay) timeValDisplay.textContent = timeSlider.value;
        }
    }

    // Always apply state to UI
    const activeBtn = document.querySelector(`.mood-btn[data-mood="${selectedMood}"]`);
    if (activeBtn) {
        moodBtns.forEach(b => b.classList.remove("active"));
        activeBtn.classList.add("active");
        if (moodLabel) {
            moodLabel.textContent = selectedMoodLabel;
            moodLabel.style.opacity = "1";
        }
    }
    updateForecast();

    saveBtn.onclick = () => {
        const forecast = updateForecast();
        
        // Find the precise emoji from the active button
        const activeBtnNow = document.querySelector(`.mood-btn[data-mood="${selectedMood}"]`);
        const emojiToSave = activeBtnNow ? activeBtnNow.textContent.trim() : "✨";

        const d = {
            mood: selectedMood,
            moodEmoji: emojiToSave,
            moodLabel: selectedMoodLabel.trim(),
            note: dailyNote.value.trim(),
            timeLoss: timeSlider ? parseFloat(timeSlider.value) : 0,
            restDay: restToggle.checked,
            probability: forecast,
            timestamp: new Date().getTime()
        };

        const currentData = JSON.parse(localStorage.getItem("dailyContext")) || {};
        currentData[today] = d;
        localStorage.setItem("dailyContext", JSON.stringify(currentData));

        saveBtn.textContent = "Forecast Locked! ✨";
        saveBtn.style.background = "#10b981";
        setTimeout(() => {
            saveBtn.textContent = "Save Progress";
            saveBtn.style.background = "";
        }, 2000);
        
        // Push update to dashboard if in memory
        if (typeof window.initDashboard === "function") window.initDashboard();
    };
};
