/* ==========================================
   HabitMetric — SPA Router (router.js)
   Handles smooth page transitions without reloads.
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial route setup on fresh load
    triggerInitFunction(window.location.pathname);

    // 2. Intercept Sidebar Clicks
    document.body.addEventListener("click", e => {
        // Find if an <a> tag was clicked inside the sidebar
        const link = e.target.closest(".sidebar a");
        if (!link) return;
        
        e.preventDefault();
        const url = link.getAttribute("href");
        
        // Prevent reloading the exact same page
        if (window.location.pathname.endsWith(url)) return;
        
        // Push state to browser history
        window.history.pushState(null, "", url);
        
        // Load the new page content
        loadPage(url);
    });

    // 3. Handle Browser Back/Forward Buttons
    window.addEventListener("popstate", () => {
        loadPage(window.location.pathname, false);
    });
});

async function loadPage(url, pushState = true) {
    const mainEl = document.querySelector(".main");
    
    // Smooth transition out
    if (mainEl) {
        mainEl.style.transition = "opacity 0.2s ease-out, transform 0.2s ease-out";
        mainEl.style.opacity = "0";
        mainEl.style.transform = "translateY(5px)";
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Page not found");
        const html = await response.text();
        
        // Parse the fetched HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // Extract new content
        const newMain = doc.querySelector(".main");
        
        // Wait a tiny bit for the fade out to finish
        setTimeout(() => {
            if (newMain && mainEl) {
                // Swap the content
                mainEl.innerHTML = newMain.innerHTML;
                mainEl.className = newMain.className; // Carry over any specific classes (like container types)
                
                // Keep the styling classes but reset the animation props
                mainEl.style.transition = "none";
                mainEl.style.opacity = "0";
                mainEl.style.transform = "translateY(5px)";
                
                // Force browser reflow to reset transition
                void mainEl.offsetWidth; 
                
                // Smooth transition in
                mainEl.style.transition = "opacity 0.2s ease-in, transform 0.2s ease-in";
                mainEl.style.opacity = "1";
                mainEl.style.transform = "translateY(0)";
            }

            // Important: Merge Stylesheets
            // Ensures pages like "My Habits" get their specific CSS (myhabits.css)
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.getAttribute("href");
                if (!document.querySelector(`link[href="${href}"]`)) {
                    const newLink = document.createElement("link");
                    newLink.rel = "stylesheet";
                    newLink.href = href;
                    document.head.appendChild(newLink);
                }
            });

            // Special Case: Modals. Remove old modals, inject new modals.
            document.querySelectorAll(".modal-backdrop").forEach(m => m.remove());
            doc.querySelectorAll(".modal-backdrop").forEach(m => {
                document.body.appendChild(m);
            });

            // Update active class on sidebar
            updateSidebarActiveLink(url);
            
            // Update Title
            document.title = doc.title;

            // Re-initialize correct scripts
            triggerInitFunction(url);
        }, 200); // 200ms matches the fade-out duration

    } catch (err) {
        console.error("Routing error:", err);
        // Recover if failed
        if (mainEl) {
            mainEl.style.opacity = "1";
            mainEl.style.transform = "translateY(0)";
        }
    }
}

function updateSidebarActiveLink(url) {
    document.querySelectorAll(".sidebar ul li").forEach(li => li.classList.remove("active"));
    const links = document.querySelectorAll(".sidebar ul li a");
    links.forEach(link => {
        if (url.endsWith(link.getAttribute("href"))) {
            link.parentElement.classList.add("active");
        }
    });
}

function triggerInitFunction(url) {
    // Re-render lucide icons if present
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
    
    // Call page-specific setup functions safely
    if (url.includes("index.html") || url.endsWith("/")) {
        if (typeof window.initDashboard === "function") window.initDashboard();
    } else if (url.includes("myhabits.html")) {
        if (typeof window.initMyHabits === "function") window.initMyHabits();
    } else if (url.includes("settings.html")) {
        if (typeof window.initSettings === "function") window.initSettings();
    }
    
    // Note: risk-insights and analytics don't have JS logic files yet, so they are ignored here safely!
}
