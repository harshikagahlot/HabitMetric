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

    const user = getUser();
    const name = user && user.name ? user.name : "Friend";

    if (hour >= 5  && hour < 12) timeOfDay = "Good Morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "Good Afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "Good Evening";
    else                               timeOfDay = "Good Night";

    greetingEl.textContent = timeOfDay + ", " + name + " 👋";
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
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

/**
 * Saves an updated user object back to localStorage.
 * @param {Object} updatedUser
 */
function saveUser(updatedUser) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
}


/* ==========================================
   SHARED STREAK & STATS UTILITIES
   Takes an array of date strings ["YYYY-MM-DD", ...]
   Works for both global stats and individual habits.
   ========================================== */

/**
 * Calculates the current streak — consecutive days ending today or yesterday.
 */
function calculateStreak(datesArray) {
    if (!datesArray || datesArray.length === 0) return 0;

    const activeSet = new Set(datesArray);
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().slice(0, 10);

        if (activeSet.has(dateStr)) {
            streak++;
        } else if (i === 0) {
            continue; // today not done yet — check yesterday before stopping
        } else {
            break;    // gap found — streak ends
        }
    }

    return streak;
}

/**
 * Finds the longest streak ever achieved across history.
 */
function getLongestStreak(datesArray) {
    if (!datesArray || datesArray.length === 0) return 0;

    const sortedDates = [...new Set(datesArray)].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev    = new Date(sortedDates[i - 1]);
        const curr    = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24)); // handle DST

        if (diffDays === 1) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1; // gap — reset
        }
    }

    return longest;
}

/**
 * 30-day consistency: what % of the last 30 days had any activity.
 */
function getConsistency30Days(datesArray) {
    if (!datesArray) return 0;
    const activeSet = new Set(datesArray);
    let activeDayCount = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (activeSet.has(dateStr)) activeDayCount++;
    }

    return Math.round((activeDayCount / 30) * 100);
}


/**
 * Ensures new users are redirected to the onboarding flow
 * if they haven't completed it yet.
 */
function enforceOnboarding() {
    const user = localStorage.getItem("user");
    const isCurrentlyOnboarding = window.location.pathname.includes("onboarding.html");
    
    // If no user exists and they aren't already on the onboarding page, redirect them.
    if (!user && !isCurrentlyOnboarding) {
        window.location.href = "onboarding.html";
    }
    // If a user exists and they try to go back to onboarding, send them to dashboard.
    if (user && isCurrentlyOnboarding) {
        window.location.href = "index.html";
    }
}

// ---- Run on every page load ----
enforceOnboarding();

// Only run these if we aren't redirecting
const user = localStorage.getItem("user");
const isCurrentlyOnboarding = window.location.pathname.includes("onboarding.html");

if (user || isCurrentlyOnboarding) {
    setGreeting();
    setSidebarActive();
}
