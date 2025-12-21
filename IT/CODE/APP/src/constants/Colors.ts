const brand = {
  base: "#0ea5e9",
  light: "#38bdf8",
  dark: "#0284c7",
  darker: "#0369a1",
  surface: "#e0f2fe",
  surfaceDark: "#0b3550",
  surfaceAlt: "#f0f9ff",
  surfaceAltDark: "#1e3450ff",
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

const accents = {
  purple: {
    soft: "#f5f3ff",
    base: "#a78bfa",
    bold: "#7c3aed",
    dark: "#27204d",
  },
  green: {
    soft: "#ecfdf5",
    base: "#22c55e",
    bold: "#0d943fff",
    dark: "#0c3326",
  },
  orange: { 
    soft: "#fff7ed",
    base: "#f59e0b",
    bold: "#ff6f00ff",
    dark: "#3a2a12",
  },
  red: {
    soft: "#fef2f2",
    base: "#ef4444",
    bold: "#ff0000ff",
    dark: "#4201075e",
  },
  blue: {
    soft: "#eff6ff",
    base: "#3b82f6",
    bold: "#0043fcff",
    dark: "#10243c",
  },
}

const white = "#ffffff"

const feedback = {
  success: accents.green.bold,
  warning: accents.orange.bold,
  danger: accents.red.bold,
} 

const accentKeys = ["purple", "green", "orange", "red", "blue"] as const

function createTheme(mode: "light" | "dark") {
  const isLight = mode === "light"

  const text = {
    primary: isLight ? neutral[900] : neutral[50],
    secondary: isLight ? neutral[500] : neutral[200],
    muted: isLight ? neutral[400] : neutral[300],
    onAccent: white,
    onAccentMuted: isLight ? "#e5f1ff" : neutral[200],
    link: isLight ? brand.base : brand.light,
    disabled: isLight ? neutral[300] : neutral[500],
  }

  const surface = {
    screen: isLight ? neutral[50] : "#0b1d35ff",
    section: isLight ? white : "#1a3458ff",
    card: isLight ? white : "#2b3d55",
    elevated: isLight ? brand.surfaceAlt : brand.surfaceAltDark,
    input: isLight ? neutral[50] : "#223246",
    accent: isLight ? brand.base : brand.dark,
    muted: isLight ? neutral[200] : "#223246",
  }

  const border = {
    default: isLight ? neutral[200] : neutral[400],
    muted: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.16)",
    strong: isLight ? neutral[400] : neutral[300],
  }

  const brandTokens = {
    base: brand.base,
    light: brand.light,
    dark: brand.dark,
    darker: brand.darker,
    surface: isLight ? brand.surface : brand.surfaceDark,
  }

  const accent = accentKeys.reduce((acc, key) => {
    acc[key] = {
      surface: isLight ? accents[key].soft :  accents[key].dark,
      base: accents[key].base,
      bold: accents[key].bold,
    }
    return acc
  }, {} as Record<(typeof accentKeys)[number], { surface: string; base: string; bold: string }>)

  const input = {
    background: surface.input,
    text: isLight ? neutral[900] : neutral[50],
    placeholder: isLight ? neutral[400] : neutral[500],
    border: isLight ? neutral[200] : "rgba(255,255,255,0.2)",
  }

  const gradient = {
    from: isLight ? brand.light : brand.dark,
    to: isLight ? brand.darker : surface.screen,
  }

  const button = {
    primary: {
      bg: isLight ? brand.base : brand.dark,
      text: white,
    },
    secondary: {
      bg: isLight ? white : surface.screen,
      text: isLight ? brand.base : brand.light,
      border: isLight ? brand.base : brand.light,
    },
    outline: {
      border: isLight ? white : "rgba(255,255,255,0.22)",
      text: isLight ? white : neutral[50],
    },
    danger: {
      bg: feedback.danger,
      text: white,
    },
  }

  const status = {
    success: feedback.success,
    warning: feedback.warning,
    danger: feedback.danger,
  }

  const overlay = {
    scrim: isLight ? "rgba(15,23,42,0.45)" : "rgba(2,6,23,0.78)",
    iconOnDark: white,
  }

  return {
    text,
    surface,
    border,
    brand: brandTokens,
    accent,
    input,
    gradient,
    button,
    status,
    focus: text.link,
    overlay,
  }
}

const Colors = {
  palette: {
    neutral,
    brand,
    accents,
    feedback,
  },
  light: createTheme("light"),
  dark: createTheme("dark"),
}

export default Colors
