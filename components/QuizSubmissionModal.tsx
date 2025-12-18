import { useQuizStore } from "@/store/useQuizStore";
import { postData } from "@/utils/fetcher";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { Modal } from "react-native";

interface QuizSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  SubmissionReason: string;
}

export default function QuizSubmissionModal({
  visible,
  onClose,
  SubmissionReason,
}: QuizSubmissionModalProps) {
  const queryClient = useQueryClient();
  const { selectedAnswers, quiz_id, instance_id } = useQuizStore();
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      try {
        const payload = {
          quiz_id: quiz_id,
          instance_id: instance_id,
          answers: selectedAnswers,
        };
        const response = await postData("modules/student-quiz-submit", payload);
        const data = await response.data();
        if (response.status === 200 && data.success) {
          queryClient.invalidateQueries({
            queryKey: ["list_quizzes"],
          });
          return data;
        } else {
          throw new Error("Failed to submit quiz");
        }
      } catch (error) {
        console.error("Quiz submission error:", error);
        throw new Error("Network error during quiz submission");
      } finally {
        onClose();
      }
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        submitMutation.mutate();
      }
    }, [visible, submitMutation])
  );
  const renderResult = () => {};
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    ></Modal>
  );
}
