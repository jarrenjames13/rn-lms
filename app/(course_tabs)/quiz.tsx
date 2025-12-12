import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Quiz() {
  return (
    <SafeAreaView>
      <ScrollView className="flex-1">
        <View className="flex bg-gray-300 p-4">
          <Text className="text-lg font-bold">Quiz Screen</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
