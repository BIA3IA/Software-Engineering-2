import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { Settings, Pencil } from "lucide-react-native"

type ProfileHeroHeaderProps = {
  title?: string
  subtitle?: string
  name: string
  email: string
  initial: string
  onSettingsPress?: () => void
  onEditPress?: () => void
}

export function ProfileHeroHeader({
  title = "Profile",
  subtitle = "Your cycling journey",
  name,
  email,
  initial,
  onSettingsPress,
  onEditPress,
}: ProfileHeroHeaderProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={[styles.hero, { backgroundColor: palette.accent }] }>
      <View style={styles.titleRow}>
        <View style={styles.textBlock}>
          <Text style={[textStyles.screenTitle, styles.heroTitle, { color: palette.titleColor }]}>{title}</Text>
          <Text style={[textStyles.heroSubtitle, styles.heroSubtitleText, { color: palette.subtitleColor }]}>
            {subtitle}
          </Text>
        </View>

        <Pressable
          onPress={onSettingsPress}
          style={({ pressed }) => [
            styles.settingsBtn,
            { backgroundColor: palette.buttonSecondaryBg, shadowColor: palette.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Settings size={iconSizes.md} color={palette.buttonSecondaryText} />
        </Pressable>
      </View>

      <View style={styles.userRow}>
        <View style={[styles.avatarOuter, { backgroundColor: palette.primarySoft, borderColor: palette.primary }] }>
          <View style={[styles.avatar, { backgroundColor: palette.bgPrimary }] }>
            <Text style={[textStyles.cardTitle, { color: palette.primaryDark }]}>{initial}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[textStyles.cardTitle, { color: palette.titleColor }]}>{name}</Text>

            <Pressable
              onPress={onEditPress}
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
            >
              <Pencil size={iconSizes.sm} color={palette.titleColor} />
            </Pressable>
          </View>

          <Text style={[textStyles.caption, { color: palette.subtitleColor }]}>{email}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(48),
    paddingBottom: verticalScale(52),
    borderBottomLeftRadius: radius.xxxl,
    borderBottomRightRadius: radius.xxxl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(16),
  },
  textBlock: {
    flex: 1,
  },
  heroTitle: {
    marginBottom: verticalScale(4),
  },
  heroSubtitleText: {
    marginTop: verticalScale(2),
    textAlign: "left",
  },
  settingsBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  avatarOuter: {
    width: scale(74),
    height: scale(74),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(14),
    borderWidth: 2,
  },
  avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editBtn: {
    marginLeft: scale(8),
    padding: scale(6),
  },
})
