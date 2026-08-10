import createActivitiesOptions from "@/api/QueryOptions/actvitiesOptions";
import createCommentsOptions from "@/api/QueryOptions/commentsOptions";
import createCourseDetailsOptions from "@/api/QueryOptions/courseDetailsOptions";
import createModuleProgressOptions from "@/api/QueryOptions/moduleProgressOptions";
import { useTrackSection } from "@/api/QueryOptions/trackSectionMutation";
import ActivitySubmissionModal from "@/components/ActivitySubmissionModal";
import { AppScreen } from "@/components/ui";
import CommentsModal from "@/components/commentsModal";
import ModuleProgressBar from "@/components/ModuleProgressBar";
import { useCourseStore } from "@/store/useCourseStore";
import { useAppTheme } from "@/theme";
import {
  ActivityWithGrade,
  Module,
  ModuleProgress,
  ParsedModule,
  Section,
  SingleActivity,
} from "@/types/api";
import {
  HTMLContent,
} from "@/utils/RenderHTML";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LegendList, LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

// Skeleton components
import ActivitySkeleton from "@/components/skeletons/activitySkeleton";
import ModuleSkeleton from "@/components/skeletons/moduleSkeleton";
import SectionSkeleton from "@/components/skeletons/sectionSkeleton";

type ModuleListItem = ParsedModule & { commentCount: number };

function cleanSummaryText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSummary(module: Module, index: number) {
  const html = module.content_html ?? "";
  const heading = html.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  const paragraph = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];

  return {
    title: cleanSummaryText(heading ?? "") || `Module ${module.position || index + 1}`,
    description: cleanSummaryText(paragraph ?? "") || "No description available.",
  };
}

