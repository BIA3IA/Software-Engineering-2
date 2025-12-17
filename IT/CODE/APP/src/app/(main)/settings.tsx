import React from "react"
import { ScrollView, StyleSheet, View, Text, Pressable, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme, useThemePreference, useSetThemePreference, type AppearancePreference } from "@/hooks/useColorScheme"
import { usePrivacyPreference, useSetPrivacyPreference } from "@/hooks/usePrivacyPreference"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { ChevronDown, SunMedium, Eye, Mail, LogOut, X } from "lucide-react-native"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { AppPopup } from "@/components/ui/AppPopup"
import { useRouter } from "expo-router"
import { BottomNavVisibilityContext } from "@/hooks/useBottomNavVisibility"
import { ScreenHeader } from "@/components/ScreenHeader"
import { useAuthStore } from "@/auth/storage"
import { PRIVACY_OPTIONS, type PrivacyPreference } from "@/constants/privacy"

type PickerOption = {
  key: string
  label: string
}

const APPEARANCE_OPTIONS: PickerOption[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
]

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const bottomNavVisibility = React.useContext(BottomNavVisibilityContext)
  const appearancePreference = useThemePreference()
  const setAppearancePreference = useSetThemePreference()
  const logout = useAuthStore((s) => s.logout)
  const defaultPrivacy = usePrivacyPreference()
  const setDefaultPrivacy = useSetPrivacyPreference()
  const [activePicker, setActivePicker] = React.useState<"appearance" | "privacy" | null>(null)
  const [overlayPosition, setOverlayPosition] = React.useState<{ top: number; right: number } | null>(null)
  const appearanceButtonRef = React.useRef<View | null>(null)
  const privacyButtonRef = React.useRef<View | null>(null)
  const [isLogoutPopupVisible, setLogoutPopupVisible] = React.useState(false)
  const overlayOptions = activePicker === "privacy" ? PRIVACY_OPTIONS : APPEARANCE_OPTIONS
  const selectedKey = activePicker === "privacy" ? defaultPrivacy : appearancePreference

  React.useEffect(() => {
    bottomNavVisibility?.setHidden(true)
    return () => {
      bottomNavVisibility?.setHidden(false)
    }
  }, [bottomNavVisibility])

  function openPicker(type: "appearance" | "privacy") {
    const ref = type === "appearance" ? appearanceButtonRef.current : privacyButtonRef.current
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get("window").width
        setOverlayPosition({
          top: y + height + verticalScale(6),
          right: Math.max(scale(16), screenWidth - (x + width)),
        })
        setActivePicker(type)
      })
    } else {
      setOverlayPosition(null)
      setActivePicker(type)
    }
  }

  function closePicker() {
    setActivePicker(null)
  }

  function handleSelect(optionKey: string) {
    if (activePicker === "appearance") {
      setAppearancePreference(optionKey as AppearancePreference)
    } else if (activePicker === "privacy") {
      setDefaultPrivacy(optionKey as PrivacyPreference)
    }
    closePicker()
  }

  function handleLogoutPress() {
    setLogoutPopupVisible(true)
  }

  async function handleConfirmLogout() {
    await logout()
    setLogoutPopupVisible(false)
    router.replace("/(auth)/welcome")
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bgSecondary }}
      contentContainerStyle={{ paddingBottom: verticalScale(32) + insets.bottom }}
    >
      <ScreenHeader
        title="Settings"
        subtitle="Customize your experience"
        showSortButton={false}
        trailingAccessory={
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: palette.buttonSecondaryBg, shadowColor: palette.border },
              pressed && { opacity: 0.9 },
            ]}
          >
            <X size={iconSizes.md} color={palette.buttonSecondaryText} />
          </Pressable>
        }
      />

      <View style={styles.sectionsWrapper}>
        <View style={[styles.card, { backgroundColor: palette.bgPrimary, shadowColor: palette.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBadge, { backgroundColor: `${palette.primarySoft}` }]}>
              <SunMedium size={iconSizes.md} color={palette.primaryDark} />
            </View>

            <View style={styles.cardTexts}>
              <Text style={[textStyles.bodyBold, { color: palette.primaryDark }]}>
                Appearance
              </Text>
              <Text style={[textStyles.caption, { color: palette.textSecondary }]}>
                Choose your theme
              </Text>
            </View>

            <Pressable
              ref={(node) => {
                appearanceButtonRef.current = node
              }}
              onPress={() => openPicker("appearance")}
              style={({ pressed }) => [
                styles.selectButton,
                { backgroundColor: palette.primary, borderColor: palette.primary, shadowColor: palette.border },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[textStyles.caption, styles.selectLabel, { color: palette.textInverse }]}>{APPEARANCE_OPTIONS.find((opt) => opt.key === appearancePreference)?.label}</Text>
              <ChevronDown size={iconSizes.xs} color={palette.textInverse} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.bgPrimary, shadowColor: palette.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBadge, { backgroundColor: `${palette.primarySoft}` }]}>
              <Eye size={iconSizes.md} color={palette.primaryDark} />
            </View>

            <View style={styles.cardTexts}>
              <Text style={[textStyles.bodyBold, { color: palette.primaryDark }]}>
                Default Privacy
              </Text>
              <Text style={[textStyles.caption, { color: palette.textSecondary }]}>
                For new paths you create
              </Text>
            </View>

            <Pressable
              ref={(node) => {
                privacyButtonRef.current = node
              }}
              onPress={() => openPicker("privacy")}
              style={({ pressed }) => [
                styles.selectButton,
                { backgroundColor: palette.primary, borderColor: palette.primary, shadowColor: palette.border },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[textStyles.caption, styles.selectLabel, { color: palette.textInverse }]}>{PRIVACY_OPTIONS.find((opt) => opt.key === defaultPrivacy)?.label}</Text>
              <ChevronDown size={iconSizes.xs} color={palette.textInverse} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.bgPrimary, shadowColor: palette.border }]}>
          <Pressable onPress={() => { }} style={({ pressed }) => [styles.simpleRow, pressed && { opacity: 0.85 }]}>
            <View style={[styles.iconBadge, { backgroundColor: palette.primarySoft }]}>
              <Mail size={iconSizes.md} color={palette.primary} />
            </View>
            <View style={styles.cardTexts}>
              <Text style={[textStyles.bodyBold, { color: palette.primaryDark }]}>Get Help</Text>
              <Text style={[textStyles.caption, { color: palette.textSecondary }]}>Contact support team</Text>
            </View>
          </Pressable>
        </View>

        <View style={[styles.card, styles.signOutCard, { backgroundColor: palette.redSoft, borderColor: `${palette.red}55` }]}>
          <Pressable
            onPress={handleLogoutPress}
            style={({ pressed }) => [styles.simpleRow, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.iconBadge, { backgroundColor: palette.redSoft, borderColor: palette.red, borderWidth: 1 }]}>
              <LogOut size={iconSizes.md} color={palette.red} />
            </View>
            <View style={styles.cardTexts}>
              <Text style={[textStyles.bodyBold, { color: palette.redDark }]}>Log Out</Text>
              <Text style={[textStyles.caption, { color: palette.redDark }]}>Log out of your account</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <SelectionOverlay
        visible={Boolean(activePicker)}
        options={overlayOptions}
        selectedKey={selectedKey}
        topOffset={overlayPosition?.top}
        rightOffset={overlayPosition?.right}
        onClose={closePicker}
        onSelect={handleSelect}
      />

      <AppPopup
        visible={isLogoutPopupVisible}
        title="Log Out?"
        message="Are you sure you want to log out? You'll need to sign back in to sync your rides."
        icon={<LogOut size={iconSizes.xl} color={palette.red} />}
        iconBackgroundColor={`${palette.red}22`}
        onClose={() => setLogoutPopupVisible(false)}
        primaryButton={{
          label: "Yes, Log Out",
          variant: "destructive",
          onPress: handleConfirmLogout,
        }}
        secondaryButton={{
          label: "No, Cancel",
          variant: "secondary",
          onPress: () => setLogoutPopupVisible(false),
          textColor: palette.red,
          borderColor: palette.red,
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  backButton: {
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
  sectionsWrapper: {
    marginTop: -verticalScale(40),
    paddingHorizontal: scale(20),
    gap: verticalScale(18),
  },
  card: {
    borderRadius: radius.xl,
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(14),
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: radius.xl,
    elevation: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
  },
  cardTexts: {
    flex: 1,
    gap: verticalScale(4),
  },
  iconBadge: {
    width: scale(40),
    height: scale(40),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    columnGap: scale(6),
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: radius.md,
    elevation: 4,
  },
  selectLabel: {
    textTransform: "capitalize",
  },
  simpleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
  },
  signOutCard: {
    borderWidth: 1,
  },
})
