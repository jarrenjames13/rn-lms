import { Ionicons } from "@expo/vector-icons";
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
          className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center pt-6 pb-4 px-6">
            <View className="w-14 h-14 bg-red-100 rounded-full items-center justify-center mb-3">
              <Ionicons name="trash-outline" size={28} color="#EF4444" />
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center">
              {title}
            </Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              {description}
            </Text>
          </View>

          <View className="h-px bg-gray-100" />

          <View className="flex-row">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-4 items-center active:bg-gray-50"
              disabled={isLoading}
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </Pressable>

            <View className="w-px bg-gray-100" />

            <Pressable
              onPress={onConfirm}
              className="flex-1 py-4 items-center active:bg-red-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text className="text-red-500 font-bold">Delete</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
