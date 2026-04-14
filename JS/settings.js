/* ==========================================
   HabitMetric — Settings Interactivity
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // Grab all theme cards from the UI
    const themeCards = document.querySelectorAll(".theme-card");
    
    // Read the current saved theme, default to lavender-aura
    const currentTheme = localStorage.getItem("theme") || "lavender-aura";

    // 1. Initialize Active State
    // Put the gray active border on the currently saved theme
    themeCards.forEach(card => {
        if (card.getAttribute("data-theme-value") === currentTheme) {
            card.classList.add("active");
        }
    });

    // 2. Click Logic
    themeCards.forEach(card => {
        card.addEventListener("click", () => {
            const selectedTheme = card.getAttribute("data-theme-value");
            
            // Re-style the UI cards
            themeCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            // Save the choice permanently
            localStorage.setItem("theme", selectedTheme);

            // Apply the theme immediately by throwing the global HTML switch
            if (selectedTheme !== "lavender-aura") {
                document.documentElement.setAttribute("data-theme", selectedTheme);
            } else {
                document.documentElement.removeAttribute("data-theme");
            }
        });
    });

});
