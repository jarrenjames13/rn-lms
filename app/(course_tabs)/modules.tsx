import { useModuleStore } from "@/store/useModuleStore";
import { ModuleData } from "@/types/api";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Modules() {
  const { moduleData } = useModuleStore();

  const modules: ModuleData = moduleData || [];
  return (
    <SafeAreaView>
      <ScrollView>
        <React.Fragment>
          {modules.length === 0 ? (
            <Text className="text-base text-gray-600 text-center mt-4">
              No modules available for this course.
            </Text>
          ) : (
            modules.map((module) => (
              <View
                key={module.module_id}
                className="bg-white rounded-xl shadow-md mb-4 mx-4 p-4"
              >
                <Text className="text-xl font-bold text-gray-800 mb-2">
                  {module.content_html}
                </Text>
                <Text className="text-gray-600">
                  {module.learning_outcomes}
                </Text>
                {module.sections && module.sections.length > 0 && (
                  <View className="mt-4">
                    {module.sections.map((section) => (
                      <View
                        key={section.section_id}
                        className="bg-gray-100 rounded-lg p-3 mb-2"
                      >
                        <Text className="text-lg font-semibold text-gray-700">
                          {section.title}
                        </Text>
                        <Text className="text-gray-600">{section.content}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </React.Fragment>
      </ScrollView>
    </SafeAreaView>
  );
}
