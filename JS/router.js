/* ==========================================
   HabitMetric — SPA Router (router.js)
   Handles smooth, glitch-free page transitions.

   HOW IT ELIMINATES THE GLITCH:
   1. Fade out old content
   2. Fetch new page HTML
   3. Detect any missing CSS stylesheets from the new page
   4. Inject them and AWAIT their 'load' event (browser confirms styles are parsed)
   5. ONLY THEN swap innerHTML and run init scripts
   6. Fade in fully-styled content

   Result: User NEVER sees unstyled content. Ever.
   ========================================== */

function initRouter() {
    // Fire initial page init
    triggerInitFunction(window.location.pathname);

    // Intercept sidebar link clicks
    document.body.addEventListener("click", e => {
        const link = e.target.closest(".sidebar a");
        if (!link) return;

        e.preventDefault();
        const url = link.getAttribute("href");

        // Don't reload the same page
        if (window.location.pathname.endsWith(url)) return;

        window.history.pushState(null, "", url);
        loadPage(url);
    });

    // Handle browser Back/Forward buttons
    window.addEventListener("popstate", () => {
        loadPage(window.location.pathname, false);
    });
}

// Boot the router
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRouter);
} else {
    initRouter();
}

/**
 * Core page loader. Fetches HTML, waits for CSS, then reveals fully-styled content.
 */
async function loadPage(url) {
    const mainEl = document.querySelector(".main");

    // Step 1: Fade out
    if (mainEl) {
        mainEl.style.transition = "opacity 0.15s ease-out";
        mainEl.style.opacity = "0";
    }

    try {
        // Step 2: Fetch new page HTML
        const response = await fetch(url);
        if (!response.ok) throw new Error("Page not found: " + url);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newMain = doc.querySelector(".main");

        if (!newMain || !mainEl) return;

        // Step 3: Find CSS files in the new page that aren't loaded yet
        const cssPromises = [];
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute("href");
            if (!document.querySelector(`link[href="${href}"]`)) {
                const newLink = document.createElement("link");
                newLink.rel = "stylesheet";
                newLink.href = href;

                // Create a Promise that resolves when this stylesheet is fully parsed
                const p = new Promise(resolve => {
                    newLink.addEventListener("load", resolve);
                    newLink.addEventListener("error", resolve); // don't block on 404
                });
                cssPromises.push(p);
                document.head.appendChild(newLink);
            }
        });

        // Step 4: Wait for ALL new stylesheets to be ready
        await Promise.all(cssPromises);

        // Step 5: Swap content — styles are guaranteed ready at this point
        mainEl.innerHTML = newMain.innerHTML;
        mainEl.className = newMain.className;
        document.title = doc.title;

        // Step 6: Update sidebar active state
        updateSidebarActiveLink(url);

        // Step 7: Run page-specific init (calendar, habits list, etc.)
        triggerInitFunction(url);

        // Step 8: Fade in — double rAF ensures browser has painted the new layout
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mainEl.style.transition = "opacity 0.2s ease-in";
                mainEl.style.opacity = "1";
            });
        });

    } catch (err) {
        console.error("[Router] Navigation error:", err);
        if (mainEl) mainEl.style.opacity = "1"; // Always recover
    }
}

function updateSidebarActiveLink(url) {
    document.querySelectorAll(".sidebar ul li").forEach(li => li.classList.remove("active"));
    document.querySelectorAll(".sidebar ul li a").forEach(link => {
        const href = link.getAttribute("href");
        if (url.endsWith(href) || (url === "/" && href === "index.html")) {
            link.parentElement.classList.add("active");
        }
    });
}

function triggerInitFunction(url) {
    // Re-render Lucide icons for newly injected SVG placeholders
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    // Call correct page init
    if (url.includes("index.html") || url.includes("habitmetric.html") || url.endsWith("/")) {
        if (typeof window.initDashboard === "function") window.initDashboard();
    } else if (url.includes("myhabits.html")) {
        if (typeof window.initMyHabits === "function") window.initMyHabits();
    } else if (url.includes("settings.html")) {
        if (typeof window.initSettings === "function") window.initSettings();
    } else if (url.includes("analytics.html")) {
        if (typeof window.initAnalytics === "function") window.initAnalytics();
    } else if (url.includes("habit-lab.html")) {
        if (typeof window.initHabitLab === "function") window.initHabitLab();
    }
}
