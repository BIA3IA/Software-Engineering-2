import React from "react"
import { View, StyleSheet } from "react-native"

import { scale } from "@/theme/layout"

type MapIconMarkerProps = {
  color: string
  icon: React.ReactNode
  size?: number
  borderColor?: string
  borderWidth?: number
}

export function MapIconMarker({
  color,
  icon,
  size = scale(30),
  borderColor,
  borderWidth = 2,
}: MapIconMarkerProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderColor,
          borderWidth: borderColor ? borderWidth : 0,
        },
      ]}
    >
      {icon}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
})
