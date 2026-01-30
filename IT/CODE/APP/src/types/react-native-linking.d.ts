declare module "react-native/Libraries/Linking/Linking" {
  const Linking: {
    openURL: (url: string) => Promise<void>
    canOpenURL?: (url: string) => Promise<boolean>
  }
  export default Linking
}
