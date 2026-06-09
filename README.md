# Choreo

An iOS app built with [Expo](https://expo.dev) / React Native.

## Development

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

### Start the dev server

```bash
npm start
```

Starts the Expo Metro bundler and prints a QR code in the terminal.

**To test on a physical iPhone:**

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your iPhone
2. Make sure your iPhone is on the same network as your dev machine
3. Scan the QR code with your iPhone camera (or the scanner inside Expo Go)

The app loads with live reload — any file change updates the app without rebuilding.

**To bind to a specific host** (e.g. a VPN or alternate network interface):

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<hostname-or-ip> npx expo start
```

The QR code will encode `exp://<hostname>:8081` — point your phone at that address.
Note: `--host` only accepts `lan`, `tunnel`, or `localhost`; use the env var for a custom address.

**To generate a QR image file:**

```bash
# With the server already running:
qrencode -o qr.png -s 8 "exp://<your-host>:8081"
```

---

## Building for the App Store

iOS builds require macOS (or a cloud Mac service). The recommended approach is [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build:configure   # first time only — generates eas.json
eas build --platform ios
```

EAS Build runs on Expo's cloud macOS infrastructure — no Mac hardware required. To submit directly to App Store Connect:

```bash
eas submit --platform ios
```

---

## Project structure

```
App.tsx        — root component
app.json       — Expo config (name, icons, permissions, bundle ID)
flake.nix      — Nix dev environment
assets/        — icons and splash screen images
```
