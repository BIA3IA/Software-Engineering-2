import React from "react"
import { Modal, View, Text, StyleSheet, Pressable, Dimensions } from "react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { radius, scale, verticalScale } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { AlertTriangle, ChevronDown } from "lucide-react-native"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"

export type ReportIssueOption = {
  key: string
  label: string
}

type ReportIssueModalProps = {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: { condition: string; obstacle: string }) => void
  conditionOptions: ReportIssueOption[]
  obstacleOptions: ReportIssueOption[]
}

export function ReportIssueModal({
  visible,
  onClose,
  onSubmit,
  conditionOptions,
  obstacleOptions,
}: ReportIssueModalProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const [conditionKey, setConditionKey] = React.useState(conditionOptions[0]?.key ?? "")
  const [obstacleKey, setObstacleKey] = React.useState(obstacleOptions[0]?.key ?? "")
  const [activeSelect, setActiveSelect] = React.useState<"condition" | "obstacle" | null>(null)
  const [overlayAnchor, setOverlayAnchor] = React.useState<{ top: number; right: number }>({
    top: verticalScale(120),
    right: scale(16),
  })
  const [overlayWidth, setOverlayWidth] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    if (conditionOptions.length && !conditionOptions.find((o) => o.key === conditionKey)) {
      setConditionKey(conditionOptions[0]?.key ?? "")
    }
  }, [conditionOptions, conditionKey])

  React.useEffect(() => {
    if (obstacleOptions.length && !obstacleOptions.find((o) => o.key === obstacleKey)) {
      setObstacleKey(obstacleOptions[0]?.key ?? "")
    }
  }, [obstacleOptions, obstacleKey])

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

  const conditionLabel = conditionOptions.find((o) => o.key === conditionKey)?.label ?? "Select option"
  const obstacleLabel = obstacleOptions.find((o) => o.key === obstacleKey)?.label ?? "Select option"

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.bgPrimary,
                shadowColor: palette.border,
              },
            ]}
          >
            <View style={styles.handle} />

            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: palette.destructive + "22" },
              ]}
            >
              <AlertTriangle size={iconSizes.lg} color={palette.destructive} strokeWidth={2.2} />
            </View>

            <Text style={[textStyles.screenTitle, styles.title, { color: palette.destructive }]}>
              Report an Issue
            </Text>

            <Text style={[textStyles.body, styles.subtitle, { color: palette.textSecondary }]}>
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

            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: palette.destructive, shadowColor: palette.border },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[textStyles.bodyBold, styles.submitText, { color: palette.textInverse }]}>
                Submit Report
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
      {!!activeSelect && (
        <SelectionOverlay
          visible
          options={
            activeSelect === "condition"
              ? conditionOptions
              : activeSelect === "obstacle"
                ? obstacleOptions
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

type SelectFieldProps = {
  label: string
  valueLabel: string
  onOpen: (anchor: { top: number; right: number; width: number }) => void
  active: boolean
}

function SelectField({ label, valueLabel, onOpen, active }: SelectFieldProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const containerRef = React.useRef<View | null>(null)

  return (
    <View
      style={styles.selectField}
      ref={(node) => {
        containerRef.current = node
      }}
    >
      <Text style={[textStyles.caption, styles.selectLabel, { color: palette.textSecondary }]}>
        {label}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.selectInput,
          {
            borderColor: palette.border,
            backgroundColor: palette.inputBg,
          },
          pressed && { opacity: 0.9 },
          active && { borderColor: palette.primary },
        ]}
        onPress={() => {
          const windowWidth = Dimensions.get("window").width
          containerRef.current?.measureInWindow((x, y, width, height) => {
            onOpen({
              top: y + height,
              right: Math.max(0, windowWidth - (x + width)),
              width,
            })
          })
        }}
      >
        <Text style={[textStyles.body, { color: palette.textPrimary }]}>
          {valueLabel}
        </Text>
        <ChevronDown size={iconSizes.sm} color={palette.textSecondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
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
  handle: {
    alignSelf: "center",
    width: scale(50),
    height: verticalScale(4),
    borderRadius: radius.full,
    marginBottom: verticalScale(8),
    backgroundColor: "rgba(148,163,184,0.4)",
  },
  iconWrapper: {
    alignSelf: "center",
    width: scale(64),
    height: scale(64),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(4),
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: verticalScale(6),
  },
  selectField: {
    width: "100%",
  },
  selectLabel: {
    marginBottom: verticalScale(6),
  },
  selectInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  submitButton: {
    marginTop: verticalScale(20),
    borderRadius: radius.full,
    paddingVertical: verticalScale(12),
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: radius.xl,
    elevation: 8,
  },
  submitText: {
    fontSize: 16,
  },
})
