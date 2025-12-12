import React from "react"
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native"
import { X } from "lucide-react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { iconSizes, textStyles } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { PathResultCard, type PathResultTag } from "@/components/PathResultCard"

export type SearchResult = {
  id: string
  title: string
  description: string
  tags: PathResultTag[]
}

type SearchResultsSheetProps = {
  visible: boolean
  results: SearchResult[]
  topOffset: number
  onClose: () => void
  title?: string
  maxHeight?: number
}

export function SearchResultsSheet({
  visible,
  results,
  topOffset,
  onClose,
  title = "Available Paths",
  maxHeight = verticalScale(260),
}: SearchResultsSheetProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  if (!visible) {
    return null
  }

  const countLabel = `${results.length} ${results.length === 1 ? "path" : "paths"}`

  return (
    <View
      style={[
        styles.sheet,
        {
          top: topOffset,
          backgroundColor: palette.bgPrimary,
          borderColor: palette.border,
          shadowColor: palette.border,
        },
      ]}
    >
      <View style={[styles.handle, { backgroundColor: palette.border }]} />

      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[textStyles.cardTitle, styles.headerTitle, { color: palette.textAccent }]}>{title}</Text>
          <Text style={[textStyles.caption, styles.headerSubtitle, { color: palette.textSecondary }]}>
            {countLabel} found
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: palette.primary,
              shadowColor: palette.primaryDark,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <X size={iconSizes.sm} color={palette.textInverse} />
        </Pressable>
      </View>

      <ScrollView
        style={[styles.list, { maxHeight }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {results.map((result) => (
          <View key={result.id} style={styles.cardWrapper}>
            <PathResultCard title={result.title} description={result.description} tags={result.tags} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    width: "90%",
    alignSelf: "center",
    borderRadius: radius.xl,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(18),
    borderWidth: 1,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: radius.xl,
    elevation: 10,
    zIndex: 12,
  },
  handle: {
    alignSelf: "center",
    width: scale(40),
    height: verticalScale(4),
    borderRadius: radius.full,
    marginBottom: verticalScale(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },
  headerTextGroup: {
    flex: 1,
    marginRight: scale(12),
  },
  headerTitle: {
    marginBottom: verticalScale(2),
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: radius.sm,
  },
  list: {
    width: "100%",
  },
  listContent: {
    paddingBottom: verticalScale(6),
  },
  cardWrapper: {
    marginBottom: verticalScale(12),
  },
})
