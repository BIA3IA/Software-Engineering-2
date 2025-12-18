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
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [visibility, setVisibility] = React.useState(initialVisibility)
  const [selectAnchor, setSelectAnchor] = React.useState<SelectAnchor | null>(null)

  React.useEffect(() => {
    if (visible) {
      setName("")
      setDescription("")
      setVisibility(initialVisibility)
      setSelectAnchor(null)
    }
  }, [visible, initialVisibility])

  const canSubmit = Boolean(name.trim())

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      visibility,
    })
  }

  function openVisibilitySelect(anchor: SelectAnchor) {
    setSelectAnchor(anchor)
  }

  function closeVisibilitySelect() {
    setSelectAnchor(null)
  }

  const visibilityLabel = PRIVACY_OPTIONS.find((option) => option.key === visibility)?.label ?? "Select visibility"

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
                backgroundColor: palette.surface.card,
                shadowColor: palette.border.muted,
              },
            ]}
          >

            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: `${palette.brand.surface}` },
              ]}
            >
              <Plus size={iconSizes.xl} color={palette.brand.base} strokeWidth={2} />
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
                onChangeText={setName}
                placeholder="Path name"
                autoCapitalize="words"
              />
              <AppTextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the path"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <SelectField
                label="Visibility"
                valueLabel={visibilityLabel}
                onOpen={openVisibilitySelect}
                active={Boolean(selectAnchor)}
              />
            </View>

            <AppButton
              title="Start Creating"
              onPress={handleSubmit}
              buttonColor={palette.brand.base}
              disabled={!canSubmit}
              style={[
                styles.submitButton,
                {
                  shadowColor: palette.border.muted,
                  opacity: canSubmit ? 1 : 0.5,
                },
              ]}
              contentStyle={styles.submitButtonContent}
            />
          </View>
        </View>
      </Pressable>
      {selectAnchor && (
        <SelectionOverlay
          visible
          options={PRIVACY_OPTIONS}
          selectedKey={visibility}
          onClose={closeVisibilitySelect}
          onSelect={(key) => {
            setVisibility(key as PrivacyPreference)
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
