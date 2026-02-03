# BestBikePaths - Mobile App

This repository contains the mobile application for BestBikePaths, built with Expo and React Native.
The app supports both guest and authenticated users and allows cyclists to explore routes, 
record trips, and contribute safety-related data.

## Tech Stack

The app is built using **Expo** on top of **React Native**.

### What is Expo?

Expo is a framework and tooling around React Native that lets us build cross-platform mobile apps 
(iOS, Android, Web) without diving into native code unless we need to. It ships with batteries
included: camera/location, filesystem, SecureStore, etc. We rely on Expo Router for file-based 
navigation and on Expo modules such as LinearGradient, SecureStore, Location, and Maps.

### Why Expo for this project?
- speed up initial setup and iteration
- support Android and iOS from a single codebase
- access native capabilities (location, secure storage, maps) without maintaining native build chains
- rely on a mature ecosystem and tooling (Expo Go, dev client, OTA updates)

### Key Libraries
- Navigation is handled via **Expo Router**, using file-based routing.
- Global state management is implemented with **Zustand**.
- UI components are built on top of **React Native Paper**, extended with custom primitives.

## Directory Walkthrough

```
src/
|—— api/                          # Backend API communication
|   |—— client.ts                 # Axios client with interceptors
|   |—— auth.ts                   # Authentication API wrappers
|   |__ ...                       # Other API modules
|—— app/                          # Expo Router navigation structure
|   |—— (auth)/                   # Authentication-related screens
|   |   |—— _layout.tsx           # Auth flow layout
|   |   |—— welcome.tsx           # Welcome screen
|   |   |__ ...                   # Other auth screens
|   |—— (main)/                   # Main application screens
|   |   |—— _layout.tsx           # Bottom navigation and access guards
|   |   |—— home.tsx              # Map-based path search and navigation
|   |   |__ ...                   # Other main screens
|   |—— _layout.tsx               # Root layout with global providers
|   |__ +not-found.tsx            # Fallback screen for unknown routes
|—— android/                      # Android native project
|—— assets/                       # Static assets
|   |—— images/                   # Icons and images
|   |__ fonts/                    # Custom fonts
|—— auth/                         # Authentication and session management
|   |—— authSession.ts            # In-memory session handling
|   |__ storage.ts                # Zustand store + SecureStore integration
|—— components/                   # Reusable UI components
|   |—— ui/                       # UI primitives (buttons, inputs, popups)
|   |   |—— AppButton.tsx         # Custom button component
|   |   |__ ...                   # Other UI primitives
|   |—— icons/                    # Icon wrappers and helpers
|   |   |__ LucideIcon.tsx        # Lucide icon set integration
|   |__ ...                       # Other components
|—— constants/                    # Static configuration values
|   |—— Colors.ts                 # Color palette definitions
|   |__ Privacy.ts                # Privacy options
|—— hooks/                        # Custom React hooks
|   |—— useBottomNavVisibility.tsx # Bottom navigation visibility
|   |__ ...                       # Other hooks
|—— ios/                          # iOS native project
|—— tests/                        # Automated tests
|   |—— integration/              # Integration tests 
|   |—— mocks/                    # Module mocks
|   |—— unit/                     # Unit tests
|   |__ utils/                    # Test helpers
|—— theme/                        # Theming configuration
|   |—— layout.ts                 # Layout helpers
|   |—— mapStyles.ts              # Map style definitions
|   |—— paperTheme.ts             # React Native Paper theme
|   |__ typography.ts             # Typography settings
|—— utils/                        # Utility functions
|   |—— geo.ts                    # Distance and route helpers
|   |—— apiError.ts               # API error normalization
|   |__ ...                       # Other utilities
|—— validation/                   # Zod validation schemas
|   |—— auth.ts                   # Login, signup, profile schemas
|   |__ ...                       # Other validation schemas
|—— .expo/                        # Expo local state
|—— .env                          # Environment variables
|—— .gitignore                    # Git ignore rules
|—— .npmrc                        # NPM configuration
|—— app.config.js                 # Expo configuration
|—— app.json                      # Expo app configuration
|—— babel.config.js               # Babel configuration
|—— eas.json                      # Expo Application Services configuration
|—— expo-env.d.ts                 # Expo TypeScript env definitions
|—— jest.config.js                # Jest configuration
|—— jest.setup.ts                 # Global test setup
|—— node_modules/                 # Installed dependencies
|—— package.json                  # Dependencies and scripts
|—— package-lock.json             # Locked dependency versions
|__ tsconfig.json                 # TypeScript configuration
```

