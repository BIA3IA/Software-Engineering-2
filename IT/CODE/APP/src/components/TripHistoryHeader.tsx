import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { scale, verticalScale, radius } from "@/theme/layout"
import { ArrowUpDown } from "lucide-react-native"

type TripHistoryHeaderProps = {
  onSortPress: () => void
}

export function TripHistoryHeader({ onSortPress }: TripHistoryHeaderProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconSize = iconSizes.md

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: palette.accent },
      ]}
    >
      <View>
        <Text
          style={[
            textStyles.screenTitle,
            styles.headerTitle,
            { color: palette.titleColor },
          ]}
        >
          Trip History
        </Text>
        <Text
          style={[
            textStyles.heroSubtitle,
            styles.headerSubtitle,
            { color: palette.subtitleColor },
          ]}
        >
          Track your progress
        </Text>
      </View>

      <Pressable
        onPress={onSortPress}
        style={({ pressed }) => [
          styles.sortButton,
          { backgroundColor: palette.buttonSecondaryBg, shadowColor: palette.border },
          pressed && { opacity: 0.85 },
        ]}
      >
        <ArrowUpDown size={iconSize} color={palette.buttonSecondaryText} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(48),
    paddingBottom: verticalScale(52),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: radius.xxxl,
    borderBottomRightRadius: radius.xxxl,
  },
  headerTitle: {
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    opacity: 0.95,
  },
  sortButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
})
