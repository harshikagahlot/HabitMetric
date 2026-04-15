/* ==========================================
   HabitMetric — Settings Interactivity
   ========================================== */

window.initSettings = function() {
    
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

    // ==========================================
    // 3. User Profile Logic
    // ==========================================
    const profileNameInput = document.getElementById("profile-name");
    const profileIdentityInput = document.getElementById("profile-identity");
    const saveProfileBtn = document.getElementById("save-profile-btn");
    const profileSaveStatus = document.getElementById("profile-save-status");

    // Load existing profile context
    const userProfile = JSON.parse(localStorage.getItem("userProfile")) || { name: "", identity: "" };
    profileNameInput.value = userProfile.name;
    profileIdentityInput.value = userProfile.identity;

    saveProfileBtn.addEventListener("click", () => {
        userProfile.name = profileNameInput.value.trim();
        userProfile.identity = profileIdentityInput.value.trim();
        localStorage.setItem("userProfile", JSON.stringify(userProfile));

        profileSaveStatus.textContent = "Profile saved!";
        profileSaveStatus.classList.add("show");
        setTimeout(() => {
            profileSaveStatus.classList.remove("show");
        }, 2500);
    });

    // ==========================================
    // 4. Data Management Logic
    // ==========================================
    const exportDataBtn = document.getElementById("export-data-btn");
    const eraseDataBtn = document.getElementById("erase-data-btn");

    // Export as JSON Logic
    exportDataBtn.addEventListener("click", () => {
        const data = {
            habits: JSON.parse(localStorage.getItem("habits")) || [],
            categories: JSON.parse(localStorage.getItem("categories")) || [],
            theme: localStorage.getItem("theme") || "lavender-aura",
            userProfile: JSON.parse(localStorage.getItem("userProfile")) || {}
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        const dateStr = new Date().toISOString().slice(0,10);
        a.download = `HabitMetric_Backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up memory
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Factory Reset Logic
    eraseDataBtn.addEventListener("click", () => {
        if (confirm("🚨 DANGER ZONE 🚨\nAre you absolutely sure you want to permanently delete ALL habits, streaks, and settings?\nThis action cannot be undone.")) {
            if (confirm("Please confirm one more time. Type OK to erase everything.")) {
                localStorage.clear();
                window.location.reload();
            }
        }
    });

}; // End of initSettings()
