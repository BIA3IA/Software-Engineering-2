import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"

import { radius, scale, verticalScale } from "@/theme/layout"
import { textStyles } from "@/theme/typography"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

export type PathResultTag = {
  label: string
  color: string
  textColor?: string
}

export type PathResultCardProps = {
  title: string
  description: string
  tags?: PathResultTag[]
  selected?: boolean
  onPress?: () => void
  actionLabel?: string
  onActionPress?: () => void
}

export function PathResultCard({
  title,
  description,
  tags = [],
  selected = false,
  onPress,
  actionLabel,
  onActionPress,
}: PathResultCardProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const cardBg = selected ? palette.bgElevated : palette.bgPrimary
  const cardBorder = selected ? palette.primaryLight : palette.border
  const titleColor = selected ? palette.primaryDark : palette.textAccent
  const descriptionColor = selected ? palette.primaryDark : palette.textSecondary

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: cardBorder,
          backgroundColor: cardBg,
          shadowColor: palette.border,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={[textStyles.bodyBold, styles.title, { color: titleColor }]}>{title}</Text>
      <Text style={[textStyles.caption, styles.description, { color: descriptionColor }]}>{description}</Text>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag, index) => (
            <View
              key={`${tag.label}-${index}`}
              style={[styles.tag, { backgroundColor: `${tag.color}` }]}
            >
              <Text style={[textStyles.caption, styles.tagText, { color: tag.textColor }]}>
                {tag.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {selected && actionLabel && (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: palette.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[textStyles.bodySmall, styles.actionText, { color: palette.textInverse }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderWidth: 0.3,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  title: {
    marginBottom: verticalScale(4),
  },
  description: {
    marginBottom: verticalScale(8),
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  tag: {
    borderRadius: radius.full,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
  },
  tagText: {
    fontWeight: "600",
  },
  actionButton: {
    marginTop: verticalScale(10),
    borderRadius: radius.full,
    paddingVertical: verticalScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontWeight: "600",
  },
})
