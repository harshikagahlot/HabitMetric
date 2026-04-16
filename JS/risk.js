/* ==========================================
   HabitMetric — Risk Insights & AI Coach (risk.js)
   Analyzes localStorage to provide behavioral psychology coaching.
   ========================================== */

window.initRisk = function () {
    console.log("Risk Insights Engine Online...");
    const coachContainer = document.getElementById("coach-container");
    const riskMetricsContainer = document.getElementById("risk-metrics-container");

    if (!coachContainer || !riskMetricsContainer) return;

    const insights = analyzeHabits();
    renderCoach(coachContainer, insights);
    renderMetrics(riskMetricsContainer, insights);
};

/**
 * Core Logic Engine
 * Scans localStorage and calculates risk scores based on patterns.
 */
function analyzeHabits() {
    const habits = JSON.parse(localStorage.getItem("habits")) || [];
    const today = getTodayString();

    // 1. Never Miss Twice Check
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const missedYesterday = habits.filter(h =>
        h.completions && !h.completions.includes(yesterdayStr) && h.completions.length > 0
    );

    // 2. Identity Erosion (Categories untouched for 3 days)
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const categoryHealth = categories.map(cat => {
        const catHabits = habits.filter(h => h.category === cat);
        const lastActive = Math.max(...catHabits.map(h => {
            if (!h.completions || h.completions.length === 0) return 0;
            return new Date(h.completions.sort().reverse()[0]).getTime();
        }));

        const daysSince = lastActive === 0 ? 99 : (new Date() - new Date(lastActive)) / (1000 * 60 * 60 * 24);
        return { name: cat, daysSince: Math.floor(daysSince), health: daysSince > 3 ? 'eroding' : 'stable' };
    });

    // 3. Selection of "Top Insight"
    let message = "Your rhythm is stable. You're building solid neural pathways today.";
    let type = "praise";

    if (missedYesterday.length > 0) {
        message = `You missed ${missedYesterday.length} habit(s) yesterday. Remember the most important rule: **Never Miss Twice**. Today is the day to show back up.`;
        type = "warning";
    } else if (categoryHealth.some(c => c.health === 'eroding')) {
        const eroded = categoryHealth.find(c => c.health === 'eroding');
        message = `Your **${eroded.name}** identity is starting to erode. It's been ${eroded.daysSince} days. Just 2 minutes of effort today can stop the leak.`;
        type = "identity";
    }

    return {
        missedYesterday,
        categoryHealth,
        coachMessage: message,
        messageType: type
    };
}

function renderCoach(container, insights) {
    container.innerHTML = `
        <div class="coach-bubble ${insights.messageType}">
            <div class="coach-avatar">🧘</div>
            <div class="coach-content">
                <span class="coach-name">Mindset Coach</span>
                <p>${insights.coachMessage}</p>
            </div>
        </div>
    `;
}

function renderMetrics(container, insights) {
    container.innerHTML = `
        <div class="risk-grid">
            <div class="risk-card">
                <h3>Streak Fragility</h3>
                <div class="risk-status ${insights.missedYesterday.length > 0 ? 'high' : 'low'}">
                    ${insights.missedYesterday.length > 0 ? 'CRITICAL' : 'STABLE'}
                </div>
                <small>${insights.missedYesterday.length > 0 ? 'Rule: Never Miss Twice' : 'Neural pathways strengthening'}</small>
            </div>
            <div class="risk-card">
                <h3>Identity Stability</h3>
                <ul class="cat-health-list">
                    ${insights.categoryHealth.map(cat => `
                        <li>
                            <span>${cat.name}</span>
                            <span class="health-dot ${cat.health}"></span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}
