window.initRisk = function () {
    console.log("[Coach] Smart behavioral engine starting...");
    
    // UI Elements
    const grid = document.getElementById("insights-grid");
    const riskLevelTxt = document.getElementById("risk-level-display");
    const riskMeter = document.getElementById("risk-meter");
    const riskBadge = document.querySelector(".status-badge");
    const notice = document.getElementById("insufficient-data-notice");
    const riskCard = document.getElementById("risk-status-card");
    const chatHistory = document.getElementById("chat-history");
    const chatInput = document.getElementById("coach-input");
    const askBtn = document.getElementById("ask-btn");

    if (!grid || !riskLevelTxt) return;

    // 1. Data Signals
    const habits = JSON.parse(localStorage.getItem("habits")) || [];
    const contextData = JSON.parse(localStorage.getItem("dailyContext")) || {};
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const today = getTodayString();

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(formatLocalDate(d));
    }

    if (Object.keys(contextData).length < 2 && habits.length === 0) {
        notice.classList.remove("hidden");
        riskCard.style.display = "none";
        grid.style.display = "none";
        return;
    }

    // 2. Behavioral Scoring Engine
    let riskScore = 0;
    const insights = [];

    // Rule 1: Streak Fragility (Never Miss Twice)
    const yesterdayStr = dates[1];
    const missedYesterday = habits.filter(h => 
        h.completions.length > 0 && !h.completions.includes(yesterdayStr)
    );
    if (missedYesterday.length > 0) {
        riskScore += 30;
        insights.push({
            title: "Streak Fragility",
            text: `You missed ${missedYesterday.length} habit(s) yesterday. The first miss is a mistake; the second is a new pattern. **Show up today.**`,
            type: "warning"
        });
    }

    // Rule 2: Low Energy Trend
    const recentContext = dates.slice(0, 3).map(dt => contextData[dt]).filter(Boolean);
    const avgMood = recentContext.length ? recentContext.reduce((acc, curr) => acc + curr.mood, 0) / recentContext.length : 3;
    if (avgMood < 2.5) {
        riskScore += 25;
        insights.push({
            title: "Energy Burnout",
            text: "Your average mood has been low for 3 days. Your willpower is likely depleted. Consider switching to 'Light Mode' habits.",
            type: "burnout"
        });
    }

    // Rule 3: Interference Spike
    const avgInterference = recentContext.length ? recentContext.reduce((acc, curr) => acc + (curr.timeLoss || 0), 0) / recentContext.length : 0;
    if (avgInterference > 2) {
        riskScore += 20;
        insights.push({
            title: "Interference Spike",
            text: `External factors are stealing ~${Math.round(avgInterference)}h daily. You cannot build neural pathways in a fire-drill. Protect your focus window.`,
            type: "risk"
        });
    }

    // Rule 4: Momentum Check
    const todayCompletions = habits.filter(h => h.completions.includes(today)).length;
    if (habits.length > 0 && todayCompletions === 0 && new Date().getHours() > 18) {
        riskScore += 15;
    }

    // Rule 5: Identity Erosion
    categories.forEach(cat => {
        const catHabits = habits.filter(h => h.categoryId === cat.id);
        if (!catHabits.length) return;
        
        const lastActivity = Math.max(...catHabits.map(h => {
            if (!h.completions.length) return 0;
            return new Date(h.completions.sort().reverse()[0]).getTime();
        }));
        
        const daysSince = lastActivity === 0 ? 99 : (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
        if (daysSince > 4) {
            riskScore += 5;
            insights.push({
                title: `${cat.name} Identity Erosion`,
                text: `It's been ${Math.floor(daysSince)} days since you practiced your ${cat.name} identity. This neural pathway is fading.`,
                type: "identity"
            });
        }
    });

    // 3. UI Update
    riskScore = Math.min(100, riskScore);
    riskMeter.style.width = riskScore + "%";
    
    let level = "Low Risk";
    let color = "var(--risk-low)";
    if (riskScore > 60) { level = "High Risk"; color = "var(--risk-high)"; }
    else if (riskScore > 30) { level = "Medium Risk"; color = "var(--risk-med)"; }

    riskLevelTxt.textContent = level;
    riskBadge.textContent = "Status: " + level;
    riskBadge.style.background = color;
    riskMeter.style.background = color;

    grid.innerHTML = insights.map(i => `
        <div class="insight-card">
            <h3>${i.title}</h3>
            <p>${i.text}</p>
        </div>
    `).join("") || `<div class="insight-card"><h3>Rhythm Stable</h3><p>No major risk signals detected. Keep your streak alive.</p></div>`;

    // 4. Conversational Logic (Ask the Coach)
    if (askBtn) {
        askBtn.onclick = handleAsk;
        chatInput.onkeydown = (e) => { if (e.key === "Enter") handleAsk(); };
    }

    function handleAsk() {
        const q = chatInput.value.trim().toLowerCase();
        if (!q) return;

        // User Message
        appendMsg(chatInput.value, "user");
        chatInput.value = "";

        // Artificial processing delay
        setTimeout(() => {
            let response = "I'm not sure about that pattern yet. Try asking about 'consistency', 'risks', or 'recovery'.";

            if (q.includes("consistency") || q.includes("why")) {
                if (riskScore > 50) response = "Your consistency is at risk because of " + (avgMood < 2.5 ? "prolonged low energy levels." : "missed habits breaking your momentum.");
                else response = "You're doing great! Your consistency is stable at " + (100 - riskScore) + "% durability.";
            } else if (q.includes("risk") || q.includes("slipping")) {
                if (missedYesterday.length > 0) response = `The biggest risk is currently ${missedYesterday[0].name}. You missed it yesterday, and your streak is fragile.`;
                else response = "No habits are currently in the 'Danger Zone'. You've been remarkably consistent.";
            } else if (q.includes("reduce") || q.includes("today")) {
                if (avgMood < 2.5) response = "I recommend reducing your goals today. Focus only on your 'General' habits and skip complex identity work until your energy recovers.";
                else response = "Your energy looks good. No need to reduce—momentum is your best friend right now.";
            } else if (q.includes("category")) {
                const eroding = insights.find(i => i.title.includes("Erosion"));
                response = eroding ? `${eroding.text} I'd prioritize that today.` : "All your identity categories are healthy and stable.";
            }

            appendMsg(response, "coach");
        }, 600);
    }

    function appendMsg(text, sender) {
        const div = document.createElement("div");
        div.className = `${sender}-msg bubble`;
        div.textContent = text;
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
};

