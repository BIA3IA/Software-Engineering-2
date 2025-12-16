import { StyleSheet } from "react-native"
import { moderateScale, scale } from "@/theme/layout"

export const textStyles = StyleSheet.create({
  heroTitle: {
    fontSize: moderateScale(36),
    fontWeight: "800",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.95,
  },
  screenTitle: {
    fontSize: moderateScale(24),
    fontWeight: "800",
  },
  screenSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  formLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  body: {
    fontSize: moderateScale(16),
    fontWeight: "400",
  },
  bodyBold: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  bodySmall: {
    fontSize: moderateScale(14),
    fontWeight: "400",
  },
  caption: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
})

export const iconSizes = {
  xs: scale(14),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(32),
  hero: scale(120),
}
