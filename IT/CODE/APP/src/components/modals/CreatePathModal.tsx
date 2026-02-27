import React from "react"
import { Keyboard, Modal, View, Text, Pressable, StyleSheet } from "react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { controlSizes, overlayMetrics, radius, screenMetrics, shadowStyles, spacing } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { AppTextInput } from "@/components/ui/AppTextInput"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { SelectField } from "@/components/ui/SelectField"
import { PrivacyPreference, PRIVACY_OPTIONS } from "@/constants/Privacy"
import { Plus } from "lucide-react-native"
import { AppButton } from "@/components/ui/AppButton"
import { createPathSchema } from "@/validation"

type CreatePathModalProps = {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: {
    name: string
    description: string
    visibility: PrivacyPreference
    creationMode: "manual" | "automatic"
  }) => void
  initialVisibility: PrivacyPreference
}

type SelectAnchor = {
  top: number
  right: number
  width: number
}

const MODE_OPTIONS = [
  { key: "manual", label: "Manual" },
  { key: "automatic", label: "Automatic" },
]

export function CreatePathModal({
  visible,
  onClose,
  onSubmit,
  initialVisibility,
}: CreatePathModalProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconBackground = scheme === "dark" ? palette.brand.base : palette.brand.surface
  const iconColor = scheme === "dark" ? palette.overlay.iconOnDark : palette.brand.base
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [visibility, setVisibility] = React.useState(initialVisibility)
  const [creationMode, setCreationMode] = React.useState<"manual" | "automatic">("manual")
  const [selectAnchor, setSelectAnchor] = React.useState<SelectAnchor | null>(null)
  const [modeAnchor, setModeAnchor] = React.useState<SelectAnchor | null>(null)
  const [errors, setErrors] = React.useState<{
    name?: string
    description?: string
    visibility?: string
    creationMode?: string
  }>({})

  React.useEffect(() => {
    if (visible) {
      setName("")
      setDescription("")
      setVisibility(initialVisibility)
      setCreationMode("manual")
      setSelectAnchor(null)
      setModeAnchor(null)
      setErrors({})
    }
  }, [visible, initialVisibility])

  function handleSubmit() {
    const result = createPathSchema.safeParse({
      name,
      description,
      visibility,
      creationMode,
    })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        visibility: fieldErrors.visibility?.[0],
        creationMode: fieldErrors.creationMode?.[0],
      })
      return
    }

    setErrors({})
    onSubmit({
      name: result.data.name.trim(),
      description: (result.data.description ?? "").trim(),
      visibility: result.data.visibility as PrivacyPreference,
      creationMode: result.data.creationMode as "manual" | "automatic",
    })
  }

  function closeVisibilitySelect() {
    setSelectAnchor(null)
  }

  const visibilityLabel = PRIVACY_OPTIONS.find((option) => option.key === visibility)?.label ?? "Select visibility"
  const modeLabel = MODE_OPTIONS.find((option) => option.key === creationMode)?.label ?? "Select mode"

  function handleNameChange(text: string) {
    setName(text)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }))
    }
  }

  function handleDescriptionChange(text: string) {
    setDescription(text)
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }))
    }
  }

  function handleSelectVisibility(anchor: SelectAnchor) {
    Keyboard.dismiss()
    setSelectAnchor(anchor)
    if (errors.visibility) {
      setErrors((prev) => ({ ...prev, visibility: undefined }))
    }
  }

  function handleSelectMode(anchor: SelectAnchor) {
    Keyboard.dismiss()
    setModeAnchor(anchor)
    if (errors.creationMode) {
      setErrors((prev) => ({ ...prev, creationMode: undefined }))
    }
  }

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
              <Plus size={iconSizes.xl} color={iconColor} strokeWidth={2} />
            </View>

            <Text style={[textStyles.screenTitle, styles.title, { color: palette.text.primary }]}>
              Create a New Path
            </Text>
            <Text style={[textStyles.body, styles.subtitle, { color: palette.text.secondary }]}>
              Share a name, description, and visibility setting before you start drawing.
            </Text>

            <View style={styles.form}>
              <AppTextInput
                label="Name"
                value={name}
                onChangeText={handleNameChange}
                placeholder="Path name"
                autoCapitalize="words"
                errorMessage={errors.name}
              />
              <AppTextInput
                label="Description"
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder="Describe the path"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                errorMessage={errors.description}
              />
              <SelectField
                label="Mode"
                valueLabel={modeLabel}
                onOpen={handleSelectMode}
                active={Boolean(modeAnchor)}
                errorMessage={errors.creationMode}
              />
              <SelectField
                label="Visibility"
                valueLabel={visibilityLabel}
                onOpen={handleSelectVisibility}
                active={Boolean(selectAnchor)}
                errorMessage={errors.visibility}
              />
            </View>

            <AppButton
              title="Start Creating"
              onPress={handleSubmit}
              buttonColor={palette.brand.base}
              style={[
                styles.submitButton,
                {
                  shadowColor: palette.border.muted,
                },
              ]}
              contentStyle={styles.submitButtonContent}
            />
          </View>
        </View>
      </View>
      {selectAnchor && (
        <SelectionOverlay
          visible
          options={PRIVACY_OPTIONS}
          selectedKey={visibility}
          onClose={closeVisibilitySelect}
          onSelect={(key) => {
            setVisibility(key as PrivacyPreference)
            setErrors((prev) => ({ ...prev, visibility: undefined }))
            closeVisibilitySelect()
          }}
          absoluteTop={selectAnchor.top}
          rightOffset={selectAnchor.right}
          width={selectAnchor.width}
        />
      )}
      {modeAnchor && (
        <SelectionOverlay
          visible
          options={MODE_OPTIONS}
          selectedKey={creationMode}
          onClose={() => setModeAnchor(null)}
          onSelect={(key) => {
            setCreationMode(key as "manual" | "automatic")
            setErrors((prev) => ({ ...prev, creationMode: undefined }))
            setModeAnchor(null)
          }}
          absoluteTop={modeAnchor.top}
          rightOffset={modeAnchor.right}
          width={modeAnchor.width}
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
    paddingTop: overlayMetrics.modalTopInset,
  },
  card: {
    width: overlayMetrics.modalWidth,
    borderRadius: radius.xl,
    paddingHorizontal: screenMetrics.screenPaddingX,
    paddingTop: overlayMetrics.modalPaddingTop,
    paddingBottom: overlayMetrics.modalPaddingBottom,
    ...shadowStyles.modal,
    elevation: 14,
    gap: 14,
  },
  iconWrapper: {
    alignSelf: "center",
    width: overlayMetrics.modalIconSize,
    height: overlayMetrics.modalIconSize,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  form: {
    gap: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xs,
    borderRadius: radius.full,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: radius.xl,
    elevation: 10,
  },
  submitButtonContent: {
    height: controlSizes.buttonHeight,
  },
})
