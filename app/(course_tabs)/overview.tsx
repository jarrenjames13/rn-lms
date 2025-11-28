import { useCourseStore } from "@/store/useCourseStore";
import React from "react";
import { Text, View } from "react-native";

export default function Overview() {
  const { course_id, instance_id } = useCourseStore();
  return (
    <View>
      <Text>Overview</Text>
    </View>
  );
}
