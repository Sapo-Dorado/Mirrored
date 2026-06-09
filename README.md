# Choreo

An iOS app built with [Expo](https://expo.dev) / React Native.

## Architecture

This project uses Expo's [Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/) — the `ios/` and `android/` folders are **not committed**. They are generated on-demand with `npx expo prebuild` and should never be manually edited.

The development workflow splits across two machines:
- **Linux (day-to-day)** — runs the Metro bundler, all JS/TS editing and hot reload
- **Mac (occasionally)** — generates the native project and builds the dev client app

---

## Daily development (Linux)

This project uses a [Nix flake](https://nixos.wiki/wiki/Flakes) for a reproducible dev environment. You do not need to install Node globally.

### Enter the dev shell

```bash
nix develop
```

Provides: `node` (v22), `npx`, `expo`, `qrencode`.

### Install dependencies

```bash
npm install
```

### Start the Metro bundler

```bash
npm start
```

Starts Metro and prints a QR code in the terminal. Once the dev client app is installed on your iPhone (see Mac setup below), open it and connect to the Metro server shown.

**To bind to a specific host** (e.g. a VPN or alternate network interface):

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<hostname-or-ip> npx expo start
```

Note: `--host` only accepts `lan`, `tunnel`, or `localhost`; use the env var for a custom hostname.

**To generate a QR image file:**

```bash
qrencode -o qr.png -s 8 "exp://<your-host>:8081"
```

---

## Mac setup — building the dev client

You need to do this once (and again whenever you add a new native module or change native config).

### Prerequisites

- macOS with [Xcode](https://developer.apple.com/xcode/) installed
- Node.js (via `brew install node` or `nvm`)
- iPhone connected via USB

### Steps

```bash
# 1. Clone and install
git clone https://github.com/Sapo-Dorado/Choreo
cd Choreo
npm install

# 2. Generate the native iOS project
npx expo prebuild --platform ios --clean

# 3. Build and install directly on your connected iPhone
npx expo run:ios --device
```

Xcode will handle code signing automatically using your Apple ID (free). The dev client app is installed on your phone — you only need to repeat this when native config changes.

> **Free Apple ID caveat:** provisioning profiles created with a free Apple ID expire every 7 days and must be re-signed. An [Apple Developer account](https://developer.apple.com/programs/) ($99/yr) removes this limit and is required for App Store submission.

### When to rebuild

You need a new Mac build when you:
- Add a native module or Expo plugin (e.g. `expo-camera`, `expo-notifications`)
- Change native config in `app.json` (bundle ID, permissions, entitlements)
- Update the Expo SDK version

Pure JS/TS changes hot reload through Metro with no rebuild.

---

## Shipping to the App Store

Use [EAS Build](https://docs.expo.dev/build/introduction/) for production builds — runs on Expo's cloud macOS infrastructure, no Mac required:

```bash
npm install -g eas-cli
eas login
eas build:configure   # first time only — generates eas.json
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Project structure

```
App.tsx            — root component
app.json           — Expo config (name, icons, permissions, bundle ID)
flake.nix          — Nix dev environment (Linux)
assets/            — icons and splash screen images
ios/               — generated, not committed (run: npx expo prebuild)
android/           — generated, not committed (run: npx expo prebuild)
```
