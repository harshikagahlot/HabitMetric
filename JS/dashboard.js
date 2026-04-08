/* ==========================================
   HabitMetric — Dashboard Logic (dashboard.js)
   Handles the heatmap calendar.
   ==========================================

   TODO (future improvements):
   - Replace random levels with real per-day completion data from localStorage
   - Show a tooltip on hover with habit completion count for that day
   ========================================== */


const calendarEl  = document.getElementById("calendar");
const monthYearEl = document.getElementById("monthYear");

let currentDate = new Date();


/**
 * Renders the heatmap calendar for a given month.
 *
 * Each day box gets a CSS class: "none" | "low" | "medium" | "high"
 * Currently uses random values as a placeholder until real data is wired in.
 *
 * @param {Date} date - The month/year to render
 */
function renderCalendar(date) {
    calendarEl.innerHTML = ""; // Clear previous render

    const year  = date.getFullYear();
    const month = date.getMonth();

    const firstDay    = new Date(year, month, 1).getDay();   // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Update the month/year heading
    monthYearEl.textContent =
        date.toLocaleString("default", { month: "long" }) + " " + year;

    // Blank spacers to align the first day correctly under its weekday column
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement("div");
        blank.classList.add("empty");
        calendarEl.appendChild(blank);
    }

    // Render each day
    for (let day = 1; day <= daysInMonth; day++) {
        const dayBox = document.createElement("div");
        dayBox.classList.add("day");

        // --- Placeholder: replace with real data later ---
        const levels = ["none", "low", "medium", "high"];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        dayBox.classList.add(randomLevel);
        // --------------------------------------------------

        dayBox.textContent = day;
        dayBox.setAttribute("title", "Day " + day + " — " + randomLevel + " activity");

        calendarEl.appendChild(dayBox);
    }
}


// ---- Navigation Controls ----
document.getElementById("prevMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});

document.getElementById("nextMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});


// ---- Initial Render ----
renderCalendar(currentDate);
