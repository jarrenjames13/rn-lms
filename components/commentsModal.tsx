import { usePostComment } from "@/api/QueryOptions/commentMutation";
import { createInfiniteCommentsOptions } from "@/api/QueryOptions/commentsOptions";
import { useCommentReactions } from "@/api/QueryOptions/commentsReactionMutation";
import { useDeleteCommentReaction } from "@/api/QueryOptions/deleteCommentReactionMutation";
import { useSoftDeleteComment } from "@/api/QueryOptions/softDeleteCommentMutation";
import { useUpdateComment } from "@/api/QueryOptions/updateCommentMutation";
import CommentItem from "@/components/commentItem";
import CommentReactionsModal from "@/components/commentReactionsModal";
import { useAuth } from "@/context/authContext";
import { useAppTheme } from "@/theme";
import { COMMENT_EVENTS, sseService } from "@/api/services/sseService";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
import ConfirmDeleteModal from "./confirmDeleteModal";
import EditCommentModal from "./editCommentModal";

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  instanceId: number;
  moduleId?: number;
}

export default function CommentsModal({
  visible,
  onClose,
  instanceId,
  moduleId,
}: CommentsModalProps) {
  const [comment, setComment] = useState<string>("");
  const { authState } = useAuth();
  const { mutate: postComment, isPending: postingComment } = usePostComment();
  const { mutate: deleteComment, isPending: deletingComment } =
    useSoftDeleteComment();
  const { mutate: updateComment, isPending: updatingComment } =
    useUpdateComment();
  const { mutate: reactToComment } = useCommentReactions();
  const { mutate: unreactToComment } = useDeleteCommentReaction();
  const [editTarget, setEditTarget] = useState<{
    id: number;
    text: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reactionsModalData, setReactionsModalData] = useState<{
    commentId: number;
  } | null>(null);

  const user_id = authState?.user?.user_id;
  const queryClient = useQueryClient();
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
  const { theme } = useAppTheme();

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
    {
      ...createInfiniteCommentsOptions(
        instanceId,
        moduleId,
        COMMENTS_PER_PAGE,
      ),
      enabled: visible && !!instanceId,
    },
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
          module_id: moduleId,
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

  const handleDeleteRequest = (commentId: number) => {
    setDeleteTarget(commentId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteComment(deleteTarget, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        refetchComments();
      },
      onError: (error) => {
        console.error("Failed to delete comment:", error);
        setShowDeleteModal(false);
      },
    });
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleEditRequest = (commentId: number, currentText: string) => {
    setEditTarget({ id: commentId, text: currentText });
  };

  const handleConfirmEdit = (newText: string) => {
    if (!editTarget) return;
    updateComment(
      {
        comment_id: editTarget.id,
        payload: { comment: newText }, // 👈 wrap in payload
      },
      {
        onSuccess: () => {
          setEditTarget(null);
          refetchComments();
        },
        onError: (error) => {
          console.error("Failed to update comment:", error);
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
    if (!visible) return;
    void sseService.reconnectWith(instanceId, moduleId);
    const unsubscribers = COMMENT_EVENTS.map((type) =>
      sseService.onCommentEvent(type, () => {
        void queryClient.invalidateQueries({ queryKey: ["comments", instanceId, moduleId] });
      }),
    );
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      void sseService.reconnectWith(undefined, undefined);
    };
  }, [instanceId, moduleId, queryClient, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.surface }}>
        {/* Header */}
        <View className="border-b px-4 py-3" style={{ borderColor: theme.border }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="chatbubbles" size={24} color={theme.school} />
              <Text className="font-bold text-lg" style={{ color: theme.text }}>
                Discussion
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              {totalComments > 0 && (
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: theme.surfaceAccent }}>
                  <Text className="text-xs font-semibold" style={{ color: theme.school }}>
                    {totalComments}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full"
                style={({ pressed }) => ({ backgroundColor: pressed ? theme.border : theme.surfaceMuted })}
              >
                <Ionicons name="close" size={20} color={theme.text} />
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
                <ActivityIndicator size="large" color={theme.school} />
                <Text className="text-sm mt-3" style={{ color: theme.textMuted }}>
                  Loading comments...
                </Text>
              </View>
            ) : commentsError ? (
              <View className="flex-1 items-center justify-center px-6">
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={theme.danger}
                />
                <Text className="text-center mt-3" style={{ color: theme.danger }}>
                  Failed to load comments
                </Text>
                <Pressable
                  onPress={() => refetchComments()}
                  className="mt-4 px-6 py-2 rounded-lg"
                  style={({ pressed }) => ({ backgroundColor: pressed ? theme.primaryPressed : theme.school })}
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </Pressable>
              </View>
            ) : allComments.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={64}
                  color={theme.tabInactive}
                />
                <Text className="text-base mt-4 text-center" style={{ color: theme.textMuted }}>
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
                        handleEditRequest(comment.id, comment.comment);
                      }}
                      onDelete={(commentId) => {
                        handleDeleteRequest(commentId);
                      }}
                      onReact={(commentId, reaction) => {
                        if (reaction === "") {
                          // Unreact
                          unreactToComment(commentId);
                        } else {
                          // React
                          reactToComment({
                            comment_id: commentId,
                            payload: { reaction_type: reaction },
                          });
                        }
                      }}
                      onShowAllReactions={(commentId) => {
                        setReactionsModalData({ commentId });
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
                      <ActivityIndicator size="small" color={theme.school} />
                      <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>
                        Loading more comments...
                      </Text>
                    </View>
                  ) : hasNextPage ? (
                    <Pressable
                      onPress={() => fetchNextPage()}
                      className="mx-4 my-4 py-3 rounded-lg items-center"
                      style={({ pressed }) => ({ backgroundColor: pressed ? theme.border : theme.surfaceMuted })}
                    >
                      <Text className="font-medium" style={{ color: theme.text }}>
                        Load More Comments
                      </Text>
                    </Pressable>
                  ) : allComments.length > 0 ? (
                    <View className="py-4 items-center">
                      <Text className="text-xs" style={{ color: theme.textMuted }}>
                        No more comments
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/* Comment Input */}
          <View className="border-t px-4 py-3" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            {replyingTo && (
              <View className="flex-row items-center justify-between px-3 py-1 rounded-xl mb-2" style={{ backgroundColor: theme.surfaceMuted }}>
                <Text className="text-sm" style={{ color: theme.text }}>
                  Replying to {replyingTo.fullname}
                </Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close" size={16} color={theme.text} />
                </Pressable>
              </View>
            )}
            <View className="rounded-2xl p-3 border" style={{ backgroundColor: theme.canvas, borderColor: theme.border }}>
              <TextInput
                ref={inputRef}
                placeholder="Write a comment..."
                placeholderTextColor={theme.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                className="text-base max-h-24"
                style={{ textAlignVertical: "top", color: theme.text }}
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

              <View className="flex-row justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
                <Pressable
                  onPress={handlePickImage}
                  className="flex-row items-center rounded-full py-2 px-4 border"
                  style={({ pressed }) => ({ backgroundColor: pressed ? theme.surfaceMuted : theme.surface, borderColor: theme.border })}
                >
                  <AntDesign name="picture" size={18} color={theme.text} />
                  <Text className="ml-2 text-sm font-medium" style={{ color: theme.text }}>
                    Photo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePostComment}
                  className="flex-row items-center rounded-full py-2 px-6"
                  disabled={
                    (!comment.trim() && !selectedImage) || postingComment
                  }
                  style={({ pressed }) => ({
                    opacity: (comment.trim() || selectedImage) && !postingComment ? 1 : 0.5,
                    backgroundColor: pressed ? theme.primaryPressed : theme.school,
                  })}
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

      <ConfirmDeleteModal
        visible={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deletingComment}
        title="Delete Comment?"
        description="This action cannot be undone. The comment will be permanently removed."
      />

      <EditCommentModal
        visible={!!editTarget}
        initialText={editTarget?.text ?? ""}
        onConfirm={handleConfirmEdit}
        onCancel={() => setEditTarget(null)}
        isLoading={updatingComment}
      />

      {reactionsModalData && (
        <CommentReactionsModal
          visible={!!reactionsModalData}
          onClose={() => setReactionsModalData(null)}
          commentId={reactionsModalData.commentId}
        />
      )}
    </Modal>
  );
}
