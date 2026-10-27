# RAVA security report

## Scope

Reviewed the static HTML, CSS, JavaScript, README, repository configuration, and available browser workflow. No external target was tested. No destructive tests, credential attacks, or production actions were performed.

The application has no server, API, database, authentication, cookies, external scripts, package manifest, or deployment configuration. Server-side authorization, injection into API/database queries, CSRF, CORS, rate limiting, and authenticated object-level access controls are not applicable to the current code.

## Findings

| ID | Severity | Evidence | Impact | Recommendation | Retest |
|---|---|---|---|---|---|
| SEC-01 | MEDIUM (privacy limitation) | `js/shared.js` stores profile records and planner data using browser `localStorage`; `README.md` notes that users of the same browser profile can access saved records. | Anyone able to use that browser profile can view or alter stored profiles. This is not a secure account or isolation boundary. | Limit use to non-sensitive data on a trusted device. If private student records, cross-device access, or multi-user isolation are required, design and implement authenticated server-side storage before collecting that data. | Confirmed as an architectural limitation; no code change made. |

No confirmed exploitable code vulnerability was identified in the inspected source. The UI constructs displayed content with DOM text APIs in the reviewed paths; no `fetch`, `XMLHttpRequest`, `innerHTML`, `eval`, or external script inclusion was found. This is a bounded source review, not a penetration test or a guarantee of absence of vulnerabilities.

## Deployment-dependent controls

| Control | Status |
|---|---|
| HTTPS, HSTS, CSP, frame protections, MIME/referrer/permissions headers | BLOCKED — must be configured and verified at the selected static host. |
| Secure cookies and CSRF controls | NOT APPLICABLE — no cookies, sessions, or server endpoints are present. |
| Dependency vulnerability scan | NOT APPLICABLE — no package manifest or runtime package dependencies are present. |
| Secret scanning | NOT RUN — no dedicated secret-scanning tool was available; no secrets were intentionally printed or added. |
| Privacy retention/deletion | Browser data can be removed by clearing browser storage; no server backup exists. There is no legal compliance assessment. |

Do not claim Kenyan data-protection compliance, HTTP security-header coverage, or production security until the real deployment and data-handling requirements are reviewed.

