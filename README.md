# RAVA Academic Planner

A lightweight, two-page academic planner built with plain HTML, CSS, and JavaScript. No package installation or build step is required.

## Run locally

From the project root, start a local server:

```powershell
python -m http.server 8000
```

Open [http://localhost:8000/pages/page1.html](http://localhost:8000/pages/page1.html). The dashboard links to the planner, and the planner links back to the dashboard. Serving the files locally provides more consistent browser storage and download behavior than opening the HTML files directly.

## Project map

- `pages/page1.html` is the dashboard for previous-semester grades and academic details.
- `pages/page2.html` is the unit-target planner, diagnostic check-in, report, and weekly-plan view.
- `css/global.css` defines the shared beige and medium-grey palette, base typography, and focus styles.
- `css/page1.css` and `css/page2.css` contain page-specific responsive layouts and controls.
- `js/page1.js` manages previous-unit grades, summary metrics, profile filters, and draft saving.
- `js/page2.js` manages planner units, quiz answers, live summaries, report generation, and weekly plans.

## Data and privacy

The project has no server or external dependencies. Drafts, planner units, check-in answers, and personal weekly-plan notes are stored in the current browser's local storage. Clearing that browser data removes those saved entries. The report download is a plain-text file generated in the browser.

## Grade display

Previous-unit grades can be shown as percentages or letter bands. The neutral grade bands use muted grey values and always retain a textual grade, so meaning does not depend on color alone. Planner component weights must total 100 points, and each target must remain within its component weight before a report can be generated.