## Prerequisites

Before running the app, make sure you have:

- **Node.js** (LTS version recommended)
- **npm** (included with Node.js)
- **Expo CLI** (optional but recommended)
- **Expo Go** (for running the app on a physical device)
- **EAS CLI** (required only for builds)

### Environment Variables

This project uses Expo public environment variables (prefixed with `EXPO_PUBLIC_`).
These variables are injected at build time and are accessible from the app code.

Create a `.env` file in the project root `IT/CODE/APP/src` starting from the example below.

```env
# API endpoints 
# At least one of the two API URLs must be provided. If both are set, the app will use the production URL.
EXPO_PUBLIC_PROD_API_URL=
EXPO_PUBLIC_DEVEL_API_URL=


# Google Maps API keys
# These keys are required for native map rendering using `react-native-maps`. 
# Missing or invalid keys may result in blank maps or runtime errors.
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=

# Comma-separated list of support emails shown in the UI (example: `support@example.com,admin@example.com`).
EXPO_PUBLIC_SUPPORT_EMAILS=
```

### Obtaining Google Maps API Keys

To enable maps on native devices, valid Google Maps API keys are required. 
If you want to obtain your own keys, follow these steps:

1. Create a project in **Google Cloud Console**
2. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
3. Create API keys

## First-time Setup (Quick Start)

From the project root (`IT/CODE/APP/src`):

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

Then:
- press `a` to run on Android
- press `i` to run on iOS (macOS only)
- or scan the QR code with Expo Go to run on a physical device

## Troubleshooting

### API calls fail when using `localhost:3000`

If you run the app on a physical device (Expo Go), `localhost` refers to the phone, not your computer.
In that case the backend must be reachable through your computer LAN IP.

Example:
- `EXPO_PUBLIC_DEVEL_API_URL=http://192.168.xx.xxx:3000/api/v1`

Notes:
- your phone and your computer must be on the same WiFi network
- ensure port 3000 is reachable from the LAN (firewall can block it)
- if your backend only listens on `127.0.0.1`, devices cannot connect. It must bind to `0.0.0.0`

If you use an Android emulator, use:
- `http://10.0.2.2:3000/api/v1` (Android Studio emulator)

### Expo Go cannot reach Metro on iPhone

Some networks block LAN discovery. If iOS cannot load the bundle or cannot connect to Metro,
start Expo in tunnel mode:

```bash
npx expo start --tunnel
```

Tunnel mode is slower, but usually works even on restrictive networks.

### Env changes do not apply

Expo injects `EXPO_PUBLIC_*` variables at bundling time.
After editing `.env`, restart the dev server and clear the cache:

```bash
npx expo start -c
```

## EAS Build (Android + iOS)

All build commands should be run from `IT/CODE/APP/src`.

### Prerequisites:
- Expo account (EAS uses your Expo login)
- For iOS builds: Apple Developer account + Apple ID access
- For Android builds: no account needed to build, Play Console needed to publish

### One-time setup:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Builds:
```bash
eas build -p android --profile apk
eas build -p ios
```

Notes:
- Android artifacts are `.apk` (or `.aab` for Play Store) files.
- iOS builds produce `.ipa` and require Apple credentials during the process.
- EAS prints a download link; you can also find builds in the Expo dashboard.

## Available Commands

| Command                   | Description                                                     |
|---------------------------|-----------------------------------------------------------------|
| `npx expo start`          | Start Expo dev server (Metro).                                  |
| `npx expo start -c`       | Start Expo dev server and clear Metro cache.                    |
| `npx expo start --tunnel` | Start Expo dev server in tunnel mode (useful on iOS).           |
| `npm run test`            | Run Jest across unit + integration suites.                      |
| `npm run test -- …`       | Targeted suites, e.g. `npm run test -- tests/integration/auth`. |
| `eas build -p android`    | Build Android APK/AAB via EAS.                                  |
| `eas build -p ios`        | Build iOS IPA via EAS.                                          |