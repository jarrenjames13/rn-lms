import { createInfiniteRepliesOptions } from "@/api/QueryOptions/repliesOptions";
import { Comment, Replies } from "@/types/api";
import { getAccessToken } from "@/utils/accessToken";
import { getData } from "@/utils/fetcher";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCommentImage(commentId: number, hasFile: boolean) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFile || !commentId) return;

    getData<{ image_url: string }>(`/comment-section/images/${commentId}`)
      .then((res) => setImageUrl(res.data.image_url))
      .catch((err) => {
        console.log(`Failed to load image for comment ${commentId}:`, err);
        setImageUrl(null);
      });
  }, [commentId, hasFile]);

  return imageUrl;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CommentData = Comment["comments"][number];
type ReplyData = Replies["replies"][number];
type EditTarget = { id: number; comment: string };
type PickerState = "idle" | "drag" | "tap";

const REACTIONS = [
  { emoji: "👍", key: "like" as const, label: "Like" },
  { emoji: "❤️", key: "love" as const, label: "Love" },
  { emoji: "😆", key: "haha" as const, label: "Haha" },
  { emoji: "😮", key: "wow" as const, label: "Wow" },
  { emoji: "😢", key: "sad" as const, label: "Sad" },
  { emoji: "👎", key: "dislike" as const, label: "Dislike" },
] as const;

