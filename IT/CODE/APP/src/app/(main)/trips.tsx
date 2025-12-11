import React, { useState } from "react"
import { View, StyleSheet, FlatList, Text, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { TripCard, TripItem } from "@/components/TripCard"
import { textStyles } from "@/theme/typography"
import { scale, verticalScale, radius } from "@/theme/layout"
import { ArrowUpDown } from "lucide-react-native"

const MOCK_TRIPS: TripItem[] = [
  {
    id: "1",
    name: "Central Park Loop",
    distanceKm: 5.2,
    durationMin: 24,
    date: "01/12/25",
  },
  {
    id: "2",
    name: "River Trail",
    distanceKm: 8.4,
    durationMin: 38,
    date: "28/11/25",
  },
  {
    id: "3",
    name: "Downtown Express",
    distanceKm: 3.1,
    durationMin: 16,
    date: "25/11/25",
  },
]

type TripHistoryHeaderProps = {
  onSortPress: () => void
}

function TripHistoryHeader({ onSortPress }: TripHistoryHeaderProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

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
          { backgroundColor: palette.buttonSecondaryBg },
          pressed && { opacity: 0.85 },
        ]}
      >
        <ArrowUpDown size={20} color={palette.buttonSecondaryText} />
      </Pressable>
    </View>
  )
}

export default function TripHistoryScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const [expandedTripId, setExpandedTripId] = useState<string | null>(
    MOCK_TRIPS[0]?.id ?? null
  )

  function handleToggleTrip(id: string) {
    setExpandedTripId((current) => (current === id ? null : id))
  }

  function handleSortPress() {
    console.log("Sort menu")
  }

  function handleRequestDeleteTrip(id: string) {
    console.log("Request delete trip", id)
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.bgSecondary }]}>
      <TripHistoryHeader onSortPress={handleSortPress} />

      <View style={[styles.listWrapper]}>
        <FlatList
          data={MOCK_TRIPS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              isExpanded={expandedTripId === item.id}
              onToggle={() => handleToggleTrip(item.id)}
              onDeletePress={() => handleRequestDeleteTrip(item.id)}
            />
          )}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  listWrapper: {
    flex: 1,
    marginTop: -verticalScale(48),
    marginHorizontal: scale(16),
    borderRadius: radius.xl,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    overflow: "hidden",
  },
  listContent: {
    paddingBottom: verticalScale(24),
  },
})