function scheduleIdle(callback: () => void): () => void {
  const runtime = globalThis as typeof globalThis & {
    requestIdleCallback?: (task: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (runtime.requestIdleCallback) {
    const handle = runtime.requestIdleCallback(callback, { timeout: 250 });
    return () => runtime.cancelIdleCallback?.(handle);
  }

  const handle = setTimeout(callback, 0);
  return () => clearTimeout(handle);
}

export default function Modules() {
  const { theme } = useAppTheme();
  const { course_id, instance_id } = useCourseStore();
  const [loadModuleDetails, setLoadModuleDetails] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<SingleActivity | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [commentsModuleId, setCommentsModuleId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<LegendListRef>(null);
  const sectionRefs = useRef<{ [key: number]: View | null }>({});

  const queryClient = useQueryClient();
  const { mutate, isPending } = useTrackSection();

  // React Query serves cached course details while they are fresh.
  const {
    data: courseDetails,
    isLoading: loadingModules,
  } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });

  const moduleData: Module[] | null = courseDetails?.modules ?? null;

  // Let the initial module shell mount before starting the per-module requests.
  React.useEffect(() => {
    setLoadModuleDetails(false);
    if (!courseDetails?.modules) return;
    return scheduleIdle(() => {
      setLoadModuleDetails(true);
    });
  }, [courseDetails, course_id]);

  const moduleSummaries = useMemo(() => {
    if (!moduleData) return new Map<number, { title: string; description: string }>();
    return new Map(moduleData.map((module, index) => [module.module_id, extractSummary(module, index)]));
  }, [moduleData]);

  // Fetch activities for all modules in parallel
  const activitiesQueries = useQueries({
    queries: (moduleData || []).map((module) =>
      ({
        ...createActivitiesOptions(module.module_id),
        enabled: loadModuleDetails,
      }),
    ),
  });

  // Fetch progress for all modules in parallel
  const progressQueries = useQueries({
    queries: (moduleData || []).map((module) =>
      ({
        ...createModuleProgressOptions(module.module_id),
        enabled: loadModuleDetails,
      }),
    ),
  });

  // Fetch comment counts for all modules in parallel
  const commentCountQueries = useQueries({
    queries: (moduleData || []).map((module) =>
      ({
        ...createCommentsOptions(instance_id!, module.module_id, 1, 1),
        enabled: loadModuleDetails && !!instance_id,
      }),
    ),
    combine: (results) => ({
      data: results.map(
        (result) => (result.data as { total?: number } | undefined)?.total ?? 0,
      ),
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  // Combine modules with activities and progress (no parsing here!)
  const parsedModules = useMemo<ModuleListItem[]>(() => {
    if (!moduleData) return [];

    return moduleData.map((module: Module, index: number) => {
      const summary = moduleSummaries.get(module.module_id) ?? extractSummary(module, index);
      const parsedTitle = summary.title;
      const parsedDescription = summary.description;

      const queryResult = activitiesQueries[index];
      const activitiesData = queryResult?.data as ActivityWithGrade | undefined;
      const activities: SingleActivity[] = activitiesData?.activities || [];

      const progressResult = progressQueries[index];
      const progressData = progressResult?.data as ModuleProgress | undefined;
      const progress = progressData || null;

      const commentCount = commentCountQueries.data[index] ?? 0;

      return {
        ...module,
        parsedTitle,
        parsedDescription,
        progress,
        activities,
        commentCount,
        isLoadingActivities: !loadModuleDetails || queryResult?.isLoading || false,
        activitiesError: queryResult?.isError || false,
      };
    });
  }, [
    moduleData,
    activitiesQueries,
    progressQueries,
    moduleSummaries,
    commentCountQueries.data,
    loadModuleDetails,
  ]);

  const toggleSection = (sectionId: number) => {
    const isOpening = openSectionId !== sectionId;
    setOpenSectionId(isOpening ? sectionId : null);

    if (isOpening && sectionRefs.current[sectionId] && !isPending) {
      mutate({ section_id: sectionId });
      setTimeout(() => {
        const nativeScrollRef = listRef.current?.getNativeScrollRef() as
          | React.ElementRef<typeof View>
          | undefined;
        if (!nativeScrollRef) return;

        sectionRefs.current[sectionId]?.measureLayout(
          nativeScrollRef,
          (x, y) => {
            listRef.current?.scrollToOffset({ offset: y - 20, animated: true });
          },
          () => console.log("measureLayout failed"),
        );
      }, 100);
    }
  };

  const handleOpenSubmission = (activity: SingleActivity) => {
    setSelectedActivity(activity);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedActivity(null);
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return { bg: theme.surfaceMuted, text: theme.success };
      case "graded":
        return { bg: theme.surfaceMuted, text: theme.primary };
      case "pending":
        return { bg: theme.surfaceMuted, text: theme.warning };
      default:
        return { bg: theme.surfaceMuted, text: theme.textMuted };
    }
  };

  const renderActivity = (activity: SingleActivity) => {
    const hasSubmission = activity.has_submission === true;
    const isGraded = activity.is_graded === true;
    const canSubmit = !isGraded;
    const getButtonText = () => {
      if (isGraded) return "View Grade";
      if (hasSubmission) return "Resubmit (Pending Grade)";
      return "Submit Activity";
    };
    const statusColors = activity.status
      ? getStatusColor(activity.status)
      : null;

    return (
      <View
        key={activity.activity_id}
        className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-xl p-4 mb-3 border border-[#E6E1E8] dark:border-[#37313C] shadow-sm"
      >
        {/* Activity Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
            <Text className="text-base font-bold text-[#201D25] dark:text-[#F7F4FA] mb-1">
              {activity.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                style={{ backgroundColor: theme.surfaceMuted }}
                className="rounded-full px-3 py-1"
              >
                <Text
                  style={{ color: theme.primary }}
                  className="text-xs font-semibold capitalize"
                >
                  {activity.activity_type}
                </Text>
              </View>
            </View>
          </View>

          {activity.is_graded && activity.grade !== null && (
            <View className="bg-[#B42335] dark:bg-[#F06A78] rounded-xl px-4 py-2 shadow-sm">
              <Text className="text-xs text-white font-medium">GRADE</Text>
              <Text className="text-xl font-bold text-white text-center">
                {activity.grade}%
              </Text>
            </View>
          )}
        </View>

        {/* Status Badges */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {activity.status && statusColors && (
            <View
              style={{ backgroundColor: statusColors.bg }}
              className="rounded-full px-3 py-1.5 flex-row items-center"
            >
              <MaterialIcons
                name={
                  activity.status.toLowerCase() === "submitted"
                    ? "check-circle"
                    : activity.status.toLowerCase() === "graded"
                      ? "star"
                      : "pending"
                }
                size={12}
                color={statusColors.text}
              />
              <Text
                style={{ color: statusColors.text }}
                className="text-xs font-semibold capitalize ml-1"
              >
                {activity.status}
              </Text>
            </View>
          )}
          {activity.has_submission && !activity.is_graded && (
            <View
              style={{ backgroundColor: theme.surfaceMuted }}
              className="rounded-full px-3 py-1.5 flex-row items-center"
            >
              <Ionicons name="time-outline" size={12} color={theme.warning} />
              <Text
                style={{ color: theme.warning }}
                className="text-xs font-semibold ml-1"
              >
                Pending Review
              </Text>
            </View>
          )}
        </View>

        {/* Submission Date */}
        {activity.submitted_at && (
          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
            <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1">
              Submitted:{" "}
              {new Date(activity.submitted_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-lg p-3 mb-3">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="description" size={16} color={theme.textMuted} />
            <Text className="text-xs font-semibold text-[#201D25] dark:text-[#F7F4FA] ml-1">
              Instructions
            </Text>
          </View>
          <View className="text-sm text-[#6C6572] dark:text-[#BEB6C5] leading-5">
            <HTMLContent htmlContent={activity.instructions} />
          </View>
        </View>

        {/* Feedback */}
        {activity.feedback && (
          <View
            style={{ backgroundColor: theme.surfaceMuted }}
            className="border-l-4 border-[#B42335] dark:border-[#F06A78] rounded-lg p-3 mb-3"
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="feedback" size={16} color={theme.school} />
              <Text className="text-xs font-bold text-[#201D25] dark:text-[#F7F4FA] ml-1">
                Instructor Feedback
              </Text>
            </View>
            <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] leading-5">
              {activity.feedback}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={() => handleOpenSubmission(activity)}
          disabled={!canSubmit}
          className={`rounded-xl py-3 px-4 flex-row items-center justify-center ${
            canSubmit ? "bg-[#B42335] dark:bg-[#F06A78] active:bg-[#B42335] dark:active:bg-[#F06A78]" : "bg-[#E6E1E8] dark:bg-[#37313C]"
          }`}
        >
          <MaterialIcons
            name={
              isGraded
                ? "check-circle"
                : hasSubmission
                  ? "edit"
                  : "upload-file"
            }
            size={18}
            color="#FFFFFF"
          />
          <Text className="text-sm font-semibold text-white ml-2">
            {getButtonText()}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderModuleSections = (module: ParsedModule) => {
    if (!module.sections || module.sections.length === 0) {
      return (
        <View className="mt-6 pt-4 border-t border-[#E6E1E8] dark:border-[#37313C]">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="folder-open" size={20} color={theme.school} />
            <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] ml-2">
              Module Sections
            </Text>
          </View>
          <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-lg p-4">
            <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center">
              No sections available for this module.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className="mt-6 pt-4 border-t border-[#E6E1E8] dark:border-[#37313C]">
        <View className="flex-row items-center mb-4">
          <MaterialIcons name="folder-open" size={20} color={theme.school} />
          <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] ml-2">
            Module Sections
          </Text>
        </View>
        {module.sections.map((section: Section) => {
          const isOpen = openSectionId === section.section_id;
          return (
            <View
              key={section.section_id}
              className="mb-3"
              ref={(ref: View | null): void => {
                sectionRefs.current[section.section_id] = ref;
              }}
            >
              <Pressable
                onPress={() => toggleSection(section.section_id)}
                className={`rounded-xl p-4 border ${isOpen ? "bg-[#FCECEF] dark:bg-[#3A2025] border-[#E6E1E8] dark:border-[#37313C]" : "bg-[#FFFFFF] dark:bg-[#1A181E] border-[#E6E1E8] dark:border-[#37313C]"}`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isOpen ? "bg-[#B42335] dark:bg-[#F06A78]" : "bg-[#F2ECF8] dark:bg-[#2A2038]"}`}
                    >
                      <MaterialIcons
                        name="article"
                        size={16}
                        color={isOpen ? "#FFFFFF" : theme.textMuted}
                      />
                    </View>
                    <Text
                      className={`text-sm font-semibold flex-1 ${isOpen ? "text-[#B42335] dark:text-[#F06A78]" : "text-[#201D25] dark:text-[#F7F4FA]"}`}
                    >
                      {section.title}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${isOpen ? "bg-[#B42335] dark:bg-[#F06A78]" : "bg-[#F2ECF8] dark:bg-[#2A2038]"}`}
                  >
                    <MaterialIcons
                      name={
                        isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"
                      }
                      size={20}
                      color={isOpen ? "#FFFFFF" : theme.textMuted}
                    />
                  </View>
                </View>
              </Pressable>
              {isOpen && (
                <View className="bg-[#FFFFFF] dark:bg-[#1A181E] border-x border-b border-[#E6E1E8] dark:border-[#37313C] rounded-b-xl p-4 mt-[-8px]">
                  <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-lg p-4">
                    <HTMLContent htmlContent={section.content} />
                  </View>
                </View>
              )}
            </View>
          );
        })}
        <View className="flex-row items-center justify-center mt-2">
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={theme.textMuted}
          />
          <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] italic ml-1">
            Tap section titles to expand or collapse
          </Text>
        </View>
      </View>
    );
  };

  const renderModuleActivities = (module: ParsedModule) => (
    <View className="mt-6 pt-4 border-t border-[#E6E1E8] dark:border-[#37313C]">
      <View className="flex-row items-center mb-4">
        <MaterialIcons name="assignment" size={20} color={theme.school} />
        <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] ml-2">
          Module Activities
        </Text>
      </View>
      {module.isLoadingActivities ? (
        Array.from({ length: 2 }).map((_, i) => <ActivitySkeleton key={i} />)
      ) : module.activitiesError ? (
        <View className="bg-[#FCECEF] dark:bg-[#3A2025] border border-[#E6E1E8] dark:border-[#37313C] rounded-xl p-4">
          <View className="flex-row items-center justify-center">
            <Ionicons name="alert-circle" size={20} color={theme.danger} />
            <Text className="text-sm text-[#B42335] dark:text-[#F06A78] ml-2 font-medium">
              Failed to load activities
            </Text>
          </View>
          <Text className="text-xs text-[#B42335] dark:text-[#F06A78] text-center mt-1">
            Please try again later
          </Text>
        </View>
      ) : module.activities.length === 0 ? (
        <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-xl p-6">
          <View className="items-center">
            <MaterialIcons name="assignment-late" size={48} color={theme.tabInactive} />
            <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center mt-3">
              No activities available for this module yet
            </Text>
          </View>
        </View>
      ) : (
        <View>{module.activities.map(renderActivity)}</View>
      )}
    </View>
  );

  const renderModule = ({
    item: module,
    index,
  }: LegendListRenderItemProps<ModuleListItem>) => (
    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl shadow-sm border border-[#E6E1E8] dark:border-[#37313C] mb-4 overflow-hidden">
      {/* Module Header */}
      <View className="bg-[#B42335] dark:bg-[#F06A78] px-5 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
              <Text className="text-white font-bold text-lg">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-white/80 font-medium mb-1">
                MODULE {index + 1}
              </Text>
              <Text className="text-xl font-bold text-white">
                {module.parsedTitle}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setCommentsModuleId(module.module_id)}
            className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center active:bg-white/30"
          >
            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            {module.commentCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#FFFFFF] dark:bg-[#1A181E] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                <Text className="text-[#B42335] dark:text-[#F06A78] text-[10px] font-bold">
                  {module.commentCount > 99 ? "99+" : module.commentCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View className="p-5">
        <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-xl p-4 mb-4">
          <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] leading-6">
            {module.parsedDescription}
          </Text>
        </View>

        {module.progress && (
          <View className="mb-4">
            <ModuleProgressBar progress={module.progress} showDetails />
          </View>
        )}

        {module.sections ? (
          renderModuleSections(module)
        ) : (
          Array.from({ length: 2 }).map((_, i) => <SectionSkeleton key={i} />)
        )}

        {renderModuleActivities(module)}
      </View>
    </View>
  );

  const renderEmptyState = () =>
    loadingModules || !moduleData ? (
      <View className="p-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <ModuleSkeleton key={i} />
        ))}
      </View>
    ) : (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <View className="w-24 h-24 bg-[#FCECEF] dark:bg-[#3A2025] rounded-full items-center justify-center mb-6">
          <MaterialIcons name="library-books" size={44} color={theme.school} />
        </View>
        <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA] text-center mb-2">
          No Modules Yet
        </Text>
        <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center leading-6 mb-8">
          This course doesn&apos;t have any modules available at the moment. Check
          back later or contact your instructor.
        </Text>
        <Pressable
          onPress={onRefresh}
          className="flex-row items-center bg-[#B42335] dark:bg-[#F06A78] active:bg-[#B42335] dark:active:bg-[#F06A78] rounded-xl px-6 py-3"
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white ml-2">Refresh</Text>
        </Pressable>
      </View>
    );

  return (
    <AppScreen>
      <LegendList
        ref={listRef}
        data={loadingModules || !moduleData ? [] : parsedModules}
        renderItem={renderModule}
        keyExtractor={(item) => item.module_id.toString()}
        estimatedItemSize={700}
        contentContainerClassName="p-4"
        className="flex-1"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          loadingModules ? (
            <View className="mb-4 flex-row items-center rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] bg-[#F2ECF8] dark:bg-[#2A2038] px-4 py-3">
              <ActivityIndicator size="small" color={theme.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-[#201D25] dark:text-[#F7F4FA]">
                  Loading modules
                </Text>
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-0.5">
                  Preparing your course content...
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={<View className="h-6" />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.school]}
            tintColor={theme.school}
            title="Pull to refresh"
            titleColor={theme.textMuted}
          />
        }
      />

      <ActivitySubmissionModal
        visible={isModalVisible}
        activity={selectedActivity}
        onClose={handleCloseModal}
      />

      {instance_id && (
        <CommentsModal
          visible={!!commentsModuleId}
          onClose={() => setCommentsModuleId(null)}
          instanceId={instance_id}
          moduleId={commentsModuleId ?? undefined}
        />
      )}
    </AppScreen>
  );
}
