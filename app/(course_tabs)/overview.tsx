import { useCourseStore } from "@/store/useCourseStore";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Overview() {
  const { course_id, instance_id } = useCourseStore();

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Text>
        Overview of Course ID: {course_id}, Instance ID: {instance_id}
      </Text>
    </SafeAreaView>
  );
}
