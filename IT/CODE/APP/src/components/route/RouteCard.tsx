import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { MetricPill } from "@/components/ui/MetricPill"
import { MapPin, Calendar, Trash2, ChevronDown, Eye, EyeOff } from "lucide-react-native"

import { RouteMap, type WeatherDetails } from "@/components/route/RouteMap"
import { PerformanceMetric } from "@/components/ui/PerformanceMetric"
import { AppButton } from "@/components/ui/AppButton"

export type LatLng = { latitude: number; longitude: number }

export type RouteItem = {
    id: string
    name: string
    distanceKm: number
    durationMin: number
    date: string
    route: LatLng[]
    reports?: Array<{ reportId: string; position: { lat: number; lng: number }; obstacleType?: string; pathStatus?: string }>
    avgSpeed: number
    maxSpeed: number
    elevation: number
    temperatureLabel?: string
    weather?: WeatherDetails
    description?: string
    visibility?: "public" | "private"
    visibilityLabel?: string
    actionLabel?: string
    onActionPress?: () => void
    showWeatherBadge?: boolean
    showDeleteAction?: boolean
    showPerformanceMetrics?: boolean
}

type RouteCardProps = {
    trip: RouteItem
    isExpanded: boolean
    onToggle: () => void
    onDeletePress: () => void
    onVisibilityPress?: () => void
    mapTitle?: string
}

export function RouteCard({
    trip,
    isExpanded,
    onToggle,
    onDeletePress,
    onVisibilityPress,
    mapTitle = "Trip Map",
}: RouteCardProps) {
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]
    const metricIconSize = iconSizes.sm
    const actionIconSize = iconSizes.lg
    const showWeatherBadge = trip.showWeatherBadge !== false
    const showDeleteAction = trip.showDeleteAction !== false
    const showPerformanceMetrics = trip.showPerformanceMetrics !== false
    const visibilityStatus = trip.visibility ?? trip.visibilityLabel?.toLowerCase()
    const isPublic = visibilityStatus === "public"
    const isPrivate = visibilityStatus === "private"
    const showVisibilityStatus = isPublic || isPrivate
    const hasActions = showVisibilityStatus || showDeleteAction
    const visibilityIconColor = isPrivate ? palette.text.secondary : palette.accent.green.base

    return (
        <View style={[styles.card, { backgroundColor: palette.surface.card, shadowColor: palette.border.muted }]}>
            <View style={styles.topRow}>
                <View style={styles.titleWrapper}>
                    <Text style={[textStyles.cardTitle, styles.title, { color: palette.text.link }]} numberOfLines={1}>
                        {trip.name}
                    </Text>
                    {trip.description && (
                        <Text
                            style={[textStyles.bodySmall, styles.description, { color: palette.text.secondary }]}
                            numberOfLines={2}
                        >
                            {trip.description}
                        </Text>
                    )}
                </View>

                <Pressable onPress={onToggle} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
                    <ChevronDown
                        size={actionIconSize}
                        color={palette.text.secondary}
                        style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
                    />
                </Pressable>
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.pillsRow}>
                    <MetricPill
                        icon={<MapPin size={metricIconSize} color={palette.accent.blue.base} />}
                        value={`${trip.distanceKm.toFixed(1)} km`}
                        backgroundColor={palette.accent.blue.surface}
                        textColor={palette.accent.blue.base}
                    />
                    <MetricPill
                        icon={<Calendar size={metricIconSize} color={palette.accent.purple.base} />}
                        value={trip.date}
                        backgroundColor={palette.accent.purple.surface}
                        textColor={palette.accent.purple.base}
                    />
                </View>

                {hasActions && (
                    <View style={styles.actionsRow}>
                        {showVisibilityStatus && (
                            <Pressable
                                disabled={!onVisibilityPress}
                                onPress={onVisibilityPress}
                                style={({ pressed }) => [
                                    styles.visibilityIcon,
                                    !onVisibilityPress && styles.visibilityIconDisabled,
                                    pressed && onVisibilityPress && { opacity: 0.85 },
                                ]}
                            >
                                {isPrivate ? (
                                    <EyeOff size={actionIconSize} color={visibilityIconColor} />
                                ) : (
                                    <Eye size={actionIconSize} color={visibilityIconColor} />
                                )}
                            </Pressable>
                        )}

                        {showDeleteAction && (
                            <Pressable onPress={onDeletePress} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
                                <Trash2 size={actionIconSize} color={palette.status.danger} />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <RouteMap
                        route={trip.route}
                        reports={trip.reports}
                        temperatureLabel={trip.temperatureLabel}
                        weather={trip.weather}
                        showWeatherBadge={showWeatherBadge}
                        title={mapTitle}
                    />

                    {showPerformanceMetrics && (
                        <PerformanceMetric
                            duration={`${trip.durationMin} min`}
                            avgSpeed={`${trip.avgSpeed.toFixed(1)} km/h`}
                            maxSpeed={`${trip.maxSpeed.toFixed(1)} km/h`}
                            elevation={`${trip.elevation} m`}
                        />
                    )}

                    {trip.actionLabel && (
                        <View style={styles.actionButtonWrapper}>
                            <AppButton
                                title={trip.actionLabel}
                                variant="primary"
                                onPress={trip.onActionPress}
                                style={styles.actionButton}
                                contentStyle={styles.actionButtonContent}
                            />
                        </View>
                    )}
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
    titleWrapper: {
        flex: 1,
        marginRight: scale(12),
    },
    title: {
        marginBottom: verticalScale(4),
    },
    description: {
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
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        columnGap: scale(10),
        marginLeft: scale(8),
        flexShrink: 0,
    },
    iconButton: {
        paddingHorizontal: scale(6),
        paddingVertical: verticalScale(4),
        borderRadius: radius.md,
        alignSelf: "flex-start",
    },
    visibilityIcon: {
        paddingHorizontal: scale(4),
        paddingVertical: verticalScale(2),
        borderRadius: radius.md,
    },
    visibilityIconDisabled: {
        opacity: 0.5,
    },
    expandedContent: {
        marginTop: verticalScale(12),
        gap: verticalScale(12),
    },
    actionButtonWrapper: {
        marginTop: verticalScale(4),
    },
    actionButton: {
        height: verticalScale(44),
        borderRadius: radius.full,
    },
    actionButtonContent: {
        height: verticalScale(44),
    },
})
