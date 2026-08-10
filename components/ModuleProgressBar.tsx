// components/ModuleProgressBar.tsx

import { ModuleProgress } from "@/types/api";
import { useAppTheme } from "@/theme";
import React from "react";
import { Text, View } from "react-native";

interface ModuleProgressBarProps {
  progress: ModuleProgress;
  showDetails?: boolean;
}

export default function ModuleProgressBar({
  progress,
  showDetails = false,
}: ModuleProgressBarProps) {
  const { theme } = useAppTheme();
  const {
    overall_percentage,
    completed_sections,
    total_sections,
    submitted_activities,
    total_activities,
    sections_percentage,
    activities_percentage,
  } = progress;

  return (
    <View
      className="rounded-lg p-4 border"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      {/* Overall Progress */}
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold" style={{ color: theme.text }}>
            Overall Progress
          </Text>
          <Text className="text-sm font-bold" style={{ color: theme.primary }}>
            {Math.round(overall_percentage)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.border }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${overall_percentage}%`,
              backgroundColor: theme.primary,
            }}
          />
        </View>
      </View>

      {/* Detailed Breakdown */}
      {showDetails && (
        <View className="space-y-2">
          {/* Sections Progress */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.success }}
              />
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                Sections
              </Text>
            </View>
            <Text className="text-xs font-medium" style={{ color: theme.text }}>
              {completed_sections}/{total_sections} (
              {Math.round(sections_percentage)}%)
            </Text>
          </View>

          {/* Activities Progress */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                Activities
              </Text>
            </View>
            <Text className="text-xs font-medium" style={{ color: theme.text }}>
              {submitted_activities}/{total_activities} (
              {Math.round(activities_percentage)}%)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
