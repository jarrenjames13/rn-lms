import { useModuleStore } from "@/store/useModuleStore";
import { ModuleData } from "@/types/api";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Modules() {
  const { moduleData } = useModuleStore();
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);

  const modules: ModuleData = moduleData || [];

  const toggleSection = (sectionId: number) => {
    setOpenSectionId(openSectionId === sectionId ? null : sectionId);
  };

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
                    {module.sections.map((section) => {
                      const isOpen = openSectionId === section.section_id;
                      return (
                        <View key={section.section_id} className="mb-2">
                          <Pressable
                            onPress={() => toggleSection(section.section_id)}
                            className="bg-gray-100 rounded-lg p-3"
                          >
                            <View className="flex-row justify-between items-center">
                              <Text className="text-lg font-semibold text-gray-700 flex-1">
                                {section.title}
                              </Text>
                              <Text className="text-gray-500 text-xl ml-2">
                                {isOpen ? "−" : "+"}
                              </Text>
                            </View>
                          </Pressable>
                          {isOpen && (
                            <View className="bg-gray-50 rounded-b-lg p-3 mt-1">
                              <Text className="text-gray-600">
                                {section.content}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
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
