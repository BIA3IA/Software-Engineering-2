import React from "react"
import { Modal, View, Text, Pressable, StyleSheet } from "react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { radius, scale, verticalScale } from "@/theme/layout"
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
  onSubmit: (payload: { name: string; description: string; visibility: PrivacyPreference }) => void
  initialVisibility: PrivacyPreference
}

type SelectAnchor = {
  top: number
  right: number
  width: number
}

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
  const [selectAnchor, setSelectAnchor] = React.useState<SelectAnchor | null>(null)
  const [errors, setErrors] = React.useState<{ name?: string; description?: string; visibility?: string }>({})

  React.useEffect(() => {
    if (visible) {
      setName("")
      setDescription("")
      setVisibility(initialVisibility)
      setSelectAnchor(null)
      setErrors({})
    }
  }, [visible, initialVisibility])

  function handleSubmit() {
    const result = createPathSchema.safeParse({
      name,
      description,
      visibility,
    })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        visibility: fieldErrors.visibility?.[0],
      })
      return
    }

    setErrors({})
    onSubmit({
      name: result.data.name.trim(),
      description: (result.data.description ?? "").trim(),
      visibility: result.data.visibility as PrivacyPreference,
    })
  }

  function closeVisibilitySelect() {
    setSelectAnchor(null)
  }

  const visibilityLabel = PRIVACY_OPTIONS.find((option) => option.key === visibility)?.label ?? "Select visibility"

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
    setSelectAnchor(anchor)
    if (errors.visibility) {
      setErrors((prev) => ({ ...prev, visibility: undefined }))
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
  form: {
    gap: verticalScale(12),
  },
  submitButton: {
    marginTop: verticalScale(6),
    borderRadius: radius.full,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: radius.xl,
    elevation: 10,
  },
  submitButtonContent: {
    height: verticalScale(48),
  },
})
