# RAVA test plan and results

Testing was performed against the static files in the integrated Chromium browser. Test profile values were synthetic and removed from browser storage after the run.

| ID | Test | Expected result | Actual result | Status |
|---|---|---|---|---|
| T-01 | Open Home and inspect navigation, labels, profile form, and progress | Home renders with the expected controls and initial progress | Home loaded and exposed its primary form and navigation in the accessibility snapshot | PASS |
| T-02 | Save a synthetic profile with academic year and semester | Profile is saved and continuation is enabled | Status confirmed profile and previous-semester details were saved | PASS |
| T-03 | Set up one unit using the standard 70/30 distribution | Assessment permits a unit with components totaling 100 | Unit was added as Exam 70 and CATs 30 | PASS |
| T-04 | Answer all eight diagnostic questions | Assessment continuation becomes available | Continuation was enabled after all answers and the unit were entered | PASS |
| T-05 | Enter targets within component maxima | Targets are accepted and the analysis reflects their combined total | Targets 60/70 and 25/30 were accepted; analysis showed 85/100 | PASS |
| T-06 | Generate the report | Report appears and workflow reaches 100% | Report was visible, included the synthetic unit, and progress read 100% | PASS |
| T-07 | Check browser runtime errors during the main journey | No unhandled page errors | No `pageerror` was captured during the workflow | PASS |
| T-08 | Check horizontal overflow at 320, 360, 390, 768, 1024, 1366, and 1920 px | No page content extends beyond viewport | No horizontal overflow observed on any of the three pages at any listed width | PASS |
| T-09 | Check grade boundaries and GPA calculations | Verify against official institutional rules | No mark-entry, grade conversion, GPA, or CGPA feature is present | NOT APPLICABLE |
| T-10 | Verify persistence after refresh, custom distributions, and print-to-PDF | Saved data remains; custom distributions validate; print output is usable | Not exercised in this audit | NOT RUN |
| T-11 | Validate on Firefox, Edge, Safari, iOS, and Android | Workflows behave consistently | Only integrated Chromium was available | BLOCKED |
| T-12 | Run automated unit, integration, lint, type-check, and build commands | Existing tests/build pass | No package manifest or test/build configuration; Node.js unavailable | BLOCKED |
| T-13 | Run the application from a local HTTP server | Server serves the pages over localhost | Python unavailable in the environment; checks used `file:///` URLs | BLOCKED |
| T-14 | Run accessibility scanner and measure contrast | Automated findings and contrast measurements recorded | Scanner/measurement tooling was not available | NOT RUN |
| T-15 | Check page titles, meta descriptions, encoding, viewport, and primary heading | Unique page metadata, UTF-8, viewport, and one main heading per page | Each page has a distinct title and description, UTF-8/viewport metadata, and one `h1` | PASS |
| T-16 | Check local page and asset links | All local targets resolve | All relative page, stylesheet, script, and favicon links in the three page documents resolve to project files | PASS |
| T-17 | Inspect grouped diagnostic questions in the accessibility tree | Each group has an accessible question name | Chromium announced all eight groups by their visible heading | PASS |
| T-18 | Keyboard-tab to profile field and inspect visible focus | Focus is visible during keyboard navigation | `#fullName` became `:focus-visible`; computed outline is solid 3px with a 5px white ring | PASS |
| T-19 | Check representative control contrast | Text meets 4.5:1 for normal-size text | Primary/navigation/selected white on `#73503A`: 7.15:1; secondary `#493328` on `#FFFCF6`: 11.47:1; valid chip: 5.34:1; previous-summary badge: 10.64:1; table header: 6.56:1 | PASS |
| T-20 | Check reduced-motion handling | Motion is minimized when requested | Progress transition computed to 0.01ms with reduced motion enabled | PASS |
| T-21 | Check native dialog Escape dismissal | Escape closes the custom-breakdown dialog | Automation did not produce a native dialog cancel event; explicit Cancel button closed it | NOT VERIFIED |
| T-22 | Verify robots/sitemap/canonical/social links on deployed origin | Correct absolute production URLs and indexing directives | No domain, host, or indexing intent supplied; no production URL added | BLOCKED |
| T-23 | Cross-browser compatibility matrix | Supported browsers pass core journeys | Integrated Chromium only; Firefox, Edge, Safari, iOS Safari, and Android Chrome unavailable | BLOCKED |
| T-24 | Recheck responsive layout after style/metadata edits | No horizontal overflow at the required widths | All three pages were rechecked at all seven required widths; no horizontal overflow | PASS |
| T-25 | Open a report in print media | Saved report content is visible in print layout | A synthetic saved report contained the test unit and was visible in print media (`display: block`, `visibility: visible`); native print dialog/PDF output was not opened | PASS (print media) |
| T-26 | Use keyboard to close custom dialog and choose a diagnostic option | Keyboard activates controls without a pointer | Enter closed the modal from its close button; Space selected an unselected quiz option. Escape-key cancellation was not recognized by the browser automation | PASS / ESCAPE NOT VERIFIED |

## Browser compatibility matrix

| Browser/device | Status | Notes |
|---|---|---|
| Integrated Chromium desktop | TESTED | Critical workflow, keyboard controls, responsive widths, metadata, and print-media styling checked. Exact browser version was not available. |
| Google Chrome desktop | UNVERIFIED | No separate Chrome installation was available to distinguish from the integrated Chromium environment. |
| Microsoft Edge desktop | UNVERIFIED | Not available in the environment. |
| Mozilla Firefox desktop | UNVERIFIED | Not available in the environment. |
| Safari on macOS | UNVERIFIED | No macOS environment available. |
| Safari on iOS | UNVERIFIED | No iOS device/browser available. |
| Chrome on Android | UNVERIFIED | No Android device/browser available. |

## Reproduction

1. Open `pages/index.html` in a Chromium-based browser.
2. Enter synthetic profile values and save.
3. Continue to Assessment; choose a current academic year, semester, and one unit.
4. Add a unit using the 70/30 template and answer one option for each of the eight questions.
5. Continue to Findings and set the Exam and CAT targets to 60 and 25.
6. Generate the report and confirm it is visible and workflow progress reaches 100%.

The test does not establish official grading correctness because the application does not implement a grading/GPA engine. The print dialog, other browsers, and persistence after refresh were not tested.
