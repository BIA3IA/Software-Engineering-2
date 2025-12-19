# Random App Notes
_copy paste and thoughts_

## What is Expo?

Expo is a framework and a platform for universal React applications.  
It is an open-source toolchain built around React Native that provides a rich set of features out of the box, such as access to the camera, location services, and other native functionalities.

With Expo, developers can avoid the complexities of native code while still building powerful, feature-rich mobile apps.

## Why Expo?

- **Quick Setup:** Expo handles most of the configuration automatically.  
- **Cross-Platform Development:** Write one codebase and run it on both Android and iOS.  
- **No Native Setup Required:** The app can run on a device or simulator with the Expo Go app, without needing Android Studio or Xcode.  
- **Pre-built Modules:** Expo includes a wide range of APIs to access native device functionalities.

## Creating a New Project

```bash
npx create-expo-app@latest APP --template tabs

npx expo install react-native-maps expo-location expo-secure-store \
react-native-gesture-handler react-native-reanimated \
react-native-safe-area-context react-native-screens \
react-native-svg

```

This command creates a new Expo project using the **Tabs template**, which includes a bottom tab navigation and a basic folder setup.

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
- **+not-found.tsx** -> The “404” page, shown if a user navigates to a non-existent route.  
- **modal.tsx** -> A demo modal screen (can be removed or replaced later).

### assets/

Contains static files bundled with the app:

- `images/` -> App icons, splash screens, etc.  
- `fonts/` -> Custom fonts (the default project includes `SpaceMono-Regular.ttf`).

Additional assets such as `logo.png` or `map-marker.png` can be added here and imported in the screens.

### components/

Contains reusable UI elements and utilities.

Included by default:

- `EditScreenInfo.tsx` -> Example info box.  
- `ExternalLink.tsx` -> Helper for opening external URLs.  
- `StyledText.tsx` -> A styled `<Text>` wrapper.  
- `Themed.tsx` -> Applies theme colors (light/dark mode).  
- `useColorScheme.ts` -> Reads device theme (light/dark).  
- `useClientOnlyValue.ts` -> Avoids running client-only code on the server when rendering for web.  

Additional components such as `TripCard.tsx`, `PathItem.tsx`, and `MapView.tsx` can be created here.

### constants/

Contains global configuration constants used across the app.

- `Colors.ts` -> Central place for the color palette (used by themes and styles).

### Other Project Files

| File / Folder | Description |
|----------------|--------------|
| `.expo/` | Internal metadata for Expo (should be gitignored). |
| `.vscode/` | Editor settings (useful for consistent formatting). |
| `node_modules/` | All dependencies installed via npm. |
| `.gitignore` | Ignores `node_modules/`, build artifacts, etc. |
| `app.json` | Expo app configuration (name, icon, permissions, etc.). |
| `package.json` | Declares dependencies and scripts. |
| `package-lock.json` | Locks dependency versions. |
| `expo-env.d.ts` | Type definitions for Expo globals. |
| `tsconfig.json` | TypeScript configuration. |


### Running the App

Run the app with:

```bash
npm run start
```

Then press:

- **w** -> open web preview  
- **a** -> open Android simulator  
- **i** -> open iOS simulator (on macOS)

Alternatively, scan the QR code in the terminal with the **Expo Go app** to preview it directly on a phone.

# React Native UI Libraries – Comparison

## 1) Selection criteria

- **Cross‑platform reach**: iOS, Android, and (optionally) web with one codebase.
- **Design system**: tokens (colors, spacing, radii, typography), theming, dark mode.
- **Performance**: runtime overhead vs. compile time, bundle size, responsiveness on low/mid devices.
- **Component breadth**: buttons, inputs, cards, lists, dialogs, sheets, tabs.
- **Customizability**: ability to implement a distinct brand (not locked to Material look).
- **Ecosystem compatibility**: works well with Expo, React Navigation/Expo Router, react-native-maps, form libs.
- **Learning curve & DX**: ergonomics, TypeScript support, community, documentation.
- **Long‑term maintainability**: active maintenance, stability, flexibility for growth (e.g., web in the future).

## 2) Contenders at a glance

