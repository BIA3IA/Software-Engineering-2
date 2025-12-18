import React from "react"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { Map, Bike, Route, User, Lock } from "lucide-react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuthStore } from "@/auth/storage"
import { scale, verticalScale, radius } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"

type BottomNavProps = {
    onRequireLogin?: () => void
}

export function BottomNav({ onRequireLogin }: BottomNavProps) {
    const router = useRouter()
    const pathname = usePathname()
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]
    const user = useAuthStore((s) => s.user)
    const isGuest = user?.id === "guest"

    function go(to: string, needsAuth?: boolean) {
        if (needsAuth && isGuest) {
            onRequireLogin?.()
            return
        }
        if (pathname === to) return
        router.replace(to as any)
    }

    return (
        <View style={[styles.container, { backgroundColor: palette.surface.accent, shadowColor: palette.border.muted }]}>
            <NavItem
                icon={Map}
                label="Home"
                active={pathname === "/home"}
                disabled={false}
                onPress={() => go("/home", false)}
                palette={palette}
            />

            <NavItem
                icon={Bike}
                label="Trips"
                active={pathname === "/trips"}
                disabled={isGuest}
                onPress={() => go("/trips", true)}
                palette={palette}
            />

            <NavItem
                icon={Route}
                label="Paths"
                active={pathname === "/paths"}
                disabled={isGuest}
                onPress={() => go("/paths", true)}
                palette={palette}
            />

            <NavItem
                icon={User}
                label="Profile"
                active={pathname === "/profile"}
                disabled={isGuest}
                onPress={() => go("/profile", true)}
                palette={palette}
            />
        </View>
    )
}

type NavItemProps = {
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
    label: string
    active?: boolean
    disabled?: boolean
    onPress: () => void
    palette: (typeof Colors)["light"]
}

function NavItem({ icon: Icon, label, active, disabled, onPress, palette }: NavItemProps) {
    const baseColor = active ? palette.text.onAccent : palette.text.onAccentMuted
    const isDimmed = disabled || !active
    const iconSize = iconSizes.lg
    const lockSize = iconSizes.xs

    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label} tab`}
            accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(active) }}
            style={[styles.item, isDimmed && styles.dimmed]}
            activeOpacity={0.8}
            testID={`nav-${label.toLowerCase()}`}
        >
            <View
                style={[
                    styles.iconWrapper,
                ]}
            >
                <Icon size={iconSize} color={baseColor} strokeWidth={2} />

                {disabled && (
                    <View
                        style={[
                            styles.lockBadge,
                        ]}
                    >
                        <Lock
                            size={lockSize}
                            color={palette.text.onAccentMuted}
                            strokeWidth={2}
                        />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        height: verticalScale(60),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: scale(22),
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 30,
        elevation: 12,
    },
    item: {
        flex: 1,
        alignItems: "center",
    },
    dimmed: {
        opacity: 0.55,
    },
    iconWrapper: {
        width: scale(48),
        height: scale(48),
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    lockBadge: {
        position: "absolute",
        top: -verticalScale(4),
        right: -scale(2),
        width: scale(20),
        height: scale(20),
        borderRadius: radius.sm,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0,
    },
})
