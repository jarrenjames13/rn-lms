import { SingleActivity } from "@/types/api";
import { getData, postData } from "@/utils/fetcher";
import { HTMLContent } from "@/utils/RenderHTML";
import { showToast } from "@/utils/toast/toast";
import { useAppTheme } from "@/theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActivitySubmissionModalProps {
  visible: boolean;
  activity: SingleActivity | null;
  onClose: () => void;
}

interface SubmitActivityPayload {
  activity_id: number;
  submission_content: string;
}

export default function ActivitySubmissionModal({
  visible,
  activity,
  onClose,
}: ActivitySubmissionModalProps) {
  const [answer, setAnswer] = useState("");
  const [loadingExistingAnswer, setLoadingExistingAnswer] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const { theme } = useAppTheme();

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          300,
        );
      },
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const queryClient = useQueryClient();

  // Reset answer when modal opens/closes or activity changes
  useEffect(() => {
    if (!visible) {
      setAnswer("");
      return;
    }

    if (!activity) return;
    let cancelled = false;
    setLoadingExistingAnswer(true);
    getData<{ submission?: { submission_content?: string } }>(
      `/modules/activity-submissions/check/${activity.activity_id}`,
    )
      .then((response) => {
        if (!cancelled && response.status === 200) {
          setAnswer(response.data?.submission?.submission_content ?? "");
        }
      })
      .catch(() => {
        // A missing submission is expected for first-time activity work.
      })
      .finally(() => {
        if (!cancelled) setLoadingExistingAnswer(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activity, visible]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: SubmitActivityPayload) => {
      try {
        const response = await postData(
          "modules/activity-submissions/submit",
          payload,
        );
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error("Failed to submit activity");
        }
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate activities queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["module_activities"] });

      setAnswer("");
      submitMutation.reset();
      showToast({
        type: "success",
        title: "Activity submitted successfully!",
        message: "Your activity has been submitted and is pending review.",
      });

      onClose();
    },
  });

  const handleSubmit = () => {
    if (!activity || !answer.trim()) return;

    submitMutation.mutate({
      activity_id: activity.activity_id,
      submission_content: answer.trim(),
    });
  };

  if (!activity) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          className="flex-1 w-full justify-end"
        >
          <View
            className="rounded-t-3xl flex-1"
            style={{
              backgroundColor: theme.surface,
              maxHeight: keyboardVisible
                ? Math.max(280, windowHeight - insets.top - 8)
                : windowHeight * 0.9,
              marginTop: 8,
            }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b" style={{ borderColor: theme.border }}>
              <Text className="text-lg font-bold flex-1 pr-4" style={{ color: theme.text }}>
                {activity.has_submission && !activity.is_graded
                  ? "Resubmit Activity"
                  : "Submit Activity"}
              </Text>
              <Pressable
                onPress={onClose}
                disabled={submitMutation.isPending}
                className="w-8 h-8 items-center justify-center"
              >
                <Text className="text-2xl" style={{ color: theme.textMuted }}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{
                paddingBottom: keyboardVisible ? keyboardHeight : 16,
              }}
              onContentSizeChange={() => {
                if (keyboardVisible) {
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({ animated: true }),
                    100,
                  );
                }
              }}
            >
              <View className="p-5">
                {/* Activity Title */}
                <Text className="text-base font-semibold mb-3" style={{ color: theme.text }}>
                  {activity.title}
                </Text>

                {/* Activity Type Badge */}
                <View className="flex-row mb-4">
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: theme.surfaceMuted }}>
                    <Text className="text-xs font-medium capitalize" style={{ color: theme.primary }}>
                      {activity.activity_type}
                    </Text>
                  </View>
                </View>

                {/* Instructions */}
                <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.surfaceAccent }}>
                  <Text className="text-sm font-semibold mb-2" style={{ color: theme.text }}>
                    Instructions:
                  </Text>
                  <HTMLContent htmlContent={activity.instructions} />
                </View>

                {/* Answer Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: theme.text }}>
                    Your Answer: <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                  <View className="border rounded-lg" style={{ backgroundColor: theme.canvas, borderColor: theme.border }}>
                    <TextInput
                      className="p-4 text-base h-40"
                      placeholder="Type your answer here..."
                      placeholderTextColor={theme.textMuted}
                      style={{ color: theme.text }}
                      multiline
                      textAlignVertical="top"
                      value={answer}
                      onChangeText={setAnswer}
                      onFocus={() =>
                        setTimeout(
                          () =>
                            scrollRef.current?.scrollToEnd({ animated: true }),
                          500,
                        )
                      }
                      editable={
                        !submitMutation.isPending && !loadingExistingAnswer
                      }
                    />
                  </View>
                  <Text className="text-xs mt-1" style={{ color: theme.textMuted }}>
                    {answer.length} characters
                  </Text>
                </View>

                {/* Error Message */}
                {submitMutation.isError && (
                  <View className="border rounded-lg p-3 mb-4" style={{ backgroundColor: theme.surfaceAccent, borderColor: theme.danger }}>
                    <Text className="text-sm" style={{ color: theme.danger }}>
                      {submitMutation.error instanceof Error
                        ? submitMutation.error.message
                        : "Failed to submit. Please try again."}
                    </Text>
                  </View>
                )}

                {/* Success Message */}
                {submitMutation.isSuccess && (
                  <View className="border rounded-lg p-3 mb-4" style={{ backgroundColor: theme.surfaceMuted, borderColor: theme.success }}>
                    <Text className="text-sm" style={{ color: theme.success }}>
                      Activity submitted successfully!
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View
              className="p-5 border-t flex-row gap-3"
              style={{ paddingBottom: Math.max(insets.bottom, 20), borderColor: theme.border }}
            >
              <Pressable
                onPress={onClose}
                disabled={submitMutation.isPending}
                className="flex-1 rounded-lg py-3 items-center"
                style={{ backgroundColor: theme.surfaceMuted }}
              >
                <Text className="text-base font-semibold" style={{ color: theme.text }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={
                  !answer.trim() ||
                  submitMutation.isPending ||
                  loadingExistingAnswer
                }
                className="flex-1 rounded-lg py-3 items-center flex-row justify-center"
                style={{
                  backgroundColor:
                    !answer.trim() || submitMutation.isPending || loadingExistingAnswer
                      ? theme.tabInactive
                      : theme.primary,
                }}
              >
                {submitMutation.isPending ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white ml-2">
                      Submitting...
                    </Text>
                  </>
                ) : (
                  <Text className="text-base font-semibold text-white">
                    {activity.has_submission && !activity.is_graded
                      ? "Resubmit"
                      : "Submit"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
