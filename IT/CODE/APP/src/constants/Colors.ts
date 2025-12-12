import { green50, purple50, red50 } from "react-native-paper/lib/typescript/styles/themes/v2/colors"

const brand = {
  primary: "#0ea5e9",
  primaryLight: "#38bdf8",
  primaryDark: "#0284c7",
  primaryDarker: "#0369a1",
  primarySoft: "#e0f2fe",
  primarySofter: "#f0f9ff",
}

const neutral = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617",
}

const white = "#ffffff"

const feedback = {
  success: "#22c55e",
  warning: "#eab308",
  destructive: "#ef4444",
}

const colors = {

  green50: "#ecfdf5",
  green100: "#d1fae5",
  green400: "#34d399",
  green700: "#047857",

  purple50: "#f5f3ff",
  purple100: "#ede9fe",
  purple400: "#a78bfa",
  purple700: "#7c3aed",

  orange50: "#fff7ed",
  orange100: "#ffedd5",
  orange400: "#fbbf24",
  orange700: "#b45309",

  red50: "#fef2f2",
  red100: "#fee2e2",
  red400: "#f87171",
  red700: "#b91c1c",
}

export default {
  light: {
    textPrimary: neutral[900],
    textSecondary: neutral[500],
    textTertiary: neutral[400],
    textInverse: white,
    textAccent: brand.primary,

    titleColor: white,
    subtitleColor: "#e5f1ff",

    navItemColor: white,
    disabledNavItemColor: neutral[100],

    bgPrimary: white,
    bgSecondary: neutral[50],
    bgElevated: brand.primarySofter,
    bgAccent: brand.primary,

    primary: brand.primary,
    primaryLight: brand.primaryLight,
    primaryDark: brand.primaryDark,
    primaryDarker: brand.primaryDarker,
    primarySoft: brand.primarySoft,

    purpleSoft: colors.purple50,
    purple: colors.purple400,
    purpleDark: colors.purple700,

    greenSoft: colors.green50,
    green: colors.green400,
    greenDark: colors.green700,

    orangeSoft: colors.orange50,
    orange: colors.orange400,
    orangeDark: colors.orange700,

    redSoft: colors.red50,
    red: colors.red400,
    redDark: colors.red700,

    gradientStart: brand.primaryLight,
    gradientEnd: brand.primaryDarker,

    cardBg: white,
    cardBorder: neutral[200],
    cardText: neutral[900],

    border: "rgba(0,0,0,0.1)",

    inputBg: neutral[50],
    inputText: neutral[900],
    inputPlaceholder: neutral[400],
    inputBorder: neutral[200],

    buttonPrimaryBg: brand.primary,
    buttonPrimaryText: white,
    buttonSecondaryBg: white,
    buttonSecondaryBorder: brand.primary,
    buttonSecondaryText: brand.primary,
    buttonOutlineBorder: white,
    buttonOutlineText: white,
    buttonDestructiveBg: feedback.destructive,
    buttonDestructiveText: white,

    success: feedback.success,
    warning: feedback.warning,
    destructive: feedback.destructive,

    muted: neutral[200],
    mutedBg: neutral[400],
    accent: brand.primary,
  },

  dark: {
    textPrimary: white,
    textSecondary: neutral[300],
    textTertiary: neutral[500],
    textInverse: neutral[900],
    textAccent: brand.primaryLight,

    titleColor: white,
    subtitleColor: "#e5f1ff",

    navItemColor: white,
    disabledNavItemColor: neutral[100],

    bgPrimary: neutral[800],
    bgSecondary: neutral[700],
    bgElevated: neutral[600],
    bgAccent: brand.primaryDark,

    primary: brand.primary,
    primaryLight: brand.primaryLight,
    primaryDark: brand.primaryDark,
    primaryDarker: brand.primaryDarker,
    primarySoft: brand.primarySoft,

    purpleSoft: colors.purple50,
    purple: colors.purple400,
    purpleDark: colors.purple700,

    greenSoft: colors.green50,
    green: colors.green400,
    greenDark: colors.green700,

    orangeSoft: colors.orange50,
    orange: colors.orange400,
    orangeDark: colors.orange700,

    redSoft: colors.red50,
    red: colors.red400,
    redDark: colors.red700,

    gradientStart: brand.primaryDark,
    gradientEnd: neutral[950],

    cardBg: neutral[700],
    cardBorder: neutral[600],
    cardText: white,

    border: "rgba(255,255,255,0.12)",

    inputBg: neutral[800],
    inputText: white,
    inputPlaceholder: neutral[500],
    inputBorder: neutral[700],

    buttonPrimaryBg: brand.primary,
    buttonPrimaryText: white,
    buttonSecondaryBg: white,
    buttonSecondaryBorder: brand.primary,
    buttonSecondaryText: brand.primary,
    buttonOutlineBorder: white,
    buttonOutlineText: white,
    buttonDestructiveBg: feedback.destructive,
    buttonDestructiveText: white,

    success: feedback.success,
    warning: feedback.warning,
    destructive: feedback.destructive,

    muted: neutral[700],
    mutedBg: neutral[800],
    accent: brand.primaryLight,
  },
}
