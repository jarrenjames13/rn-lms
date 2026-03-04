import { usePostComment } from "@/api/QueryOptions/commentMutation";
import { createInfiniteCommentsOptions } from "@/api/QueryOptions/commentsOptions";
import CommentItem from "@/components/commentItem";
import { useAuth } from "@/context/authContext";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  instanceId: number;
}

export default function CommentsModal({
  visible,
  onClose,
  instanceId,
}: CommentsModalProps) {
  const [comment, setComment] = useState<string>("");
  const { authState } = useAuth();
  const { mutate: postComment, isPending: postingComment } = usePostComment();
  const user_id = authState?.user?.user_id;
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Track the comment being replied to
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    fullname: string;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const COMMENTS_PER_PAGE = 10;

  const {
    data,
    isLoading: loadingComments,
    error: commentsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = useInfiniteQuery(
    createInfiniteCommentsOptions(instanceId, undefined, COMMENTS_PER_PAGE),
  );

  const allComments = data?.pages.flatMap((page) => page.comments) ?? [];
  const totalComments = data?.pages[0]?.total ?? 0;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const handlePostComment = () => {
    if (!comment.trim() && !selectedImage) return;
    if (!instanceId) return;

    postComment(
      {
        formData: {
          comment: comment.trim() || "",
          image: selectedImage || undefined,
          parent_id: replyingTo?.id || undefined,
        },
        instance_id: instanceId,
      },
      {
        onSuccess: () => {
          setComment("");
          setSelectedImage(null);
          setReplyingTo(null);
          refetchComments();
        },
        onError: (error) => {
          console.log("Failed to post comment:", error);
        },
      },
    );
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (visible) {
      refetchComments();
    }
  }, [visible, refetchComments]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="chatbubbles" size={24} color="#EF4444" />
              <Text className="font-bold text-lg text-gray-800">
                Discussion
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              {totalComments > 0 && (
                <View className="bg-red-50 rounded-full px-3 py-1">
                  <Text className="text-xs text-red-500 font-semibold">
                    {totalComments}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full active:bg-gray-200"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </Pressable>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Comments List */}
          <View className="flex-1">
            {loadingComments ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#EF4444" />
                <Text className="text-sm text-gray-500 mt-3">
                  Loading comments...
                </Text>
              </View>
            ) : commentsError ? (
              <View className="flex-1 items-center justify-center px-6">
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#EF4444"
                />
                <Text className="text-red-500 text-center mt-3">
                  Failed to load comments
                </Text>
                <Pressable
                  onPress={() => refetchComments()}
                  className="mt-4 bg-red-500 active:bg-red-600 px-6 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </Pressable>
              </View>
            ) : allComments.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={64}
                  color="#D1D5DB"
                />
                <Text className="text-base text-gray-400 mt-4 text-center">
                  No comments yet.{"\n"}Be the first to share your thoughts!
                </Text>
              </View>
            ) : (
              <LegendList
                data={allComments}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View className="px-4 pt-3">
                    <CommentItem
                      item={item}
                      currentUserId={user_id}
                      onEdit={(comment) => {
                        console.log("Edit comment", comment.id);
                      }}
                      onDelete={(commentId) => {
                        console.log("Delete comment", commentId);
                      }}
                      onReact={(commentId, reaction) => {
                        console.log("React", reaction, "on comment", commentId);
                      }}
                      onReply={(comment) => {
                        //handle switching
                        if (replyingTo) {
                          if (replyingTo.id === comment.id) {
                            // If tapping the same comment, toggle off
                            setReplyingTo(null);
                            inputRef.current?.blur();
                            return;
                          }
                        }

                        setReplyingTo({
                          id: comment.id,
                          fullname: comment.full_name,
                        });
                        inputRef.current?.focus();
                      }}
                    />
                  </View>
                )}
                estimatedItemSize={200}
                recycleItems
                contentContainerStyle={{ paddingBottom: 16 }}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View className="py-6 items-center">
                      <ActivityIndicator size="small" color="#EF4444" />
                      <Text className="text-xs text-gray-400 mt-2">
                        Loading more comments...
                      </Text>
                    </View>
                  ) : hasNextPage ? (
                    <Pressable
                      onPress={() => fetchNextPage()}
                      className="mx-4 my-4 bg-gray-100 active:bg-gray-200 py-3 rounded-lg items-center"
                    >
                      <Text className="text-gray-700 font-medium">
                        Load More Comments
                      </Text>
                    </Pressable>
                  ) : allComments.length > 0 ? (
                    <View className="py-4 items-center">
                      <Text className="text-xs text-gray-400">
                        No more comments
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/* Comment Input */}
          <View className="border-t border-gray-200 bg-white px-4 py-3">
            {replyingTo && (
              <View className="flex-row items-center justify-between bg-gray-100 px-3 py-1 rounded-xl mb-2">
                <Text className="text-gray-700 text-sm">
                  Replying to {replyingTo.fullname}
                </Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close" size={16} color="#374151" />
                </Pressable>
              </View>
            )}
            <View className="bg-gray-50 rounded-2xl p-3 border border-gray-200">
              <TextInput
                ref={inputRef}
                placeholder="Write a comment..."
                placeholderTextColor="#9CA3AF"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                className="text-gray-800 text-base max-h-24"
                style={{ textAlignVertical: "top" }}
              />

              {selectedImage && (
                <View className="mt-2 relative">
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={{ width: 100, height: 100 }}
                    className="rounded-xl"
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => setSelectedImage(null)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              )}

              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <Pressable
                  onPress={handlePickImage}
                  className="flex-row items-center bg-white active:bg-gray-100 rounded-full py-2 px-4 border border-gray-200"
                >
                  <AntDesign name="picture" size={18} color="#374151" />
                  <Text className="text-gray-700 ml-2 text-sm font-medium">
                    Photo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePostComment}
                  className="flex-row items-center bg-red-500 active:bg-red-600 rounded-full py-2 px-6"
                  disabled={
                    (!comment.trim() && !selectedImage) || postingComment
                  }
                  style={{
                    opacity:
                      (comment.trim() || selectedImage) && !postingComment
                        ? 1
                        : 0.5,
                  }}
                >
                  {postingComment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text className="text-white font-semibold mr-2">
                        Post
                      </Text>
                      <AntDesign name="send" size={14} color="white" />
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
