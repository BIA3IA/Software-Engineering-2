import "@testing-library/jest-native/extend-expect"

jest.spyOn(console, "warn").mockImplementation(() => { })
jest.spyOn(console, "error").mockImplementation(() => { })

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router")
  return {
    ...actual,
    Slot: () => null,
    Redirect: () => null,
    useSegments: () => ["(auth)"],
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  }
})

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}))
