# Native mobile build

This project now has a Capacitor native shell for iOS and Android. The native build uses the existing React/TanStack music app as the single source of truth, so the web UI, routes, playback, lyrics, likes, playlists, themes, and album browsing stay visually identical while running inside real iOS and Android app projects.

## What is native-ready

- `build:native` emits a static mobile bundle to `dist-cap`.
- The Capacitor config points the native app at `dist-cap` and enables edge-to-edge iPhone/Android rendering.
- Native-only CSS activates from the Capacitor runtime and applies safe-area padding, large iPhone system typography, disabled tap highlights, haptics-ready controls, and more curved album artwork.
- Downloads use the Capacitor Filesystem/Share bridge when the app is running natively, then fall back to the browser download behavior on the web.

## First-time platform setup

After dependencies are available, create the native projects once:

```bash
bun install
bun run build:native
bunx cap add ios
bunx cap add android
bunx cap sync
```

## Day-to-day commands

```bash
bun run build:native
bun run native:sync
bun run native:ios
bun run native:android
bun run native:apk
bun run native:apk:release
```

## APK output

- Debug APK: after `bun run native:apk`, use `android/app/build/outputs/apk/debug/app-debug.apk`.
- Release APK: after `bun run native:apk:release`, use `android/app/build/outputs/apk/release/app-release-unsigned.apk` unless you add Android signing config.
- The APK commands require the Android platform to exist, so run `bunx cap add android` once during first-time setup.

## Notes

- Keep building UI/features in `src`; do not fork separate native screens unless a hardware-only feature is required.
- If you add native plugins, call them through a small bridge in `src/lib/native-shell.ts` so the web build keeps working.
- iOS requires Xcode on macOS. Android requires Android Studio and the Android SDK.