const CANCEL_SLOP = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTopReactions(item: CommentData | ReplyData) {
  return REACTIONS.map((r) => ({ ...r, count: item[r.key] }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function getTotalReactions(item: CommentData | ReplyData) {
  return item.like + item.love + item.haha + item.wow + item.sad + item.dislike;
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

// ─── ReactionPicker ───────────────────────────────────────────────────────────
function ReactionPicker({
  visible,
  triggerPageY,
  triggerPageX,
  onSelect,
  onDismiss,
}: {
  visible: boolean;
  triggerPageY: number;
  triggerPageX: number;
  onSelect: (key: string) => void;
  onDismiss: () => void;
}) {
  // All animated values in a single stable ref — fixes exhaustive-deps warnings
  const animValues = useRef({
    pickerOpacity: new Animated.Value(0),
    pickerScale: new Animated.Value(0.8),
    pickerTranslateY: new Animated.Value(10),
    items: REACTIONS.map(() => ({
      scale: new Animated.Value(1),
      translateY: new Animated.Value(0),
      labelOpacity: new Animated.Value(0),
    })),
  });

  const [pickerState, setPickerState] = useState<PickerState>("idle");
  const stateRef = useRef<PickerState>("idle");
  const hoveredIdxRef = useRef<number | null>(null);

  const pickerLayout = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const pickerViewRef = useRef<View>(null);

  // T[] instead of Array<T>
  const itemLayouts = useRef<
    ({ x: number; y: number; w: number; h: number } | null)[]
  >(REACTIONS.map(() => null)).current;
  const itemRefs = useRef<(View | null)[]>(REACTIONS.map(() => null)).current;

  const setState = (s: PickerState) => {
    stateRef.current = s;
    setPickerState(s);
  };

  // ── Animate picker in ──────────────────────────────────────────────────────
  // Reading from animValues.current inside the effect so they're not deps
  useEffect(() => {
    if (!visible) return;
    const { pickerOpacity, pickerScale, pickerTranslateY } = animValues.current;
    setState("drag");
    pickerOpacity.setValue(0);
    pickerScale.setValue(0.8);
    pickerTranslateY.setValue(10);
    Animated.parallel([
      Animated.spring(pickerScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 15,
      }),
      Animated.timing(pickerOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(pickerTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 200,
        friction: 15,
      }),
    ]).start();
  }, [visible]); // animValues is a stable ref — no lint warning

  // ── Animate picker out ─────────────────────────────────────────────────────
  const animateOut = useCallback((cb?: () => void) => {
    const { pickerOpacity, pickerScale, pickerTranslateY } = animValues.current;
    Animated.parallel([
      Animated.timing(pickerScale, {
        toValue: 0.8,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pickerOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pickerTranslateY, {
        toValue: 10,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }, []);

  // ── Animate hover ──────────────────────────────────────────────────────────
  const animateHover = useCallback((idx: number | null) => {
    const { items } = animValues.current;
    REACTIONS.forEach((_, i) => {
      const isTarget = i === idx;
      Animated.parallel([
        Animated.spring(items[i].scale, {
          toValue: isTarget ? 1.55 : 1,
          useNativeDriver: true,
          tension: 220,
          friction: 10,
        }),
        Animated.spring(items[i].translateY, {
          toValue: isTarget ? -10 : 0,
          useNativeDriver: true,
          tension: 220,
          friction: 10,
        }),
        Animated.timing(items[i].labelOpacity, {
          toValue: isTarget ? 1 : 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // ── Hit testing ────────────────────────────────────────────────────────────
  const getReactionIdxAt = useCallback(
    (x: number, y: number) => {
      const pad = 14;
      for (let i = 0; i < itemLayouts.length; i++) {
        const l = itemLayouts[i];
        if (!l) continue;
        if (
          x >= l.x - pad &&
          x <= l.x + l.w + pad &&
          y >= l.y - pad &&
          y <= l.y + l.h + pad
        )
          return i;
      }
      return null;
    },
    [itemLayouts],
  );

  const isInsidePicker = useCallback((x: number, y: number) => {
    const l = pickerLayout.current;
    if (!l) return false;
    return (
      x >= l.x - CANCEL_SLOP &&
      x <= l.x + l.w + CANCEL_SLOP &&
      y >= l.y - CANCEL_SLOP &&
      y <= l.y + l.h + CANCEL_SLOP
    );
  }, []);

  // ── Select / dismiss ───────────────────────────────────────────────────────
  const dismiss = useCallback(
    (cb?: () => void) => {
      animateOut(() => {
        setState("idle");
        hoveredIdxRef.current = null;
        animateHover(null);
        cb?.();
      });
    },
    [animateOut, animateHover],
  );

  const selectReaction = useCallback(
    (key: string) => {
      dismiss(() => onSelect(key));
    },
    [dismiss, onSelect],
  );

  // ── PanResponder ───────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stateRef.current === "drag",
      onMoveShouldSetPanResponder: () => stateRef.current === "drag",
      onPanResponderMove: (_, g) => {
        if (stateRef.current !== "drag") return;
        const idx = getReactionIdxAt(g.moveX, g.moveY);
        if (idx !== hoveredIdxRef.current) {
          hoveredIdxRef.current = idx;
          animateHover(idx);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (stateRef.current !== "drag") return;
        const idx = getReactionIdxAt(g.moveX, g.moveY);
        if (idx !== null) {
          selectReaction(REACTIONS[idx].key);
          return;
        }
        if (isInsidePicker(g.moveX, g.moveY)) {
          setState("tap");
          hoveredIdxRef.current = null;
          animateHover(null);
          return;
        }
        dismiss(onDismiss);
      },
      onPanResponderTerminate: () => dismiss(onDismiss),
    }),
  ).current;

  // ── Measure picker + items ─────────────────────────────────────────────────
  const measureAll = () => {
    pickerViewRef.current?.measure((_, __, w, h, pageX, pageY) => {
      pickerLayout.current = { x: pageX, y: pageY, w, h };
    });
    itemRefs.forEach((ref, i) => {
      ref?.measure((_, __, w, h, pageX, pageY) => {
        itemLayouts[i] = { x: pageX, y: pageY, w, h };
      });
    });
  };

  if (!visible) return null;

  const pickerTop = triggerPageY - 64 - 8; // picker height ~64 + 8px gap

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <View
        style={StyleSheet.absoluteFill}
        {...(pickerState === "drag" ? panResponder.panHandlers : {})}
      >
        {pickerState === "tap" && (
          <TouchableWithoutFeedback onPress={() => dismiss(onDismiss)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        )}

        <Animated.View
          ref={pickerViewRef}
          onLayout={() => {
            setTimeout(measureAll, 80);
          }}
          style={[
            styles.picker,
            {
              position: "absolute",
              top: pickerTop,
              left: Math.max(8, triggerPageX - 16),
              opacity: animValues.current.pickerOpacity,
              transform: [
                { scale: animValues.current.pickerScale },
                { translateY: animValues.current.pickerTranslateY },
              ],
            },
          ]}
        >
          {REACTIONS.map((r, i) => (
            <Animated.View
              key={r.key}
              ref={(ref) => {
                itemRefs[i] = ref as View | null;
              }}
              style={[
                styles.reactionItem,
                {
                  transform: [
                    { scale: animValues.current.items[i].scale },
                    { translateY: animValues.current.items[i].translateY },
                  ],
                },
              ]}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Animated.Text
                style={[
                  styles.reactionLabel,
                  { opacity: animValues.current.items[i].labelOpacity },
                ]}
              >
                {r.label}
              </Animated.Text>

              {pickerState === "tap" && (
                <TouchableWithoutFeedback
                  onPress={() => selectReaction(r.key)}
                  onPressIn={() => {
                    animateHover(i);
                  }}
                  onPressOut={() => {
                    animateHover(null);
                  }}
                >
                  <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
              )}
            </Animated.View>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── ActionRow ────────────────────────────────────────────────────────────────
function ActionRow({
  item,
  isOwner,
  onReact,
  onShowAllReactions,
  onReply,
  onEdit,
  onDelete,
}: {
  item: CommentData | ReplyData;
  isOwner?: boolean;
  onReact?: (key: string) => void;
  onShowAllReactions?: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const likeBtnRef = useRef<View>(null);
  const [triggerPos, setTriggerPos] = useState({ x: 0, y: 0 });

  const userReaction = REACTIONS.find((r) => r.key === item.user_reaction);

  const openPicker = () => {
    likeBtnRef.current?.measure((_, __, _w, _h, pageX, pageY) => {
      setTriggerPos({ x: pageX, y: pageY });
      setPickerVisible(true);
    });
  };

  const handleSelect = (key: string) => {
    setPickerVisible(false);
    onReact?.(key === item.user_reaction ? "" : key);
  };

  return (
    <>
      <View style={styles.actionRow}>
        {/* Like button */}
        <View ref={likeBtnRef} collapsable={false}>
          <Pressable
            onPress={() => {
              if (!pickerVisible) onReact?.(item.user_reaction ? "" : "like");
            }}
            onLongPress={openPicker}
            delayLongPress={400}
            style={[
              styles.actionBtn,
              item.user_reaction ? styles.actionBtnActive : undefined,
            ]}
          >
            <Text style={styles.actionIcon}>
              {userReaction ? userReaction.emoji : "👍"}
            </Text>
            <Text
              style={[
                styles.actionLabel,
                item.user_reaction ? styles.actionLabelActive : undefined,
              ]}
            >
              {userReaction ? userReaction.label : "Like"}
            </Text>
          </Pressable>
        </View>

        {/* Reply */}
        {onReply && (
          <Pressable onPress={onReply} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={13} color="#6B7280" />
            <Text style={styles.actionLabel}>Reply</Text>
          </Pressable>
        )}

        {/* Edit / Delete */}
        {isOwner && (
          <>
            <Pressable onPress={onEdit} style={styles.actionBtn}>
              <MaterialIcons name="edit" size={13} color="#6B7280" />
              <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={styles.actionBtn}>
              <MaterialIcons name="delete-outline" size={13} color="#EF4444" />
              <Text style={[styles.actionLabel, { color: "#EF4444" }]}>
                Delete
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <ReactionPicker
        visible={pickerVisible}
        triggerPageY={triggerPos.y}
        triggerPageX={triggerPos.x}
        onSelect={handleSelect}
        onDismiss={() => setPickerVisible(false)}
      />
    </>
  );
}

// Helper to render reaction count pill
function ReactionCount({
  item,
  onPress,
}: {
  item: CommentData | ReplyData;
  onPress?: () => void;
}) {
  const topReactions = getTopReactions(item);
  const totalReactions = getTotalReactions(item);

  if (totalReactions === 0) return null;

  return (
    <Pressable onPress={onPress} style={styles.reactionPillAbove}>
      {topReactions.map((r) => (
        <Text key={r.key} style={styles.pillEmoji}>
          {r.emoji}
        </Text>
      ))}
      <Text style={styles.pillCount}>{totalReactions}</Text>
    </Pressable>
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
  onShowAllReactions,
}: {
  reply: ReplyData;
  accessToken: string | null;
  currentUserId?: number;
  onEdit?: (item: EditTarget) => void;
  onDelete?: (replyId: number) => void;
  onReact?: (replyId: number, reaction: string) => void;
  onReply?: (target: { id: number; full_name: string }) => void;
  onShowAllReactions?: (replyId: number) => void;
}) {
  const imageUrl = useCommentImage(reply.id, !!(reply.file_path?.trim()));
  const isOwner = currentUserId === reply.user_id;
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <View style={styles.replyContainer}>
      {reply.mentioned_user_name && (
        <Text style={styles.replyingTo}>
          ↩ replying to @{reply.mentioned_user_name}
        </Text>
      )}

      <View style={styles.replyHeader}>
        <View style={styles.rowCenter}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>
              {reply.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>{reply.full_name}</Text>
        </View>
        <View style={styles.rowCenter}>
          {reply.updated_at && (
            <View style={styles.editedBadge}>
              <Text style={styles.editedText}>edited</Text>
            </View>
          )}
          <Text style={styles.timestamp}>{formatDate(reply.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.commentBody}>{reply.comment}</Text>

      {reply.file_path && imageUrl && (
        <>
          <Pressable onPress={() => setShowImageModal(true)}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.attachedImage}
              contentFit="contain"
            />
          </Pressable>
          <Modal
            visible={showImageModal}
            transparent
            onRequestClose={() => setShowImageModal(false)}
          >
            <Pressable
              style={styles.imageModalOverlay}
              onPress={() => setShowImageModal(false)}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullImage}
                contentFit="contain"
              />
            </Pressable>
          </Modal>
        </>
      )}

      <ReactionCount
        item={reply}
        onPress={() => onShowAllReactions?.(reply.id)}
      />

      <View style={styles.divider} />

      <ActionRow
        item={reply}
        isOwner={isOwner}
        onReact={(key) => onReact?.(reply.id, key)}
        onShowAllReactions={() => onShowAllReactions?.(reply.id)}
        onReply={() => onReply?.({ id: reply.id, full_name: reply.full_name })}
        onEdit={() => onEdit?.({ id: reply.id, comment: reply.comment })}
        onDelete={() => onDelete?.(reply.id)}
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
  onDelete,
  onEdit,
  onReact,
  onShowAllReactions,
}: {
  parentId: number;
  accessToken: string | null;
  currentUserId?: number;
  onReply?: (target: { id: number; full_name: string }) => void;
  onDelete?: (replyId: number) => void;
  onEdit?: (item: EditTarget) => void;
  onReact?: (replyId: number, reaction: string) => void;
  onShowAllReactions?: (replyId: number) => void;
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

  if (isLoading) {
    return (
      <View style={styles.repliesLoader}>
        <ActivityIndicator size="small" color="#EF4444" />
      </View>
    );
  }
  if (error) {
    return <Text style={styles.repliesError}>Failed to load replies.</Text>;
  }

  return (
    <View>
      {allReplies.map((reply) => (
        <ReplyItem
          key={reply.id}
          reply={reply}
          accessToken={accessToken}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
          onReact={onReact}
          onShowAllReactions={onShowAllReactions}
        />
      ))}

      {isFetchingNextPage ? (
        <View style={styles.repliesLoader}>
          <ActivityIndicator size="small" color="#EF4444" />
          <Text style={styles.loadMoreText}>Loading more...</Text>
        </View>
      ) : hasNextPage ? (
        <Pressable onPress={() => fetchNextPage()} style={styles.loadMoreBtn}>
          <Text style={styles.loadMoreBtnText}>Load more replies</Text>
        </Pressable>
      ) : allReplies.length > 0 ? (
        <Text style={styles.noMoreText}>No more replies</Text>
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
  onShowAllReactions,
}: {
  item: CommentData;
  currentUserId?: number;
  onEdit?: (item: EditTarget) => void;
  onDelete?: (commentId: number) => void;
  onReact?: (commentId: number, reaction: string) => void;
  onReply?: (target: { id: number; full_name: string }) => void;
  onShowAllReactions?: (commentId: number) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const imageUrl = useCommentImage(item.id, !!(item.file_path?.trim()));
  const isOwner = currentUserId === item.user_id;
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    getAccessToken().then(setAccessToken);
  }, []);

  return (
    <View style={styles.commentCard}>
      {/* Header */}
      <View style={styles.commentHeader}>
        <View style={styles.rowCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{item.full_name}</Text>
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        {item.updated_at && (
          <View style={styles.editedBadge}>
            <Text style={styles.editedText}>edited</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <Text style={styles.commentBody}>{item.comment}</Text>

      {item.file_path && imageUrl && (
        <>
          <Pressable onPress={() => setShowImageModal(true)}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.attachedImageLarge}
              contentFit="cover"
            />
          </Pressable>
          <Modal
            visible={showImageModal}
            transparent
            onRequestClose={() => setShowImageModal(false)}
          >
            <Pressable
              style={styles.imageModalOverlay}
              onPress={() => setShowImageModal(false)}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullImage}
                contentFit="contain"
              />
            </Pressable>
          </Modal>
        </>
      )}

      <ReactionCount
        item={item}
        onPress={() => onShowAllReactions?.(item.id)}
      />

      <View style={styles.divider} />

      <ActionRow
        item={item}
        isOwner={isOwner}
        onReact={(key) => onReact?.(item.id, key)}
        onShowAllReactions={() => onShowAllReactions?.(item.id)}
        onReply={() => {
          onReply?.({ id: item.id, full_name: item.full_name });
          if (item.total_replies > 0) setShowReplies(true);
        }}
        onEdit={() => onEdit?.({ id: item.id, comment: item.comment })}
        onDelete={() => onDelete?.(item.id)}
      />

      {item.total_replies > 0 && (
        <Pressable
          onPress={() => setShowReplies((v) => !v)}
          style={styles.repliesToggle}
        >
          <Ionicons
            name={showReplies ? "chevron-up" : "chevron-down"}
            size={13}
            color="#EF4444"
          />
          <Text style={styles.repliesToggleText}>
            {showReplies
              ? "Hide"
              : `${item.total_replies} Repl${item.total_replies === 1 ? "y" : "ies"}`}
          </Text>
        </Pressable>
      )}

      {showReplies && (
        <RepliesSection
          parentId={item.id}
          accessToken={accessToken}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
          onReact={onReact}
          onShowAllReactions={onShowAllReactions}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Picker
  picker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  reactionItem: {
    width: 44,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmoji: { fontSize: 28, lineHeight: 34 },
  reactionLabel: {
    position: "absolute",
    bottom: -18,
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },

  // Action row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 4,
    marginTop: 6,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  reactionPillAbove: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  pillEmoji: { fontSize: 13 },
  pillCount: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginLeft: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  actionBtnActive: { backgroundColor: "#FEE2E2" },
  actionIcon: { fontSize: 13 },
  actionLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  actionLabelActive: { color: "#EF4444" },

  // Comment card
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  authorName: { fontSize: 13, fontWeight: "600", color: "#1F2937" },
  timestamp: { fontSize: 11, color: "#9CA3AF" },
  editedBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  editedText: { fontSize: 10, color: "#9CA3AF" },
  commentBody: { fontSize: 13, color: "#374151", lineHeight: 20 },
  attachedImage: { width: 140, height: 140, borderRadius: 10, marginTop: 8 },
  attachedImageLarge: {
    width: 140,
    height: 192,
    borderRadius: 10,
    marginTop: 10,
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 10 },
  repliesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-end",
  },
  repliesToggleText: { fontSize: 11, color: "#EF4444", fontWeight: "600" },

  // Reply
  replyContainer: {
    marginLeft: 28,
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  replyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  replyingTo: {
    fontSize: 10,
    color: "#F87171",
    fontWeight: "500",
    marginBottom: 4,
  },
  avatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: { fontSize: 9, fontWeight: "700", color: "#EF4444" },

  // Replies section
  repliesLoader: { marginLeft: 28, marginTop: 10, alignItems: "center" },
  repliesError: {
    marginLeft: 28,
    marginTop: 8,
    fontSize: 11,
    color: "#F87171",
  },
  loadMoreBtn: {
    marginLeft: 28,
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  loadMoreBtnText: { fontSize: 11, color: "#6B7280", fontWeight: "500" },
  loadMoreText: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  noMoreText: { marginLeft: 28, marginTop: 6, fontSize: 11, color: "#9CA3AF" },
  
  // Image modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
  },
});
