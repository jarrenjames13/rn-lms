import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/theme";
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
  const { theme } = useAppTheme();

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
            className="rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ backgroundColor: theme.surface }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b" style={{ borderColor: theme.border }}>
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: theme.surfaceMuted }}>
                  <Ionicons name="create-outline" size={18} color={theme.primary} />
                </View>
                <Text className="text-base font-bold" style={{ color: theme.text }}>
                  Edit Comment
                </Text>
              </View>
              <Pressable
                onPress={onCancel}
                className="w-7 h-7 items-center justify-center rounded-full"
                style={({ pressed }) => ({ backgroundColor: pressed ? theme.border : theme.surfaceMuted })}
              >
                <Ionicons name="close" size={16} color={theme.text} />
              </Pressable>
            </View>

            {/* Input */}
            <View className="px-4 pt-3 pb-4">
              <View className="rounded-xl border p-3" style={{ backgroundColor: theme.canvas, borderColor: theme.border }}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  autoFocus
                  numberOfLines={4}
                  maxLength={500}
                  placeholder="Write your comment..."
                  placeholderTextColor={theme.textMuted}
                  className="text-sm leading-5 max-h-32"
                  style={{ textAlignVertical: "top", color: theme.text }}
                />
              </View>
              <Text className="text-xs text-right mt-1" style={{ color: theme.textMuted }}>
                {text.length}/500
              </Text>
            </View>

            {/* Actions */}
            <View className="h-px" style={{ backgroundColor: theme.border }} />
            <View className="flex-row">
              <Pressable
                onPress={onCancel}
                disabled={isLoading}
                className="flex-1 py-4 items-center"
                style={({ pressed }) => ({ backgroundColor: pressed ? theme.canvas : theme.surface })}
              >
                <Text className="font-semibold" style={{ color: theme.text }}>Cancel</Text>
              </Pressable>

              <View className="w-px" style={{ backgroundColor: theme.border }} />

              <Pressable
                onPress={() => onConfirm(text.trim())}
                disabled={!canSubmit}
                className="flex-1 py-4 items-center"
                style={({ pressed }) => ({ opacity: canSubmit ? 1 : 0.4, backgroundColor: pressed ? theme.surfaceMuted : theme.surface })}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text className="font-bold" style={{ color: theme.primary }}>Save</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
