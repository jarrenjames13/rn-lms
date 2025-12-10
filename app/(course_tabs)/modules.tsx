import { useModuleStore } from "@/store/useModuleStore";
import { ModuleData } from "@/types/api";
import {
  extractDescriptionFromParsed,
  extractTitleFromParsed,
  parseHTML,
  renderHTMLContent,
} from "@/utils/RenderHTML";
import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Modules() {
  const { moduleData } = useModuleStore();
  const [openSectionId, setOpenSectionId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: number]: View | null }>({});

  // Parse once and cache
  const parsedModules = useMemo(() => {
    const modules: ModuleData = moduleData || [];
    return modules.map((module) => {
      const parsed = parseHTML(module.content_html);
      const title = extractTitleFromParsed(parsed);
      const description = extractDescriptionFromParsed(parsed);

      return {
        ...module,
        parsedTitle: title,
        parsedDescription: description,
      };
    });
  }, [moduleData]);

  const toggleSection = (sectionId: number) => {
    const isOpening = openSectionId !== sectionId;
    setOpenSectionId(openSectionId === sectionId ? null : sectionId);

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

  return (
    <SafeAreaView>
      <ScrollView ref={scrollViewRef}>
        {parsedModules.length === 0 ? (
          <View className="mt-80">
            <Text className="text-lg text-gray-600 text-center mt-4">
              {
                "No modules available for this course.\nPlease check back later."
              }
            </Text>
          </View>
        ) : (
          parsedModules.map((module) => (
            <View
              key={module.module_id}
              className="bg-white rounded-xl shadow-md mb-4 mx-4 p-6"
            >
              <Text className="text-xl font-bold text-gray-800 my-2">
                {module.parsedTitle || "Untitled Module"}
              </Text>
              <Text className="text-gray-600 my-2 text-lg text-justify px-2">
                {module.parsedDescription || "No description available"}
              </Text>
              {module.sections && module.sections.length === 0 ? (
                <View className="mt-6 pt-2 border-t border-gray-300 py-3">
                  <Text className="text-xl font-semibold">
                    Module Sections:
                  </Text>
                  <Text className="text-base text-gray-600 mt-2 px-2">
                    No sections available for this module.
                  </Text>
                </View>
              ) : (
                <View className="mt-6 pt-2">
                  <View className="py-2 border-t border-gray-300">
                    <Text className="text-xl font-semibold mb-2 px-2">
                      Module Sections:
                    </Text>
                  </View>
                  {module.sections.map((section) => {
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
                          className="bg-gray-100 rounded-lg p-3"
                        >
                          <View className="flex-row justify-between items-center">
                            <Text className="text-base font-semibold text-gray-700 flex-1">
                              {section.title}
                            </Text>
                            <Text className="text-gray-500 text-xl ml-2">
                              {isOpen ? "−" : "+"}
                            </Text>
                          </View>
                        </Pressable>
                        {isOpen && (
                          <View className="bg-gray-50 rounded-b-lg p-3 mt-1">
                            <View className="px-2">
                              {renderHTMLContent(section.content)}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  <View>
                    <Text className="text-sm text-gray-500 italic px-2">
                      Tap on a section title to expand or collapse its content.
                    </Text>
                  </View>
                  <View className="mt-2 pt-2">
                    <View className="py-2 border-t border-gray-300">
                      <Text className="text-xl font-semibold mb-2 px-2">
                        Module Activities:
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
