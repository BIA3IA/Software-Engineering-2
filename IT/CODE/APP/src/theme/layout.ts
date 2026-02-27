import { StyleSheet } from "react-native"
import { scale, verticalScale, moderateScale } from "@/utils/layout"

export { scale, verticalScale, moderateScale } from "@/utils/layout"

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
}

export const controlSizes = {
  buttonHeight: 50,
  inputHeight: 52,
  iconButton: 36,
  navItem: 48,
  badge: 40,
  compactBadge: 20,
  compactFab: 44,
  fab: 56,
}

export const floatingMetrics = {
  compactControlRight: scale(20),
  fabRight: scale(24),
  actionButtonInsetY: verticalScale(14),
}

export const screenMetrics = {
  screenPaddingX: spacing.lg,
  sectionGap: spacing.md,
}

export const cardMetrics = {
  cardPaddingX: spacing.md,
  cardPaddingY: spacing.md,
  cardPaddingCompactY: spacing.sm,
  inlineGap: spacing.sm,
  chipGap: spacing.xs,
}

export const overlayMetrics = {
  modalWidth: "92%" as const,
  sheetWidth: "90%" as const,
  menuWidth: 190,
  modalTopInset: spacing.xxl,
  modalPaddingTop: 18,
  modalPaddingBottom: spacing.lg,
  modalIconSize: 80,
}

export const heroMetrics = {
  headerPaddingTop: verticalScale(48),
  headerPaddingBottom: verticalScale(52),
  authHeaderPaddingTop: verticalScale(56),
  authHeaderPaddingBottom: verticalScale(42),
  contentOverlapMd: verticalScale(40),
  contentOverlapLg: verticalScale(48),
}

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  roundedTopXL: {
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
  },
  horizontalPadding: {
    paddingHorizontal: screenMetrics.screenPaddingX,
  },
})

export const spacingStyles = StyleSheet.create({
  xs: {
    height: spacing.xs,
  },
  sm: {
    height: spacing.sm,
  },
  md: {
    height: spacing.md,
  },
  lg: {
    height: spacing.lg,
  },
  xl: {
    height: spacing.xl,
  },
})

export const radius = {
  full: 9999,
  pill: 9999,
  xxxl: 80,
  xxl: 40,
  xl: 32,
  lg: 24,
  md: 16,
  sm: 12,
  xs: 8,
}

export const shadowStyles = {
  iconButton: {
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: radius.xl,
    elevation: 4,
  },
  modal: {
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 10,
  },
  fab: {
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
} as const
