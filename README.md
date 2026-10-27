# RAVA Academic Planner

A lightweight, three-page academic planner built with plain HTML, CSS, and JavaScript. No package installation or build step is required.

## Run locally

Open `pages/page1.html` directly in a browser. For a consistent HTTP origin, start a local server from the project root if Python is installed:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/pages/page1.html](http://localhost:8000/pages/page1.html). Home saves a profile before unlocking Assessment; a completed assessment unlocks Findings; generating the final report unlocks its download. The navigation and progress strip are shared across all three pages. Browser-local profiles work without a build step or server.

## Project map

- `pages/page1.html` is Home, where each person creates or selects a saved profile and records the previous academic year, semester, and optional unit grades. Academic-year options currently run through 2026/2027.
- `pages/page2.html` is Assessment, where the current academic year, semester, expected unit count, component mark distributions, and all eight diagnostic answers are entered. Custom distributions are configured in a modal.
- `pages/page3.html` moves the live check-in summary, accepts a target for every component, analyzes results, provides two detailed recommendations per unit, supports reusable weekly plans, and prints the final report to PDF.
- `css/global.css` provides the shared beige/medium-grey palette, responsive navigation, progress strip, typography, and focus styles.
- `css/page1.css`, `css/page2.css`, and `css/page3.css` contain each page's responsive layout and controls.
- `js/shared.js` manages profile storage, switching, shared navigation, and workflow progress.
- `js/page1.js` manages profile creation, validation, carousel controls, and the Home continuation gate.
- `js/page2.js` manages per-profile current-semester setup, unit distributions, the custom-weight modal, diagnostic answers, and the exact unit-count completion gate.
- `js/page3.js` manages component target entry, live summaries, analysis, recommendations, weekly plans, and the final report/download gate.

## Data and privacy

The project has no server or external dependencies. Each profile and its planner data are stored in the current browser's local storage, and Home's profile-card dropdown switches between saved profiles or starts a new one without a page reload. This is convenient separation, not account security: anyone using the same browser profile can access its saved records. Clearing browser data removes locally saved profiles. Each visitor runs the planner locally; serving the static files to many visitors is largely a hosting/CDN capacity question, not shared application compute. A guarantee for 1,000 simultaneous visitors still requires load testing the chosen host. For private, cross-device accounts, connect the project to an authenticated backend. The report's Download PDF button opens the browser print dialog; choose Save as PDF there.

## Assessment rules

Assessment completion requires a current academic year and semester, a declared unit count with exactly that many units entered, each unit's component marks totaling 100, and an answer to each of the eight check-in questions. Findings then requires a whole-number target from zero through each component's maximum. Workflow progress is 0%, 33%, 67%, then 100% only after the final report is generated. The report download stays disabled until that final step. Previous-semester unit grades are optional and appear in the analysis when their unit names match.

## Testing and deployment notes

There is no package manager manifest, automated test suite, linter, type checker, or production build step. Test changes by opening each page in a browser and exercising the profile, assessment, target, report, and print-preview workflows. The browser print dialog is required to save a PDF. If Python is installed, the local HTTP server command above can be used instead of opening the files directly.

The project is static-only. It does not record actual assessment marks or calculate grades, grade points, GPA, or CGPA, and it has no API, server-side authentication, database, or cross-device synchronization. Do not treat browser-local profiles as protected student accounts or store sensitive records on a shared device. No production host, domain, HTTPS setup, deployment configuration, or capacity test is included; verify those with the selected hosting provider before making production claims.

The pre-deployment audit records the checks that were run and the limitations that remain in [`audit/`](./audit/).

Page-specific titles and descriptions are included. Canonical URLs, `robots.txt`, a sitemap, and absolute social-preview metadata are intentionally pending a production-domain and indexing decision; crawler directives are not a privacy control.
