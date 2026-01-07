import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { scale, verticalScale, radius } from "@/theme/layout"
import { textStyles } from "@/theme/typography"

type MetricPillProps = {
    icon?: React.ReactNode
    value: string
    backgroundColor?: string,
    textColor?: string,
}

export function MetricPill({ icon, value, backgroundColor, textColor }: MetricPillProps) {
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]

    const bg = backgroundColor ?? palette.surface.accent
    const contentColor = textColor ?? palette.text.primary

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            {icon && <View style={styles.icon}>{icon}</View>}

            <View style={styles.texts}>
                <Text
                    style={[
                        textStyles.bodySmall,
                        { color: contentColor },
                    ]}
                >
                    {value}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        borderRadius: radius.full,
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(4),
        alignItems: "center",
    },
    icon: {
        marginRight: scale(6),
    },
    texts: {
        flexDirection: "column",
    },
})
