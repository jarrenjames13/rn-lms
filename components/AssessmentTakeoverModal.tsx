import { useAppTheme } from "@/theme";
import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AssessmentTakeoverModal({ visible, pending, onCancel, onConfirm }: Props) {
  const { theme } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: theme.surface }}>
          <Text className="text-xl font-bold" style={{ color: theme.text }}>Assessment open elsewhere</Text>
          <Text className="mt-2 text-base leading-6" style={{ color: theme.textMuted }}>
            Continuing here will take over the active assessment session. The other device will no longer be able to answer or submit.
          </Text>
          <View className="mt-6 flex-row gap-3">
            <Pressable disabled={pending} onPress={onCancel} className="flex-1">
              <View className="min-h-14 items-center justify-center rounded-xl" style={{ backgroundColor: theme.canvas }}>
                <Text className="font-bold" style={{ color: theme.text }}>Cancel</Text>
              </View>
            </Pressable>
            <Pressable disabled={pending} onPress={onConfirm} className="flex-1">
              <View className="min-h-14 items-center justify-center rounded-xl" style={{ backgroundColor: theme.school }}>
                {pending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">Take over</Text>}
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
