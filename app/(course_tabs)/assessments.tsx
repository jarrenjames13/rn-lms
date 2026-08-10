import createActivitiesOptions from "@/api/QueryOptions/actvitiesOptions";
import createCourseDetailsOptions from "@/api/QueryOptions/courseDetailsOptions";
import createListExamsOptions from "@/api/QueryOptions/listExamsOption";
import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import ActivitySubmissionModal from "@/components/ActivitySubmissionModal";
import { AppButton, AppHeader, AppScreen, Card, StateView } from "@/components/ui";
import ScreenLoading from "@/components/ScreenLoading";
import SubmissionModal from "@/components/SubmissionModal";
import { useCourseStore } from "@/store/useCourseStore";
import { useExamStore } from "@/store/useExamStore";
import { useQuizStore } from "@/store/useQuizStore";
import { ActivityWithGrade, ExamDetails, Module, QuizDetails, SingleActivity } from "@/types/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Assessment = {
  id: number;
  title: string;
  description?: string;
  type: "Quiz" | "Exam" | "Submission";
  period?: string;
  status: string;
  score?: number | null;
  meta: string;
  quiz?: QuizDetails;
  exam?: ExamDetails;
  activity?: SingleActivity;
};

type AssessmentType = Assessment["type"];

const typeStyles = {
  Quiz: { icon: "help-circle-outline" as const, color: "#6D4C9B", bg: "#F3EEFA" },
  Exam: { icon: "clipboard-text-outline" as const, color: "#B42318", bg: "#FDECEC" },
  Submission: { icon: "file-upload-outline" as const, color: "#8A5A2B", bg: "#FAF1E6" },
};

