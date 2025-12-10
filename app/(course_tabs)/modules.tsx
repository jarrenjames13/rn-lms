import createActivitiesOptions from "@/api/QueryOptions/actvitiesOptions";
import { useModuleStore } from "@/store/useModuleStore";
import { ActivityWithGrade, SingleActivity } from "@/types/api";
import {
  extractDescriptionFromParsed,
  extractTitleFromParsed,
  parseHTML,
  renderHTMLContent,
} from "@/utils/RenderHTML";
import { useQueries } from "@tanstack/react-query";
import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Modules() {
  const { moduleData } = useModuleStore();
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: number]: View | null }>({});

  // Fetch activities for all modules in parallel
  const activitiesQueries = useQueries({
    queries: (moduleData || []).map((module) =>
      createActivitiesOptions(module.module_id)
    ),
  });

  // Parse modules and attach their activities
  const parsedModules = useMemo(() => {
    if (!moduleData) return [];

    return moduleData.map((module, index) => {
      const parsed = parseHTML(module.content_html);
      const title = extractTitleFromParsed(parsed);
      const description = extractDescriptionFromParsed(parsed);

      // Get activities for this specific module
      const queryResult = activitiesQueries[index];
      const activitiesData: ActivityWithGrade | undefined = queryResult?.data;
      const activities: SingleActivity[] = activitiesData?.activities || [];

      return {
        ...module,
        parsedTitle: title,
        parsedDescription: description,
        activities,
        isLoadingActivities: queryResult?.isLoading || false,
        activitiesError: queryResult?.isError || false,
      };
    });
  }, [moduleData, activitiesQueries]);

  const toggleSection = (sectionId: number) => {
    const isOpening = openSectionId !== sectionId;
    setOpenSectionId(isOpening ? sectionId : null);

    if (isOpening && sectionRefs.current[sectionId]) {
      setTimeout(() => {
        sectionRefs.current[sectionId]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: y - 20,
              animated: true,
            });
          },
          () => console.log("measureLayout failed")
        );
      }, 100);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-green-100 text-green-800";
      case "graded":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const renderActivity = (activity: SingleActivity) => (
    <View
      key={activity.activity_id}
      className="bg-gray-100 rounded-lg p-4 mb-3"
    >
      {/* Activity Header */}
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-base font-semibold text-gray-800 flex-1 pr-2">
          {activity.title}
        </Text>

        {activity.is_graded && activity.grade !== null && (
          <View className="bg-blue-500 rounded-lg px-3 py-1">
            <Text className="text-sm font-bold text-white">
              {activity.grade}%
            </Text>
          </View>
        )}
      </View>

      {/* Activity Type Badge */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        <View className="bg-purple-100 rounded-full px-3 py-1">
          <Text className="text-xs font-medium text-purple-800 capitalize">
            {activity.activity_type}
          </Text>
        </View>

        {/* Status Badge */}
        {activity.status && (
          <View
            className={`rounded-full px-3 py-1 ${getStatusColor(activity.status)}`}
          >
            <Text className="text-xs font-medium capitalize">
              {activity.status}
            </Text>
          </View>
        )}

        {/* Pending Review Badge */}
        {activity.has_submission && !activity.is_graded && (
          <View className="bg-orange-100 rounded-full px-3 py-1">
            <Text className="text-xs font-medium text-orange-800">
              Pending Review
            </Text>
          </View>
        )}
      </View>

      {/* Submission Date */}
      {activity.submitted_at && (
        <Text className="text-xs text-gray-500 mb-2">
          Submitted:{" "}
          {new Date(activity.submitted_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      )}

      {/* Feedback Section */}
      {activity.feedback && (
        <View className="bg-blue-50 border-l-4 border-blue-400 rounded p-3 mt-2">
          <Text className="text-xs font-semibold text-gray-700 mb-1">
            Instructor Feedback:
          </Text>
          <Text className="text-xs text-gray-600 leading-5">
            {activity.feedback}
          </Text>
        </View>
      )}

      <Text className="text-sm text-gray-500">
        {renderHTMLContent(activity.instructions)}
      </Text>

      <View className="w-full items-start ">
        <Pressable className="mt-2 w-auto bg-blue-600 active:bg-blue-500 border border-blue-600 rounded-lg px-4 py-2">
          <Text className="text-sm text-white  p-1">Submit Activity</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderModuleSections = (module: any) => {
    if (!module.sections || module.sections.length === 0) {
      return (
        <View className="mt-6 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Module Sections
          </Text>
          <Text className="text-sm text-gray-500 px-2">
            No sections available for this module.
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-6 pt-4 border-t border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Module Sections
        </Text>
        {module.sections.map((section: any) => {
          const isOpen = openSectionId === section.section_id;
          return (
            <View
              key={section.section_id}
              className="mb-2"
              ref={(ref) => {
                sectionRefs.current[section.section_id] = ref;
              }}
            >
              <Pressable
                onPress={() => toggleSection(section.section_id)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-semibold text-gray-700 flex-1">
                    {section.title}
                  </Text>
                  <Text className="text-gray-400 text-xl ml-2 font-bold">
                    {isOpen ? "−" : "+"}
                  </Text>
                </View>
              </Pressable>
              {isOpen && (
                <View className="bg-white border-x border-b border-gray-200 rounded-b-lg p-4 mt-[-1]">
                  {renderHTMLContent(section.content)}
                </View>
              )}
            </View>
          );
        })}
        <Text className="text-xs text-gray-400 italic mt-2 px-1">
          Tap section titles to expand or collapse
        </Text>
      </View>
    );
  };

  const renderModuleActivities = (module: any) => (
    <View className="mt-6 pt-4 border-t border-gray-200">
      <Text className="text-lg font-semibold text-gray-800 mb-3">
        Module Activities
      </Text>

      {module.isLoadingActivities ? (
        <View className="bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-500 text-center">
            Loading activities...
          </Text>
        </View>
      ) : module.activitiesError ? (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Text className="text-sm text-red-600 text-center">
            Failed to load activities. Please try again later.
          </Text>
        </View>
      ) : module.activities.length === 0 ? (
        <View className="bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-500 text-center">
            No activities available for this module yet.
          </Text>
        </View>
      ) : (
        <View>{module.activities.map(renderActivity)}</View>
      )}
    </View>
  );

  if (parsedModules.length === 0) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-lg text-gray-600 text-center">
            No modules available for this course.
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2">
            Please check back later.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView ref={scrollViewRef} className="flex-1">
        <View className="p-4">
          {parsedModules.map((module) => (
            <View
              key={module.module_id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-5"
            >
              {/* Module Header */}
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {module.parsedTitle || "Untitled Module"}
              </Text>

              {/* Module Description */}
              <Text className="text-sm text-gray-600 leading-6 mb-4">
                {module.parsedDescription || "No description available"}
              </Text>

              {/* Module Sections */}
              {renderModuleSections(module)}

              {/* Module Activities */}
              {renderModuleActivities(module)}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
