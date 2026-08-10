import createActivitiesOptions from "@/api/QueryOptions/actvitiesOptions";
import createCourseDetailsOptions from "@/api/QueryOptions/courseDetailsOptions";
import createListExamsOptions from "@/api/QueryOptions/listExamsOption";
import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import ActivitySubmissionModal from "@/components/ActivitySubmissionModal";
import AssessmentStartModal from "@/components/AssessmentStartModal";
import ScreenLoading from "@/components/ScreenLoading";
import SubmissionModal from "@/components/SubmissionModal";
import { AppHeader, AppScreen, Card, StateView } from "@/components/ui";
import { useCourseStore } from "@/store/useCourseStore";
import { useExamStore } from "@/store/useExamStore";
import { useQuizStore } from "@/store/useQuizStore";
import { useAppTheme } from "@/theme";
import {
  ActivityWithGrade,
  ExamDetails,
  Module,
  QuizDetails,
  SingleActivity,
} from "@/types/api";
import { MAX_QUIZ_ATTEMPTS } from "@/utils/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type Assessment = {
  id: number;
  title: string;
  description?: string;
  type: "Quiz" | "Exam" | "Submission";
  period?: string;
  status: string;
  score?: number | null;
  meta: string;
  actionable: boolean;
  actionLabel: string;
  quiz?: QuizDetails;
  exam?: ExamDetails;
  activity?: SingleActivity;
};

type AssessmentType = Assessment["type"];

