import { createCommentReactionsOptions } from "@/api/QueryOptions/commentReactionsOptions";
import { useAppTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const REACTIONS = [
  { emoji: "👍", key: "like", label: "Like" },
  { emoji: "❤️", key: "love", label: "Love" },
  { emoji: "😆", key: "haha", label: "Haha" },
  { emoji: "😮", key: "wow", label: "Wow" },
  { emoji: "😢", key: "sad", label: "Sad" },
  { emoji: "👎", key: "dislike", label: "Dislike" },
  { emoji: "📊", key: "all", label: "All" },
] as const;

interface CommentReactionsModalProps {
  visible: boolean;
  onClose: () => void;
  commentId: number;
}

export default function CommentReactionsModal({
  visible,
  onClose,
  commentId,
}: CommentReactionsModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const { theme } = useAppTheme();

  const { data, isLoading, error } = useQuery({
    ...createCommentReactionsOptions(commentId, selectedFilter, 1, 50),
    enabled: visible,
  });

  const reactions = data?.reactions ?? [];
  const counts = data?.counts;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: theme.surface }}>
        {/* Header */}
        <View className="border-b px-4 py-4" style={{ borderColor: theme.border }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-lg" style={{ color: theme.text }}>Reactions</Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.surfaceMuted }}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4 -mx-4 px-4"
          >
            <View className="flex-row gap-2">
              {REACTIONS.map((reaction) => {
                const count =
                  reaction.key === "all"
                    ? counts?.all ?? 0
                    : counts?.[reaction.key as keyof typeof counts] ?? 0;
                if (reaction.key !== "all" && count === 0) return null;

                const isSelected = selectedFilter === reaction.key;
                return (
                  <Pressable
                    key={reaction.key}
                    onPress={() => setSelectedFilter(reaction.key)}
                    className="flex-row items-center gap-1 px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isSelected ? theme.surfaceAccent : theme.canvas,
                      borderColor: isSelected ? theme.school : theme.border,
                    }}
                  >
                    <Text className="text-lg">{reaction.emoji}</Text>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isSelected ? theme.school : theme.textMuted }}
                    >
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Reactions List */}
        <ScrollView className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color={theme.school} />
              <Text className="text-sm mt-3" style={{ color: theme.textMuted }}>
                Loading reactions...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-12 px-6">
              <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
              <Text className="text-center mt-3" style={{ color: theme.danger }}>
                Failed to load reactions
              </Text>
            </View>
          ) : reactions.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12 px-6">
              <Text className="text-base text-center" style={{ color: theme.textMuted }}>
                No reactions yet
              </Text>
            </View>
          ) : (
            <View className="px-4 py-2">
              {reactions.map((reaction, index) => {
                const reactionData = REACTIONS.find(
                  (r) => r.key === reaction.reaction_type,
                );
                return (
                  <View
                    key={`${reaction.user_id}-${index}`}
                    className="flex-row items-center justify-between py-3 border-b"
                    style={{ borderColor: theme.border }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.surfaceAccent }}>
                        <Text className="text-sm font-bold" style={{ color: theme.school }}>
                          {reaction.full_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium flex-1" style={{ color: theme.text }}>
                        {reaction.full_name}
                      </Text>
                    </View>
                    <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: theme.canvas }}>
                      <Text className="text-xl">{reactionData?.emoji}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
