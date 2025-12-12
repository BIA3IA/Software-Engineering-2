import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { MetricPill } from "@/components/ui/MetricPill"
import { MapPin, Calendar, Trash2, ChevronDown } from "lucide-react-native"

import { TripMap, type WeatherDetails } from "@/components/TripMap"
import { TripSummary } from "@/components/TripSummary"
import { PerformanceMetric } from "@/components/PerformanceMetric"

export type LatLng = { latitude: number; longitude: number }

export type TripItem = {
    id: string
    name: string
    distanceKm: number
    durationMin: number
    date: string
    route: LatLng[]
    avgSpeed: number
    maxSpeed: number
    elevation: number
    temperatureLabel?: string
    weather?: WeatherDetails
}

type TripCardProps = {
    trip: TripItem
    isExpanded: boolean
    onToggle: () => void
    onDeletePress: () => void
}

export function TripCard({ trip, isExpanded, onToggle, onDeletePress }: TripCardProps) {
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]
    const metricIconSize = iconSizes.sm
    const actionIconSize = iconSizes.lg

    return (
        <View style={[styles.card, { backgroundColor: palette.bgPrimary, shadowColor: palette.border }]}>
            <View style={styles.topRow}>
                <Text style={[textStyles.cardTitle, styles.title, { color: palette.textAccent }]} numberOfLines={1}>
                    {trip.name}
                </Text>

                <Pressable onPress={onToggle} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
                    <ChevronDown
                        size={actionIconSize}
                        color={palette.textSecondary}
                        style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
                    />
                </Pressable>
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.pillsRow}>
                    <MetricPill
                        icon={<MapPin size={metricIconSize} color={palette.primaryDark} />}
                        value={`${trip.distanceKm.toFixed(1)} km`}
                        backgroundColor={palette.primarySoft}
                        textColor={palette.primaryDark}
                    />
                    <MetricPill
                        icon={<Calendar size={metricIconSize} color={palette.purpleDark} />}
                        value={trip.date}
                        backgroundColor={palette.purpleSoft}
                        textColor={palette.purpleDark}
                    />
                </View>

                <Pressable onPress={onDeletePress} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
                    <Trash2 size={actionIconSize} color={palette.destructive} />
                </Pressable>
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <TripMap
                        route={trip.route}
                        temperatureLabel={trip.temperatureLabel}
                        weather={trip.weather}
                    />

                    {/* <TripSummary
                        date={trip.date}
                        durationLabel={`${trip.durationMin} min`}
                        pathName={trip.name}
                    /> */}

                    <PerformanceMetric
                        duration={`${trip.durationMin} min`}
                        avgSpeed={`${trip.avgSpeed.toFixed(1)} km/h`}
                        maxSpeed={`${trip.maxSpeed.toFixed(1)} km/h`}
                        elevation={`${trip.elevation} m`}
                    />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(14),
        marginBottom: verticalScale(14),
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: radius.lg,
        elevation: 4,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        marginBottom: verticalScale(6),
    },
    metricsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: verticalScale(2),
    },
    pillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: scale(8),
        flex: 1,
    },
    iconButton: {
        paddingHorizontal: scale(6),
        paddingVertical: verticalScale(4),
    },
    expandedContent: {
        marginTop: verticalScale(12),
    },
})
