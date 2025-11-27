import { Tabs } from "expo-router";

export default function courseTabs() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="overview"
        options={{
          headerShown: false,
          tabBarLabel: "Overview",
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          headerShown: false,
          tabBarLabel: "Modules",
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          headerShown: false,
          tabBarLabel: "Quiz",
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          headerShown: false,
          tabBarLabel: "Exams",
        }}
      />
      <Tabs.Screen
        name="grade"
        options={{
          headerShown: false,
          tabBarLabel: "Grade",
        }}
      />
    </Tabs>
  );
}
