# RAVA deployment checklist

Statuses reflect repository and environment evidence available during this audit. `BLOCKED` means the item depends on an unselected host, domain, account, or test environment.

| Gate | Status | Notes |
|---|---|---|
| Static project entry pages and assets identified | PASS | Three pages link local CSS and JavaScript assets. |
| Package install/build command | NOT APPLICABLE | No framework, package manifest, or build step. |
| Critical synthetic browser workflow | PASS | Passed in the integrated Chromium browser; see `TEST_PLAN.md`. |
| Browser-local persistence | PASS (limited) | `localStorage` is used; it is not account security or cross-device storage. |
| Production host and output configuration | BLOCKED | No hosting provider or deployment configuration is in the repository. |
| Root domain entry route | BLOCKED | No root `index.html`; README uses `/pages/page1.html`. Configure the selected host or provide a root entry page. |
| Production domain and canonical URL | BLOCKED | No domain was supplied; none was invented. |
| HTTPS certificate and HTTP-to-HTTPS redirects | BLOCKED | Must be checked at the selected host. |
| Security headers and private-data cache policy | BLOCKED | Must be configured/verified at the host. Do not rely on `robots.txt` for access control. |
| Environment variables and API URLs | NOT APPLICABLE | No API or environment configuration exists. |
| Deep-link/refresh behavior over HTTP | BLOCKED | No HTTP deployment was available to verify host routing. |
| SEO indexability and social previews | BLOCKED | Page metadata is present, but sitemap, robots, canonical, and absolute preview URLs need a production-domain/indexing decision. |
| Automated accessibility and browser matrix | BLOCKED | Targeted contrast, focus, and reflow checks passed in Chromium; automated scanner, assistive technology, and other browsers remain unverified. |
| Performance and Core Web Vitals | BLOCKED | No production-like HTTP environment or Lighthouse measurement. |
| Backups, restore, monitoring, and alerting | NOT APPLICABLE / BLOCKED | No server-side data or selected host; browser data can be removed by clearing storage. |
| 300-user capacity | BLOCKED | No host selected and no load test run. |
| Rollback procedure | BLOCKED | Must be defined in the selected host's deployment workflow. |
| Student-data privacy/security approval | BLOCKED for sensitive data | Browser-local storage is not a protected multi-user account. |

## Before release

- Decide whether RAVA is intended only for non-sensitive planning on a user's own device or must handle private student records and cross-device accounts.
- If static-only, select a host, configure HTTPS and suitable security headers, and verify direct page navigation and refresh on that host.
- If authenticated private records are a requirement, do not deploy the current local-storage design as though it provides authentication or access control.
- Run accessibility, performance, browser compatibility, and (if required) bounded staging load tests against the actual deployment configuration.
- Define rollback, monitoring, and support ownership before launch.
