import React from "react"
import { Modal, View, Text, StyleSheet, Pressable } from "react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { radius, scale, verticalScale } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { AlertTriangle } from "lucide-react-native"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { SelectField } from "@/components/ui/SelectField"
import { AppButton } from "@/components/ui/AppButton"
import { ISSUE_CONDITION_OPTIONS, OBSTACLE_TYPE_OPTIONS } from "@/utils/reportOptions"

type ReportIssueModalProps = {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: { condition: string; obstacle: string }) => void
  submitting?: boolean
}

export function ReportIssueModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
}: ReportIssueModalProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconBackground =
    scheme === "dark" ? palette.status.danger : palette.accent.red.surface
  const iconColor = scheme === "dark" ? palette.overlay.iconOnDark : palette.status.danger

  const [conditionKey, setConditionKey] = React.useState(ISSUE_CONDITION_OPTIONS[0]?.key ?? "")
  const [obstacleKey, setObstacleKey] = React.useState(OBSTACLE_TYPE_OPTIONS[0]?.key ?? "")
  const [activeSelect, setActiveSelect] = React.useState<"condition" | "obstacle" | null>(null)
  const [overlayAnchor, setOverlayAnchor] = React.useState<{ top: number; right: number }>({
    top: verticalScale(120),
    right: scale(16),
  })
  const [overlayWidth, setOverlayWidth] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    if (ISSUE_CONDITION_OPTIONS.length && !ISSUE_CONDITION_OPTIONS.find((o) => o.key === conditionKey)) {
      setConditionKey(ISSUE_CONDITION_OPTIONS[0]?.key ?? "")
    }
  }, [conditionKey])

  React.useEffect(() => {
    if (OBSTACLE_TYPE_OPTIONS.length && !OBSTACLE_TYPE_OPTIONS.find((o) => o.key === obstacleKey)) {
      setObstacleKey(OBSTACLE_TYPE_OPTIONS[0]?.key ?? "")
    }
  }, [obstacleKey])

  function handleSubmit() {
    if (!conditionKey || !obstacleKey) return
    onSubmit({ condition: conditionKey, obstacle: obstacleKey })
  }

  function handleOpenSelect(
    field: "condition" | "obstacle",
    anchor: { top: number; right: number; width: number }
  ) {
    setActiveSelect(field)
    setOverlayAnchor({ top: anchor.top, right: anchor.right })
    setOverlayWidth(anchor.width)
  }

  function handleSelectOption(key: string) {
    if (activeSelect === "condition") {
      setConditionKey(key)
    } else if (activeSelect === "obstacle") {
      setObstacleKey(key)
    }
    setActiveSelect(null)
  }

  function closeOverlay() {
    setActiveSelect(null)
  }

  const conditionLabel = ISSUE_CONDITION_OPTIONS.find((o) => o.key === conditionKey)?.label ?? "Select option"
  const obstacleLabel = OBSTACLE_TYPE_OPTIONS.find((o) => o.key === obstacleKey)?.label ?? "Select option"

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: palette.overlay.scrim }]}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface.card,
                shadowColor: palette.border.muted,
              },
            ]}
          >

            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: iconBackground },
              ]}
            >
              <AlertTriangle size={iconSizes.xl} color={iconColor} strokeWidth={2.2} />
            </View>

            <Text style={[textStyles.screenTitle, styles.title, { color: palette.status.danger }]}>
              Report an Issue
            </Text>

            <Text style={[textStyles.body, styles.subtitle, { color: palette.text.secondary }]}>
              Tell us what you found on the path so other riders stay safe.
            </Text>

            <SelectField
              label="Path Condition"
              valueLabel={conditionLabel}
              onOpen={(anchor) => handleOpenSelect("condition", anchor)}
              active={activeSelect === "condition"}
            />

            <SelectField
              label="Obstacle Type"
              valueLabel={obstacleLabel}
              onOpen={(anchor) => handleOpenSelect("obstacle", anchor)}
              active={activeSelect === "obstacle"}
            />

            <AppButton
              title={submitting ? "Submitting..." : "Submit Report"}
              onPress={handleSubmit}
              loading={submitting}
              buttonColor={palette.status.danger}
              style={[
                styles.submitButton,
                { shadowColor: palette.border.muted },
              ]}
              contentStyle={styles.submitButtonContent}
            />
          </View>
        </View>
      </View>
      {!!activeSelect && (
        <SelectionOverlay
          visible
          options={
            activeSelect === "condition"
              ? ISSUE_CONDITION_OPTIONS
              : activeSelect === "obstacle"
                ? OBSTACLE_TYPE_OPTIONS
                : []
          }
          selectedKey={
            activeSelect === "condition"
              ? conditionKey
              : activeSelect === "obstacle"
                ? obstacleKey
                : undefined
          }
          onClose={closeOverlay}
          onSelect={(key) => handleSelectOption(key)}
          absoluteTop={overlayAnchor.top}
          rightOffset={overlayAnchor.right}
          width={overlayWidth}
        />
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: verticalScale(40),
  },
  card: {
    width: "92%",
    borderRadius: radius.xl,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(24),
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 14,
    gap: verticalScale(14),
  },
  iconWrapper: {
    alignSelf: "center",
    width: scale(80),
    height: scale(80),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: verticalScale(6),
  },
  submitButton: {
    marginTop: verticalScale(20),
    borderRadius: radius.full,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: radius.xl,
    elevation: 8,
  },
  submitButtonContent: {
    height: verticalScale(48),
  },
})
