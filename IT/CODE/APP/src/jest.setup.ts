import "@testing-library/jest-native/extend-expect"

jest.spyOn(console, "warn").mockImplementation(() => {})
jest.spyOn(console, "error").mockImplementation(() => {})
jest.spyOn(console, "log").mockImplementation(() => {})

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

export const mockRedirectSpy = jest.fn()
export const mockSegments: { value: string[] } = { value: ["(auth)"] }
export const mockPathname: { value: string } = { value: "/home" }
export const mockSlotElement: { value: any } = { value: null }
export const mockSearchParams: { value: Record<string, string> } = { value: {} }

jest.mock("expo-router", () => ({
  Slot: () => mockSlotElement.value,
  Redirect: (props: any) => {
    mockRedirectSpy(props.href)
    return null
  },
  useLocalSearchParams: () => mockSearchParams.value,
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = require("react")
    const ranRef = React.useRef(false)
    React.useEffect(() => {
      if (ranRef.current) return
      ranRef.current = true
      return effect()
    }, [effect])
  },
  useSegments: () => mockSegments.value,
  useRouter: () => mockRouter,
  usePathname: () => mockPathname.value,
}))

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}))

jest.mock("react-native-safe-area-context", () => {
  const React = require("react")
  const RN = require("react-native")
  const SafeAreaInsetsContext = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 })
  return {
    SafeAreaView: (props: any) => React.createElement(RN.View, null, props.children),
    SafeAreaInsetsContext,
    SafeAreaProvider: ({ children }: any) =>
      React.createElement(SafeAreaInsetsContext.Provider, { value: { top: 0, bottom: 0, left: 0, right: 0 } }, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  }
})

jest.mock("@/components/ui/AppButton", () => {
  const React = require("react")
  const { Pressable, Text } = require("react-native")
  return {
    AppButton: ({ title, onPress, testID }: any) => {
      const handlePress = () => {
        onPress?.()
      }
      return React.createElement(
        Pressable,
        { onPress: handlePress, testID },
        React.createElement(Text, { onPress: handlePress }, title)
      )
    },
  }
})

jest.mock("@/components/ui/AppTextInput", () => {
  const React = require("react")
  const { Text, TextInput, View } = require("react-native")
  return {
    AppTextInput: ({ label, placeholder, value, onChangeText, errorMessage }: any) =>
      React.createElement(
        View,
        null,
        label ? React.createElement(Text, null, label) : null,
        React.createElement(TextInput, {
          placeholder,
          value,
          onChangeText,
        }),
        errorMessage ? React.createElement(Text, null, errorMessage) : null
      ),
  }
})

jest.mock("@/components/ui/AppPopup", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")
  return {
    AppPopup: ({ visible, title, message, primaryButton, secondaryButton }: any) =>
      visible
        ? React.createElement(
            View,
            null,
            React.createElement(Text, null, title),
            React.createElement(Text, null, message),
            primaryButton?.label
              ? React.createElement(
                  Pressable,
                  { onPress: primaryButton.onPress },
                  React.createElement(Text, null, primaryButton.label)
                )
              : null,
            secondaryButton?.label
              ? React.createElement(
                  Pressable,
                  { onPress: secondaryButton.onPress },
                  React.createElement(Text, null, secondaryButton.label)
                )
              : null
          )
        : null,
  }
})

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
  useThemePreference: () => "light",
}))

jest.mock("@/hooks/usePrivacyPreference", () => ({
  usePrivacyPreference: () => "public",
}))

jest.mock("@/utils/apiError", () => ({
  getApiErrorMessage: () => "API error",
}))

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 45.0, longitude: 9.0 },
  })),
  watchPositionAsync: jest.fn(async (_options: any, callback: any) => {
    callback?.({ coords: { latitude: 45.0, longitude: 9.0 } })
    return { remove: jest.fn() }
  }),
  reverseGeocodeAsync: jest.fn(async () => [{ city: "Test City", street: "Test Street" }]),
  LocationAccuracy: { Balanced: 3 },
}))

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children,
}))

jest.mock("lucide-react-native", () => {
  const React = require("react")
  const { Text } = require("react-native")
  const MockIcon = () => React.createElement(Text, null, "icon")
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    }
  )
})
