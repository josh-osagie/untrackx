# <img src="public/icons/logo.svg" width="32" height="32" align="center" alt="UntrackX Logo" /> UntrackX

Manifest V3 Chrome extension that automatically removes user attribution, sharing telemetry, and analytics trackers (`a=`, `s=`, `t=`, `ref_src=`, etc.) from X (Twitter) URLs.

## Features

- **DOM & In-App Interception**: Automatically cleans links when using `Ctrl+C` or clicking the native X "Copy link to post" button.
- **Right-Click Context Menu**: Right-click any X link anywhere on the web and select **"Copy Clean Link (UntrackX)"**.
- **Interactive Popup**: View real-time link sanitization counter and test/clean any URL manually.

## Development & Build

```bash
pnpm install
pnpm test    # Run Vitest test suite
pnpm build   # Produces production-ready unpacked extension in /dist
```

## How to Load in Chrome

1. Open `chrome://extensions/` in Chrome or Brave.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the [`dist`](file:///C:/Users/Joshua%20Osagie/projects/untrackx/dist) directory.
