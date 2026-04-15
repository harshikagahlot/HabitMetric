/* ==========================================
   HabitMetric — Dashboard Logic (dashboard.js)
   Handles the real heatmap + streak + risk + consistency stats.

   ALL values on this page come from real localStorage data.
   No hardcoded numbers. Every stat is earned.
   ========================================== */


window.initDashboard = function() {
/* ==========================================
   STREAK CALCULATIONS
   ========================================== */

/**
 * Collects every unique date that had at least one habit completion.
 * Returns a sorted array of unique "YYYY-MM-DD" strings.
 *
 * WHY unique: multiple habits done on the same day = ONE active day.
 * Set removes duplicates automatically.
 */
function getAllActiveDates() {
    const habits = JSON.parse(localStorage.getItem("habits")) || [];
    const dateSet = new Set();

    habits.forEach(function (habit) {
        if (habit.completions) {
            habit.completions.forEach(function (date) {
                dateSet.add(date);
            });
        }
    });

    return Array.from(dateSet).sort(); // ISO format sorts chronologically as strings
}


/* ==========================================
   UPDATE THE STAT CARDS
   ========================================== */

function updateStreakCard() {
    const activeDates = getAllActiveDates();
    const streak  = calculateStreak(activeDates);
    const longest = getLongestStreak(activeDates);
    const el      = document.getElementById("streak-value");
    const bestEl  = document.getElementById("longest-streak");
    if (!el) return;

    el.textContent = streak + (streak === 1 ? " Day" : " Days");
    if (longest > 1) bestEl.textContent = "Best: " + longest + " days";
}


/**
 * Drop risk uses research-backed thresholds.
 * Days 7–10 are the peak dropout window — motivation fades, habit not automatic yet.
 * Adds/removes class="warning" to trigger amber CSS style.
 */
function updateRiskCard() {
    const activeDates = getAllActiveDates();
    const streak     = calculateStreak(activeDates);
    const riskCard   = document.getElementById("risk-card");
    const riskValue  = document.getElementById("risk-value");
    const riskReason = document.getElementById("risk-reason");
    if (!riskCard) return;

    if (streak === 0) {
        riskValue.textContent  = "—";
        riskReason.textContent = "Start your first habit";
        riskCard.classList.remove("warning");
    } else if (streak >= 7 && streak <= 10) {
        riskValue.textContent  = "High";
        riskReason.textContent = "Day " + streak + " — historically risky. Check in today.";
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


function updateConsistencyCard() {
    const el = document.getElementById("consistency-value");
    if (!el) return;
    const activeDates = getAllActiveDates();
    el.textContent = getConsistency30Days(activeDates) + "%";
}



const calendarEl  = document.getElementById("calendar");
const monthYearEl = document.getElementById("monthYear");

let currentDate = new Date();


/* ==========================================
   CORE FUNCTION: Get completion level for one day
   ========================================== */

/**
 * Looks at ALL habits and checks how many were completed on a given date.
 * Returns a level string: "none" | "low" | "medium" | "high"
 *
 * HOW IT WORKS:
 * 1. Load all habits from localStorage
 * 2. For each habit, check if the date string exists in its completions[]
 * 3. Count how many habits were completed that day
 * 4. Divide by total habits → get a percentage
 * 5. Map the percentage to a color level
 *
 * @param {string} dateString - date in "YYYY-MM-DD" format e.g. "2026-04-11"
 * @returns {Object} - { level: "none"|"low"|"medium"|"high", count: Number, total: Number }
 */
function getLevelForDate(dateString) {
    const habits = JSON.parse(localStorage.getItem("habits")) || [];

    // Edge case: no habits added yet → show nothing
    if (habits.length === 0) return { level: "none", count: 0, total: 0 };

    // Count how many habits have this date in their completions array
    let completedCount = 0;
    habits.forEach(function (habit) {
        if (habit.completions && habit.completions.includes(dateString)) {
            completedCount++;
        }
    });

    const total = habits.length;
    const rate = completedCount / total;

    let level = "high";
    if (rate === 0)       level = "none";
    else if (rate <= 0.40) level = "low";
    else if (rate <= 0.70) level = "medium";

    return { level: level, count: completedCount, total: total };
}


/* ==========================================
   BUILD THE DATE STRING for any calendar day
   ========================================== */

/**
 * Builds a "YYYY-MM-DD" string for a specific day in a given month/year.
 * This matches the exact format we store in completions[].
 *
 * WHY we build it manually:
 * JavaScript's Date object uses 0-indexed months (Jan = 0, Dec = 11).
 * We add 1 to get the real month number.
 * We pad single digits with "0" so "April 5" becomes "2026-04-05" not "2026-4-5".
 *
 * @param {number} year  - full year e.g. 2026
 * @param {number} month - 0-indexed month (0 = Jan, 3 = April)
 * @param {number} day   - day of month e.g. 5
 * @returns {string} - "YYYY-MM-DD"
 */
function buildDateString(year, month, day) {
    const mm = String(month + 1).padStart(2, "0"); // month: 0→"01", 3→"04"
    const dd = String(day).padStart(2, "0");        // day:   5→"05", 11→"11"
    return year + "-" + mm + "-" + dd;              // "2026-04-11"
}


/* ==========================================
   RENDER THE CALENDAR
   ========================================== */

/**
 * Renders the heatmap calendar for a given month.
 * Each day cell is coloured using REAL completion data from localStorage.
 *
 * @param {Date} date - the month/year to render
 */
function renderCalendar(date) {
    calendarEl.innerHTML = ""; // Clear previous render

    const year  = date.getFullYear();
    const month = date.getMonth();     // 0-indexed

    const firstDay    = new Date(year, month, 1).getDay();  // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Update the "April 2026" heading
    monthYearEl.textContent =
        date.toLocaleString("default", { month: "long" }) + " " + year;

    // Add day-of-week headers (S M T W T F S)
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    weekdays.forEach(function(day) {
        const header = document.createElement("div");
        header.classList.add("weekday");
        header.textContent = day;
        calendarEl.appendChild(header);
    });

    // Add blank spacers so Day 1 lands under the correct weekday column
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement("div");
        blank.classList.add("empty");
        calendarEl.appendChild(blank);
    }

    // Render each day of the month
    for (let day = 1; day <= daysInMonth; day++) {

        // Build "YYYY-MM-DD" for this specific day
        const dateString = buildDateString(year, month, day);

        // Get the real completion stats for this date from localStorage
        const stats = getLevelForDate(dateString);

        // Build the day cell
        const dayBox = document.createElement("div");
        dayBox.classList.add("day", stats.level); // both classes applied at once

        dayBox.textContent = day;

        // Hover tooltip — shows real info, including numerical count
        dayBox.setAttribute("title", dateString + " — " + stats.count + "/" + stats.total + " habits completed (" + stats.level + ")");

        calendarEl.appendChild(dayBox);
    }
}


// ---- Navigation: Previous / Next Month ----
document.getElementById("prevMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});

document.getElementById("nextMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});


// ---- Initial Render on page load ----
renderCalendar(currentDate);

/* ==========================================
   SVG PROGRESS RING
   ========================================== */
function updateProgressRing() {
    const today = getTodayString();
    const stats = getLevelForDate(today);

    const ringText = document.getElementById("today-progress-text");
    const circle = document.querySelector(".progress-ring__circle");
    
    if (!ringText || !circle) return;

    if (stats.total === 0) {
        ringText.textContent = "0/0";
        circle.style.strokeDasharray = "314 314";
        circle.style.strokeDashoffset = "314";
        return;
    }

    ringText.textContent = stats.count + "/" + stats.total;

    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    const rate = stats.count / stats.total;
    const offset = circumference - (rate * circumference);

    circle.style.strokeDashoffset = offset;
}

// ---- Update real stat cards on page load ----
updateStreakCard();
updateRiskCard();
updateConsistencyCard();
updateIdentityStatement();

// Small delay to ensure CSS transition fires on load
setTimeout(() => {
    updateProgressRing();
}, 100);

/* ==========================================
   IDENTITY STATEMENT (Step 6)
   ========================================== */
function updateIdentityStatement() {
    const user = JSON.parse(localStorage.getItem("user"));
    const statementEl = document.getElementById("identity-statement");
    
    if (!statementEl) return;
    
    if (!user || !user.identities || user.identities.length === 0) {
        statementEl.style.display = "none";
        return;
    }
    
    // Rotate identity based on day of year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const index = dayOfYear % user.identities.length;
    const identity = user.identities[index];
    
    statementEl.textContent = `Today you are building: ${identity} 📖`;
}

}; // End of initDashboard()
