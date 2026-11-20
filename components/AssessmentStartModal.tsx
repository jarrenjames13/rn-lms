import { useAppTheme } from "@/theme";
import { useAsyncAction } from "@/utils/useAsyncAction";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { ExamIdentityCapture } from "@/components/ExamIdentityCapture";

type AssessmentStartModalProps = {
  visible: boolean;
  type: "quiz" | "exam";
  title: string;
  isReattempt?: boolean;
  cameraRequired?: boolean;
  attemptsRemaining?: number;
  isResume?: boolean;
  remainingSeconds?: number;
  onCancel: () => void;
  onBegin: () => void;
};

export default function AssessmentStartModal({
  visible,
  type,
  title,
  isReattempt = false,
  cameraRequired = false,
  attemptsRemaining = 1,
  isResume = false,
  remainingSeconds,
  onCancel,
  onBegin,
}: AssessmentStartModalProps) {
  const { theme } = useAppTheme();
  const isQuiz = type === "quiz";
  const { isPending, run } = useAsyncAction();
  const [cameraReady, setCameraReady] = useState(false);
  useEffect(() => {
    setCameraReady(false);
  }, [cameraRequired, visible]);
  const duration = isQuiz ? 60 : 120;
  const assessmentLabel = isQuiz ? "quiz" : "exam";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-5">
        <View
          className="w-full max-w-md rounded-2xl overflow-hidden border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <View className="items-center px-6 pt-6 pb-4">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: theme.surfaceAccent }}
            >
              <Ionicons
                name={isQuiz ? "help-circle-outline" : "shield-checkmark-outline"}
                size={30}
                color={theme.school}
              />
            </View>
            <Text className="text-xl font-bold text-center" style={{ color: theme.text }}>
              {isResume ? "Resume" : "Begin"} {isQuiz ? "Quiz" : "Exam"}?
            </Text>
            <Text className="text-base font-semibold text-center mt-2" style={{ color: theme.text }}>
              {title}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: theme.textMuted }}>
              {isResume && typeof remainingSeconds === "number"
                ? `Your current attempt has ${Math.max(1, Math.ceil(remainingSeconds / 60))} minutes remaining.`
                : isResume
                  ? "Continue your current attempt with its existing deadline."
                  : `You will have ${duration} minutes once you begin.`}
            </Text>
          </View>

          <View className="mx-5 mb-5 rounded-xl p-4" style={{ backgroundColor: theme.canvas }}>
            <View className="flex-row items-start">
              <Ionicons name="warning-outline" size={20} color={theme.warning} />
              <Text className="flex-1 text-sm leading-5 ml-3" style={{ color: theme.text }}>
                The server records app background and navigation events. It will warn or finalize the {assessmentLabel} according to its security policy.
              </Text>
            </View>
            {isQuiz && isReattempt && !isResume ? (
              <View className="flex-row items-start mt-3">
                <Ionicons name="reload-outline" size={20} color={theme.warning} />
                <Text className="flex-1 text-sm leading-5 ml-3" style={{ color: theme.text }}>
                  Beginning this reattempt will consume one of your remaining quiz attempts.
                </Text>
              </View>
            ) : null}
            {!isQuiz && !isResume ? (
              <View className="flex-row items-start mt-3">
                <Ionicons name="lock-closed-outline" size={20} color={theme.danger} />
                <Text className="flex-1 text-sm font-semibold leading-5 ml-3" style={{ color: theme.danger }}>
                  Beginning consumes one attempt. {attemptsRemaining <= 1 ? "This is your last available attempt." : `${attemptsRemaining} attempts are available.`}
                </Text>
              </View>
            ) : null}
            {!isQuiz && cameraRequired ? (
              <View className="mt-4">
                <Text className="text-sm leading-5 mb-3" style={{ color: theme.text }}>
                  This remote exam requires a front-camera preview before starting. A photo is taken later only if the exam server requests it.
                </Text>
                <ExamIdentityCapture
                  mode="preflight"
                  onStateChange={(state) => setCameraReady(state.phase === "preview_ready")}
                  onReady={() => setCameraReady(true)}
                />
              </View>
            ) : null}
          </View>

          <View className="flex-row border-t" style={{ borderColor: theme.border }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              className="flex-1"
            >
              {({ pressed }) => (
                <View
                  className="min-h-14 items-center justify-center"
                  style={{ backgroundColor: pressed ? theme.canvas : theme.surface }}
                >
                  <Text className="font-bold" style={{ color: theme.textMuted }}>Cancel</Text>
                </View>
              )}
            </Pressable>
            <View className="w-px" style={{ backgroundColor: theme.border }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Begin ${assessmentLabel}`}
              onPress={() => void run(onBegin)}
              disabled={isPending || (cameraRequired && !isQuiz && !cameraReady)}
              className="flex-1"
            >
              {({ pressed }) => (
                <View
                  className="min-h-14 items-center justify-center"
                  style={{ backgroundColor: isPending || (cameraRequired && !isQuiz && !cameraReady)
                    ? theme.tabInactive
                    : pressed ? theme.primaryPressed : theme.school }}
                >
                  <Text className="font-bold" style={{ color: "#FFFFFF" }}>{isPending ? "Starting..." : cameraRequired && !isQuiz && !cameraReady ? "Camera required" : isResume ? "Resume" : "Begin"}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
