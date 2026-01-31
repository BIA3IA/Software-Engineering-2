# BestBikePaths Internal Notes

Quick reference for how the Expo app is structured, why specific choices were made, and how to run/tests things today. Everything below reflects the current repo layout (`IT/CODE/APP/src`).

## What is Expo?

Expo is a framework and tooling around React Native that lets us build cross-platform mobile apps (iOS, Android, Web) without diving into native code unless we need to. It ships with batteries included: camera/location, filesystem, SecureStore, etc. We rely on Expo Router for file-based navigation and on Expo modules such as LinearGradient, SecureStore, Location, and Maps.

## Why Expo for this project?

- **Fast bootstrap** - `create-expo-app` delivered a ready-to-run React Native setup with sensible defaults.
- **Cross-platform UI** - a single codebase runs on both Android and iOS (and web for previews).
- **Native APIs without native build chains** - we get SecureStore, Location, LinearGradient, etc. without touching Xcode/Android Studio until deployment time.
- **Deep community/tooling** - dev client, Expo Go, OTA updates, and a huge library ecosystem.

## Creating / maintaining the project

```bash
npx create-expo-app@latest APP --template tabs

npx expo install react-native-maps expo-location expo-secure-store \
  react-native-gesture-handler react-native-reanimated \
  react-native-safe-area-context react-native-screens \
  react-native-svg
```

The base template gave us the `(tabs)` routing which we adapted into the `(auth)` and `(main)` stacks.

## Directory Walkthrough (src)

### Root files
- `app.json` / `app.config.js` - Expo project name, icon, splash, extra env vars.
- `package.json` - scripts + dependencies (Expo 54, React Native 0.81, Paper 5, Zustand, etc.).
- `tsconfig.json` - aliases `@/` to `src`, JSX config.
- `jest.config.js` - React Native preset extended to include `tests/unit` + `tests/integration`.
- `jest.setup.ts` - global mocks for Expo Router, SecureStore, SafeArea, Paper UI, AppButton/TextInput/Popup shims, console suppression.
- `tests/mocks/expoMock.ts` - empty stub returned when some modules import `expo`.

### app/ (Expo Router)
- `_layout.tsx` - wraps the entire navigation tree with `PaperProvider`, injects the Lucide icon set, calls `useAuthStore.initAuth()` and enforces redirects (unauth users forced to welcome, logged-in users prevented from staying in `(auth)`).
- `+not-found.tsx` - generic 404 screen.
- `(auth)/_layout.tsx` - minimal layout for welcome/login/signup flows.
- `(auth)/welcome.tsx` - hero screen with CTA buttons and "Guest Mode".
- `(auth)/login.tsx` & `signup.tsx` - React Hook Form + Zod validation wiring, call `useAuthStore` actions.
- `(main)/_layout.tsx` - houses `BottomNav`, `LoginPromptProvider`, and the login-required popup (guest flows).
- `(main)/home.tsx` - central map/route experience: search inputs, result sheet, Create Path FAB, report modal, navigation progress, start/complete trip actions.
- `(main)/trips.tsx` - trip history, metrics, stats cards, entry points to detail screens.
- `(main)/paths.tsx` - curated path list with filters/tags.
- `(main)/create-path.tsx` - wizard/modal for user-generated paths.
- `(main)/profile.tsx` - profile header, stats, privacy preferences, entry to edit-profile.
- `(main)/edit-profile.tsx` - full edit form with Zod validation, updateProfile call, success/error popups.
- `(main)/settings.tsx` - settings toggles, theme/preferences.
## Folder Structure Explained

### app/

This is the main routing folder - Expo Router turns its structure into navigation automatically.

#### Inside it:

