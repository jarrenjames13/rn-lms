import React from "react";
import { StyleSheet, View } from "react-native";
import Skeleton from "./Skeleton";

export default function ActivitySkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
      {/* Title */}
      <Skeleton height={18} width="70%" style={styles.title} />

      {/* Badge */}
      <Skeleton height={14} width={80} style={styles.badge} />

      {/* Instructions block */}
      <Skeleton height={14} width="100%" style={styles.instruction} />
      <Skeleton height={14} width="95%" style={styles.instruction} />
      <Skeleton height={14} width="85%" style={styles.instructionLast} />

      {/* Button */}
      <Skeleton height={40} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 10,
  },
  badge: {
    marginBottom: 16,
  },
  instruction: {
    marginBottom: 6,
  },
  instructionLast: {
    marginBottom: 16,
  },
});
