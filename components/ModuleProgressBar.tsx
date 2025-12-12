// components/ModuleProgressBar.tsx

import { ModuleProgress } from "@/types/api";
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
    <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Overall Progress */}
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold text-gray-700">
            Overall Progress
          </Text>
          <Text className="text-sm font-bold text-blue-600">
            {Math.round(overall_percentage)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${overall_percentage}%` }}
          />
        </View>
      </View>

      {/* Detailed Breakdown */}
      {showDetails && (
        <View className="space-y-2">
          {/* Sections Progress */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-xs text-gray-600">Sections</Text>
            </View>
            <Text className="text-xs font-medium text-gray-700">
              {completed_sections}/{total_sections} (
              {Math.round(sections_percentage)}%)
            </Text>
          </View>

          {/* Activities Progress */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-purple-500" />
              <Text className="text-xs text-gray-600">Activities</Text>
            </View>
            <Text className="text-xs font-medium text-gray-700">
              {submitted_activities}/{total_activities} (
              {Math.round(activities_percentage)}%)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
