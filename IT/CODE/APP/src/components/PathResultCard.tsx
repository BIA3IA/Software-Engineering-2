import React from "react"
import { View, Text, StyleSheet } from "react-native"

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
}

export function PathResultCard({ title, description, tags = [] }: PathResultCardProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: palette.border,
          backgroundColor: palette.bgPrimary,
          shadowColor: palette.border,
        },
      ]}
    >
      <Text style={[textStyles.bodyBold, styles.title, { color: palette.textAccent }]}>{title}</Text>
      <Text style={[textStyles.caption, styles.description, { color: palette.textSecondary }]}>{description}</Text>

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
    </View>
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
})
