import createActivitiesOptions from "@/api/QueryOptions/actvitiesOptions";
import createCourseDetailsOptions from "@/api/QueryOptions/courseDetailsOptions";
import createListExamsOptions from "@/api/QueryOptions/listExamsOption";
import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import { startAssessmentSession } from "@/api/QueryFunctions/startAssessmentSession";
import ActivitySubmissionModal from "@/components/ActivitySubmissionModal";
import SubmissionModal from "@/components/SubmissionModal";
import { useCourseStore } from "@/store/useCourseStore";
import { useExamStore } from "@/store/useExamStore";
import { useQuizStore } from "@/store/useQuizStore";
import { ActivityWithGrade, ExamDetails, Module, QuizDetails, SingleActivity } from "@/types/api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    ...createListQuizzesOptions(instance_id!),
    enabled: !!instance_id,
  });
  const { data: exams, isLoading: loadingExams } = useQuery({
    ...createListExamsOptions(instance_id!),
    enabled: !!instance_id,
  });
  const { data: courseDetails, isLoading: loadingCourse } = useQuery({
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

  const startQuiz = async (quiz: QuizDetails) => {
    try {
      const session = await startAssessmentSession({ assessment_id: quiz.quiz_id, instance_id: instance_id!, category: "quiz" });
      setQuizId(quiz.quiz_id);
      setQuizInstance(instance_id!);
      setQuizSession(session.session_token);
      router.replace("/quiz_taking");
    } catch (error: any) {
      Alert.alert("Unable to start", error?.response?.data?.detail ?? "Please try again.");
    }
  };

  const startExam = async (exam: ExamDetails) => {
    try {
      const session = await startAssessmentSession({ assessment_id: exam.exam_id, instance_id: instance_id!, category: "exam" });
      setExamId(exam.exam_id);
      setExamInstance(instance_id!);
      setExamSession(session.session_token);
      router.replace("/exam_taking");
    } catch (error: any) {
      Alert.alert("Unable to start", error?.response?.data?.detail ?? "Please try again.");
    }
  };

  const loading = loadingQuizzes || loadingExams || loadingCourse;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F5]">
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-3xl font-bold text-[#2D2633]">Assessments</Text>
            <Text className="text-sm text-[#756C7D] mt-1">Quizzes, exams, and submissions in one place</Text>
          </View>
          <View className="w-11 h-11 rounded-2xl bg-[#EEE8F7] items-center justify-center">
            <MaterialCommunityIcons name="clipboard-check-outline" size={23} color="#6D4C9B" />
          </View>
        </View>

        {loading ? (
          <View className="py-20 items-center"><ActivityIndicator size="large" color="#6D4C9B" /><Text className="text-[#756C7D] mt-3">Loading your assessments...</Text></View>
        ) : assessments.length === 0 ? (
          <View className="bg-white rounded-3xl border border-[#E8E2E9] p-8 items-center mt-6">
            <Ionicons name="checkmark-circle-outline" size={56} color="#B8AFC0" />
            <Text className="text-lg font-bold text-[#2D2633] mt-4">You are all caught up</Text>
            <Text className="text-sm text-[#756C7D] text-center mt-2">New assessments will appear here when they are published.</Text>
          </View>
        ) : (
          assessments.map((assessment) => {
            const style = typeStyles[assessment.type];
            const actionable = assessment.status === "Available";
            return (
              <View key={`${assessment.type}-${assessment.id}`} className="bg-white rounded-3xl border border-[#E8E2E9] p-5 mt-4">
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
                  <Pressable
                    accessibilityRole="button"
                    className="bg-[#6D4C9B] rounded-2xl py-3.5 items-center mt-4 active:opacity-80"
                    onPress={() => assessment.quiz ? startQuiz(assessment.quiz) : assessment.exam && assessment.type === "Exam" ? startExam(assessment.exam) : assessment.exam ? setSelectedExam(assessment.exam) : assessment.activity && setSelectedActivity(assessment.activity)}
                  >
                    <Text className="text-white font-bold">{assessment.type === "Quiz" ? "Start quiz" : assessment.type === "Exam" ? "Start exam" : "Submit work"}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
      {selectedExam && instance_id ? <SubmissionModal visible exam={selectedExam} instanceId={instance_id} onClose={() => setSelectedExam(null)} /> : null}
      {selectedActivity ? <ActivitySubmissionModal visible activity={selectedActivity} onClose={() => setSelectedActivity(null)} /> : null}
    </SafeAreaView>
  );
}