export default function Assessments() {
  const router = useRouter();
  const { course_id, instance_id } = useCourseStore();
  const { setQuizId, setInstanceId: setQuizInstance, setSessionToken: setQuizSession } = useQuizStore();
  const { setExamId, setInstanceId: setExamInstance, setSessionToken: setExamSession } = useExamStore();
  const [selectedExam, setSelectedExam] = useState<ExamDetails | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<SingleActivity | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Record<AssessmentType, boolean>>({
    Quiz: true,
    Exam: true,
    Submission: true,
  });

  const { data: quizzes, isLoading: loadingQuizzes, isError: quizzesError, refetch: refetchQuizzes } = useQuery({
    ...createListQuizzesOptions(instance_id!),
    enabled: !!instance_id,
  });
  const { data: exams, isLoading: loadingExams, isError: examsError, refetch: refetchExams } = useQuery({
    ...createListExamsOptions(instance_id!),
    enabled: !!instance_id,
  });
  const { data: courseDetails, isLoading: loadingCourse, isError: courseError, refetch: refetchCourse } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });
  const activityQueries = useQueries({
    queries: (courseDetails?.modules ?? []).map((module: Module) => createActivitiesOptions(module.module_id)),
  });

  const assessments = useMemo<Assessment[]>(() => {
    const quizItems: Assessment[] = (quizzes?.quizzes ?? []).map((quiz) => ({
      id: quiz.quiz_id,
      title: quiz.quiz_name,
      description: quiz.description,
      type: "Quiz",
      period: quiz.exam_period,
      status: quiz.is_taken ? "Attempted" : "Available",
      score: quiz.score,
      meta: `${quiz.total_items} questions · ${quiz.attempts_made} attempts used`,
      quiz,
    }));
    const examItems: Assessment[] = (exams?.exams ?? []).map((exam) => {
      const submission = exam.category.toLowerCase() === "submission";
      return {
        id: exam.exam_id,
        title: exam.exam_name,
        description: exam.description,
        type: submission ? "Submission" : "Exam",
        period: exam.exam_period,
        status: exam.is_taken ? (exam.score === null ? "Awaiting review" : "Graded") : "Available",
        score: exam.score,
        meta: submission ? "File submission · One attempt" : `${exam.total_items} questions · Timed assessment`,
        exam,
      };
    });
    const activityItems: Assessment[] = activityQueries.flatMap((query, index) =>
      ((query.data as ActivityWithGrade | undefined)?.activities ?? []).map((activity) => ({
        id: activity.activity_id,
        title: activity.title,
        description: activity.instructions,
        type: "Submission",
        period: `Module ${(courseDetails?.modules ?? [])[index]?.position ?? index + 1}`,
        status: activity.is_graded ? "Graded" : activity.has_submission ? "Submitted" : "Available",
        score: activity.grade,
        meta: `${activity.activity_type} · Text or file submission`,
        activity,
      })),
    );
    return [...quizItems, ...examItems, ...activityItems];
  }, [activityQueries, courseDetails?.modules, exams?.exams, quizzes?.quizzes]);

  const startQuiz = (quiz: QuizDetails) => {
    setQuizId(quiz.quiz_id);
    setQuizInstance(instance_id!);
    setQuizSession("");
    router.replace("/quiz_taking");
  };

  const startExam = (exam: ExamDetails) => {
    setExamId(exam.exam_id);
    setExamInstance(instance_id!);
    setExamSession("");
    router.replace("/exam_taking");
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
    const actionable = assessment.status === "Available";

    return (
       <Card key={`${assessment.type}-${assessment.id}`} style={{ marginTop: 12 }}>
        <View className="flex-row items-start">
          <View style={{ backgroundColor: style.bg }} className="w-11 h-11 rounded-2xl items-center justify-center mr-3">
            <MaterialCommunityIcons name={style.icon} size={22} color={style.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2">
              <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: style.color }}>{assessment.type}</Text>
              {assessment.period ? <Text className="text-xs text-[#756C7D]">{assessment.period}</Text> : null}
            </View>
            <Text className="text-lg font-bold text-[#2D2633] mt-1">{assessment.title}</Text>
            <Text className="text-sm text-[#756C7D] mt-1" numberOfLines={2}>{assessment.meta}</Text>
          </View>
          <View className="rounded-full px-3 py-1 bg-[#F4F1F5]"><Text className="text-xs font-semibold text-[#5D5262]">{assessment.status}</Text></View>
        </View>
        {assessment.score !== null && assessment.score !== undefined ? <Text className="text-sm font-semibold text-[#6D4C9B] mt-4">Score: {assessment.score}%</Text> : null}
        {actionable ? (
          <View style={{ marginTop: 16 }}><AppButton label={assessment.type === "Quiz" ? "Start quiz" : assessment.type === "Exam" ? "Start exam" : "Submit work"} onPress={() => assessment.quiz ? startQuiz(assessment.quiz) : assessment.exam && assessment.type === "Exam" ? startExam(assessment.exam) : assessment.exam ? setSelectedExam(assessment.exam) : assessment.activity && setSelectedActivity(assessment.activity)} /></View>
        ) : null}
      </Card>
    );
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="COURSE WORK" title="Assessments" subtitle="Quizzes, exams, and submissions in one place." />

        {loading ? (
          <ScreenLoading message="Loading your assessments..." />
        ) : quizzesError || examsError || courseError ? (
          <StateView icon="cloud-offline-outline" title="Assessments unavailable" message="We could not load all of your course work." actionLabel="Try again" onAction={() => { void refetchQuizzes(); void refetchExams(); void refetchCourse(); }} />
        ) : assessments.length === 0 ? (
          <StateView icon="checkmark-circle-outline" title="You are all caught up" message="New assessments will appear here when they are published." />
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
                  className="flex-row items-center bg-white border border-[#E8E2E9] rounded-2xl px-4 py-3.5 active:opacity-80"
                >
                  <View style={{ backgroundColor: style.bg }} className="w-9 h-9 rounded-xl items-center justify-center mr-3">
                    <MaterialCommunityIcons name={style.icon} size={19} color={style.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#2D2633]">{type}s</Text>
                    <Text className="text-xs text-[#756C7D]">{items.length} assessment{items.length === 1 ? "" : "s"}</Text>
                  </View>
                  <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={24} color="#756C7D" />
                </Pressable>
                {expanded ? items.map(renderAssessmentCard) : null}
              </View>
            );
          })
        )}
      </ScrollView>
      {selectedExam && instance_id ? <SubmissionModal visible exam={selectedExam} instanceId={instance_id} onClose={() => setSelectedExam(null)} /> : null}
      {selectedActivity ? <ActivitySubmissionModal visible activity={selectedActivity} onClose={() => setSelectedActivity(null)} /> : null}
    </AppScreen>
  );
}
