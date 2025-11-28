import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function CourseTabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
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
          headerShown: false,
          tabBarLabel: "Quizzes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          headerShown: false,
          tabBarLabel: "Exams",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" color={color} size={size} />
          ),
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
