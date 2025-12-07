import React from 'react'
import { Tabs, Link } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import { useClientOnlyValue } from '@/components/useClientOnlyValue'

type TabBarIconProps = {
  name: React.ComponentProps<typeof FontAwesome>['name']
  color: string
}

function TabBarIcon({ name, color }: TabBarIconProps) {
  return <FontAwesome name={name} size={22} style={{ marginBottom: -2 }} color={color} />
}

export default function TabLayout() {

  const colorScheme = useColorScheme()
  const insets = useSafeAreaInsets()

  const theme = Colors[colorScheme ?? 'light']

  const barBackground = theme.bbpBackground
  const activeTint = theme.tint
  const inactiveTint = theme.tabIconDefault

  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),

        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarStyle: {
          alignSelf: 'center',
          width: '70%',
          bottom: 4 + insets.bottom,
          height: 60,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: barBackground,
          borderTopWidth: 0,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable
                hitSlop={8}
                style={{ marginRight: 16 }}
              >
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={22}
                    color={theme.text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  )
}
