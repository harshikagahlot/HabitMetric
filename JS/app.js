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


// ---- Run on every page load ----
setGreeting();
setSidebarActive();
