# RAVA performance report

## Measurement conditions

- Source: current static project files.
- Browser: integrated Chromium.
- Layout checks: 320, 360, 390, 768, 1024, 1366, and 1920 CSS-pixel viewport widths on each page.
- Network: local `file:///` pages, not a production or staging web server.

## Results

| Measure | Result |
|---|---|
| Horizontal overflow | None observed on the three pages at the seven checked widths. |
| Browser page errors during the synthetic critical journey | None captured. |
| External script/network dependencies | None found in the inspected project source. |
| Local RAVA logo referenced by every page | 77,783 bytes as a source JPEG; displayed at approximately 36 × 36 CSS pixels in the shared header. This is one local asset, not a network transfer measurement. |
| Tiled paper background | 1,164 bytes as a source JPEG. |
| Unused package dependencies | None declared; no package manifest exists. |
| Render-blocking local styles | Each page uses two local stylesheets; CSS is required for layout and was not deferred. |
| JavaScript loading | Page scripts use `defer`; no third-party scripts or API calls were found. |
| LCP, INP, CLS | NOT MEASURED — no Lighthouse or field measurement was available. |
| Server response time, caching, compression | NOT MEASURED — no host or HTTP server was available. |
| Before/after optimization comparison | NOT APPLICABLE — accessibility colors, metadata, and semantics changed; no performance optimization was made. |

No claim is made about Core Web Vitals, real-device speed, or production performance. Because the application is static and has no API or server-side compute, hosting/CDN configuration will largely determine transfer performance and visitor capacity.

SEO metadata and the existing JPEG logo favicon were added without introducing new dependencies. The existing logo is significantly larger than its displayed header size; consider generating a properly sized favicon/brand asset if image-transfer optimization becomes a priority. The supplied source tree is small, and a local lab measurement is still needed before deciding whether image conversion is worthwhile.

## Follow-up

After selecting a host, measure production-like builds over HTTP with Lighthouse on representative desktop and mobile devices. Record the browser/device, network throttling, cache state, and repeated-run methodology. Review image transfer sizes and compression at the host; do not infer server capacity from local file testing.
