import { ExamSubmitResponse } from "@/api/QueryOptions/examAnswersOptions";

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
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  let reasonText = "";

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-50";
    if (percentage >= 60) return "bg-yellow-50";
    return "bg-red-50";
  };

  if (!visible) return null;

  if (submissionReason === "time_expired") {
    reasonText = "Time ran out (60 minutes)";
  } else if (submissionReason === "tab_switch") {
    reasonText = "Switched to another app / returned to home screen";
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
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-md p-6">
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="mt-4 text-gray-600 text-center">
                Submitting your exam...
              </Text>
            </View>
          ) : resultData ? (
            <>
              {/* Header */}
              <View className="items-center mb-6">
                <View className="bg-blue-100 p-4 rounded-full mb-3">
                  <Ionicons name="checkmark-circle" size={48} color="#3b82f6" />
                </View>
                <Text className="text-2xl font-bold text-gray-800">
                  Exam Submitted!
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{reasonText}</Text>
              </View>

              {/* Score Display */}
              <View
                className={`${getScoreBgColor(
                  (resultData.correct_answers / resultData.total_questions) *
                    100,
                )} p-6 rounded-xl mb-6`}
              >
                <Text className="text-center text-gray-600 mb-2">
                  Your Score
                </Text>
                <Text
                  className={`text-center text-5xl font-bold ${getScoreColor(
                    (resultData.correct_answers / resultData.total_questions) *
                      100,
                  )}`}
                >
                  {Math.round(
                    (resultData.correct_answers / resultData.total_questions) *
                      100,
                  )}
                  %
                </Text>
                <Text className="text-center text-gray-600 mt-2">
                  {resultData.correct_answers} out of{" "}
                  {resultData.total_questions} correct
                </Text>
              </View>

              {/* Statistics */}
              <View className="space-y-3 mb-6">
                <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                  <Text className="text-gray-600">Correct Answers</Text>
                  <Text className="font-semibold text-green-600">
                    {resultData.correct_answers}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                  <Text className="text-gray-600">Incorrect Answers</Text>
                  <Text className="font-semibold text-red-600">
                    {resultData.total_questions - resultData.correct_answers}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-gray-600">Total Questions</Text>
                  <Text className="font-semibold text-gray-800">
                    {resultData.total_questions}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                className="bg-blue-600 py-4 rounded-lg active:bg-blue-700"
                onPress={onClose}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Back to Exams
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="items-center py-8">
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text className="mt-4 text-gray-600 text-center">
                No result data available
              </Text>
              <Pressable
                className="bg-blue-600 py-3 px-6 rounded-lg mt-4"
                onPress={onClose}
              >
                <Text className="text-white font-semibold">Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
