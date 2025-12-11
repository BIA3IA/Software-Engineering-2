import { StyleSheet } from "react-native"
import { moderateScale } from "@/theme/layout"

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
  bodyBold: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  caption: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
})
