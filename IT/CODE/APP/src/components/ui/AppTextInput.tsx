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
import { radius, scale, verticalScale } from "@/theme/layout"
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

    return (
        <View style={styles.container}>
            {label && (
                <Text
                    style={[
                        textStyles.formLabel,
                        styles.label,
                        { color: palette.textPrimary },
                    ]}
                >
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: palette.inputBg,
                        borderColor: hasError ? palette.destructive : palette.inputBorder,
                        shadowColor: palette.border,
                    },
                ]}
            >
                {icon && <View style={styles.icon}>{icon}</View>}

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={palette.inputPlaceholder}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    style={[
                        styles.input,
                        icon ? { paddingLeft: scale(8) } : null,
                        { color: palette.inputText },
                    ]}
                    {...rest}
                />
            </View>

            {hasError && (
                <Text style={[textStyles.caption, styles.errorMessage, { color: palette.destructive }]}>
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
        marginBottom: verticalScale(6),
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: radius.pill,
        borderWidth: 1,
        paddingHorizontal: scale(16),
        height: verticalScale(52),
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
        elevation: 4,
    },
    icon: {
        marginRight: scale(8),
    },
    input: {
        flex: 1,
        fontSize: scale(14),
        fontWeight: "500",
    },
    errorMessage: {
        marginTop: verticalScale(6),
    },
})
