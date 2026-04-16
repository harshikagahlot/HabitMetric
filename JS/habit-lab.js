/* ==========================================
   HabitMetric — Habit Lab Logic (habit-lab.js)
   Empowers users via Atomic Habits principles.
   ========================================== */

window.initHabitLab = function() {
    console.log("[Habit Lab] Initializing modules...");
    
    // 1. Identity Voting Module
    renderIdentityVotes();

    // 2. Habit Stacker Module
    initHabitStacker();
};

/**
 * Identity Voting Module
 * Maps habit completions to Categories (treated as Identities)
 */
function renderIdentityVotes() {
    const votesContainer = document.getElementById("identity-votes-list");
    if (!votesContainer) return;

    const habits = JSON.parse(localStorage.getItem("habits")) || [];
    const categories = JSON.parse(localStorage.getItem("categories")) || [];

    if (categories.length === 0) {
        votesContainer.innerHTML = `<p class="card-desc">Create your first category in "My Habits" to start casting identity votes.</p>`;
        return;
    }

    votesContainer.innerHTML = "";
    
    // Total completions globally to calculate relative weight (optional)
    const maxVotesInCategory = habits.reduce((max, h) => {
        const count = h.completions ? h.completions.length : 0;
        return count > max ? count : max;
    }, 5); // Default min scale of 5

    categories.forEach(cat => {
        const catHabits = habits.filter(h => h.category === cat);
        const votes = catHabits.reduce((sum, h) => sum + (h.completions ? h.completions.length : 0), 0);
        
        // Clean identity name (strip emoji if present for title label)
        const identityTitle = cat.replace(/[^\w\s]/gi, '').trim() || cat;
        
        const voteEl = document.createElement("div");
        voteEl.className = "identity-vote-item";
        voteEl.innerHTML = `
            <div class="vote-info">
                <span class="identity-name">${cat} (The ${identityTitle})</span>
                <span class="vote-count">${votes} Votes Cast</span>
            </div>
            <div class="vote-bar-bg">
                <div class="vote-bar-fill" style="width: 0%"></div>
            </div>
        `;
        
        votesContainer.appendChild(voteEl);

        // Animate bar entry
        setTimeout(() => {
            const fill = voteEl.querySelector(".vote-bar-fill");
            const percentage = Math.min((votes / (maxVotesInCategory * 2)) * 100, 100) || 5; 
            fill.style.width = percentage + "%";
        }, 100);
    });
}

/**
 * Habit Stacking Module
 * Handles creation and persistence of habit stacks.
 */
function initHabitStacker() {
    const triggerInput = document.getElementById("stack-trigger");
    const actionInput = document.getElementById("stack-action");
    const addBtn = document.getElementById("add-stack-btn");
    const stacksList = document.getElementById("saved-stacks");

    if (!addBtn || !stacksList) return;

    // Load existing stacks
    renderStacks();

    addBtn.onclick = function() {
        const trigger = triggerInput.value.trim();
        const action = actionInput.value.trim();

        if (!trigger || !action) {
            alert("Both parts of the stack are required!");
            return;
        }

        const newStack = {
            id: Date.now(),
            trigger: trigger,
            action: action
        };

        const currentStacks = JSON.parse(localStorage.getItem("habitStacks")) || [];
        currentStacks.unshift(newStack);
        localStorage.setItem("habitStacks", JSON.stringify(currentStacks));

        triggerInput.value = "";
        actionInput.value = "";
        renderStacks();
    };

    function renderStacks() {
        const stacks = JSON.parse(localStorage.getItem("habitStacks")) || [];
        if (stacks.length === 0) {
            stacksList.innerHTML = `<p class="card-desc" style="text-align:center">No stacks built yet. Building architectures is the first step.</p>`;
            return;
        }

        stacksList.innerHTML = stacks.map(s => `
            <div class="stack-item">
                After I <strong>${s.trigger}</strong>, I will <strong>${s.action}</strong>.
                <button class="delete-stack" onclick="removeStack(${s.id})">×</button>
            </div>
        `).join("");
    }
}

/**
 * Global remover for stacks (called via onclick string)
 */
window.removeStack = function(id) {
    let stacks = JSON.parse(localStorage.getItem("habitStacks")) || [];
    stacks = stacks.filter(s => s.id !== id);
    localStorage.setItem("habitStacks", JSON.stringify(stacks));
    
    // Refresh display
    const stacksList = document.getElementById("saved-stacks");
    if (stacksList) {
        // Re-call inner logic (simplified)
        const newStacks = JSON.parse(localStorage.getItem("habitStacks"));
        stacksList.innerHTML = newStacks.map(s => `
            <div class="stack-item">
                After I <strong>${s.trigger}</strong>, I will <strong>${s.action}</strong>.
                <button class="delete-stack" onclick="removeStack(${s.id})">×</button>
            </div>
        `).join("") || `<p class="card-desc" style="text-align:center">No stacks built yet.</p>`;
    }
};
