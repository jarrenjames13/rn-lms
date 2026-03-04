import React from "react";
import { View } from "react-native";
import Skeleton from "./Skeleton";

export default function SectionSkeleton() {
  return (
    <View className="mb-3">
      <Skeleton height={40} width="100%" style={{ marginBottom: 6 }} />
      <Skeleton height={60} width="100%" />
    </View>
  );
}
