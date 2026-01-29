import React from "react"
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native"
import { X } from "lucide-react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { iconSizes, textStyles } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { PathResultCard, type PathResultTag } from "@/components/paths/PathResultCard"
import { useAuthStore } from "@/auth/storage"

export type SearchResult = {
  id: string
  title: string
  description: string
  tags: PathResultTag[]
  route: { latitude: number; longitude: number }[]
  pathSegments?: {
    segmentId: string
    polylineCoordinates: { latitude: number; longitude: number }[]
  }[]
}

type SearchResultsSheetProps = {
  visible: boolean
  results: SearchResult[]
  topOffset: number
  onClose: () => void
  title?: string
  maxHeight?: number
  selectedResultId?: string | null
  onSelectResult?: (result: SearchResult) => void
  actionLabel?: string
  onActionPress?: (result: SearchResult) => void
}

export function SearchResultsSheet({
  visible,
  results,
  topOffset,
  onClose,
  title = "Available Paths",
  maxHeight = verticalScale(260),
  selectedResultId = null,
  onSelectResult,
  actionLabel,
  onActionPress,
}: SearchResultsSheetProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const user = useAuthStore((s) => s.user)
  const isGuest = user?.id === "guest"

  if (!visible) {
    return null
  }

  const isEmpty = results.length === 0
  const countLabel = `${results.length} ${results.length === 1 ? "path" : "paths"}`
  const emptyHeight = maxHeight
  const emptyHint = isGuest
    ? "Create an account and a new path!"
    : "Try creating one!"

  return (
    <View
      style={[
        styles.sheet,
        {
          top: topOffset,
          backgroundColor: palette.surface.card,
          borderColor: palette.border.muted,
          shadowColor: palette.border.muted,
        },
        isEmpty ? { minHeight: emptyHeight } : null,
      ]}
    >

      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[textStyles.cardTitle, styles.headerTitle, { color: palette.text.link }]}>{title}</Text>
          <Text style={[textStyles.caption, styles.headerSubtitle, { color: palette.text.secondary }]}>
            {countLabel} found
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: palette.brand.base,
              shadowColor: palette.brand.dark,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <X size={iconSizes.sm} color={palette.text.onAccent} />
        </Pressable>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={[textStyles.bodyBold, styles.emptyTitle, { color: palette.text.primary }]}>
            Unfortunately there are no paths for the selected route.
          </Text>
          <Text style={[textStyles.bodySmall, styles.emptySubtitle, { color: palette.text.secondary }]}>
            {emptyHint}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.list, { maxHeight }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {results.map((result) => (
            <View key={result.id} style={styles.cardWrapper}>
              <PathResultCard
                title={result.title}
                description={result.description}
                tags={result.tags}
                selected={selectedResultId === result.id}
                actionLabel={actionLabel}
                onActionPress={() => onActionPress?.(result)}
                onPress={() => onSelectResult?.(result)}
              />
            </View>
          ))}
        </ScrollView>
      )}
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(12),
    gap: verticalScale(6),
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
  },
})
