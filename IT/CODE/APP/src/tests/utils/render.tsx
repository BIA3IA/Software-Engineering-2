import React from "react"
import { render } from "@testing-library/react-native"
import { Provider as PaperProvider } from "react-native-paper"
import { usePaperTheme } from "@/theme/paperTheme"
import { LucideIcon } from "@/components/icons/LucideIcon"

function Providers({ children }: { children: React.ReactNode }) {
    const paperTheme = usePaperTheme()

    return (
        <PaperProvider
            theme={paperTheme}
            settings={{
                icon: (props) => <LucideIcon name={props.name} color={props.color} size={props.size} />,
            }}
        >
            {children}
        </PaperProvider>
    )
}

export function renderWithProviders(ui: React.ReactElement) {
    return render(ui, { wrapper: Providers })
}
