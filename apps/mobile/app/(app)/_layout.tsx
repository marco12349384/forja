import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { colors } from '@/design/tokens';

// Custom tab bar icon component
function TabIcon({
  label,
  icon,
  focused,
  accentColor,
}: {
  label: string;
  icon: string;
  focused: boolean;
  accentColor?: string;
}) {
  const activeColor = accentColor ?? colors.primary;
  return (
    <View className="items-center justify-center" style={{ gap: 3 }}>
      <View
        style={{
          width: 40,
          height: 32,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? `${activeColor}18` : 'transparent',
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text
        style={{
          fontSize: 10,
          fontFamily: focused ? 'DMSans_700Bold' : 'DMSans_400Regular',
          color: focused ? activeColor : colors.subtle,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Hoy" icon="🌿" focused={focused} accentColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="entrena/index"
        options={{
          title: 'Entrena',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Entrena" icon="⚡" focused={focused} accentColor={colors.energy} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutricion/index"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Nutrición" icon="🥗" focused={focused} accentColor={colors.calm} />
          ),
        }}
      />
      <Tabs.Screen
        name="socio/index"
        options={{
          title: 'SOCIO',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="SOCIO" icon="💬" focused={focused} accentColor={colors.ai} />
          ),
        }}
      />
      <Tabs.Screen
        name="progreso/index"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Progreso" icon="📈" focused={focused} accentColor={colors.primary} />
          ),
        }}
      />
      {/* Hidden screen — not shown in tab bar */}
      <Tabs.Screen
        name="snap-eat/index"
        options={{
          title: 'Snap & Eat',
          href: null, // hides from tab bar
        }}
      />
    </Tabs>
  );
}
