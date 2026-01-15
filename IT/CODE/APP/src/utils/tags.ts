import Colors from "@/constants/Colors"

export function buildStatusTag(
    status: string | null | undefined,
    palette: typeof Colors.light
) {
    if (!status) return null
    const normalized = status.toUpperCase()

    if (normalized === "OPTIMAL") {
        return { label: "Optimal", color: palette.accent.green.surface, textColor: palette.accent.green.base }
    }
    if (normalized === "MEDIUM") {
        return { label: "Medium", color: palette.accent.blue.surface, textColor: palette.accent.blue.base }
    }
    if (normalized === "SUFFICIENT") {
        return { label: "Sufficient", color: palette.accent.orange.surface, textColor: palette.accent.orange.base }
    }
    if (normalized === "REQUIRES_MAINTENANCE") {
        return { label: "Maintenance", color: palette.accent.red.surface, textColor: palette.accent.red.base }
    }

    return null
}
