import { StyleSheet } from "react-native"
import { scale, verticalScale, moderateScale } from "@/utils/layout"

export { scale, verticalScale, moderateScale } from "@/utils/layout"

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  roundedTopXL: {
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
  },
  horizontalPadding: {
    paddingHorizontal: scale(24),
  },
})

export const spacingStyles = StyleSheet.create({
  xs: {
    height: verticalScale(8),
  },
  sm: {
    height: verticalScale(12),
  },
  md: {
    height: verticalScale(16),
  },
  lg: {
    height: verticalScale(24),
  },
  xl: {
    height: verticalScale(32),
  },
})

export const radius = {
  full: 9999,
  pill: 9999,
  xxxl: moderateScale(80),
  xxl: moderateScale(40),
  xl: scale(32),
  lg: scale(24),
  md: scale(16),
  sm: scale(12),
  xs: scale(8),
}
