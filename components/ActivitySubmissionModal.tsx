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
  instanceId: number;
  onClose: () => void;
}

interface SubmitActivityPayload {
  activity_id: number;
  instance_id: number;
  submission_content: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const requestError = error as {
    message?: string;
    response?: { data?: { detail?: unknown } };
  };
  const detail = requestError?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return requestError?.message || fallback;
};

export default function ActivitySubmissionModal({
  visible,
  activity,
  instanceId,
  onClose,
}: ActivitySubmissionModalProps) {
  const activityId = activity?.activity_id;
  const [answer, setAnswer] = useState("");
  const [loadingExistingAnswer, setLoadingExistingAnswer] = useState(false);
  const [existingAnswerError, setExistingAnswerError] = useState<string | null>(
    null,
  );
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

  // Load the student's existing work for the selected course instance.
  useEffect(() => {
    setAnswer("");
    setExistingAnswerError(null);
    if (!visible) {
      setLoadingExistingAnswer(false);
      return;
    }

    if (activityId == null || instanceId <= 0) {
      setLoadingExistingAnswer(false);
      return;
    }
    let cancelled = false;
    setLoadingExistingAnswer(true);
    getData<{ submission?: { submission_content?: string } }>(
      `/activity-submissions/check/${activityId}`,
      { instance_id: instanceId },
    )
      .then((response) => {
        if (!cancelled && response.status === 200) {
          setAnswer(response.data?.submission?.submission_content ?? "");
        }
      })
      .catch((error: any) => {
        if (cancelled) return;
        if (error?.response?.status === 404) {
          setAnswer("");
          return;
        }
        setExistingAnswerError(
          getApiErrorMessage(
            error,
            "Could not load your previous work. Try again.",
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingExistingAnswer(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activityId, instanceId, visible]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: SubmitActivityPayload) => {
      try {
        const response = await postData(
          "/activity-submissions/submit",
          payload,
        );
        return response.data;
      } catch (error) {
        throw new Error(
          getApiErrorMessage(error, "Failed to submit activity. Try again."),
        );
      }
    },
    onSuccess: async (_data, payload) => {
      const matchesInstance = (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[2] === payload.instance_id;
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "module_activities" &&
            matchesInstance(query),
        }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "module_progress" &&
            matchesInstance(query),
        }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "course_progress" &&
            query.queryKey[2] === payload.instance_id,
        }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "comprehensive_grades" &&
            matchesInstance(query),
        }),
      ]);

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
      instance_id: instanceId,
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

                {existingAnswerError ? (
                  <View className="border rounded-lg p-3 mb-4" style={{ backgroundColor: theme.surfaceAccent, borderColor: theme.danger }}>
                    <Text className="text-sm" style={{ color: theme.danger }}>
                      {existingAnswerError}
                    </Text>
                  </View>
                ) : null}

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
                        !submitMutation.isPending &&
                        !loadingExistingAnswer &&
                        !existingAnswerError
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
                  loadingExistingAnswer ||
                  existingAnswerError !== null
                }
                className="flex-1 rounded-lg py-3 items-center flex-row justify-center"
                style={{
                  backgroundColor:
                    !answer.trim() ||
                    submitMutation.isPending ||
                    loadingExistingAnswer ||
                    existingAnswerError !== null
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
