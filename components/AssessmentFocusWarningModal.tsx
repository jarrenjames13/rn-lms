import { useAppTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  assessmentLabel: "quiz" | "exam";
  onReturn: () => void;
};

export default function AssessmentFocusWarningModal({
  visible,
  assessmentLabel,
  onReturn,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/90 px-6">
        <View
          className="w-full max-w-md rounded-2xl p-6"
          style={{ backgroundColor: theme.surface }}
        >
          <Ionicons name="warning" size={42} color={theme.warning} />
          <Text className="mt-4 text-xl font-bold" style={{ color: theme.text }}>
            Focus loss detected
          </Text>
          <Text className="mt-2 text-base leading-6" style={{ color: theme.textMuted }}>
            Leaving this {assessmentLabel} again will submit your current answers automatically.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to answering"
            onPress={onReturn}
          >
            {({ pressed }) => (
              <View
                className="mt-6 min-h-14 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: pressed ? theme.primaryPressed : theme.school,
                }}
              >
                <Text className="font-bold text-white">Return to answering</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
