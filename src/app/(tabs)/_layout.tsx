import { Tabs } from "expo-router";
import {
  House,
  Flame,
  ChartColumn,
 
  Settings,
} from "lucide-react-native";
import { useTheme } from "@/hooks/use-theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 70,
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ color, size }) => (
            <Flame color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <ChartColumn color={color} size={size} />
          ),
        }}
      />

    

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}