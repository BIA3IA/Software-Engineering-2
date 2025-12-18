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

jest.mock("expo-router", () => ({
  Slot: () => mockSlotElement.value,
  Redirect: (props: any) => {
    mockRedirectSpy(props.href)
    return null
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
    AppButton: ({ title, onPress }: any) => {
      const handlePress = () => {
        onPress?.()
      }
      return React.createElement(
        Pressable,
        { onPress: handlePress, accessibilityRole: "button", accessibilityLabel: title },
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
          accessibilityLabel: label || placeholder,
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
    AppPopup: ({ visible, title, message, primaryButton }: any) =>
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

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children,
}))
