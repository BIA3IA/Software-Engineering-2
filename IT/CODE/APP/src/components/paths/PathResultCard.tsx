import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"

import { controlSizes, radius, spacing } from "@/theme/layout"
import { textStyles } from "@/theme/typography"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { AppButton } from "@/components/ui/AppButton"
import { MetricPill } from "@/components/ui/MetricPill"

export type PathResultTag = {
  label: string
  color: string
  textColor?: string
  kind?: "status" | "metric"
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
  const cardBg = selected ? palette.surface.elevated : palette.surface.card
  const cardBorder = palette.border.muted
  const titleColor = palette.text.link
  const descriptionColor = palette.text.secondary

  return (
    <Pressable
      onPress={onPress}
      style={() => [
        styles.card,
        {
          borderColor: cardBorder,
          backgroundColor: cardBg,
          shadowColor: palette.border.muted,
        },
      ]}
    >
      <Text style={[textStyles.bodyBold, styles.title, { color: titleColor }]}>{title}</Text>
      <Text style={[textStyles.caption, styles.description, { color: descriptionColor }]}>{description}</Text>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag, index) => (
            <MetricPill
              key={`${tag.kind ?? "tag"}-${tag.label}-${index}`}
              value={tag.label}
              backgroundColor={tag.color}
              textColor={tag.textColor}
            />
          ))}
        </View>
      )}

      {selected && actionLabel && (
        <AppButton
          title={actionLabel}
          onPress={onActionPress}
          buttonColor={palette.brand.base}
          textColor={palette.text.onAccent}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 0.3,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  title: {
    marginBottom: 4,
  },
  description: {
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actionButton: {
    marginTop: 10,
    borderRadius: radius.full,
    height: controlSizes.compactFab,
  },
  actionButtonContent: {
    height: controlSizes.compactFab,
  },
})
