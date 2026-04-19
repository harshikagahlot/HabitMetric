/* ==========================================
   HabitMetric — Dashboard Logic (dashboard.js)
   ========================================== */

let _dashCurrentDate = new Date(); // persists across SPA navigations

window.initDashboard = function () {

    // ---- Helpers ----
    function getAllActiveDates() {
        const habits = JSON.parse(localStorage.getItem("habits")) || [];
        const dateSet = new Set();
        habits.forEach(h => { if (h.completions) h.completions.forEach(d => dateSet.add(d)); });
        return Array.from(dateSet).sort();
    }

    function getLevelForDate(dateString) {
        const habits = JSON.parse(localStorage.getItem("habits")) || [];
        if (!habits.length) return { level: "none", count: 0, total: 0 };
        
        let count = 0;
        let dueHabits = habits;

        // Ensure we only calculate stats against habits actually due on this date.
        // We use window.isHabitDueOnDate from app.js
        if (typeof isHabitDueOnDate === "function") {
            dueHabits = habits.filter(h => isHabitDueOnDate(h, dateString));
        }

        const total = dueHabits.length;
        if (total === 0) return { level: "none", count: 0, total: 0 };

        dueHabits.forEach(h => { if (h.completions && h.completions.includes(dateString)) count++; });
        
        const rate  = count / total;
        let level = "high";
        if (rate === 0)       level = "none";
        else if (rate <= 0.40) level = "low";
        else if (rate <= 0.70) level = "medium";
        return { level, count, total };
    }

    function buildDateString(year, month, day) {
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(day).padStart(2, "0");
        return `${year}-${mm}-${dd}`;
    }

    // ---- Stat Cards ----
    function updateStreakCard() {
        const dates   = getAllActiveDates();
        const streak  = calculateStreak(dates);
        const longest = getLongestStreak(dates);
        const el      = document.getElementById("streak-value");
        const bestEl  = document.getElementById("longest-streak");
        if (!el) return;
        el.textContent = streak + (streak === 1 ? " Day" : " Days");
        if (longest > 1 && bestEl) bestEl.textContent = "Best: " + longest + " days";
    }

    function updateRiskCard() {
        const streak    = calculateStreak(getAllActiveDates());
        const riskCard  = document.getElementById("risk-card");
        const riskValue = document.getElementById("risk-value");
        const riskReason= document.getElementById("risk-reason");
        if (!riskCard) return;

        if (streak === 0) {
            riskValue.textContent  = "—";
            riskReason.textContent = "Start your first habit";
            riskCard.classList.remove("warning");
        } else if (streak >= 7 && streak <= 10) {
            riskValue.textContent  = "High";
            riskReason.textContent = `Day ${streak} — historically risky. Check in today.`;
            riskCard.classList.add("warning");
        } else if (streak >= 3 && streak <= 6) {
            riskValue.textContent  = "Medium";
            riskReason.textContent = "Building momentum. Stay consistent.";
            riskCard.classList.remove("warning");
        } else {
            riskValue.textContent  = "Low";
            riskReason.textContent = "You're in a strong rhythm. 🔥";
            riskCard.classList.remove("warning");
        }
    }

    function updateTodayCompletionCard() {
        const valEl = document.getElementById("consistency-value");
        const fillEl = document.getElementById("consistency-fill");
        if (!valEl || !fillEl) return;
        
        const today = getTodayString ? getTodayString() : new Date().toISOString().slice(0, 10);
        const stats = getLevelForDate(today);
        
        let score = 0;
        if (stats.total > 0) {
            score = Math.round((stats.count / stats.total) * 100);
        }
        
        valEl.textContent = score + "%";
        fillEl.style.width = score + "%";
    }

    function updateProgressRing() {
        const today   = getTodayString();
        const stats   = getLevelForDate(today);
        const ringText= document.getElementById("today-progress-text");
        const circle  = document.querySelector(".progress-ring__circle");
        if (!ringText || !circle) return;

        if (stats.total === 0) {
            ringText.textContent = "0/0";
            circle.style.strokeDasharray  = "314 314";
            circle.style.strokeDashoffset = "314";
            return;
        }
        ringText.textContent = `${stats.count}/${stats.total}`;
        const r   = circle.r.baseVal.value;
        const circ= r * 2 * Math.PI;
        circle.style.strokeDasharray  = `${circ} ${circ}`;
        circle.style.strokeDashoffset = circ - (stats.count / stats.total) * circ;
    }

    function updateIdentityStatement() {
        const user      = JSON.parse(localStorage.getItem("user"));
        const statementEl = document.getElementById("identity-statement");
        if (!statementEl) return;
        if (!user || !user.identities || !user.identities.length) {
            statementEl.style.display = "none";
            return;
        }
        const start     = new Date(new Date().getFullYear(), 0, 0);
        const dayOfYear = Math.floor((new Date() - start) / 86400000);
        const identity  = user.identities[dayOfYear % user.identities.length];
        statementEl.textContent = `Today you are building: ${identity} 📖`;
    }

    function updateDayStatus() {
        const today = getTodayString();
        const contextData = JSON.parse(localStorage.getItem("dailyContext")) || {};
        const emojiEl = document.getElementById("day-emoji");
        const labelEl = document.getElementById("day-mood-label");

        if (!emojiEl || !labelEl) return;

        if (contextData[today]) {
            const d = contextData[today];
            // Use saved values directly for perfect sync
            emojiEl.textContent = d.moodEmoji || "✨";
            labelEl.textContent = d.moodLabel || "Logged";
            
        } else {
            emojiEl.textContent = "✨";
            labelEl.textContent = "Not Logged";
        }
    }

    // ---- Calendar ----
    function renderCalendar(date) {
        const calendarEl  = document.getElementById("calendar");
        const monthYearEl = document.getElementById("monthYear");
        if (!calendarEl || !monthYearEl) return;

        calendarEl.innerHTML = "";
        const year  = date.getFullYear();
        const month = date.getMonth();

        monthYearEl.textContent =
            date.toLocaleString("default", { month: "long" }) + " " + year;

        // Day-of-week headers
        ["S","M","T","W","T","F","S"].forEach(d => {
            const h = document.createElement("div");
            h.classList.add("weekday");
            h.textContent = d;
            calendarEl.appendChild(h);
        });

        // Leading blank cells
        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement("div");
            blank.classList.add("empty");
            calendarEl.appendChild(blank);
        }

        // Day cells
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const ds    = buildDateString(year, month, day);
            const stats = getLevelForDate(ds);
            const box   = document.createElement("div");
            box.classList.add("day", stats.level);
            box.textContent = day;
            box.setAttribute("title", `${ds} — ${stats.count}/${stats.total} habits (${stats.level})`);
            calendarEl.appendChild(box);
        }
    }

    // ---- Attach calendar navigation (only once, use cloneNode trick to wipe old listeners) ----
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");

    if (prevBtn && nextBtn) {
        // Clone to remove any old listeners from previous SPA navigation
        const newPrev = prevBtn.cloneNode(true);
        const newNext = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);

        newPrev.addEventListener("click", () => {
            _dashCurrentDate.setMonth(_dashCurrentDate.getMonth() - 1);
            renderCalendar(_dashCurrentDate);
        });
        newNext.addEventListener("click", () => {
            _dashCurrentDate.setMonth(_dashCurrentDate.getMonth() + 1);
            renderCalendar(_dashCurrentDate);
        });
    }

    // ---- Run all updates ----
    updateStreakCard();
    updateRiskCard();
    updateTodayCompletionCard();
    updateDayStatus();
    renderCalendar(_dashCurrentDate);

    setTimeout(() => updateProgressRing(), 50);

}; // end initDashboard
