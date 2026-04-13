/* ==========================================
   HabitMetric — Onboarding Logic
   ========================================== */

let selectedIdentity = "";

/**
 * Transitions between the 4 cards.
 * @param {number} stepNumber - The ID of the step to show (1-4)
 */
function nextStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-card').forEach(card => {
        card.classList.remove('active');
    });

    // Show the target step
    const target = document.getElementById(`step-${stepNumber}`);
    if (target) {
        target.classList.add('active');
    }
}

// Identity button selection logic
const idButtons = document.querySelectorAll('.id-btn');
const step2Next = document.getElementById('step2-next');

idButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove selected class from all
        idButtons.forEach(b => b.classList.remove('selected'));
        // Add to clicked
        this.classList.add('selected');
        
        // Store value (clean out emojis for the raw identity array if desired)
        selectedIdentity = this.textContent.trim(); 
        
        // Enable next button
        step2Next.removeAttribute('disabled');
    });
});

/**
 * Triggered on the final step. Gathers all data, saves to localStorage,
 * and redirects the user to the main dashboard.
 */
function finishOnboarding() {
    // 1. Collect Data
    const nameInput = document.getElementById('user-name').value.trim() || 'Friend';
    const habitInput = document.getElementById('first-habit').value.trim();
    let resetTime = parseInt(document.getElementById('reset-time').value, 10);

    // Validate reset time
    if (isNaN(resetTime) || resetTime < 0 || resetTime > 23) {
        resetTime = 4; // Default to 4 AM
    }

    // 2. Create and Save User Object
    const user = {
        name: nameInput,
        identities: selectedIdentity ? [selectedIdentity] : [],
        dailyResetHour: resetTime
    };
    localStorage.setItem('user', JSON.stringify(user));

    // 3. Create First Habit (if they typed one)
    if (habitInput !== "") {
        let savedHabits = JSON.parse(localStorage.getItem("habits")) || [];
        const newHabit = {
            id: generateId(),             // Utility from app.js
            name: habitInput,
            category: "general",
            createdAt: getTodayString(),  // Utility from app.js
            completions: []
        };
        savedHabits.push(newHabit);
        localStorage.setItem("habits", JSON.stringify(savedHabits));
    }

    // 4. Redirect to Dashboard
    window.location.href = "index.html";
}
