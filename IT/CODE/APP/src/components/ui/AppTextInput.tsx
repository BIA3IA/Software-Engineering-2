import React from "react"
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
    KeyboardTypeOptions,
} from "react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { controlSizes, radius, spacing } from "@/theme/layout"
import { textStyles } from "@/theme/typography"

type Props = {
    label?: string
    icon?: React.ReactNode
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    secureTextEntry?: boolean
    keyboardType?: KeyboardTypeOptions
    autoCapitalize?: TextInputProps["autoCapitalize"]
    autoCorrect?: boolean
    errorMessage?: string
} & Omit<TextInputProps, "style" | "onChangeText" | "value">

export function AppTextInput({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize = "none",
    autoCorrect = false,
    errorMessage,
    ...rest
}: Props) {
    const scheme = useColorScheme() ?? "light"
    const palette = Colors[scheme]
    const hasError = Boolean(errorMessage)
    const inputProps = {
        ...rest,
    }

    return (
        <View style={styles.container}>
            {label && (
                <Text
                    style={[
                        textStyles.formLabel,
                        styles.label,
                        { color: palette.text.primary },
                    ]}
                >
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: palette.input.background,
                        borderColor: hasError ? palette.status.danger : palette.input.border,
                        shadowColor: palette.border.muted,
                    },
                ]}
            >
                {icon && <View style={styles.icon}>{icon}</View>}

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={palette.input.placeholder}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    style={[
                        styles.input,
                        icon ? styles.inputWithIcon : null,
                        { color: palette.input.text },
                    ]}
                    {...inputProps}
                />
            </View>

            {hasError && (
                <Text style={[textStyles.caption, styles.errorMessage, { color: palette.status.danger }]}>
                    {errorMessage}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    label: {
        marginBottom: spacing.xs,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: radius.pill,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        height: controlSizes.inputHeight,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
        elevation: 4,
    },
    icon: {
        marginRight: spacing.xs,
    },
    input: {
        flex: 1,
        fontSize: textStyles.bodySmall.fontSize,
        fontWeight: "500",
    },
    inputWithIcon: {
        paddingLeft: spacing.xs,
    },
    errorMessage: {
        marginTop: spacing.xs,
    },
})
