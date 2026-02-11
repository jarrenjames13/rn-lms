import createComprehensiveGradesOptions from "@/api/QueryOptions/comprehensiveGradesOptions";
import { useCourseStore } from "@/store/useCourseStore";
import { ComprehensiveGradesResponse } from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "overview" | "activities" | "quizzes" | "exams";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "activities", label: "Activities" },
  { key: "quizzes", label: "Quizzes" },
  { key: "exams", label: "Exams" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getLetterGrade = (score: number) => {
  if (score >= 90) return { letter: "A", color: "#10B981" };
  if (score >= 80) return { letter: "B", color: "#B8A9D9" };
  if (score >= 70) return { letter: "C", color: "#F59E0B" };
  if (score >= 60) return { letter: "D", color: "#F97316" };
  return { letter: "F", color: "#EF4444" };
};

const getScoreTextColor = (score: number) => {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-purple-600";
  return "text-red-500";
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProgressBar = ({
  value,
  colorClass = "bg-red-500",
}: {
  value: number;
  colorClass?: string;
}) => (
  <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
    <View
      className={`h-full rounded-full ${colorClass}`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { bg: string; text: string }> = {
    graded: { bg: "bg-emerald-50", text: "text-emerald-600" },
    submitted: { bg: "bg-blue-50", text: "text-blue-600" },
    pending: { bg: "bg-amber-50", text: "text-amber-600" },
    late: { bg: "bg-red-50", text: "text-red-500" },
  };
  const cfg = configs[status?.toLowerCase()] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
  };
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${cfg.bg}`}>
      <Text className={`text-xs font-bold capitalize ${cfg.text}`}>
        {status}
      </Text>
    </View>
  );
};

const ActivityTypePill = ({ type }: { type: string }) => {
  const configs: Record<string, { bg: string; text: string }> = {
    project: { bg: "bg-red-50", text: "text-red-500" },
    assignment: { bg: "bg-purple-50", text: "text-purple-600" },
    lab: { bg: "bg-sky-50", text: "text-sky-600" },
  };
  const cfg = configs[type?.toLowerCase()] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
  };
  return (
    <View className={`rounded-full px-2.5 py-0.5 self-start ${cfg.bg}`}>
      <Text
        className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}
      >
        {type}
      </Text>
    </View>
  );
};

// ─── Shared summary stat row ───────────────────────────────────────────────
const SummaryStatRow = ({
  stats,
}: {
  stats: { label: string; val: string; cls: string }[];
}) => (
  <View className="bg-white rounded-2xl border border-gray-200 flex-row mb-4 overflow-hidden">
    {stats.map((item, idx) => (
      <View
        key={item.label}
        className={`flex-1 items-center py-3 ${idx < stats.length - 1 ? "border-r border-gray-200" : ""}`}
      >
        <Text className={`text-base font-bold ${item.cls}`}>{item.val}</Text>
        <Text className="text-xs text-gray-500 mt-0.5">{item.label}</Text>
      </View>
    ))}
  </View>
);

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: ComprehensiveGradesResponse }) {
  const { letter, color } = getLetterGrade(data.overall_grade);

  const categories = [
    {
      label: "Activities",
      summary: data.summary.activities,
      icon: "assignment" as const,
      headerBg: "bg-purple-600",
      barClass: "bg-purple-500",
      scoreClass: "text-purple-600",
    },
    {
      label: "Quizzes",
      summary: data.summary.quizzes,
      icon: "quiz" as const,
      headerBg: "bg-red-500",
      barClass: "bg-red-500",
      scoreClass: "text-red-500",
    },
    {
      label: "Exams",
      summary: data.summary.exams,
      icon: "school" as const,
      headerBg: "bg-indigo-600",
      barClass: "bg-indigo-500",
      scoreClass: "text-indigo-600",
    },
  ];

  return (
    <View>
      {/* Overall Grade Card */}
      <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        {/* Crimson header band */}
        <View className="bg-red-500 px-5 pt-4 pb-6">
          <Text className="text-xs text-white/80 font-bold tracking-widest mb-1">
            OVERALL GRADE
          </Text>
          <Text className="text-white text-sm font-semibold" numberOfLines={1}>
            {data.course_info.course_code} · {data.course_info.course_title}
          </Text>
        </View>

        {/* Score + letter */}
        <View className="flex-row items-end px-5 pt-4 pb-5 -mt-3">
          <View className="flex-1 mr-4">
            <Text
              className="text-7xl font-black text-gray-900 leading-none"
              style={{ letterSpacing: -3 }}
            >
              {data.overall_grade.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-400 mt-1">
              Based on all graded assessments
            </Text>
            <View className="mt-3">
              <ProgressBar value={data.overall_grade} colorClass="bg-red-500" />
            </View>
          </View>
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center border-2"
            style={{ borderColor: color, backgroundColor: color + "22" }}
          >
            <Text className="text-3xl font-black" style={{ color }}>
              {letter}
            </Text>
          </View>
        </View>

        {/* 3-column category averages strip */}
        <View className="flex-row border-t border-gray-200">
          {[
            { label: "Activities", val: data.summary.activities.average },
            { label: "Quizzes", val: data.summary.quizzes.average },
            { label: "Exams", val: data.summary.exams.average },
          ].map((item, idx) => (
            <View
              key={item.label}
              className={`flex-1 items-center py-3 ${idx < 2 ? "border-r border-gray-200" : ""}`}
            >
              <Text
                className={`text-base font-bold ${getScoreTextColor(item.val)}`}
              >
                {item.val.toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category Breakdown heading */}
      <Text className="text-xs font-bold text-gray-500 tracking-widest ml-1 mb-3">
        CATEGORY BREAKDOWN
      </Text>

      {categories.map((cat) => (
        <View
          key={cat.label}
          className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden"
        >
          <View className="p-4">
            {/* Header row */}
            <View className="flex-row items-center mb-3">
              <View
                className={`w-9 h-9 ${cat.headerBg} rounded-xl items-center justify-center mr-3`}
              >
                <MaterialIcons name={cat.icon} size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  {cat.label}
                </Text>
                <Text className="text-xs text-gray-500">
                  {cat.summary.graded_count}/{cat.summary.count} graded
                </Text>
              </View>
              <Text className={`text-2xl font-black ${cat.scoreClass}`}>
                {cat.summary.average.toFixed(1)}%
              </Text>
            </View>

            <ProgressBar
              value={cat.summary.average}
              colorClass={cat.barClass}
            />

            {/* Min / avg / max */}
            <View className="flex-row mt-3 pt-3 border-t border-gray-200">
              {[
                { label: "Highest", val: cat.summary.highest },
                { label: "Average", val: cat.summary.average },
                { label: "Lowest", val: cat.summary.lowest },
              ].map((stat, idx) => (
                <View
                  key={stat.label}
                  className={`flex-1 items-center ${idx < 2 ? "border-r border-gray-200" : ""}`}
                >
                  <Text className="text-base font-bold text-gray-900">
                    {stat.val.toFixed(0)}%
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Activities Tab ───────────────────────────────────────────────────────────
function ActivitiesTab({ data }: { data: ComprehensiveGradesResponse }) {
  return (
    <View>
      <SummaryStatRow
        stats={[
          {
            label: "Graded",
            val: `${data.summary.activities.graded_count}/${data.summary.activities.count}`,
            cls: "text-gray-900",
          },
          {
            label: "Average",
            val: `${data.summary.activities.average.toFixed(1)}%`,
            cls: "text-purple-600",
          },
          {
            label: "Best",
            val: `${data.summary.activities.highest}%`,
            cls: "text-emerald-600",
          },
        ]}
      />

      {data.activity_grades.map((activity, idx) => {
        const hasGrade =
          activity.grade !== undefined && activity.grade !== null;
        const { letter, color } = hasGrade
          ? getLetterGrade(activity.grade!)
          : { letter: "—", color: "#52525b" };

        const accentByType: Record<string, string> = {
          project: "bg-red-500",
          assignment: "bg-purple-500",
          lab: "bg-sky-500",
        };
        const accentClass =
          accentByType[activity.activity_type?.toLowerCase()] ?? "bg-gray-400";

        const barByType: Record<string, string> = {
          project: "bg-red-500",
          assignment: "bg-purple-500",
          lab: "bg-sky-500",
        };
        const barClass =
          barByType[activity.activity_type?.toLowerCase()] ?? "bg-gray-300";

        return (
          <View
            key={`activity-${idx}`}
            className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden"
          >
            <View className="flex-row">
              {/* Left accent bar */}
              <View className={`w-1 ${accentClass}`} />

              <View className="flex-1 p-4">
                {/* Title + grade circle */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-gray-900 leading-5 mb-2">
                      {activity.activity_title}
                    </Text>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <ActivityTypePill type={activity.activity_type} />
                      <Text className="text-xs text-gray-500">
                        M{activity.module_position} · A
                        {activity.activity_position}
                      </Text>
                    </View>
                  </View>

                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center border-2"
                    style={{
                      borderColor: color,
                      backgroundColor: color + "22",
                    }}
                  >
                    <Text className="text-xl font-black" style={{ color }}>
                      {letter}
                    </Text>
                    {hasGrade && (
                      <Text className="text-xs text-gray-500">
                        {activity.grade}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Progress bar */}
                {hasGrade && (
                  <View className="mb-3">
                    <ProgressBar
                      value={activity.grade!}
                      colorClass={barClass}
                    />
                  </View>
                )}

                {/* Status + submitted date */}
                <View className="flex-row items-center justify-between">
                  <StatusBadge status={activity.status} />
                  {activity.submitted_at && (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#9CA3AF"
                      />
                      <Text className="text-xs text-gray-500 ml-1">
                        {formatDate(activity.submitted_at)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Instructor feedback */}
                {activity.feedback && (
                  <View className="mt-3 bg-purple-50 border-l-2 border-purple-500 rounded-r-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <MaterialIcons
                        name="feedback"
                        size={12}
                        color="#7C3AED"
                      />
                      <Text className="text-xs font-bold text-purple-600 ml-1">
                        Instructor Feedback
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-600 leading-4">
                      {activity.feedback}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Shared Assessment Card (Quizzes + Exams) ─────────────────────────────────
function AssessmentCard({
  name,
  period,
  score,
  totalQuestions,
  correctAnswers,
  completedAt,
  accentClass,
  barClass,
}: {
  name: string;
  period: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string | null;
  accentClass: string;
  barClass: string;
}) {
  const isComplete = completedAt !== null;
  const { letter, color } = getLetterGrade(score);
  const incorrectAnswers = totalQuestions - correctAnswers;
  const pctCorrect =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return (
    <View className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden">
      <View className="flex-row">
        <View className={`w-1 ${accentClass}`} />
        <View className="flex-1 p-4">
          {/* Name + grade circle */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-gray-900 leading-5 mb-1">
                {name}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-1">{period}</Text>
              </View>
            </View>

            {isComplete ? (
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center border-2"
                style={{ borderColor: color, backgroundColor: color + "22" }}
              >
                <Text className="text-xl font-black" style={{ color }}>
                  {letter}
                </Text>
                <Text className="text-xs text-gray-500">{score}</Text>
              </View>
            ) : (
              <View className="bg-amber-50 rounded-xl px-3 py-2 items-center">
                <Ionicons name="hourglass-outline" size={16} color="#D97706" />
                <Text className="text-xs text-amber-600 font-bold mt-0.5">
                  Soon
                </Text>
              </View>
            )}
          </View>

          {/* Stats when complete */}
          {isComplete && (
            <>
              <View className="mb-3">
                <ProgressBar value={pctCorrect} colorClass={barClass} />
              </View>

              <View className="flex-row bg-gray-100 rounded-xl overflow-hidden mb-3">
                {[
                  {
                    label: "Correct",
                    val: correctAnswers,
                    cls: "text-emerald-600",
                  },
                  {
                    label: "Wrong",
                    val: incorrectAnswers,
                    cls: "text-red-500",
                  },
                  {
                    label: "Total",
                    val: totalQuestions,
                    cls: "text-gray-900",
                  },
                ].map((s, i) => (
                  <View
                    key={s.label}
                    className={`flex-1 items-center py-2.5 ${
                      i < 2 ? "border-r border-gray-200" : ""
                    }`}
                  >
                    <Text className={`text-base font-black ${s.cls}`}>
                      {s.val}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text className="text-xs text-gray-500 ml-1">
                  Completed {formatDate(completedAt)}
                </Text>
              </View>
            </>
          )}

          {!isComplete && (
            <View className="bg-amber-50 rounded-lg px-3 py-2 flex-row items-center">
              <Ionicons
                name="information-circle-outline"
                size={13}
                color="#D97706"
              />
              <Text className="text-xs text-amber-600 ml-1.5">
                Not yet taken
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function QuizzesTab({ data }: { data: ComprehensiveGradesResponse }) {
  return (
    <View>
      <SummaryStatRow
        stats={[
          {
            label: "Total",
            val: `${data.summary.quizzes.count}`,
            cls: "text-gray-900",
          },
          {
            label: "Average",
            val: `${data.summary.quizzes.average.toFixed(1)}%`,
            cls: "text-purple-600",
          },
          {
            label: "Highest",
            val: `${data.summary.quizzes.highest}%`,
            cls: "text-emerald-600",
          },
        ]}
      />
      {data.quiz_grades.map((quiz, idx) => (
        <AssessmentCard
          key={`quiz-${idx}`}
          name={quiz.exam_name}
          period={quiz.exam_period}
          score={quiz.score}
          totalQuestions={quiz.total_questions}
          correctAnswers={quiz.correct_answers}
          completedAt={quiz.completed_at}
          accentClass="bg-purple-500"
          barClass="bg-purple-500"
        />
      ))}
    </View>
  );
}

function ExamsTab({ data }: { data: ComprehensiveGradesResponse }) {
  return (
    <View>
      <SummaryStatRow
        stats={[
          {
            label: "Total",
            val: `${data.summary.exams.count}`,
            cls: "text-gray-900",
          },
          {
            label: "Average",
            val: `${data.summary.exams.average.toFixed(1)}%`,
            cls: "text-red-500",
          },
          {
            label: "Highest",
            val: `${data.summary.exams.highest}%`,
            cls: "text-emerald-600",
          },
        ]}
      />
      {data.exam_grades.map((exam, idx) => (
        <AssessmentCard
          key={`exam-${idx}`}
          name={exam.exam_name}
          period={exam.exam_period}
          score={exam.score}
          totalQuestions={exam.total_questions}
          correctAnswers={exam.correct_answers}
          completedAt={exam.completed_at}
          accentClass="bg-red-500"
          barClass="bg-red-500"
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ComprehensiveGradesScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { course_id } = useCourseStore();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery(
    createComprehensiveGradesOptions(course_id!),
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EF4444" />
          <Text className="text-gray-400 text-sm mt-3">Loading grades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 bg-red-50 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text className="text-gray-900 text-lg font-bold text-center mb-2">
            Failed to Load Grades
          </Text>
          <Text className="text-gray-400 text-sm text-center mb-6">
            Something went wrong while fetching your grades. Please try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-red-500 rounded-xl px-6 py-3 active:bg-red-600"
          >
            <Text className="text-white font-bold">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────── */}
      <View className="bg-white border-b border-gray-200">
        {/* Crimson accent line */}
        <View className="h-0.5 bg-red-500" />

        <View className="px-5 pt-4 pb-0">
          <Text className="text-xs text-red-500 font-bold tracking-widest mb-0.5">
            {data.course_info.course_code}
          </Text>
          <Text
            className="text-xl font-black text-gray-900 leading-tight"
            numberOfLines={1}
          >
            {data.course_info.course_title}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5 mb-4">
            Academic Performance Report
          </Text>
        </View>

        {/* Tab bar */}
        <View className="flex-row">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="flex-1 items-center pt-2 pb-3 relative"
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View className="absolute bottom-0 left-3 right-3 h-0.5 bg-red-500 rounded-full" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={["#EF4444"]}
            tintColor="#EF4444"
            title="Pull to refresh"
            titleColor="#9CA3AF"
          />
        }
      >
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "activities" && <ActivitiesTab data={data} />}
        {activeTab === "quizzes" && <QuizzesTab data={data} />}
        {activeTab === "exams" && <ExamsTab data={data} />}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