- **(tabs)/** -> Defines the bottom tab navigation (the bar with multiple pages).  
  - `_layout.tsx` -> Defines the navigation bar and icons for each tab.  
  - `index.tsx` -> Home screen.  
  - `two.tsx` -> Example second screen.  
  (Additional screens can be added here, e.g., `trip.tsx`, `paths.tsx`, etc.)

- **_layout.tsx** -> Root layout for everything outside tabs (e.g., modals, login screens).  
- **+html.tsx** -> Used internally when running on web to render HTML pages (can be ignored).  
- **+not-found.tsx** -> The "404" page, shown if a user navigates to a non-existent route.  
- **modal.tsx** -> A demo modal screen (can be removed or replaced later).

### assets/

Contains static files bundled with the app:

- `images/` -> App icons, splash screens, etc.  
- `fonts/` -> Custom fonts (the default project includes `SpaceMono-Regular.ttf`).

Additional assets such as `logo.png` or `map-marker.png` can be added here and imported in the screens.

### components/
- `ui/` - reusable primitives (`AppButton`, `AppTextInput`, `AppPopup`, `SelectField`, etc.).
- `BottomNav.tsx` - bottom navigation bar aware of auth/guest state.
- `ScreenHeader`, `ProfileHeroHeader`, `PathResultCard`, `SearchResultsSheet`, `CreatePathModal`, `ReportIssueModal`, `RouteMap`, `RouteCard`, etc. These encapsulate domain UI/logic for routes, paths, profile.
- `components/icons/` - `LucideIcon` wrapper to ensure consistent icon use inside Paper theme.

### auth/
- `authSession.ts` - in-memory tokens + listener for session changes.
- `storage.ts` - Zustand store connecting SecureStore, APIs, and UI (init, login, logout, fetch profile, update profile, guest mode).

## Zustand usage

Zustand is a lightweight global state container for React. We use it to store app-wide state (auth/session, user data, and cross-screen UI selections) and expose it through hooks like `useAuthStore`.

In BBP:
- `IT/CODE/APP/src/auth/storage.ts` is the main store: handles login/logout, session init, user profile, and bridges SecureStore with the UI.
- `IT/CODE/APP/src/hooks/useTripLaunchSelection.ts` shares the selected path between Path Library and Home.
- `IT/CODE/APP/src/hooks/usePrivacyPreference.ts` persists the user's default visibility preference.

### validation/
- `auth.ts` - Zod schemas + types for login, signup, and edit-profile flows.
- `path.ts` - schema for create-path modal.
- `index.ts` - barrel so consumers can `import { signupSchema } from "@/validation"`.

### api/
- `client.ts` - Axios instance with `getAccessToken()` injection and 403 interceptor that hits `refreshAccessToken`.
- `auth.ts` - login/signup/logout/profile/update API wrappers with type-safe mappers.
- `tokenManager.ts` - manual axios client to refresh tokens, handles concurrency and session clearing on failure.

### hooks/
- `useColorScheme`, `useThemePreference` - theme detection/persistence.
- `useLoginPrompt` - context to trigger global login modal (guest restrictions).
- `useBottomNavVisibility` - context provider to hide the nav for certain screens (e.g., edit profile).
- `useTrips` - handles trip fetching/state (caching between navigations).
- `usePrivacyPreference` - manages selected privacy option and persistence.
- `useBottomNavVisibility` context consumed by modals/screens to hide nav on scroll-intensive views.

### constants/ & theme/
- `constants/Colors.ts` - light/dark palette, accent colors, guest colors, etc.
- `constants/privacy.ts` - static privacy preference options.
- `theme/layout.ts` / `theme/typography.ts` - spacing helpers, radius, font sizes.
- `theme/mapStyles.ts`, `theme/paperTheme.ts` - map style JSON and Paper theme definitions.

### assets/
- `assets/images/` - icons, splash, adaptive icon.
- `assets/fonts/` - custom typefaces (Space Mono).

### utils/
- `utils/apiError.ts` - normalizes Axios/JS errors into user-facing strings (used by Login/Signup/Edit Profile popups).
- `utils/layout.ts` - responsive layout helpers (scale, verticalScale, moderateScale).
- `utils/geo.ts` - haversine distance helpers plus `minDistanceToRouteMeters` for off-route detection.
- `utils/routes.ts` - builds full polylines from path/trip segments.
- `utils/map.ts` - map helpers (region fitting, search normalization, closest-point index).
- `utils/pathMappers.ts` - adapters between API path payloads and UI-friendly SearchResult/RouteItem shapes.
- `tests/utils/render.tsx` (in `tests/utils`) - test helper that wraps React components with PaperProvider + theme icon settings.

### tests/
- `tests/unit` - per-module jest files.
- `tests/integration` - screen + navigation flow tests (auth, navigation).
- `tests/utils/render.tsx` - helper to render components with PaperProvider wrapper in tests.
- `tests/mocks` - Expo Router / Expo stub modules.

## Key Flows

- **Auth init** - `useAuthStore.initAuth()` loads user + tokens from SecureStore, hydrates `authSession`, and refreshes profile if needed.
- **Login/signup** - call `api/auth`, persist tokens, update Zustand store, navigate to `/(main)/home`.
- **Guest mode** - welcome screen triggers `loginAsGuest`, `MainLayout` shows the login popup when a guest tries to access restricted tabs/actions.
- **Token refresh** - Axios response interceptor invokes `refreshAccessToken` on 401, coalescing concurrent refresh calls and updating `authSession`.
- **Profile update** - `useAuthStore.updateProfile()` hits `/users/me` and re-fetches profile to keep store + SecureStore in sync.
- **Navigation** - `BottomNav` reads `usePathname` to know the active tab and, for guests, calls `onRequireLogin` instead of navigating.

## Running the App

| Command             | Description                                                |
|---------------------|------------------------------------------------------------|
| `npm run start`     | Expo dev server + Metro bundler (press `w`/`a`/`i`/QR).    |
| `npm run android`   | Build/run on Android device or emulator.                   |
| `npm run ios`       | Build/run on iOS simulator (requires macOS).               |
| `npm run test`      | Run Jest across unit + integration suites.                 |
| `npm run test -- …` | Targeted suites, e.g. `npm run test -- tests/integration/auth`. |

Expo CLI shortcuts inside Metro:
- `w` - start web preview
- `a` - Android
- `i` - iOS
- `r` - reload
- `shift + r` - restart bundler/clear cache
You can also scan the QR code with Expo Go to run on a physical device.

## Testing Strategy

All tests live under `src/tests`. Jest is configured in `src/jest.config.js` and `src/jest.setup.ts` provides global mocks (router, SecureStore, Paper UI, Safe Area, LinearGradient...).

### Unit suites (`tests/unit`)
- `auth/authSession.test.ts` - verifies `setSession`/`clearSession`, getters, listener registration/unsubscribe.
- `auth/tokenManager.test.ts` - refresh request dispatch, session update, error handling, concurrency coalescing.
- `auth/storage.test.ts` - covers `initAuth`, SecureStore edge cases, login/signup/logout actions, fetchProfile/updateProfile (success + failure paths).
- `api/auth.api.test.ts` - ensures payloads/timeouts mapping to backend contract for login/signup/logout/profile/update.
- `validation/auth.validation.test.ts` - Zod schema behaviour: password mismatch, optional edit profile fields, etc.

### Integration suites (`tests/integration`)
- `auth/login.integration.test.tsx` - login screen: validation, store call, navigation, popup on errors.
- `auth/signup.integration.test.tsx` - sign up validation, store integration, navigation to home.
- `auth/editProfile.integration.test.tsx` - edit profile form behaviour, update API call, success/error popups.
- `navigation/redirects.integration.test.tsx` - root layout redirect logic for unauthenticated users, authenticated, guest edge cases.
- `navigation/welcome.integration.test.tsx` - CTA flows (Sign Up, Log In, Guest Mode) ensure correct store actions + router calls.
- `navigation/guestAccess.integration.test.tsx` - bottom nav + login popup guard user actions when guest.
- `navigation/loggedinAccess.integration.test.tsx` - verifies tabs actually navigate when authenticated and ignore duplicate taps.

> Each integration test uses the shared mocks from `jest.setup.ts` to avoid real navigation/SecureStore, while still exercising the React components end-to-end.

Run a subset via e.g.:
```bash
npm run test -- tests/integration/navigation
```

## React Native UI Libraries - Selection Criteria (context recap)

When choosing UI libraries/components we looked at:
1. **Cross-platform support** - must behave identically on Android/iOS (Paper passes this).
2. **Composable primitives** - Paper provides theming + base components, while we extend with custom UI in `components/ui`.
3. **Theming support** - Paper integrates with our Colors/typography, accessible dark/light switches, etc.

## Trips & Navigation Behaviors

- **Trip start** happens when a selected path is near the user origin (100m threshold).
- **Off-route detection**: while a trip is active, we measure the minimum distance to the route polyline.
  - Default threshold: 50 meters.
  - Trigger: 3 consecutive updates outside the threshold or 15 seconds continuously off-route.
  - Result: popup prompts to end the trip or continue (resetting the off-route counter).
  - Continue is allowed only once per trip; subsequent prompts only allow ending the trip.
  - Ending the trip here runs the same save flow as the manual "Complete Trip" button.
- `(main)/home.tsx` - central map/route experience: search inputs, result sheet, Create Path FAB, report modal, navigation progress, start/complete trip actions.
- `(main)/trips.tsx` - trip history, metrics, stats cards, entry points to detail screens.
- `(main)/paths.tsx` - curated path list with filters/tags.
- `(main)/create-path.tsx` - wizard/modal for user-generated paths.
- `(main)/profile.tsx` - profile header, stats, privacy preferences, entry to edit-profile.
- `(main)/edit-profile.tsx` - full edit form with Zod validation, updateProfile call, success/error popups.
- `(main)/settings.tsx` - settings toggles, theme/preferences.

## EAS Build (Android + iOS)

All build commands should be run from `IT/CODE/APP/src`.

Prerequisites:
- Expo account (EAS uses your Expo login)
- For iOS builds: Apple Developer account + Apple ID access
- For Android builds: no account needed to build, Play Console needed to publish

One-time setup:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

Builds:
```bash
eas build -p android
eas build -p ios
```

Notes:
- Android artifacts are usually `.aab` (Play Store). For install on device you need to convert to APK.
- iOS builds produce `.ipa` and require Apple credentials during the process.
- EAS prints a download link; you can also find builds in the Expo dashboard.

eas build -p android --profile apk