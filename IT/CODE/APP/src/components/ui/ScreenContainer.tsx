import React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAppTheme } from "@/theme/paperTheme"

type ScreenContainerProps = {
  children: React.ReactNode
  centerContent?: boolean
  scroll?: boolean
  padding?: number
}

export function ScreenContainer({
  children,
  centerContent = false,
  scroll = false,
  padding = 16,
}: ScreenContainerProps) {
  const { colors } = useAppTheme()
  const bg = colors.bgPrimary ?? "#ffffff"

  const content = (
    <View
      style={[
        styles.content,
        {
          backgroundColor: bg,
          alignItems: centerContent ? "center" : "flex-start",
          justifyContent: centerContent ? "center" : "flex-start",
          padding,
        },
      ]}
    >
      {children}
    </View>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    width: "100%",
  },
  scroll: {
    flexGrow: 1,
  },
})
