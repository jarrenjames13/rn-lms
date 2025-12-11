import { SingleActivity } from "@/types/api";
import { postData } from "@/utils/fetcher";
import { renderHTMLContent } from "@/utils/RenderHTML";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

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
  const queryClient = useQueryClient();

  // Reset answer when modal opens/closes or activity changes
  useEffect(() => {
    if (!visible) {
      setAnswer("");
    }
  }, [visible]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: SubmitActivityPayload) => {
      try {
        const response = await postData(
          "modules/activity-submissions/submit",
          payload
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
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900 flex-1 pr-4">
              Submit Activity
            </Text>
            <Pressable
              onPress={onClose}
              disabled={submitMutation.isPending}
              className="w-8 h-8 items-center justify-center"
            >
              <Text className="text-2xl text-gray-400">×</Text>
            </Pressable>
          </View>

          <ScrollView className="flex">
            <View className="p-5">
              {/* Activity Title */}
              <Text className="text-base font-semibold text-gray-800 mb-3">
                {activity.title}
              </Text>

              {/* Activity Type Badge */}
              <View className="flex-row mb-4">
                <View className="bg-purple-100 rounded-full px-3 py-1">
                  <Text className="text-xs font-medium text-purple-800 capitalize">
                    {activity.activity_type}
                  </Text>
                </View>
              </View>

              {/* Instructions */}
              <View className="bg-blue-50 rounded-lg p-4 mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Instructions:
                </Text>
                <Text className="text-sm text-gray-600">
                  {renderHTMLContent(activity.instructions)}
                </Text>
              </View>

              {/* Answer Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Your Answer: <Text className="text-red-500">*</Text>
                </Text>
                <View className="bg-gray-50 border border-gray-300 rounded-lg">
                  <TextInput
                    className="p-4 text-base text-gray-900 h-40"
                    placeholder="Type your answer here..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    value={answer}
                    onChangeText={setAnswer}
                    editable={!submitMutation.isPending}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {answer.length} characters
                </Text>
              </View>

              {/* Error Message */}
              {submitMutation.isError && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <Text className="text-sm text-red-600">
                    {submitMutation.error instanceof Error
                      ? submitMutation.error.message
                      : "Failed to submit. Please try again."}
                  </Text>
                </View>
              )}

              {/* Success Message */}
              {submitMutation.isSuccess && (
                <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <Text className="text-sm text-green-600">
                    Activity submitted successfully!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-5 border-t border-gray-200 flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={submitMutation.isPending}
              className="flex-1 bg-gray-200 active:bg-gray-300 rounded-lg py-3 items-center"
            >
              <Text className="text-base font-semibold text-gray-700">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={!answer.trim() || submitMutation.isPending}
              className={`flex-1 rounded-lg py-3 items-center flex-row justify-center ${
                !answer.trim() || submitMutation.isPending
                  ? "bg-blue-300"
                  : "bg-blue-600 active:bg-blue-700"
              }`}
            >
              {submitMutation.isPending ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-base font-semibold text-white ml-2">
                    Submitting...
                  </Text>
                </>
              ) : (
                <Text className="text-base font-semibold text-white">
                  Submit
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
