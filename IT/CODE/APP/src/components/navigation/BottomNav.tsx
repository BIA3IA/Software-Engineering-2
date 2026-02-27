import React from "react"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Map, Bike, Route, User, Lock } from "lucide-react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuthStore } from "@/auth/storage"
import { controlSizes, radius, spacing, verticalScale } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"

type BottomNavProps = {
    onRequireLogin?: () => void
}

export function BottomNav({ onRequireLogin }: BottomNavProps) {
    const router = useRouter()
    const pathname = usePathname()
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]
    const insets = useSafeAreaInsets()
    const user = useAuthStore((s) => s.user)
    const isGuest = !user || user.id === "guest"
    const bottomInset = insets.bottom > 0 ? Math.min(insets.bottom, verticalScale(35)) : 0

    function go(to: string, needsAuth?: boolean) {
        if (needsAuth && isGuest) {
            onRequireLogin?.()
            return
        }
        if (pathname === to) return
        router.replace(to as any)
    }

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: palette.surface.accent,
                    shadowColor: palette.border.muted,
                    paddingBottom: bottomInset,
                    height: verticalScale(60) + bottomInset,
                },
            ]}
        >
            <NavItem
                icon={Map}
                label="Home"
                active={pathname === "/home"}
                onPress={() => go("/home", false)}
                palette={palette}
                isGuest={false}
            />

            <NavItem
                icon={Bike}
                label="Trips"
                active={pathname === "/trips"}
                onPress={() => go("/trips", true)}
                palette={palette}
                isGuest={isGuest}
            />

            <NavItem
                icon={Route}
                label="Paths"
                active={pathname === "/paths"}
                onPress={() => go("/paths", true)}
                palette={palette}
                isGuest={isGuest}
            />

            <NavItem
                icon={User}
                label="Profile"
                active={pathname === "/profile"}
                onPress={() => go("/profile", true)}
                palette={palette}
                isGuest={isGuest}
            />
        </View>
    )
}

type NavItemProps = {
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
    label: string
    active?: boolean
    onPress: () => void
    palette: (typeof Colors)["light"]
    isGuest: boolean
}

function NavItem({ icon: Icon, label, active, onPress, palette, isGuest }: NavItemProps) {
    const baseColor = active ? palette.text.onAccent : palette.text.onAccentMuted
    const isDimmed = isGuest || !active
    const iconSize = iconSizes.lg
    const lockSize = iconSizes.xs

    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityState={{ selected: Boolean(active) }}
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

                {isGuest && (
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
        paddingHorizontal: spacing.lg,
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
        width: controlSizes.navItem,
        height: controlSizes.navItem,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    lockBadge: {
        position: "absolute",
        top: -4,
        right: -2,
        width: controlSizes.compactBadge,
        height: controlSizes.compactBadge,
        borderRadius: radius.sm,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0,
    },
})
