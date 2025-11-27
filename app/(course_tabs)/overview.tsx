import { useCourseStore } from "@/store/useCourseStore";
import React from "react";
import { Text, View } from "react-native";

export default function overview() {
  const { course_id } = useCourseStore();
  console.log("Current course_id in overview:", course_id);
  return (
    <View>
      <Text>overview</Text>
    </View>
  );
}
