import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useAppTheme } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CourseTabsLayout() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      backBehavior="none"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 66 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 4 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", paddingBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "All Courses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // don't navigate to the screen
            router.replace("/(tabs)");
          },
        })}
      />
      <Tabs.Screen
        name="overview"
        options={{
          tabBarLabel: "Overview",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          tabBarLabel: "Assessments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
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
          tabBarLabel: "Grades",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