| Library | Platforms | Design approach | Theming/Design tokens | Components breadth | Performance | Web support | Maturity |
|---|---|---|---|---|---|---|---|
| **Tamagui** | iOS/Android/Web | Styled props + compiler | Strong tokens + themes | Solid base (Button, Card, Sheet, etc.) | Excellent (compile-time) | First‑class | High (fast‑growing) |
| **React Native Paper** | iOS/Android | Material Design components | Theming (Material) | Very broad (MD spec) | Good | No (mobile only) | Very high, battle‑tested |
| **NativeBase** | iOS/Android/Web | Styled props (Chakra‑like) | Tokens + themes | Broad | Good | Good | Mature |
| **UI Kitten** | iOS/Android | Eva Design System | Tokens + themes | Broad | Good | No native web | Mature |
| **React Native Elements** | iOS/Android | Configurable components | Basic theming | Medium | Good | No | Mature |
| **Dripsy** | iOS/Android/Web | Styled props (theme‑ui style) | Tokens + themes | Light | Good | Good | Moderate |

Notes:
- Dripsy is lighter than Tamagui, but lacks a full component suite and compiler optimizations.

## 3) Deep dive

### 3.1 Tamagui
- **What it is**: Cross‑platform design system with a compiler that transforms styled props into static styles (reduced runtime cost).
- **Strengths**: Performance, first‑class web support, tokens/themes, coherent API, good base components (Stack, Text, Button, Card, Sheet).
- **Weaknesses**: Slightly more setup, smaller ecosystem than Material-based libraries.
- **Fit for BBP**: Excellent for a distinctive brand, dark/light themes, mobile now + optional web. Works well with Expo Router and react-native-maps.

### 3.2 React Native Paper
- **What it is**: Material Design implementation for React Native by Callstack.
- **Strengths**: Broad, polished component set (Cards, Lists, FAB, Appbar, Dialogs, DataTable), strong accessibility.
- **Weaknesses**: Opinionated Material look (customization beyond MD requires effort), no web target.
- **Fit for BBP**: Very good if you want fast delivery with a Material look; less ideal if you want a custom non‑Material identity or future web alignment.

### 3.3 NativeBase
- **What it is**: Component library with styled‑props approach (inspired by Chakra).
- **Strengths**: Broad components, tokens, themes, decent web story, good DX.
- **Weaknesses**: Styling engine adds some runtime cost; design less opinionated than Paper but less performant than Tamagui.
- **Fit for BBP**: Good middle ground if you want Chakra‑like ergonomics in RN with optional web.

### 3.4 UI Kitten
- **What it is**: Components on top of Eva Design System.
- **Strengths**: Beautiful defaults, strong theming.
- **Weaknesses**: No first‑class web, ecosystem smaller than Paper.
- **Fit for BBP**: Good if you like the Eva visual language and stay mobile‑only.

### 3.5 React Native Elements
- **What it is**: Lightweight, modular components.
- **Strengths**: Simple, flexible, unopinionated.
- **Weaknesses**: Fewer high‑level components; you assemble more yourself.
- **Fit for BBP**: Fine for simple UIs; for a full dashboard experience you will write more code.

### 3.6 Dripsy
- **What it is**: Theme‑UI‑style tokens for RN and web.
- **Strengths**: Minimal, clean, web support.
- **Weaknesses**: Small component set, fewer patterns out of the box.
- **Fit for BBP**: Viable if you want to keep things very minimal, but you will craft many components.


# Here is how I would structure the app

## 1. Expo
Expo is a framework on top of React Native that simplifies development:

- Zero native setup required
- Automatic updates
- Easy access to native APIs (Camera, Location, Sensors)
- Stable development workflow

## 2. Tamagui
Tamagui is a UI kit and styling system for React Native and Web:

- Cross-platform styling engine
- Prebuilt components (Button, Input, etc.)
- Highly performant
- Works with themes and tokens

Icons use:

- `@tamagui/lucide-icons`

## 3. Navigation System

The app uses **Expo Router**, which maps the file structure inside `/app` to navigation routes.

Example:

```
app/
  (tabs)/
    index.tsx        <- Home
    trips.tsx        <- Trip list
    navigation.tsx   <- Nav Map
    profile.tsx      <- User profile
  (auth)/
    login.tsx
    register.tsx
  (modals)/
    report-modal.tsx
```

Expo Router automatically handles:

- Stack navigation  
- Tab navigation  
- Modal screens  
- Deep linking  

## 4. State Management

### **4.1 Server State -> TanStack Query (React Query)**

_Non confonderti: 
React Query mantiene i dati freschi, sincronizzati, cached e sempre aggiornati.
Axios fa la chiamata.
Il backend dà la risposta.
React Query é tipo un gestore intelligente che usa Axios per prendere i dati e li conserva in cache, li aggiorna, li refetch-a quando serve, ecc._

Used for:

