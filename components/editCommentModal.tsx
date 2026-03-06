import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface EditCommentModalProps {
  visible: boolean;
  initialText: string;
  onConfirm: (newText: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EditCommentModal({
  visible,
  initialText,
  onConfirm,
  onCancel,
  isLoading = false,
}: EditCommentModalProps) {
  const [text, setText] = useState(initialText);

  // Sync text when modal opens with a different comment
  useEffect(() => {
    if (visible) setText(initialText);
  }, [visible, initialText]);

  const hasChanges = text.trim() !== initialText.trim();
  const canSubmit = text.trim().length > 0 && hasChanges && !isLoading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-6"
          onPress={onCancel}
        >
          <Pressable
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
                  <Ionicons name="create-outline" size={18} color="#3B82F6" />
                </View>
                <Text className="text-base font-bold text-gray-900">
                  Edit Comment
                </Text>
              </View>
              <Pressable
                onPress={onCancel}
                className="w-7 h-7 items-center justify-center bg-gray-100 rounded-full active:bg-gray-200"
              >
                <Ionicons name="close" size={16} color="#374151" />
              </Pressable>
            </View>

            {/* Input */}
            <View className="px-4 pt-3 pb-4">
              <View className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  autoFocus
                  numberOfLines={4}
                  maxLength={500}
                  placeholder="Write your comment..."
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-800 text-sm leading-5 max-h-32"
                  style={{ textAlignVertical: "top" }}
                />
              </View>
              <Text className="text-xs text-gray-400 text-right mt-1">
                {text.length}/500
              </Text>
            </View>

            {/* Actions */}
            <View className="h-px bg-gray-100" />
            <View className="flex-row">
              <Pressable
                onPress={onCancel}
                disabled={isLoading}
                className="flex-1 py-4 items-center active:bg-gray-50"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </Pressable>

              <View className="w-px bg-gray-100" />

              <Pressable
                onPress={() => onConfirm(text.trim())}
                disabled={!canSubmit}
                className="flex-1 py-4 items-center active:bg-blue-50"
                style={{ opacity: canSubmit ? 1 : 0.4 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text className="text-blue-500 font-bold">Save</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