export default function Assessments() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { course_id, instance_id } = useCourseStore();
  const {
    beginAttempt: beginQuizAttempt,
    hasHydrated: quizAttemptHydrated,
    status: quizAttemptStatus,
    quiz_id: activeQuizId,
    instance_id: activeQuizInstanceId,
  } = useQuizStore();
  const {
    beginAttempt: beginExamAttempt,
    hasHydrated: examAttemptHydrated,
    status: examAttemptStatus,
    exam_id: activeExamId,
    instance_id: activeExamInstanceId,
  } = useExamStore();
  const [selectedExam, setSelectedExam] = useState<ExamDetails | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<SingleActivity | null>(null);
  const [assessmentToStart, setAssessmentToStart] = useState<Assessment | null>(
    null,
  );
  const [expandedTypes, setExpandedTypes] = useState<
    Record<AssessmentType, boolean>
  >({
    Quiz: true,
    Exam: true,
    Submission: true,
  });
  const typeStyles = {
    Quiz: {
      icon: "help-circle-outline" as const,
      color: theme.primary,
      bg: theme.surfaceMuted,
    },
    Exam: {
      icon: "clipboard-text-outline" as const,
      color: theme.danger,
      bg: theme.surfaceAccent,
    },
    Submission: {
      icon: "file-upload-outline" as const,
      color: theme.warning,
      bg: theme.surfaceMuted,
    },
  };

  const {
    data: quizzes,
    isLoading: loadingQuizzes,
    isError: quizzesError,
    refetch: refetchQuizzes,
  } = useQuery({
    ...createListQuizzesOptions(instance_id!),
    enabled: !!instance_id,
  });
  const {
    data: exams,
    isLoading: loadingExams,
    isError: examsError,
    refetch: refetchExams,
  } = useQuery({
    ...createListExamsOptions(instance_id!),
    enabled: !!instance_id,
  });
  const {
    data: courseDetails,
    isLoading: loadingCourse,
    isError: courseError,
    refetch: refetchCourse,
  } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });
  const activityQueries = useQueries({
    queries: (courseDetails?.modules ?? []).map((module: Module) =>
      createActivitiesOptions(module.module_id),
    ),
  });

  const assessments = useMemo<Assessment[]>(() => {
    const quizItems: Assessment[] = (quizzes?.quizzes ?? []).map((quiz) => {
      const attemptsMade = quiz.attempts_made ?? 0;
      return {
        id: quiz.quiz_id,
        title: quiz.quiz_name,
        description: quiz.description,
        type: "Quiz",
        period: quiz.exam_period,
        status:
          attemptsMade >= MAX_QUIZ_ATTEMPTS
            ? "Attempts used"
            : attemptsMade > 0
              ? "Reattempt available"
              : "Available",
        score: quiz.score,
        meta: `${quiz.total_items} questions · ${attemptsMade}/${MAX_QUIZ_ATTEMPTS} attempts used`,
        actionable: attemptsMade < MAX_QUIZ_ATTEMPTS,
        actionLabel: attemptsMade > 0 ? "Reattempt quiz" : "Start quiz",
        quiz,
      };
    });
    const examItems: Assessment[] = (exams?.exams ?? []).map((exam) => {
      const submission = exam.category.toLowerCase() === "submission";
      return {
        id: exam.exam_id,
        title: exam.exam_name,
        description: exam.description,
        type: submission ? "Submission" : "Exam",
        period: exam.exam_period,
        status: exam.is_taken
          ? exam.score === null
            ? "Awaiting review"
            : "Graded"
          : "Available",
        score: exam.score,
        meta: submission
          ? "File submission · One attempt"
          : `${exam.total_items} questions · Timed assessment`,
        actionable: !exam.is_taken,
        actionLabel: submission ? "Submit work" : "Start exam",
        exam,
      };
    });
    const activityItems: Assessment[] = activityQueries.flatMap(
      (query, index) =>
        ((query.data as ActivityWithGrade | undefined)?.activities ?? []).map(
          (activity) => ({
            id: activity.activity_id,
            title: activity.title,
            description: activity.instructions,
            type: "Submission",
            period: `Module ${(courseDetails?.modules ?? [])[index]?.position ?? index + 1}`,
            status: activity.is_graded
              ? "Graded"
              : activity.has_submission
                ? "Submitted"
                : "Available",
            score: activity.grade,
            meta: `${activity.activity_type} · Text or file submission`,
            actionable: !activity.has_submission,
            actionLabel: "Submit work",
            activity,
          }),
        ),
    );
    return [...quizItems, ...examItems, ...activityItems];
  }, [activityQueries, courseDetails?.modules, exams?.exams, quizzes?.quizzes]);

  const startQuiz = (quiz: QuizDetails) => {
    beginQuizAttempt(quiz.quiz_id, quizzes?.instance_id ?? instance_id!);
    router.replace("/quiz_taking");
  };

  const startExam = (exam: ExamDetails) => {
    beginExamAttempt(exam.exam_id, exams?.instance_id ?? instance_id!);
    router.replace("/exam_taking");
  };

  const beginAssessment = () => {
    if (assessmentToStart?.quiz) {
      const quiz = assessmentToStart.quiz;
      setAssessmentToStart(null);
      startQuiz(quiz);
    } else if (assessmentToStart?.exam) {
      const exam = assessmentToStart.exam;
      setAssessmentToStart(null);
      startExam(exam);
    }
  };

  const requestAssessmentStart = (assessment: Assessment) => {
    const targetInstanceId = assessment.quiz
      ? (quizzes?.instance_id ?? instance_id)
      : (exams?.instance_id ?? instance_id);
    if (!targetInstanceId) return;

    if (assessment.quiz) {
      if (!quizAttemptHydrated) return;
      if (quizAttemptStatus === "idle") {
        setAssessmentToStart(assessment);
      } else if (
        activeQuizId === assessment.id &&
        activeQuizInstanceId === targetInstanceId
      ) {
        router.replace("/quiz_taking");
      } else {
        Alert.alert(
          "Quiz attempt already active",
          "Finish or view the result of your current quiz attempt before starting another one.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resume attempt",
              onPress: () => router.replace("/quiz_taking"),
            },
          ],
        );
      }
      return;
    }

    if (assessment.type === "Exam" && assessment.exam) {
      if (!examAttemptHydrated) return;
      if (examAttemptStatus === "idle") {
        setAssessmentToStart(assessment);
      } else if (
        activeExamId === assessment.id &&
        activeExamInstanceId === targetInstanceId
      ) {
        router.replace("/exam_taking");
      } else {
        Alert.alert(
          "Exam attempt already active",
          "Finish or view the result of your current exam attempt before starting another one.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resume attempt",
              onPress: () => router.replace("/exam_taking"),
            },
          ],
        );
      }
      return;
    }

    if (assessment.exam) setSelectedExam(assessment.exam);
    else if (assessment.activity) setSelectedActivity(assessment.activity);
  };

  const loading = loadingQuizzes || loadingExams || loadingCourse;
  const assessmentGroups = useMemo(
    () =>
      (["Quiz", "Exam", "Submission"] as AssessmentType[]).map((type) => ({
        type,
        items: assessments.filter((assessment) => assessment.type === type),
      })),
    [assessments],
  );

  const toggleType = (type: AssessmentType) => {
    setExpandedTypes((current) => ({ ...current, [type]: !current[type] }));
  };

  const renderAssessmentCard = (assessment: Assessment) => {
    const style = typeStyles[assessment.type];
    const attemptHydrated =
      assessment.type === "Quiz"
        ? quizAttemptHydrated
        : assessment.type === "Exam"
          ? examAttemptHydrated
          : true;

    return (
      <Card
        key={`${assessment.type}-${assessment.id}`}
        style={{ marginTop: 12 }}
      >
        <View className="flex-row items-start">
          <View
            style={{ backgroundColor: style.bg }}
            className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          >
            <MaterialCommunityIcons
              name={style.icon}
              size={22}
              color={style.color}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2">
              <Text
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: style.color }}
              >
                {assessment.type}
              </Text>
              {assessment.period ? (
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
                  {assessment.period}
                </Text>
              ) : null}
            </View>
            <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] mt-1">
              {assessment.title}
            </Text>
            <Text
              className="text-sm text-[#6C6572] dark:text-[#BEB6C5] mt-1"
              numberOfLines={2}
            >
              {assessment.meta}
            </Text>
          </View>
          <View className="rounded-full px-3 py-1 bg-[#F2ECF8] dark:bg-[#2A2038]">
            <Text className="text-xs font-semibold text-[#6C6572] dark:text-[#BEB6C5]">
              {assessment.status}
            </Text>
          </View>
        </View>
        {assessment.score !== null && assessment.score !== undefined ? (
          <Text className="text-sm font-semibold text-[#6842A0] dark:text-[#A98ADC] mt-4">
            Score: {assessment.score}%
          </Text>
        ) : null}
        {assessment.actionable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={assessment.actionLabel}
            onPress={() => requestAssessmentStart(assessment)}
            disabled={!attemptHydrated}
          >
            {({ pressed }) => (
              <View
                style={{
                  marginTop: 16,
                  minHeight: 52,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    !attemptHydrated
                      ? theme.tabInactive
                      : assessment.type === "Quiz" || assessment.type === "Exam"
                      ? pressed
                        ? theme.primaryPressed
                        : theme.school
                      : theme.danger,
                  borderWidth: assessment.type === "Submission" ? 1 : 0,
                  borderColor:
                    assessment.type === "Submission"
                      ? theme.primaryPressed
                      : "transparent",
                  opacity:
                    !attemptHydrated
                      ? 0.55
                      : assessment.type === "Submission" && pressed
                        ? 0.82
                        : 1,
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}
                >
                  {assessment.actionLabel}
                </Text>
              </View>
            )}
          </Pressable>
        ) : null}
      </Card>
    );
  };

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          eyebrow="COURSE WORK"
          title="Assessments"
          subtitle="Quizzes, exams, and submissions in one place."
        />

        {loading ? (
          <ScreenLoading message="Loading your assessments..." />
        ) : quizzesError || examsError || courseError ? (
          <StateView
            icon="cloud-offline-outline"
            title="Assessments unavailable"
            message="We could not load all of your course work."
            actionLabel="Try again"
            onAction={() => {
              void refetchQuizzes();
              void refetchExams();
              void refetchCourse();
            }}
          />
        ) : assessments.length === 0 ? (
          <StateView
            icon="checkmark-circle-outline"
            title="You are all caught up"
            message="New assessments will appear here when they are published."
          />
        ) : (
          assessmentGroups.map(({ type, items }) => {
            const style = typeStyles[type];
            const expanded = expandedTypes[type];
            return (
              <View key={type} className="mt-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${expanded ? "Hide" : "Show"} ${type.toLowerCase()} assessments`}
                  onPress={() => toggleType(type)}
                  className="flex-row items-center bg-[#FFFFFF] dark:bg-[#1A181E] border border-[#E6E1E8] dark:border-[#37313C] rounded-2xl px-4 py-3.5 active:opacity-80"
                >
                  <View
                    style={{ backgroundColor: style.bg }}
                    className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  >
                    <MaterialCommunityIcons
                      name={style.icon}
                      size={19}
                      color={style.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {type}s
                    </Text>
                    <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
                      {items.length} assessment{items.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={theme.textMuted}
                  />
                </Pressable>
                {expanded ? items.map(renderAssessmentCard) : null}
              </View>
            );
          })
        )}
      </ScrollView>
      {selectedExam && instance_id ? (
        <SubmissionModal
          visible
          exam={selectedExam}
          instanceId={instance_id}
          onClose={() => setSelectedExam(null)}
        />
      ) : null}
      {selectedActivity ? (
        <ActivitySubmissionModal
          visible
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      ) : null}
      <AssessmentStartModal
        visible={!!assessmentToStart}
        type={assessmentToStart?.type === "Exam" ? "exam" : "quiz"}
        title={assessmentToStart?.title ?? "Assessment"}
        isReattempt={(assessmentToStart?.quiz?.attempts_made ?? 0) > 0}
        onCancel={() => setAssessmentToStart(null)}
        onBegin={beginAssessment}
      />
    </AppScreen>
  );
}
