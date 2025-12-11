import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"

export default function ComingSoonScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={[styles.container, { backgroundColor: palette.bgPrimary }]}>
      <Text style={[styles.text, { color: palette.textAccent }]}>
        Coming Soon
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
})
