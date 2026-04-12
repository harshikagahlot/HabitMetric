/* ==========================================
   HabitMetric — Shared App Logic (app.js)
   Runs on every page.
   ==========================================

   WHAT THIS FILE DOES:
   1. Sets a time-aware greeting (Morning / Afternoon / Evening / Night)
   2. Automatically marks the correct sidebar link as "active"
      based on the current page URL — so you never need to set
      class="active" manually in the HTML again.
   ========================================== */


/**
 * Updates the element with id="greeting" with a time-sensitive message.
 * If no greeting element exists on the page, it safely does nothing.
 */
function setGreeting() {
    const greetingEl = document.getElementById("greeting");
    if (!greetingEl) return; // Not all pages have a greeting

    const hour = new Date().getHours();
    let timeOfDay;

    if (hour >= 5  && hour < 12) timeOfDay = "Good Morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "Good Afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "Good Evening";
    else                               timeOfDay = "Good Night";

    greetingEl.textContent = timeOfDay + ", Jiyuu 👋";
}


/**
 * Reads the current page filename from the URL and adds class="active"
 * to whichever sidebar <li> contains a matching <a href>.
 *
 * Example: if the URL ends in "myhabits.html", the <li> wrapping
 * <a href="myhabits.html"> gets class="active" automatically.
 */
function setSidebarActive() {
    // Get just the filename, e.g. "myhabits.html" or "index.html"
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    const navLinks = document.querySelectorAll(".sidebar ul li a");

    navLinks.forEach(function (link) {
        const linkPage = link.getAttribute("href");
        const parentLi = link.parentElement;

        if (linkPage === currentPage) {
            parentLi.classList.add("active");
        } else {
            parentLi.classList.remove("active");
        }
    });
}


/**
 * Returns today's date as a string in "YYYY-MM-DD" format.
 * Example: "2026-04-11"
 *
 * WHY this format: It's the ISO standard. It sorts correctly as a string
 * (alphabetical order = chronological order), which makes streak
 * and heatmap calculations much simpler.
 */
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}


/**
 * Generates a simple unique ID for each habit.
 * Combines current timestamp (base-36) + random characters.
 * Example output: "lf2k8r4ab"
 *
 * WHY we need this: We now find habits by their ID, not by array index.
 * Using index was fragile — if habits are reordered or deleted,
 * the index shifts and points to the wrong habit.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}


/**
 * Returns the user object from localStorage.
 * If it doesn't exist yet (first visit), creates a default one and saves it.
 *
 * Structure:
 * {
 *   name:           "Jiyuu"           ← set during onboarding
 *   identities:     ["Reader", ...]   ← chosen during onboarding
 *   dailyResetHour: 5                 ← when a new habit-day begins (5am default)
 * }
 *
 * WHY dailyResetHour: If you complete a habit at 2am, it should count for
 * "yesterday" not "today". The reset hour defines that boundary.
 */
function getUser() {
    let user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        // First visit — create default user object
        user = {
            name:           "Friend",
            identities:     [],
            dailyResetHour: 5
        };
        localStorage.setItem("user", JSON.stringify(user));
    }

    return user;
}

/**
 * Saves an updated user object back to localStorage.
 * @param {Object} updatedUser
 */
function saveUser(updatedUser) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
}


// ---- Run on every page load ----
setGreeting();
setSidebarActive();
