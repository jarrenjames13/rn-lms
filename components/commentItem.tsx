import { createInfiniteRepliesOptions } from "@/api/QueryOptions/repliesOptions";
import { Comment, Replies } from "@/types/api";
import { getAccessToken } from "@/utils/accessToken";
import { BASE_URL } from "@/utils/constants";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type CommentData = Comment["comments"][number];
type ReplyData = Replies["replies"][number];

const REACTIONS = [
  { emoji: "👍", key: "like" as const },
  { emoji: "❤️", key: "love" as const },
  { emoji: "😆", key: "haha" as const },
  { emoji: "😮", key: "wow" as const },
  { emoji: "😢", key: "sad" as const },
  { emoji: "👎", key: "dislike" as const },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTopReactions(item: CommentData | ReplyData) {
  return REACTIONS.map((r) => ({ ...r, count: item[r.key] }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─── ReactionBar ─────────────────────────────────────────────────────────────
function ReactionBar({
  item,
  onReact,
}: {
  item: CommentData | ReplyData;
  onReact?: (key: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const topReactions = getTopReactions(item);

  return (
    <View className="flex-row items-center gap-2 mt-2">
      {topReactions.length > 0 && (
        <View className="flex-row items-center bg-gray-100 rounded-full px-2 py-1 gap-1">
          {topReactions.map((r) => (
            <Text key={r.key} className="text-xs">
              {r.emoji} <Text className="text-gray-500">{r.count}</Text>
            </Text>
          ))}
        </View>
      )}
      <View className="relative">
        <Pressable
          onPress={() => setShowPicker((v) => !v)}
          className="flex-row items-center gap-1 bg-gray-100 active:bg-gray-200 rounded-full px-3 py-1"
        >
          <Text className="text-sm">
            {item.user_reaction
              ? (REACTIONS.find((r) => r.key === item.user_reaction)?.emoji ??
                "👍")
              : "👍"}
          </Text>
          <Text className="text-xs text-gray-500 font-medium">React</Text>
        </Pressable>

        {showPicker && (
          <View className="absolute bottom-9 left-0 flex-row bg-white rounded-2xl shadow-lg border border-gray-200 px-2 py-2 gap-1 z-50">
            {REACTIONS.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => {
                  onReact?.(r.key);
                  setShowPicker(false);
                }}
                className="w-9 h-9 items-center justify-center active:bg-gray-100 rounded-full"
              >
                <Text className="text-xl">{r.emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── ActionButtons ────────────────────────────────────────────────────────────
function ActionButtons({
  onReply,
  onEdit,
  onDelete,
  isOwner,
}: {
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3 mt-2">
      <Pressable
        onPress={onReply}
        className="flex-row items-center gap-1 active:opacity-60"
      >
        <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
        <Text className="text-xs text-gray-500 font-medium">Reply</Text>
      </Pressable>

      {isOwner && (
        <>
          <View className="w-px h-3 bg-gray-300" />
          <Pressable
            onPress={onEdit}
            className="flex-row items-center gap-1 active:opacity-60"
          >
            <MaterialIcons name="edit" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-500 font-medium">Edit</Text>
          </Pressable>

          <View className="w-px h-3 bg-gray-300" />
          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-1 active:opacity-60"
          >
            <MaterialIcons name="delete-outline" size={14} color="#EF4444" />
            <Text className="text-xs text-red-400 font-medium">Delete</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─── ReplyItem ────────────────────────────────────────────────────────────────
function ReplyItem({
  reply,
  accessToken,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: {
  reply: ReplyData;
  accessToken: string | null;
  currentUserId?: number;
  onEdit?: (reply: ReplyData) => void;
  onDelete?: (replyId: number) => void;
  onReact?: (replyId: number, reaction: string) => void;
  onReply?: (target: { id: number; full_name: string }) => void;
}) {
  const imageUrl = `${BASE_URL}/comment-section/images/${reply.id}`;
  const isOwner = currentUserId === reply.user_id;

  return (
    <View className="ml-8 mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
      {reply.mentioned_user_name && (
        <View className="flex-row items-center mb-1">
          <Text className="text-xs text-red-400 font-medium">
            ↩ replying to @{reply.mentioned_user_name}
          </Text>
        </View>
      )}

      <View className="flex-row justify-between items-center mb-1">
        <View className="flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center">
            <Text className="text-xs font-bold text-red-500">
              {reply.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-sm font-semibold text-gray-800">
            {reply.full_name}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {formatDate(reply.created_at)}
        </Text>
      </View>

      <Text className="text-sm text-gray-700 leading-5">{reply.comment}</Text>

      {reply.file_path && accessToken && (
        <Image
          source={{
            uri: imageUrl,
            headers: { Authorization: `Bearer ${accessToken}` },
          }}
          style={{ width: 140, height: 140 }}
          className="rounded-xl mt-2"
          contentFit="contain"
        />
      )}

      <ReactionBar item={reply} onReact={(key) => onReact?.(reply.id, key)} />
      <ActionButtons
        isOwner={isOwner}
        onEdit={() => onEdit?.(reply)}
        onDelete={() => onDelete?.(reply.id)}
        onReply={() => onReply?.({ id: reply.id, full_name: reply.full_name })}
      />
    </View>
  );
}

// ─── RepliesSection ───────────────────────────────────────────────────────────
function RepliesSection({
  parentId,
  accessToken,
  currentUserId,
  onReply,
}: {
  parentId: number;
  accessToken: string | null;
  currentUserId?: number;
  onReply?: (target: { id: number; full_name: string }) => void;
}) {
  const perPage = 5;
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(createInfiniteRepliesOptions(parentId, perPage));

  const allReplies = data?.pages.flatMap((page) => page.replies) ?? [];

  if (isLoading)
    return (
      <View className="ml-8 mt-3">
        <ActivityIndicator size="small" color="#EF4444" />
      </View>
    );
  if (error)
    return (
      <Text className="ml-8 mt-2 text-xs text-red-400">
        Failed to load replies.
      </Text>
    );

  return (
    <View>
      {allReplies.map((reply) => (
        <ReplyItem
          key={reply.id}
          reply={reply}
          accessToken={accessToken}
          currentUserId={currentUserId}
          onReply={onReply}
        />
      ))}

      {isFetchingNextPage ? (
        <View className="ml-8 mt-3 items-center">
          <ActivityIndicator size="small" color="#EF4444" />
          <Text className="text-xs text-gray-400 mt-1">Loading more...</Text>
        </View>
      ) : hasNextPage ? (
        <Pressable
          onPress={() => fetchNextPage()}
          className="ml-8 mt-3 bg-gray-100 active:bg-gray-200 px-4 py-2 rounded-lg items-center"
        >
          <Text className="text-xs text-gray-600 font-medium">
            Load more replies
          </Text>
        </Pressable>
      ) : allReplies.length > 0 ? (
        <View className="ml-8 mt-2">
          <Text className="text-xs text-gray-400">No more replies</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── CommentItem ──────────────────────────────────────────────────────────────
export default function CommentItem({
  item,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: {
  item: CommentData;
  currentUserId?: number;
  onEdit?: (comment: CommentData) => void;
  onDelete?: (commentId: number) => void;
  onReact?: (commentId: number, reaction: string) => void;
  onReply?: (target: { id: number; full_name: string }) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const imageUrl = `${BASE_URL}/comment-section/images/${item.id}`;
  const isOwner = currentUserId === item.user_id;

  useEffect(() => {
    getAccessToken().then(setAccessToken);
  }, []);

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-full bg-red-500 items-center justify-center">
            <Text className="text-sm font-bold text-white">
              {item.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-sm font-semibold text-gray-800">
              {item.full_name}
            </Text>
            <Text className="text-xs text-gray-400">
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        {item.updated_at && (
          <View className="bg-gray-100 rounded-full px-2 py-0.5">
            <Text className="text-xs text-gray-400">edited</Text>
          </View>
        )}
      </View>

      {/* Comment body */}
      <Text className="text-sm text-gray-700 leading-5">{item.comment}</Text>

      {/* Attached image */}
      {item.file_path && accessToken && (
        <Image
          source={{
            uri: imageUrl,
            headers: { Authorization: `Bearer ${accessToken}` },
          }}
          style={{ width: 140, height: 192 }}
          className="rounded-xl mt-3"
          contentFit="cover"
        />
      )}

      <ReactionBar item={item} onReact={(key) => onReact?.(item.id, key)} />

      {/* Divider */}
      <View className="h-px bg-gray-100 my-3" />

      {/* Action row */}
      <View className="flex-row items-center justify-between">
        <ActionButtons
          isOwner={isOwner}
          onReply={() => {
            onReply?.({ id: item.id, full_name: item.full_name });
            if (item.total_replies > 0) setShowReplies(true);
          }}
          onEdit={() => onEdit?.(item)}
          onDelete={() => onDelete?.(item.id)}
        />

        {item.total_replies > 0 && (
          <Pressable
            onPress={() => setShowReplies((v) => !v)}
            className="flex-row items-center gap-1 active:opacity-60"
          >
            <Ionicons
              name={showReplies ? "chevron-up" : "chevron-down"}
              size={14}
              color="#EF4444"
            />
            <Text className="text-xs text-red-500 font-medium">
              {showReplies
                ? "Hide"
                : `${item.total_replies} Repl${item.total_replies === 1 ? "y" : "ies"}`}
            </Text>
          </Pressable>
        )}
      </View>

      {showReplies && (
        <RepliesSection
          parentId={item.id}
          accessToken={accessToken}
          currentUserId={currentUserId}
          onReply={onReply} // <- forward reply handler
        />
      )}
    </View>
  );
}