- Fetching trip list  
- Fetching path info  
- Fetching markers (reports, obstacles)  
- Statistics  
- User data  

Advantages:

- Automatic caching  
- Refetch on focus  
- Error/loading handling  
- Pagination support  

Example:

```ts
const { data, isLoading } = useQuery({
  queryKey: ['trips'],
  queryFn: () => api.get('/trips').then(r => r.data)
})
```

### **4.2 Local State -> Zustand**

Used for:

- Active trip ID  
- Current filters  
- Map layer toggles  
- UI booleans (modals, sheets)

Example:

```ts
const useTripStore = create(set => ({
  activeTripId: null,
  setActiveTripId: id => set({ activeTripId: id })
}));
```

## 5. Forms and Validation

Forms appear in:

- Login / Register  
- Create Path  
- Report Obstacle  
- Filters  

Recommended stack:

- `react-hook-form`
- `zod` (validation)

Example:

```ts
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
```

## 6. Networking

Networking is handled via **Axios**:

```ts
export const api = axios.create({
  baseURL: 'https://bbp-backend.example.com/api',
  timeout: 10000,
});
```

React Query uses this client for all API calls.

## 7. Maps & Navigation (react-native-maps)

The mapping subsystem is built with:

- `react-native-maps`
- `expo-location`

### **7.1 What react-native-maps does**

Rendering:
- Map tiles
- Markers
- Polylines (paths)
- Polygons

It *does not* compute routes.  
Route generation comes from:
- Backend  
- External routing APIs (Google, OpenRouteService)  

### **7.2 Rendering a Path (Polyline)**

Given a route with coordinates:

```tsx
<Polyline
  coordinates={routeCoords}
  strokeColor="#7c3aed"
  strokeWidth={5}
/>
```

### **7.3 Rendering Reports / Obstacles (Markers)**

```tsx
<Marker
  coordinate={{ latitude, longitude }}
  title="Obstacle"
  description="Pothole reported here"
/>
```

### **7.4 Displaying User Position**

```tsx
<MapView showsUserLocation followsUserLocation />
```

## 8. Live GPS Tracking

Trip tracking requires:

- Getting continuous GPS updates  
- Appending coordinates to an array  
- Drawing a growing polyline  
- Storing data locally until the trip ends  

### **8.1 Enabling Permissions**

```ts
let { status } = await Location.requestForegroundPermissionsAsync();
```

### **8.2 Starting a Live Tracking**

```tsx
const [coords, setCoords] = useState([]);

const startTracking = async () => {
  await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 2, // meters
    },
    (location) => {
      const { latitude, longitude } = location.coords;
      setCoords(prev => [...prev, { latitude, longitude }]);
    }
  );
};
```

### **8.3 Rendering Live Map Track**
```tsx
<MapView>
  <Polyline
    coordinates={coords}
    strokeColor="#6d28d9"
    strokeWidth={4}
  />
</MapView>
```

### **8.4 Uploading Trip Data**

Once the user stops:

```ts
api.post('/trips', { coordinates: coords, ...stats });
```

## 9. Bottom Sheets & Overlays

BBP uses overlays for:

- Trip summary  
- Report creation  
- Filters  

Tamagui includes a `Sheet` component that works well as a bottom sheet.

Example:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <Sheet.Frame>
    <Text>Report an Issue</Text>
  </Sheet.Frame>
</Sheet>
```

## 10. Charts for Statistics

- `react-native-svg`
- `victory-native`

Example chart:

```tsx
<VictoryLine
  data={speedOverTime}
  x="timestamp"
  y="speed"
/>
```

## 11. Recommended Dependencies Summary

```
UI:
  tamagui
  @tamagui/lucide-icons

Navigation:
  expo-router

State:
  @tanstack/react-query
  zustand

Forms:
  react-hook-form
  zod

Maps:
  react-native-maps
  expo-location

Networking:
  axios

Charts:
  react-native-svg
  victory-native

Storage:
  expo-secure-store
```

## 12. Architecture Summary

- **Presentation layer** -> Tamagui UI, screens  
- **Navigation layer** -> Expo Router  
- **State layer** -> React Query + Zustand  
- **Map layer** -> react-native-maps  
- **Tracking layer** -> expo-location  
- **API layer** -> Axios client + backend services  
- **Data layer** -> Cached server state + secure local storage  

```bash
npm install tamagui @tamagui/core @tamagui/lucide-icons @tamagui/themes @tamagui/config \
@tanstack/react-query zustand \
react-hook-form zod \
axios \
victory-native
```