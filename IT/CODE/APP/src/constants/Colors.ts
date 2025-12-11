const brand = {
  primary: "#0ea5e9",
  primaryLight: "#38bdf8",
  primaryDark: "#0284c7",
  primaryDarker: "#0369a1",
}

const neutral = {
  50:  "#f8fafc",
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

const feedback = {
  success: "#22c55e",
  warning: "#eab308",
  destructive: "#ef4444",
}

export default {
  light: {
    textPrimary: neutral[900],
    textSecondary: neutral[600],
    textTertiary: neutral[500],
    textInverse: "#ffffff",
    textAccent: brand.primary,

    titleColor: "#ffffff",
    subtitleColor: "#e5f1ff",

    bgPrimary: "#ffffff",
    bgSecondary: neutral[50],
    bgElevated: "#ffffff",
    bgAccent: brand.primaryLight,

    primary: brand.primary,
    primaryLight: brand.primaryLight,
    primaryDark: brand.primaryDark,
    primaryDarker: brand.primaryDarker,

    gradientStart: brand.primaryLight,
    gradientEnd: brand.primaryDarker,

    cardBg: "#ffffff",
    cardBorder: neutral[200],
    cardText: neutral[900],

    border: "rgba(0,0,0,0.1)",

    inputBg: neutral[100],
    inputText: neutral[900],
    inputPlaceholder: neutral[500],
    inputBorder: neutral[300],

    buttonPrimaryBg: brand.primary,
    buttonPrimaryText: "#ffffff",
    buttonSecondaryBg: "#ffffff",
    buttonSecondaryBorder: neutral[300],
    buttonSecondaryText: brand.primary,
    buttonOutlineBorder: "#ffffff",
    buttonOutlineText: "#ffffff",

    success: feedback.success,
    warning: feedback.warning,
    destructive: feedback.destructive,

    muted: neutral[300],
    mutedBg: neutral[100],
    accent: brand.primary,
  },

  dark: {
    textPrimary: "#ffffff",
    textSecondary: neutral[300],
    textTertiary: neutral[500],
    textInverse: neutral[900],
    textAccent: brand.primaryLight,

    titleColor: "#ffffff",
    subtitleColor: "#e5f1ff",

    bgPrimary: neutral[950],
    bgSecondary: neutral[900],
    bgElevated: neutral[800],
    bgAccent: brand.primaryDark,

    primary: brand.primary,
    primaryLight: brand.primaryLight,
    primaryDark: brand.primaryDark,
    primaryDarker: brand.primaryDarker,

    gradientStart: brand.primaryDark,
    gradientEnd: neutral[950],

    cardBg: neutral[900],
    cardBorder: neutral[700],
    cardText: "#ffffff",

    border: "rgba(255,255,255,0.12)",

    inputBg: neutral[800],
    inputText: "#ffffff",
    inputPlaceholder: neutral[500],
    inputBorder: neutral[700],

    buttonPrimaryBg: brand.primary,
    buttonPrimaryText: "#ffffff",
    buttonSecondaryBg: "#ffffff",
    buttonSecondaryBorder: neutral[600],
    buttonSecondaryText: brand.primary,
    buttonOutlineBorder: "#ffffff",
    buttonOutlineText: "#ffffff",

    success: feedback.success,
    warning: feedback.warning,
    destructive: feedback.destructive,

    muted: neutral[700],
    mutedBg: neutral[900],
    accent: brand.primaryLight,
  },
}
