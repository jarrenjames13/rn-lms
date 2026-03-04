import createActivitiesOptions from "@/api/QueryOptions/actvitiesOptions";
import createCourseDetailsOptions from "@/api/QueryOptions/courseDetailsOptions";
import createModuleProgressOptions from "@/api/QueryOptions/moduleProgressOptions";
import { useTrackSection } from "@/api/QueryOptions/trackSectionMutation";
import ActivitySubmissionModal from "@/components/ActivitySubmissionModal";
import ModuleProgressBar from "@/components/ModuleProgressBar";
import { useCourseStore } from "@/store/useCourseStore";
import { useModuleStore } from "@/store/useModuleStore";
import {
  ActivityWithGrade,
  ModuleProgress,
  ParsedModule,
  Section,
  SingleActivity,
} from "@/types/api";
import {
  extractDescriptionFromParsed,
  extractTitleFromParsed,
  parseHTML,
  renderHTMLContent,
} from "@/utils/RenderHTML";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Skeleton components
import ActivitySkeleton from "@/components/skeletons/activitySkeleton";
import ModuleSkeleton from "@/components/skeletons/moduleSkeleton";
import SectionSkeleton from "@/components/skeletons/sectionSkeleton";

export default function Modules() {
  const { course_id } = useCourseStore();
  const { moduleData, setModuleData } = useModuleStore();
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<SingleActivity | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [parsedCache, setParsedCache] = useState<
    Map<number, { title: string; description: string }>
  >(new Map());
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: number]: View | null }>({});

  const queryClient = useQueryClient();
  const { mutate, isPending } = useTrackSection();

  // Fetch course details (including modules) when the screen is focused
  const {
    data: courseDetails,
    isLoading: loadingModules,
    refetch: refetchModules,
  } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });

  // Update module store when data changes
  useFocusEffect(
    useCallback(() => {
      if (course_id) {
        refetchModules();
      }
    }, [course_id, refetchModules]),
  );

  // Sync courseDetails to moduleData store
  React.useEffect(() => {
    if (courseDetails?.modules) {
      setModuleData(courseDetails.modules);
    }
  }, [courseDetails, setModuleData]);

  // Parse HTML for modules progressively (non-blocking)
  React.useEffect(() => {
    if (!moduleData) return;

    // Parse modules one at a time with small delays to keep UI responsive
    const parseModules = async () => {
      for (let i = 0; i < moduleData.length; i++) {
        const module = moduleData[i];

        // Skip if already parsed
        if (parsedCache.has(module.module_id)) continue;

        // Parse this module
        await new Promise((resolve) => {
          setTimeout(() => {
            try {
              const parsed = parseHTML(module.content_html);
              const title = extractTitleFromParsed(parsed);
              const description = extractDescriptionFromParsed(parsed);

              setParsedCache((prev) =>
                new Map(prev).set(module.module_id, { title, description }),
              );
            } catch (error) {
              console.error("Error parsing module:", error);
              setParsedCache((prev) =>
                new Map(prev).set(module.module_id, {
                  title: "Untitled Module",
                  description: "No description available",
                }),
              );
            }
            resolve(null);
          }, 0); // Let UI breathe between parses
        });
      }
    };

    parseModules();
  }, [moduleData, parsedCache]);

  // Fetch activities for all modules in parallel
  const activitiesQueries = useQueries({
    queries: (moduleData || []).map((module) =>
      createActivitiesOptions(module.module_id),
    ),
  });

  // Fetch progress for all modules in parallel
  const progressQueries = useQueries({
    queries: (moduleData || []).map((module) =>
      createModuleProgressOptions(module.module_id),
    ),
  });

  // Combine modules with activities and progress (no parsing here!)
  const parsedModules = useMemo(() => {
    if (!moduleData) return [];

    return moduleData.map((module, index) => {
      // Get cached parsed data or use placeholders
      const cached = parsedCache.get(module.module_id);
      const parsedTitle = cached?.title || "Loading...";
      const parsedDescription = cached?.description || "Loading description...";

      const queryResult = activitiesQueries[index];
      const activitiesData: ActivityWithGrade | undefined = queryResult?.data;
      const activities: SingleActivity[] = activitiesData?.activities || [];

      const progressResult = progressQueries[index];
      const progressData: ModuleProgress | undefined = progressResult?.data;
      const progress = progressData || null;

      return {
        ...module,
        parsedTitle,
        parsedDescription,
        progress,
        activities,
        isLoadingActivities: queryResult?.isLoading || false,
        activitiesError: queryResult?.isError || false,
      };
    });
  }, [moduleData, activitiesQueries, progressQueries, parsedCache]);

  const toggleSection = (sectionId: number) => {
    const isOpening = openSectionId !== sectionId;
    setOpenSectionId(isOpening ? sectionId : null);

    if (isOpening && sectionRefs.current[sectionId] && !isPending) {
      mutate({ section_id: sectionId });
      setTimeout(() => {
        sectionRefs.current[sectionId]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
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
      setParsedCache(new Map()); // Clear cache on refresh
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
        return { bg: "#D1FAE5", text: "#065F46" };
      case "graded":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      case "pending":
        return { bg: "#FEF3C7", text: "#92400E" };
      default:
        return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  const renderActivity = (activity: SingleActivity) => {
    const hasSubmission = activity.has_submission === true;
    const isGraded = activity.is_graded === true;
    const canSubmit = !hasSubmission;
    const getButtonText = () => {
      if (isGraded) return "Activity Graded";
      if (hasSubmission) return "Activity Submitted";
      return "Submit Activity";
    };
    const statusColors = activity.status
      ? getStatusColor(activity.status)
      : null;

    return (
      <View
        key={activity.activity_id}
        className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
      >
        {/* Activity Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
            <Text className="text-base font-bold text-gray-900 mb-1">
              {activity.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                style={{ backgroundColor: "#FAF5FF" }}
                className="rounded-full px-3 py-1"
              >
                <Text
                  style={{ color: "#7C3AED" }}
                  className="text-xs font-semibold capitalize"
                >
                  {activity.activity_type}
                </Text>
              </View>
            </View>
          </View>

          {activity.is_graded && activity.grade !== null && (
            <View className="bg-red-500 rounded-xl px-4 py-2 shadow-sm">
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
              style={{ backgroundColor: "#FEF3C7" }}
              className="rounded-full px-3 py-1.5 flex-row items-center"
            >
              <Ionicons name="time-outline" size={12} color="#92400E" />
              <Text
                style={{ color: "#92400E" }}
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
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1">
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
        <View className="bg-gray-50 rounded-lg p-3 mb-3">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="description" size={16} color="#6B7280" />
            <Text className="text-xs font-semibold text-gray-700 ml-1">
              Instructions
            </Text>
          </View>
          <Text className="text-sm text-gray-600 leading-5">
            {renderHTMLContent(activity.instructions)}
          </Text>
        </View>

        {/* Feedback */}
        {activity.feedback && (
          <View
            style={{ backgroundColor: "#EFF6FF" }}
            className="border-l-4 border-red-500 rounded-lg p-3 mb-3"
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="feedback" size={16} color="#EF4444" />
              <Text className="text-xs font-bold text-gray-800 ml-1">
                Instructor Feedback
              </Text>
            </View>
            <Text className="text-sm text-gray-700 leading-5">
              {activity.feedback}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={() => handleOpenSubmission(activity)}
          disabled={!canSubmit}
          className={`rounded-xl py-3 px-4 flex-row items-center justify-center ${
            canSubmit ? "bg-red-500 active:bg-red-600" : "bg-gray-300"
          }`}
        >
          <MaterialIcons
            name={
              isGraded
                ? "check-circle"
                : hasSubmission
                  ? "check"
                  : "upload-file"
            }
            size={18}
            color="white"
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
        <View className="mt-6 pt-4 border-t border-gray-200">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="folder-open" size={20} color="#EF4444" />
            <Text className="text-lg font-bold text-gray-900 ml-2">
              Module Sections
            </Text>
          </View>
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-sm text-gray-500 text-center">
              No sections available for this module.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className="mt-6 pt-4 border-t border-gray-200">
        <View className="flex-row items-center mb-4">
          <MaterialIcons name="folder-open" size={20} color="#EF4444" />
          <Text className="text-lg font-bold text-gray-900 ml-2">
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
                className={`rounded-xl p-4 border ${isOpen ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isOpen ? "bg-red-500" : "bg-gray-100"}`}
                    >
                      <MaterialIcons
                        name="article"
                        size={16}
                        color={isOpen ? "white" : "#6B7280"}
                      />
                    </View>
                    <Text
                      className={`text-sm font-semibold flex-1 ${isOpen ? "text-red-900" : "text-gray-800"}`}
                    >
                      {section.title}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${isOpen ? "bg-red-500" : "bg-gray-200"}`}
                  >
                    <MaterialIcons
                      name={
                        isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"
                      }
                      size={20}
                      color={isOpen ? "white" : "#6B7280"}
                    />
                  </View>
                </View>
              </Pressable>
              {isOpen && (
                <View className="bg-white border-x border-b border-gray-200 rounded-b-xl p-4 mt-[-8px]">
                  <View className="bg-gray-50 rounded-lg p-4">
                    {renderHTMLContent(section.content)}
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
            color="#9CA3AF"
          />
          <Text className="text-xs text-gray-400 italic ml-1">
            Tap section titles to expand or collapse
          </Text>
        </View>
      </View>
    );
  };

  const renderModuleActivities = (module: ParsedModule) => (
    <View className="mt-6 pt-4 border-t border-gray-200">
      <View className="flex-row items-center mb-4">
        <MaterialIcons name="assignment" size={20} color="#EF4444" />
        <Text className="text-lg font-bold text-gray-900 ml-2">
          Module Activities
        </Text>
      </View>
      {module.isLoadingActivities ? (
        Array.from({ length: 2 }).map((_, i) => <ActivitySkeleton key={i} />)
      ) : module.activitiesError ? (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4">
          <View className="flex-row items-center justify-center">
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text className="text-sm text-red-600 ml-2 font-medium">
              Failed to load activities
            </Text>
          </View>
          <Text className="text-xs text-red-500 text-center mt-1">
            Please try again later
          </Text>
        </View>
      ) : module.activities.length === 0 ? (
        <View className="bg-gray-50 rounded-xl p-6">
          <View className="items-center">
            <MaterialIcons name="assignment-late" size={48} color="#D1D5DB" />
            <Text className="text-sm text-gray-500 text-center mt-3">
              No activities available for this module yet
            </Text>
          </View>
        </View>
      ) : (
        <View>{module.activities.map(renderActivity)}</View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EF4444"]}
            tintColor="#EF4444"
            title="Pull to refresh"
            titleColor="#6B7280"
          />
        }
      >
        <View className="p-4">
          {loadingModules || !moduleData
            ? Array.from({ length: 2 }).map((_, i) => (
                <ModuleSkeleton key={i} />
              ))
            : parsedModules.map((module, index) => (
                <View
                  key={module.module_id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
                >
                  {/* Module Header */}
                  <View className="bg-red-500 px-5 py-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                        <Text className="text-white font-bold text-lg">
                          {index + 1}
                        </Text>
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
                  </View>

                  <View className="p-5">
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
                      <Text className="text-sm text-gray-700 leading-6">
                        {module.parsedDescription}
                      </Text>
                    </View>

                    {module.progress && (
                      <View className="mb-4">
                        <ModuleProgressBar
                          progress={module.progress}
                          showDetails
                        />
                      </View>
                    )}

                    {module.sections
                      ? renderModuleSections(module)
                      : Array.from({ length: 2 }).map((_, i) => (
                          <SectionSkeleton key={i} />
                        ))}

                    {renderModuleActivities(module)}
                  </View>
                </View>
              ))}
        </View>
        <View className="h-6" />
      </ScrollView>

      <ActivitySubmissionModal
        visible={isModalVisible}
        activity={selectedActivity}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}
