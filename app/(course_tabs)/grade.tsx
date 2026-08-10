import createComprehensiveGradesOptions from "@/api/QueryOptions/comprehensiveGradesOptions";
import { AppScreen, StateView } from "@/components/ui";
import Skeleton from "@/components/skeletons/Skeleton";
import { useCourseStore } from "@/store/useCourseStore";
import { useAppTheme } from "@/theme";
import type { Theme } from "@/theme";
import { ComprehensiveGradesResponse, SubmissionGrade } from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "overview" | "activities" | "quizzes" | "exams" | "submissions";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "activities", label: "Activities" },
  { key: "quizzes", label: "Quizzes" },
  { key: "exams", label: "Exams" },
  { key: "submissions", label: "Submissions" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getLetterGrade = (score: number, theme: Theme) => {
  if (score >= 90) return { letter: "A", color: theme.success };
  if (score >= 80) return { letter: "B", color: theme.primary };
  if (score >= 70) return { letter: "C", color: theme.warning };
  if (score >= 60) return { letter: "D", color: theme.warning };
  return { letter: "F", color: theme.danger };
};

const getScoreTextColor = (score: number) => {
  if (score >= 85) return "text-[#167A50] dark:text-[#58C99A]";
  if (score >= 70) return "text-[#6842A0] dark:text-[#A98ADC]";
  return "text-[#B42335] dark:text-[#F06A78]";
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
  colorClass = "bg-[#B42335] dark:bg-[#F06A78]",
}: {
  value: number;
  colorClass?: string;
}) => (
  <View className="h-1 bg-[#E6E1E8] dark:bg-[#37313C] rounded-full overflow-hidden">
    <View
      className={`h-full rounded-full ${colorClass}`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { bg: string; text: string }> = {
    graded: { bg: "bg-[#F2ECF8] dark:bg-[#2A2038]", text: "text-[#167A50] dark:text-[#58C99A]" },
    submitted: { bg: "bg-[#F2ECF8] dark:bg-[#2A2038]", text: "text-[#6842A0] dark:text-[#A98ADC]" },
    pending: { bg: "bg-[#F2ECF8] dark:bg-[#2A2038]", text: "text-[#A75D00] dark:text-[#F2B35C]" },
    late: { bg: "bg-[#FCECEF] dark:bg-[#3A2025]", text: "text-[#B42335] dark:text-[#F06A78]" },
  };
  const cfg = configs[status?.toLowerCase()] ?? {
    bg: "bg-[#F2ECF8] dark:bg-[#2A2038]",
    text: "text-[#6C6572] dark:text-[#BEB6C5]",
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
    project: { bg: "bg-[#FCECEF] dark:bg-[#3A2025]", text: "text-[#B42335] dark:text-[#F06A78]" },
    assignment: { bg: "bg-[#F2ECF8] dark:bg-[#2A2038]", text: "text-[#6842A0] dark:text-[#A98ADC]" },
    lab: { bg: "bg-[#F2ECF8] dark:bg-[#2A2038]", text: "text-[#6842A0] dark:text-[#A98ADC]" },
  };
  const cfg = configs[type?.toLowerCase()] ?? {
    bg: "bg-[#F2ECF8] dark:bg-[#2A2038]",
    text: "text-[#6C6572] dark:text-[#BEB6C5]",
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
  <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] flex-row mb-4 overflow-hidden">
    {stats.map((item, idx) => (
      <View
        key={item.label}
        className={`flex-1 items-center py-3 ${idx < stats.length - 1 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
      >
        <Text className={`text-base font-bold ${item.cls}`}>{item.val}</Text>
        <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-0.5">{item.label}</Text>
      </View>
    ))}
  </View>
);

// ─── Skeleton Components ──────────────────────────────────────────────────────

const OverviewSkeleton = () => (
  <View>
    {/* Overall Grade Card Skeleton */}
    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] overflow-hidden mb-4">
      <View className="bg-[#B42335] dark:bg-[#F06A78] px-5 pt-4 pb-6">
        <Skeleton
          height={12}
          width={120}
          style={{ marginBottom: 8 }}
          baseColor="rgba(255, 255, 255, 0.2)"
          highlightColor="rgba(255, 255, 255, 0.3)"
        />
        <Skeleton
          height={16}
          width="80%"
          baseColor="rgba(255, 255, 255, 0.2)"
          highlightColor="rgba(255, 255, 255, 0.3)"
        />
      </View>

      <View className="flex-row items-end px-5 pt-4 pb-5 -mt-3">
        <View className="flex-1 mr-4">
          <Skeleton height={72} width={120} style={{ marginBottom: 8 }} />
          <Skeleton height={12} width="60%" style={{ marginBottom: 12 }} />
          <Skeleton height={4} width="100%" />
        </View>
        <Skeleton height={64} width={64} borderRadius={16} />
      </View>

      <View className="flex-row border-t border-[#E6E1E8] dark:border-[#37313C]">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className={`flex-1 items-center py-3 ${i < 3 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
          >
            <Skeleton height={16} width={40} style={{ marginBottom: 4 }} />
            <Skeleton height={12} width={60} />
          </View>
        ))}
      </View>
    </View>

    {/* Category Cards Skeleton */}
    <Skeleton height={12} width={150} style={{ marginBottom: 12 }} />
    {[1, 2, 3].map((i) => (
      <View
        key={i}
        className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 p-4"
      >
        <View className="flex-row items-center mb-3">
          <Skeleton
            height={36}
            width={36}
            borderRadius={12}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1">
            <Skeleton height={16} width="60%" style={{ marginBottom: 4 }} />
            <Skeleton height={12} width="40%" />
          </View>
          <Skeleton height={28} width={60} />
        </View>
        <Skeleton height={4} width="100%" style={{ marginBottom: 12 }} />
        <View className="flex-row">
          {[1, 2, 3].map((j) => (
            <View
              key={j}
              className={`flex-1 items-center ${j < 3 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
            >
              <Skeleton height={16} width={40} style={{ marginBottom: 4 }} />
              <Skeleton height={12} width={50} />
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
);

const ActivityCardSkeleton = () => (
  <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 overflow-hidden">
    <View className="flex-row">
      <View className="w-1 bg-[#E6E1E8] dark:bg-[#37313C]" />
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-3">
            <Skeleton height={14} width="80%" style={{ marginBottom: 8 }} />
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Skeleton height={20} width={60} borderRadius={12} />
              <Skeleton height={12} width={60} />
            </View>
          </View>
          <Skeleton height={56} width={56} borderRadius={16} />
        </View>
        <Skeleton height={4} width="100%" style={{ marginBottom: 12 }} />
        <View className="flex-row items-center justify-between">
          <Skeleton height={20} width={70} borderRadius={12} />
          <Skeleton height={12} width={80} />
        </View>
      </View>
    </View>
  </View>
);

const AssessmentCardSkeleton = () => (
  <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 overflow-hidden">
    <View className="flex-row">
      <View className="w-1 bg-[#E6E1E8] dark:bg-[#37313C]" />
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-3">
            <Skeleton height={14} width="70%" style={{ marginBottom: 6 }} />
            <Skeleton height={12} width="50%" />
          </View>
          <Skeleton height={56} width={56} borderRadius={16} />
        </View>
        <Skeleton height={4} width="100%" style={{ marginBottom: 12 }} />
        <View className="bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl overflow-hidden mb-3">
          <View className="flex-row">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className={`flex-1 items-center py-2.5 ${i < 3 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
              >
                <Skeleton height={16} width={30} style={{ marginBottom: 4 }} />
                <Skeleton height={12} width={40} />
              </View>
            ))}
          </View>
        </View>
        <Skeleton height={12} width="60%" />
      </View>
    </View>
  </View>
);

const ListSkeleton = ({
  count = 3,
  type = "activity",
}: {
  count?: number;
  type?: "activity" | "assessment";
}) => (
  <View>
    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] flex-row mb-4 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className={`flex-1 items-center py-3 ${i < 3 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
        >
          <Skeleton height={16} width={40} style={{ marginBottom: 4 }} />
          <Skeleton height={12} width={50} />
        </View>
      ))}
    </View>
    {Array.from({ length: count }).map((_, i) =>
      type === "assessment" ? (
        <AssessmentCardSkeleton key={i} />
      ) : (
        <ActivityCardSkeleton key={i} />
      ),
    )}
  </View>
);

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: ComprehensiveGradesResponse }) {
  const { theme } = useAppTheme();
  const { letter, color } = getLetterGrade(data.overall_grade, theme);

  const categories = [
    {
      label: "Activities",
      summary: data.summary.activities,
      icon: "assignment" as const,
      headerBg: "bg-[#6842A0] dark:bg-[#A98ADC]",
      barClass: "bg-[#6842A0] dark:bg-[#A98ADC]",
      scoreClass: "text-[#6842A0] dark:text-[#A98ADC]",
    },
    {
      label: "Quizzes",
      summary: data.summary.quizzes,
      icon: "quiz" as const,
      headerBg: "bg-[#B42335] dark:bg-[#F06A78]",
      barClass: "bg-[#B42335] dark:bg-[#F06A78]",
      scoreClass: "text-[#B42335] dark:text-[#F06A78]",
    },
    {
      label: "Exams",
      summary: data.summary.exams,
      icon: "school" as const,
      headerBg: "bg-[#6842A0] dark:bg-[#A98ADC]",
      barClass: "bg-[#6842A0] dark:bg-[#A98ADC]",
      scoreClass: "text-[#6842A0] dark:text-[#A98ADC]",
    },
    {
      label: "Submissions",
      summary: data.summary.submissions,
      icon: "file-upload" as const,
      headerBg: "bg-[#A75D00] dark:bg-[#F2B35C]",
      barClass: "bg-[#A75D00] dark:bg-[#F2B35C]",
      scoreClass: "text-[#A75D00] dark:text-[#F2B35C]",
    },
  ];

  return (
    <View>
      {/* Overall Grade Card */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] overflow-hidden mb-4">
        {/* Crimson header band */}
        <View className="bg-[#B42335] dark:bg-[#F06A78] px-5 pt-4 pb-6">
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
              className="text-7xl font-black text-[#201D25] dark:text-[#F7F4FA] leading-none"
              style={{ letterSpacing: -3 }}
            >
              {data.overall_grade.toFixed(1)}
            </Text>
            <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-1">
              Based on all graded assessments
            </Text>
            <View className="mt-3">
              <ProgressBar value={data.overall_grade} colorClass="bg-[#B42335] dark:bg-[#F06A78]" />
            </View>
          </View>
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center border-2"
            style={{ borderColor: color, backgroundColor: theme.surfaceMuted }}
          >
            <Text className="text-3xl font-black" style={{ color }}>
              {letter}
            </Text>
          </View>
        </View>

        {/* 3-column category averages strip */}
        <View className="flex-row border-t border-[#E6E1E8] dark:border-[#37313C]">
          {[
            { label: "Activities", val: data.summary.activities.average },
            { label: "Quizzes", val: data.summary.quizzes.average },
            { label: "Exams", val: data.summary.exams.average },
            { label: "Submissions", val: data.summary.submissions.average },
          ].map((item, idx) => (
            <View
              key={item.label}
              className={`flex-1 items-center py-3 ${idx < 3 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
            >
              <Text
                className={`text-base font-bold ${getScoreTextColor(item.val)}`}
              >
                {item.val.toFixed(0)}%
              </Text>
              <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-0.5">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category Breakdown heading */}
      <Text className="text-xs font-bold text-[#6C6572] dark:text-[#BEB6C5] tracking-widest ml-1 mb-3">
        CATEGORY BREAKDOWN
      </Text>

      {categories.map((cat) => (
        <View
          key={cat.label}
          className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 overflow-hidden"
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
                <Text className="text-base font-bold text-[#201D25] dark:text-[#F7F4FA]">
                  {cat.label}
                </Text>
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
                  {cat.label === "Activities"
                    ? `${cat.summary.graded_count}/${cat.summary.count} graded`
                    : `${cat.summary.count} ${cat.label.toLowerCase()} completed`}
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
            <View className="flex-row mt-3 pt-3 border-t border-[#E6E1E8] dark:border-[#37313C]">
              {[
                { label: "Highest", val: cat.summary.highest },
                { label: "Average", val: cat.summary.average },
                { label: "Lowest", val: cat.summary.lowest },
              ].map((stat, idx) => (
                <View
                  key={stat.label}
                  className={`flex-1 items-center ${idx < 2 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""}`}
                >
                  <Text className="text-base font-bold text-[#201D25] dark:text-[#F7F4FA]">
                    {stat.val.toFixed(0)}%
                  </Text>
                  <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-0.5">
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
  const { theme } = useAppTheme();
  return (
    <View>
      <SummaryStatRow
        stats={[
          {
            label: "Graded",
            val: `${data.summary.activities.graded_count}/${data.summary.activities.count}`,
            cls: "text-[#201D25] dark:text-[#F7F4FA]",
          },
          {
            label: "Average",
            val: `${data.summary.activities.average.toFixed(1)}%`,
            cls: "text-[#6842A0] dark:text-[#A98ADC]",
          },
          {
            label: "Best",
            val: `${data.summary.activities.highest}%`,
            cls: "text-[#167A50] dark:text-[#58C99A]",
          },
        ]}
      />

      {data.activity_grades.map((activity, idx) => {
        const hasGrade =
          activity.grade !== undefined && activity.grade !== null;
        const { letter, color } = hasGrade
          ? getLetterGrade(activity.grade!, theme)
          : { letter: "—", color: theme.textMuted };

        const accentByType: Record<string, string> = {
          project: "bg-[#B42335] dark:bg-[#F06A78]",
          assignment: "bg-[#6842A0] dark:bg-[#A98ADC]",
          lab: "bg-[#6842A0] dark:bg-[#A98ADC]",
        };
        const accentClass =
          accentByType[activity.activity_type?.toLowerCase()] ?? "bg-[#817987] dark:bg-[#BEB6C5]";

        const barByType: Record<string, string> = {
          project: "bg-[#B42335] dark:bg-[#F06A78]",
          assignment: "bg-[#6842A0] dark:bg-[#A98ADC]",
          lab: "bg-[#6842A0] dark:bg-[#A98ADC]",
        };
        const barClass =
          barByType[activity.activity_type?.toLowerCase()] ?? "bg-[#E6E1E8] dark:bg-[#37313C]";

        return (
          <View
            key={`activity-${idx}`}
            className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 overflow-hidden"
          >
            <View className="flex-row">
              {/* Left accent bar */}
              <View className={`w-1 ${accentClass}`} />

              <View className="flex-1 p-4">
                {/* Title + grade circle */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-[#201D25] dark:text-[#F7F4FA] leading-5 mb-2">
                      {activity.activity_title}
                    </Text>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <ActivityTypePill type={activity.activity_type} />
                      <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
                        M{activity.module_position} · A
                        {activity.activity_position}
                      </Text>
                    </View>
                  </View>

                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center border-2"
                    style={{
                      borderColor: color,
                      backgroundColor: theme.surfaceMuted,
                    }}
                  >
                    <Text className="text-xl font-black" style={{ color }}>
                      {letter}
                    </Text>
                    {hasGrade && (
                      <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
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
                        color={theme.textMuted}
                      />
                      <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1">
                        {formatDate(activity.submitted_at)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Instructor feedback */}
                {activity.feedback && (
                  <View className="mt-3 bg-[#F2ECF8] dark:bg-[#2A2038] border-l-2 border-[#6842A0] dark:border-[#A98ADC] rounded-r-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <MaterialIcons
                        name="feedback"
                        size={12}
                        color={theme.primary}
                      />
                      <Text className="text-xs font-bold text-[#6842A0] dark:text-[#A98ADC] ml-1">
                        Instructor Feedback
                      </Text>
                    </View>
                    <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] leading-4">
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
  const { theme } = useAppTheme();
  const isComplete = completedAt !== null;
  const { letter, color } = getLetterGrade(score, theme);
  const incorrectAnswers = totalQuestions - correctAnswers;
  const pctCorrect =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return (
    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 overflow-hidden">
      <View className="flex-row">
        <View className={`w-1 ${accentClass}`} />
        <View className="flex-1 p-4">
          {/* Name + grade circle */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-[#201D25] dark:text-[#F7F4FA] leading-5 mb-1">
                {name}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1">{period}</Text>
              </View>
            </View>

            {isComplete ? (
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center border-2"
                style={{ borderColor: color, backgroundColor: theme.surfaceMuted }}
              >
                <Text className="text-xl font-black" style={{ color }}>
                  {letter}
                </Text>
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">{score}</Text>
              </View>
            ) : (
              <View className="bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl px-3 py-2 items-center">
                <Ionicons name="hourglass-outline" size={16} color={theme.warning} />
                <Text className="text-xs text-[#A75D00] dark:text-[#F2B35C] font-bold mt-0.5">
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

              <View className="flex-row bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl overflow-hidden mb-3">
                {[
                  {
                    label: "Correct",
                    val: correctAnswers,
                    cls: "text-[#167A50] dark:text-[#58C99A]",
                  },
                  {
                    label: "Wrong",
                    val: incorrectAnswers,
                    cls: "text-[#B42335] dark:text-[#F06A78]",
                  },
                  {
                    label: "Total",
                    val: totalQuestions,
                    cls: "text-[#201D25] dark:text-[#F7F4FA]",
                  },
                ].map((s, i) => (
                  <View
                    key={s.label}
                    className={`flex-1 items-center py-2.5 ${
                      i < 2 ? "border-r border-[#E6E1E8] dark:border-[#37313C]" : ""
                    }`}
                  >
                    <Text className={`text-base font-black ${s.cls}`}>
                      {s.val}
                    </Text>
                    <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-0.5">
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={13} color={theme.success} />
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1">
                  Completed {formatDate(completedAt)}
                </Text>
              </View>
            </>
          )}

          {!isComplete && (
            <View className="bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg px-3 py-2 flex-row items-center">
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={theme.warning}
              />
              <Text className="text-xs text-[#A75D00] dark:text-[#F2B35C] ml-1.5">
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
            cls: "text-[#201D25] dark:text-[#F7F4FA]",
          },
          {
            label: "Average",
            val: `${data.summary.quizzes.average.toFixed(1)}%`,
            cls: "text-[#6842A0] dark:text-[#A98ADC]",
          },
          {
            label: "Highest",
            val: `${data.summary.quizzes.highest}%`,
            cls: "text-[#167A50] dark:text-[#58C99A]",
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
          accentClass="bg-[#6842A0] dark:bg-[#A98ADC]"
          barClass="bg-[#6842A0] dark:bg-[#A98ADC]"
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
            cls: "text-[#201D25] dark:text-[#F7F4FA]",
          },
          {
            label: "Average",
            val: `${data.summary.exams.average.toFixed(1)}%`,
            cls: "text-[#B42335] dark:text-[#F06A78]",
          },
          {
            label: "Highest",
            val: `${data.summary.exams.highest}%`,
            cls: "text-[#167A50] dark:text-[#58C99A]",
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
          accentClass="bg-[#B42335] dark:bg-[#F06A78]"
          barClass="bg-[#B42335] dark:bg-[#F06A78]"
        />
      ))}
    </View>
  );
}

function SubmissionCard({ submission }: { submission: SubmissionGrade }) {
  const { theme } = useAppTheme();
  const hasGrade = submission.score !== null && submission.score !== undefined;
  const { letter, color } = hasGrade
    ? getLetterGrade(submission.score!, theme)
    : { letter: "—", color: theme.textMuted };

  return (
    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] mb-3 overflow-hidden">
      <View className="flex-row">
        <View className="w-1 bg-[#A75D00] dark:bg-[#F2B35C]" />
        <View className="flex-1 p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-[#201D25] dark:text-[#F7F4FA] leading-5">
                {submission.exam_name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1">
                  {submission.exam_period}
                </Text>
              </View>
            </View>
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center border-2"
              style={{ borderColor: color, backgroundColor: theme.surfaceMuted }}
            >
              <Text className="text-xl font-black" style={{ color }}>
                {letter}
              </Text>
              {hasGrade && <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">{submission.score}</Text>}
            </View>
          </View>

          {hasGrade && <View className="mt-3"><ProgressBar value={submission.score!} colorClass="bg-[#A75D00] dark:bg-[#F2B35C]" /></View>}

          <View className="flex-row items-center justify-between mt-3">
            <StatusBadge status={submission.status || "Submitted"} />
            <View className="items-end">
              <Text className="text-[11px] text-[#6C6572] dark:text-[#BEB6C5]">
                Submitted {formatDate(submission.submitted_at) ?? "—"}
              </Text>
              <Text className="text-[11px] text-[#6C6572] dark:text-[#BEB6C5] mt-0.5">
                {submission.graded_at ? `Graded ${formatDate(submission.graded_at)}` : "Awaiting grading"}
              </Text>
            </View>
          </View>

          {submission.feedback && (
            <View className="mt-3 bg-[#F2ECF8] dark:bg-[#2A2038] border-l-2 border-[#A75D00] dark:border-[#F2B35C] rounded-r-xl p-3">
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="feedback" size={12} color={theme.warning} />
                <Text className="text-xs font-bold text-[#A75D00] dark:text-[#F2B35C] ml-1">Instructor Feedback</Text>
              </View>
              <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] leading-4">{submission.feedback}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function SubmissionsTab({ data }: { data: ComprehensiveGradesResponse }) {
  const { theme } = useAppTheme();
  return (
    <View>
      <SummaryStatRow
        stats={[
          {
            label: "Graded",
            val: `${data.summary.submissions.graded_count ?? 0}/${data.summary.submissions.count}`,
            cls: "text-[#201D25] dark:text-[#F7F4FA]",
          },
          {
            label: "Average",
            val: `${data.summary.submissions.average.toFixed(1)}%`,
            cls: "text-[#A75D00] dark:text-[#F2B35C]",
          },
          {
            label: "Highest",
            val: `${data.summary.submissions.highest}%`,
            cls: "text-[#167A50] dark:text-[#58C99A]",
          },
        ]}
      />
      {data.submission_grades.map((submission, idx) => (
        <SubmissionCard key={`submission-${idx}`} submission={submission} />
      ))}
      {data.submission_grades.length === 0 && (
        <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] p-8 items-center">
          <MaterialIcons name="file-upload" size={44} color={theme.tabInactive} />
          <Text className="text-base font-bold text-[#201D25] dark:text-[#F7F4FA] mt-3">No submissions yet</Text>
          <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center mt-1">Submission grades will appear here after you submit work.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ComprehensiveGradesScreen() {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { course_id } = useCourseStore();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    ...createComprehensiveGradesOptions(course_id!),
    enabled: !!course_id,
  });

  if (isError) {
    return <AppScreen><StateView icon="cloud-offline-outline" title="Grades unavailable" message="Your academic performance report could not be loaded." actionLabel="Try again" onAction={() => void refetch()} /></AppScreen>;
  }

  return (
    <AppScreen>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] border-b border-[#E6E1E8] dark:border-[#37313C]">
        {/* Crimson accent line */}
        <View className="h-0.5 bg-[#B42335] dark:bg-[#F06A78]" />

        {isLoading ? (
          <View className="px-5 pt-4 pb-0">
            <Skeleton height={12} width={80} style={{ marginBottom: 6 }} />
            <Skeleton height={24} width="70%" style={{ marginBottom: 6 }} />
            <Skeleton height={12} width={150} style={{ marginBottom: 16 }} />
          </View>
        ) : data ? (
          <View className="px-5 pt-4 pb-0">
            <Text className="text-xs text-[#B42335] dark:text-[#F06A78] font-bold tracking-widest mb-0.5">
              {data.course_info.course_code}
            </Text>
            <Text
              className="text-xl font-black text-[#201D25] dark:text-[#F7F4FA] leading-tight"
              numberOfLines={1}
            >
              {data.course_info.course_title}
            </Text>
            <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-0.5 mb-4">
              Academic Performance Report
            </Text>
          </View>
        ) : null}

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
                    isActive ? "text-[#201D25] dark:text-[#F7F4FA]" : "text-[#817987] dark:text-[#BEB6C5]"
                  }`}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#B42335] dark:bg-[#F06A78] rounded-full" />
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
            colors={[theme.school]}
            tintColor={theme.school}
            title="Pull to refresh"
            titleColor={theme.textMuted}
          />
        }
      >
        {isLoading ? (
          <>
            {activeTab === "overview" && <OverviewSkeleton />}
            {activeTab === "activities" && (
              <ListSkeleton count={3} type="activity" />
            )}
            {activeTab === "quizzes" && (
              <ListSkeleton count={2} type="assessment" />
            )}
            {activeTab === "exams" && (
              <ListSkeleton count={2} type="assessment" />
            )}
            {activeTab === "submissions" && (
              <ListSkeleton count={2} type="assessment" />
            )}
          </>
        ) : data ? (
          <>
            {activeTab === "overview" && <OverviewTab data={data} />}
            {activeTab === "activities" && <ActivitiesTab data={data} />}
            {activeTab === "quizzes" && <QuizzesTab data={data} />}
            {activeTab === "exams" && <ExamsTab data={data} />}
            {activeTab === "submissions" && <SubmissionsTab data={data} />}
          </>
        ) : null}

        <View className="h-8" />
      </ScrollView>
    </AppScreen>
  );
}
