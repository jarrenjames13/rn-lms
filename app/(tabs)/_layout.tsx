import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return <Tabs>
    <Tabs.Screen
      name="index"
      options={{
        title: "Home",
        tabBarLabel: "Home",
        tabBarIcon:({color, size})=> <Ionicons name="home" color={color} size={size} />
      }}
    />
    <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon:({color, size})=> <Ionicons name="settings" color={color} size={size} />
        }}
      />
  </Tabs>
}
