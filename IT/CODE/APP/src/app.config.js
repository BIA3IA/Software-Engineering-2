const base = require("./app.json")

const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
const iosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    android: {
      ...base.expo.android,
      config: {
        ...(base.expo.android?.config ?? {}),
        ...(androidKey ? { googleMaps: { apiKey: androidKey } } : {}),
      },
    },
    ios: {
      ...base.expo.ios,
      config: {
        ...(base.expo.ios?.config ?? {}),
        ...(iosKey ? { googleMapsApiKey: iosKey } : {}),
      },
    },
  },
}
