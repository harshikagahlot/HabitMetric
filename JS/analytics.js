/* ==========================================
   HabitMetric — Analytics & Context Logic (analytics.js)
   Handles daily context logging and productivity forecasting.
   ========================================== */

window.initAnalytics = function() {
    console.log("[Analytics] Initializing context engine...");
    
    const moodBtns = document.querySelectorAll(".mood-btn");
    const moodLabel = document.getElementById("mood-label");
    const dailyNote = document.getElementById("daily-note");
    const restToggle = document.getElementById("rest-day-toggle");
    const probDisplay = document.getElementById("prob-percentage");
    const saveBtn = document.getElementById("save-context-btn");

    if (!moodBtns || !saveBtn) return;

    let selectedMood = 3; // Default Neutral

    // Mood selection logic
    moodBtns.forEach(btn => {
        btn.onclick = () => {
            moodBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedMood = parseInt(btn.dataset.mood);
            
            const labels = ["Drained", "Low", "Neutral", "Good", "Peak"];
            moodLabel.textContent = labels[selectedMood - 1];
            updateForecast();
        };
    });

    // Auto-update forecast on typing or toggling
    dailyNote.oninput = updateForecast;
    restToggle.onchange = updateForecast;

    function updateForecast() {
        // Base probability starts at 90%
        let prob = 90;

        // Mood Impact
        if (selectedMood <= 2) prob -= 15;
        if (selectedMood === 5) prob += 5;

        // Interference Impact (if text is entered)
        if (dailyNote.value.trim().length > 5) {
            prob -= 15;
        }

        // Rest Day Impact (capped)
        if (restToggle.checked) {
            prob = Math.max(prob - 10, 40);
        }

        // Final Clamp
        prob = Math.max(10, Math.min(100, prob));
        probDisplay.textContent = prob + "%";
        return prob;
    }

    // Load existing data for today
    const today = new Date().toISOString().slice(0, 10);
    const contextData = JSON.parse(localStorage.getItem("dailyContext")) || {};
    
    if (contextData[today]) {
        const d = contextData[today];
        selectedMood = d.mood;
        dailyNote.value = d.note || "";
        restToggle.checked = d.restDay || false;
        
        // Update UI
        const activeBtn = document.querySelector(`.mood-btn[data-mood="${selectedMood}"]`);
        if (activeBtn) activeBtn.click();
    } else {
        // Trigger initial forecast
        updateForecast();
    }

    saveBtn.onclick = () => {
        const d = {
            mood: selectedMood,
            note: dailyNote.value.trim(),
            restDay: restToggle.checked,
            probability: updateForecast(),
            timestamp: new Date().getTime()
        };

        const currentData = JSON.parse(localStorage.getItem("dailyContext")) || {};
        currentData[today] = d;
        localStorage.setItem("dailyContext", JSON.stringify(currentData));

        saveBtn.textContent = "Saved! ✨";
        setTimeout(() => saveBtn.textContent = "Save Progress", 2000);
        
        // Trigger dashboard update if needed
        if (typeof window.initDashboard === "function") window.initDashboard();
    };
};
