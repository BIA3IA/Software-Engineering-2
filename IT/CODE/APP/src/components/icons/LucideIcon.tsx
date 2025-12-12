import React from "react"
import type { ComponentType } from "react"
import { icons } from "lucide-react-native"
import { iconSizes } from "@/theme/typography"

type IconRegistry = typeof icons
type LucideIconName = keyof IconRegistry

const DEFAULT_ICON: LucideIconName = "Circle"

const aliasMap: Record<string, string> = {
  bicycle: "Bike",
  bike: "Bike",
  map: "Map",
  location: "MapPin",
  "map-marker": "MapPin",
  "map-marker-outline": "MapPin",
  "map-marker-radius": "MapPin",
  "map-marker-path": "MapPinned",
  profile: "User",
  user: "User",
  account: "User",
  settings: "Settings",
  gear: "Settings",
  home: "Home",
  house: "Home",
  dashboard: "LayoutDashboard",
  stats: "ChartSpline",
  chart: "ChartSpline",
  search: "Search",
  magnify: "Search",
  alert: "Bell",
  bell: "Bell",
  info: "Info",
  infooutline: "Info",
  warning: "Triangle",
  plus: "Plus",
  add: "Plus",
  minus: "Minus",
  remove: "Minus",
  logout: "LogOut",
  login: "LogIn",
}

type LucideIconProps = {
  name?: string
  color?: string
  size?: number
  strokeWidth?: number
}

function toPascalCase(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+(\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\s+/g, "")
}

function resolveIcon(name?: string): ComponentType<{ color?: string; size?: number; strokeWidth?: number }> {
  if (!name) {
    return icons[DEFAULT_ICON]
  }

  const exact = icons[name as LucideIconName]
  if (exact) {
    return exact
  }

  const normalizedKey = aliasMap[name.toLowerCase()]
  if (normalizedKey && icons[normalizedKey as LucideIconName]) {
    return icons[normalizedKey as LucideIconName]
  }

  const pascalCaseName = toPascalCase(name)
  const pascalIcon = icons[pascalCaseName as LucideIconName]
  if (pascalIcon) {
    return pascalIcon
  }

  return icons[DEFAULT_ICON]
}

export function LucideIcon({ name, color = "currentColor", size = iconSizes.lg, strokeWidth = 2 }: LucideIconProps) {
  const IconComponent = resolveIcon(name)
  return <IconComponent color={color} size={size} strokeWidth={strokeWidth} />
}
