# Icarus Solar Mobile v0.1.0 (PWA prototype)

## Install on iPhone
1. Create a **public GitHub repository** and upload the files in this directory to its root (not the ZIP itself).
2. In repository Settings > Pages, choose Deploy from a branch, main, /(root). Wait for the HTTPS Pages URL.
3. Open the HTTPS URL in **Safari on iPhone**. Share > Add to Home Screen > Add.
4. Open the home screen app once while online, tap GPS, and allow location permission. Once installed, cached app files and the last saved location are available offline.
5. Test offline by enabling Airplane Mode and relaunching the app. GPS can be slower or unavailable; manual/saved coordinates remain available.

## Current scope
- Vector SVG analemma, month markers, solstice/equinox labels, selected-day indicator, lunar event marks and date callouts.
- Sunrise, sunset, solar noon, daylight length and adjacent-day change; moon phase and illumination; golden and blue hour estimates.
- Manual and device GPS coordinates, stored on device; touch swipe or date navigation; service worker offline cache.
- **Moonrise and moonset are not yet ported** in this prototype. They require a separate lunar position calculation and validation.
- Times use the device's time zone, not an automatically inferred time zone for arbitrary coordinates. Moon phases and event dates are approximate. High-latitude twilight can be absent.
- The GPS API requires HTTPS and user permission; opening index.html directly from Files is not a supported GPS installation method.
- This project has not yet been tested in Safari on an actual iPhone.

## Development
For local desktop testing, serve the folder using `python -m http.server 8000` and open http://localhost:8000. PWA offline installation requires HTTPS (except localhost development). To update cached files after changes, bump CACHE in service-worker.js.


## v0.1.2 iPhone touch update
- Disable pinch and double-tap page zoom with viewport settings.
- Treat rapid navigation button taps as interactions, with 44px minimum targets.
- Increment offline cache version so installed PWAs refresh their assets.
- On GitHub upload changed files to repository root, replacing existing versions. Open online once before testing offline.
- Note: disabling zoom reduces accessibility for users who need magnification.


## v0.1.2 changes
- Added offline estimated moonrise and moonset for the selected date and location. A dash means no event on that local calendar date.
- Added illumination percentages below previous/current/next moon graphics.
- Lunar rise/set times use a low-precision analytical model and an approximate horizon correction. Expect differences of several minutes or more from an almanac, especially at high latitudes or near mountains.
- Updated offline service-worker cache version. After uploading, open the website online, then fully close and reopen the Home Screen app to activate the new cache.
