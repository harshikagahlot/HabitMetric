/* ==========================================
   HabitMetric — Dashboard Logic (dashboard.js)
   Handles the real heatmap calendar.
   ========================================== */


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
 * @returns {string} - "none" | "low" | "medium" | "high"
 */
function getLevelForDate(dateString) {
    const habits = JSON.parse(localStorage.getItem("habits")) || [];

    // Edge case: no habits added yet → show nothing
    if (habits.length === 0) return "none";

    // Count how many habits have this date in their completions array
    // habit.completions.includes(dateString) returns true/false
    // We add up all the true values (true = 1, false = 0 in JS math)
    let completedCount = 0;
    habits.forEach(function (habit) {
        if (habit.completions && habit.completions.includes(dateString)) {
            completedCount++;
        }
    });

    // Calculate the completion rate as a percentage
    const rate = completedCount / habits.length; // e.g. 2/3 = 0.666...

    // Map the rate to a visual level
    // These thresholds can be tuned later
    if (rate === 0)       return "none";
    if (rate <= 0.40)     return "low";
    if (rate <= 0.70)     return "medium";
    return "high";
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

        // Get the real completion level for this date from localStorage
        const level = getLevelForDate(dateString); // "none"|"low"|"medium"|"high"

        // Build the day cell
        const dayBox = document.createElement("div");
        dayBox.classList.add("day", level); // both classes applied at once

        dayBox.textContent = day;

        // Hover tooltip — shows real info, not fake
        dayBox.setAttribute("title", dateString + " — " + level + " activity");

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
