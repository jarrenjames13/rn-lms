import React from "react";
import { View } from "react-native";
import { useAppTheme } from "@/theme";
import Skeleton from "./Skeleton";

interface ModuleSkeletonProps {
  showSections?: boolean;
  showActivities?: boolean;
}

export default function ModuleSkeleton({
  showSections = true,
  showActivities = true,
}: ModuleSkeletonProps) {
  const { theme } = useAppTheme();

  return (
    <View
      className="rounded-2xl shadow-sm border mb-4 overflow-hidden"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      {/* Module Header */}
      <View
        className="px-5 py-4 flex-row items-center"
        style={{ backgroundColor: theme.school }}
      >
        <Skeleton
          width={40}
          height={40}
          borderRadius={12}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1">
          <Skeleton height={12} width="50%" style={{ marginBottom: 6 }} />
          <Skeleton height={20} width="80%" />
        </View>
      </View>

      <View className="p-5">
        {/* Module Description */}
        <Skeleton height={14} width="100%" style={{ marginBottom: 6 }} />
        <Skeleton height={14} width="95%" style={{ marginBottom: 16 }} />

        {/* Module Sections */}
        {showSections && (
          <View className="mb-4">
            <Skeleton height={16} width="40%" style={{ marginBottom: 8 }} />
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={i}
                height={40}
                width="100%"
                style={{ marginBottom: 6 }}
              />
            ))}
          </View>
        )}

        {/* Module Activities */}
        {showActivities && (
          <View>
            <Skeleton height={16} width="40%" style={{ marginBottom: 8 }} />
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={i}
                height={80}
                width="100%"
                style={{ marginBottom: 6 }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
