# RAVA Academic Planner

A lightweight, three-page academic planner built with plain HTML, CSS, and JavaScript. No package installation or build step is required.

## Run locally

Open `pages/page1.html` directly in a browser. For a consistent HTTP origin, start a local server from the project root if Python is installed:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/pages/page1.html](http://localhost:8000/pages/page1.html). Home saves a profile before unlocking Assessment; a completed assessment unlocks Findings; generating the final report unlocks its download. The navigation and progress strip are shared across all three pages. Browser-local profiles work without a build step or server.

## Project map

- `pages/page1.html` is Home, where each person creates or selects a saved profile and records previous-semester study year, academic year, semester, and optional unit grades.
- `pages/page2.html` is Assessment, where the current academic year and semester, current unit targets, and all eight diagnostic answers are entered.
- `pages/page3.html` compares previous results with current targets and contains personalized findings, recommendations, weekly planning, and final report generation.
- `css/global.css` provides the shared beige/medium-grey palette, responsive navigation, progress strip, typography, and focus styles.
- `css/page1.css`, `css/page2.css`, and `css/page3.css` contain each page's responsive layout and controls.
- `js/shared.js` manages profile storage, switching, shared navigation, and workflow progress.
- `js/page1.js` manages profile creation, validation, carousel controls, and the Home continuation gate.
- `js/page2.js` manages per-profile unit targets, diagnostic answers, summaries, and the Assessment completion gate.
- `js/page3.js` creates per-profile findings, recommendations, weekly plans, and the final report/download gate.

## Data and privacy

The project has no server or external dependencies. Each profile and its planner data are stored in the current browser's local storage, and Home provides a profile switcher for people sharing that browser. This is convenient separation, not account security: anyone using the same browser profile can access its saved records. For private, cross-device accounts, connect the project to an authenticated backend. Clearing browser data removes locally saved profiles. The report download is a plain-text file generated in the browser.

## Assessment rules

Assessment completion requires the current academic year and semester, at least one unit whose component weights total 100, targets within each component's weight, and an answer to each of the eight check-in questions. Workflow progress is 0%, 33%, 67%, then 100% only after the final report is generated. The report download stays disabled until that final step. Previous-semester unit grades are optional and appear in the comparison when their unit names match.
