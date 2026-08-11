import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/theme";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface ConfirmDeleteModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export default function ConfirmDeleteModal({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
  title = "Delete?",
  description = "This action cannot be undone.",
}: ConfirmDeleteModalProps) {
  const { theme } = useAppTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable
          className="rounded-2xl w-full max-w-sm overflow-hidden"
          style={{ backgroundColor: theme.surface }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center pt-6 pb-4 px-6">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: theme.surfaceAccent }}>
              <Ionicons name="trash-outline" size={28} color={theme.danger} />
            </View>
            <Text className="text-lg font-bold text-center" style={{ color: theme.text }}>
              {title}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: theme.textMuted }}>
              {description}
            </Text>
          </View>

          <View className="h-px" style={{ backgroundColor: theme.border }} />

          <View className="flex-row">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-4 items-center"
              style={{ backgroundColor: theme.surface }}
              disabled={isLoading}
            >
              <Text className="font-semibold" style={{ color: theme.text }}>Cancel</Text>
            </Pressable>

            <View className="w-px" style={{ backgroundColor: theme.border }} />

            <Pressable
              onPress={onConfirm}
              className="flex-1 py-4 items-center"
              style={{ backgroundColor: theme.surface }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.danger} />
              ) : (
                <Text className="font-bold" style={{ color: theme.danger }}>Delete</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
