import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { layoutStyles, scale } from "@/theme/layout"
import { textStyles } from "@/theme/typography"

export default function ComingSoonScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={[layoutStyles.screen, styles.container, { backgroundColor: palette.bgPrimary }]}>
      <Text style={[textStyles.screenTitle, { color: palette.textAccent }]}>
        Coming Soon
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
  },
})
