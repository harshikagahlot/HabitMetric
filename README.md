# HabitMetric

**Adaptive Habit Intelligence** — A habit tracker inspired by the principles in *Atomic Habits*, built with vanilla HTML, CSS, and JavaScript.

## Features

- 📅 **Heatmap Calendar** — Visual representation of daily habit activity
- ✅ **Habit Management** — Add, complete, and organize habits by category
- 💾 **Persistent Storage** — All habits and categories saved to `localStorage`
- 📊 **Streak & Consistency Tracking** — Track your current streak and consistency score
- ⚠️ **Drop Risk Alerts** — Smart insights warn you before streaks are likely to break
- 📱 **Responsive Design** — Works on desktop and mobile

## Pages

| Page | File | Status |
|---|---|---|
| Dashboard | `index.html` | ✅ Live |
| My Habits | `myhabits.html` | ✅ Live |
| Analytics | `analytics.html` | 🚧 Coming Soon |
| Risk Insights | `risk-insights.html` | 🚧 Coming Soon |
| Settings | `settings.html` | 🚧 Coming Soon |

## Project Structure

```
HabitMetric/
├── index.html              ← Dashboard (main entry point)
├── myhabits.html           ← Habit management page
├── analytics.html          ← Analytics (placeholder)
├── risk-insights.html      ← Risk Insights (placeholder)
├── settings.html           ← Settings (placeholder)
├── habitmetric.html        ← Redirects to index.html
│
├── CSS/
│   ├── base.css            ← Reset, CSS variables, body, sidebar (shared)
│   ├── habitmetric.css     ← Dashboard-specific styles
│   ├── myhabits.css        ← My Habits-specific styles
│   └── placeholder.css     ← Coming-soon page styles
│
└── JS/
    ├── app.js              ← Shared logic (greeting, sidebar active state)
    ├── dashboard.js        ← Calendar/heatmap logic
    └── myhabits.js         ← Habit CRUD, localStorage read/write
```

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties (variables), CSS Grid, Flexbox, responsive media queries
- **JavaScript (ES6)** — DOM manipulation, localStorage API, event listeners
- **Google Fonts** — Roboto

## Getting Started

No build tools or server needed. Open `index.html` directly in your browser.

```bash
# If you have VS Code with Live Server:
# Right-click index.html → Open with Live Server
```

## Roadmap

- [ ] Connect heatmap calendar to real habit completion data
- [ ] Replace `prompt()` inputs with inline modals
- [ ] Implement category filtering for the habit list
- [ ] Build out Analytics page with charts
- [ ] Add streak protection notifications
- [ ] Dark/Light theme toggle in Settings
