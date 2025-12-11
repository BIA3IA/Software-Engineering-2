import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles } from "@/theme/typography"
import { scale, verticalScale } from "@/theme/layout"
import { MetricPill } from "@/components/ui/MetricPill"
import { MapPin, Clock, Calendar, Trash2, ChevronDown } from "lucide-react-native"

export type TripItem = {
    id: string
    name: string
    distanceKm: number
    durationMin: number
    date: string
    // poi aggiungeremo tutte le altre metriche
}

type TripCardProps = {
    trip: TripItem
    isExpanded: boolean
    onToggle: () => void
    onDeletePress: () => void
}

export function TripCard({
    trip,
    isExpanded,
    onToggle,
    onDeletePress,
}: TripCardProps) {
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: palette.bgPrimary, shadowColor: palette.border },
            ]}
        >
            <View style={styles.headerRow}>
                <View style={styles.titleAndPills}>
                    <Text
                        style={[
                            textStyles.cardTitle,
                            styles.title,
                            { color: palette.textAccent },
                        ]}
                        numberOfLines={1}
                    >
                        {trip.name}
                    </Text>

                    <View style={styles.pillsRow}>
                        <MetricPill
                            icon={<MapPin size={16} color={palette.primaryDark} />}
                            value={`${trip.distanceKm.toFixed(1)} km`}
                            backgroundColor={palette.primarySoft}
                            textColor={palette.primaryDark}
                        />
                        <MetricPill
                            icon={<Clock size={16} color={palette.purpleDark} />}
                            value={`${trip.durationMin} min`}
                            backgroundColor={palette.purpleSoft}
                            textColor={palette.purpleDark}
                        />
                        <MetricPill
                            icon={<Calendar size={16} color={palette.greenDark} />}
                            value={trip.date}
                            backgroundColor={palette.greenSoft}
                            textColor={palette.greenDark}
                        />
                    </View>
                </View>

                <View style={styles.actions}>
                    <Pressable
                        onPress={onDeletePress}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Trash2 size={22} color="#ef4444" />
                    </Pressable>

                    <Pressable
                        onPress={onToggle}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <ChevronDown
                            size={22}
                            color={palette.textSecondary}
                            style={{
                                transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                            }}
                        />
                    </Pressable>
                </View>
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    {/* TripMapSection, TripSummarySection, PerformanceMetricsSection */}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(12),
        marginBottom: verticalScale(12),
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 4,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    titleAndPills: {
        flex: 1,
    },
    title: {
        marginBottom: verticalScale(6),
    },
    pillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    actions: {
        marginLeft: scale(8),
        alignItems: "flex-end",
    },
    iconButton: {
        paddingHorizontal: scale(6),
        paddingVertical: verticalScale(4),
    },
    expandedContent: {
        marginTop: verticalScale(12),
    },
})
