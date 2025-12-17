/** @type {import('jest').Config} */
const config = {
  preset: "react-native",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|react-native-paper|expo(nent)?|@expo(nent)?/.*|expo-router|@unimodules|unimodules|nativewind|react-native-svg)",
  ],
  moduleNameMapper: {
    "^expo$": "<rootDir>/tests/mocks/expoMock.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
}

module.exports = config
