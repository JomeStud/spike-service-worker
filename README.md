# SubGuard Test

A minimal offline-capable PWA spike for service worker caching, local notifications, and mobile install testing.

## PC setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the app:
   ```bash
   npm run build
   ```

3. Serve the generated `dist/` folder with a static server:
   ```bash
   npx serve dist
   ```
   or
   ```bash
   python3 -m http.server --directory dist 4173
   ```

4. Open the app in your browser:
   ```text
   http://localhost:4173
   ```

`localhost` is treated as a secure context, so service worker registration and notifications will work for local testing.

## Usage on Android

- Open the app URL in Chrome or another supported browser.
- Allow notifications when prompted.
- Use the notification card to send a custom test notification.
- Install the app to the home screen if you want to test the PWA install flow.
- You can then reload the installed app while offline and verify the cached app shell still works.

## Usage on iOS

- Open the app URL in Safari.
- Use Share → Add to Home Screen to install the PWA.
- Once installed, reopen the app from the home screen.
- If notification permission is available on your iOS version, allow it and send a test notification.
- The app is designed to keep the shell and local data working when the network is unavailable.

## Notes

- This repo builds into `dist/` for local use and deployment.
- If you want a real HTTPS origin for mobile testing, use a local TLS server or host the built app on a secure site.
