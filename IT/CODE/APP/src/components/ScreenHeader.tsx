import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { scale, verticalScale, radius } from "@/theme/layout"
import { ArrowUpDown } from "lucide-react-native"

type ScreenHeaderProps = {
  title?: string
  subtitle?: string
  onSortPress?: () => void
  showSortButton?: boolean
  trailingAccessory?: React.ReactNode
}

export function ScreenHeader({
  title = "Trip History",
  subtitle = "Track your progress",
  onSortPress,
  showSortButton = true,
  trailingAccessory,
}: ScreenHeaderProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconSize = iconSizes.md
  const showDefaultSort = showSortButton && onSortPress && !trailingAccessory

  return (
    <View style={[styles.header, { backgroundColor: palette.accent }]}>
      <View style={styles.textBlock}>
        <Text
          style={[
            textStyles.screenTitle,
            styles.headerTitle,
            { color: palette.titleColor },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            textStyles.heroSubtitle,
            styles.headerSubtitle,
            { color: palette.subtitleColor },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.trailing}>
        {trailingAccessory}
        {showDefaultSort && (
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
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(48),
    paddingBottom: verticalScale(52),
    borderBottomLeftRadius: radius.xxxl,
    borderBottomRightRadius: radius.xxxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: scale(16),
  },
  textBlock: {
    flex: 1,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  headerTitle: {
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    opacity: 0.95,
    textAlign: "left",
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
