import Skeleton from "@/components/skeletons/Skeleton";
import { useAppTheme } from "@/theme";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScreenLoading({
  message = "Loading your learning space...",
}: {
  message?: string;
}) {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.canvas }}>
      <View className="px-5 pt-6">
        <Skeleton height={14} width={120} style={{ marginBottom: 10 }} />
        <Skeleton height={28} width="72%" style={{ marginBottom: 8 }} />
        <Text className="text-sm mb-6" style={{ color: theme.textMuted }}>
          {message}
        </Text>
        <Skeleton height={96} width="100%" borderRadius={20} style={{ marginBottom: 12 }} />
        <Skeleton height={150} width="100%" borderRadius={20} style={{ marginBottom: 12 }} />
        <Skeleton height={150} width="100%" borderRadius={20} />
      </View>
    </SafeAreaView>
  );
}
