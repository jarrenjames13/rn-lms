import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";

export default function CourseTabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6D4C9B",
        tabBarInactiveTintColor: "#8A8190",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // don't navigate to the screen
            router.replace("/(tabs)"); // go to main tabs instead
          },
        })}
      />
      <Tabs.Screen
        name="overview"
        options={{
          headerShown: false,
          tabBarLabel: "Overview",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          headerShown: false,
          tabBarLabel: "Assessments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          headerShown: false,
          tabBarLabel: "Modules",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="grade"
        options={{
          headerShown: false,
          tabBarLabel: "Grades",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
