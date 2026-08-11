import { ExamSubmitResponse } from "@/api/QueryOptions/examAnswersMutation";
import { useAppTheme } from "@/theme";
import { useAsyncAction } from "@/utils/useAsyncAction";

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface ExamSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  submissionReason: string;
  resultData?: ExamSubmitResponse;
  isLoading?: boolean;
}

export default function ExamSubmissionModal({
  visible,
  onClose,
  submissionReason,
  resultData,
  isLoading = false,
}: ExamSubmissionModalProps) {
  const { theme } = useAppTheme();
  const { isPending: isClosing, run: close } = useAsyncAction();
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return theme.success;
    if (percentage >= 60) return theme.warning;
    return theme.danger;
  };
  let reasonText = "";

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return theme.surfaceMuted;
    if (percentage >= 60) return theme.surfaceAccent;
    return theme.surfaceAccent;
  };

  if (!visible) return null;

  if (submissionReason === "time_expired") {
    reasonText = "Time ran out (120 minutes)";
  } else if (submissionReason === "tab_switch") {
    reasonText = "Submitted automatically because the app was left";
  } else if (submissionReason === "navigation_attempt") {
    reasonText = "Submitted automatically because navigation was attempted";
  } else if (submissionReason === "manual") {
    reasonText = "Manually submitted by user";
  } else {
    reasonText = submissionReason;
  }
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => undefined}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="rounded-2xl w-full max-w-md p-6" style={{ backgroundColor: theme.surface }}>
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={theme.primary} />
              <Text className="mt-4 text-center" style={{ color: theme.textMuted }}>
                Submitting your exam...
              </Text>
            </View>
          ) : resultData ? (
            <>
              {/* Header */}
              <View className="items-center mb-6">
                <View className="p-4 rounded-full mb-3" style={{ backgroundColor: theme.surfaceMuted }}>
                  <Ionicons name="checkmark-circle" size={48} color={theme.success} />
                </View>
                <Text className="text-2xl font-bold" style={{ color: theme.text }}>
                  Exam Submitted!
                </Text>
                <Text className="text-sm mt-1" style={{ color: theme.textMuted }}>{reasonText}</Text>
              </View>

              {/* Score Display */}
              <View
                className="p-6 rounded-xl mb-6"
                style={{ backgroundColor: getScoreBgColor(resultData.score) }}
              >
                <Text className="text-center mb-2" style={{ color: theme.textMuted }}>
                  Your Score
                </Text>
                <Text
                  className="text-center text-5xl font-bold"
                  style={{ color: getScoreColor(resultData.score) }}
                >
                  {Math.round(resultData.score)}%
                </Text>
                <Text className="text-center mt-2" style={{ color: theme.textMuted }}>
                  {resultData.correct_answers} out of{" "}
                  {resultData.total_questions} correct
                </Text>
              </View>

              {/* Statistics */}
              <View className="space-y-3 mb-6">
                <View className="flex-row justify-between items-center py-2 border-b" style={{ borderColor: theme.border }}>
                  <Text style={{ color: theme.textMuted }}>Correct Answers</Text>
                  <Text className="font-semibold" style={{ color: theme.success }}>
                    {resultData.correct_answers}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b" style={{ borderColor: theme.border }}>
                  <Text style={{ color: theme.textMuted }}>Incorrect Answers</Text>
                  <Text className="font-semibold" style={{ color: theme.danger }}>
                    {resultData.total_questions - resultData.correct_answers}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-2">
                  <Text style={{ color: theme.textMuted }}>Total Questions</Text>
                  <Text className="font-semibold" style={{ color: theme.text }}>
                    {resultData.total_questions}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                onPress={() => void close(onClose)}
                disabled={isClosing}
              >
                {({ pressed }) => (
                  <View
                    className="py-4 rounded-lg"
                    style={{ backgroundColor: pressed ? theme.primaryPressed : theme.primary }}
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      {isClosing ? "Returning..." : "Back to Exams"}
                    </Text>
                  </View>
                )}
              </Pressable>
            </>
          ) : (
            <View className="items-center py-8">
              <Ionicons name="alert-circle" size={48} color={theme.danger} />
              <Text className="mt-4 text-center" style={{ color: theme.textMuted }}>
                No result data available
              </Text>
              <Pressable
                onPress={() => void close(onClose)}
                disabled={isClosing}
              >
                {({ pressed }) => (
                  <View
                    className="py-3 px-6 rounded-lg mt-4"
                    style={{ backgroundColor: pressed ? theme.primaryPressed : theme.primary }}
                  >
                    <Text className="text-white font-semibold">Close</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
