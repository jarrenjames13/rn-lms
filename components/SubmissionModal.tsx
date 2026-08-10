import type { SubmitExamFilesParams } from "@/api/QueryFunctions/postSubmissionFile";
import { useSubmissionFile } from "@/api/QueryOptions/submissionFileMutation";
import { ExamDetails } from "@/types/api";
import { useAppTheme } from "@/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  exam: ExamDetails;
  instanceId: number;
}

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export default function SubmissionModal({
  visible,
  onClose,
  exam,
  instanceId,
}: SubmissionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  // Use the existing mutation options
  const { mutate, isPending } = useSubmissionFile();

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newFiles: SelectedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType || "application/pdf",
      }));

      // Validate file count
      const totalFiles = selectedFiles.length + newFiles.length;
      if (totalFiles > 10) {
        Alert.alert(
          "Too Many Files",
          `You can only upload up to 10 files. You currently have ${selectedFiles.length} file(s) selected.`,
        );
        return;
      }

      // Validate file sizes (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;
      const oversizedFiles = newFiles.filter((file) => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        Alert.alert(
          "File Too Large",
          `The following file(s) exceed the 10MB limit:\n${oversizedFiles
            .map((f) => f.name)
            .join("\n")}`,
        );
        return;
      }

      setSelectedFiles([...selectedFiles, ...newFiles]);
    } catch (error) {
      console.error("Error picking documents:", error);
      Alert.alert("Error", "Failed to pick documents. Please try again.");
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) {
      Alert.alert("No Files", "Please select at least one file to submit.");
      return;
    }

    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit? You can only submit once.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "destructive",
          onPress: () => {
            const params: SubmitExamFilesParams = {
              examTypeId: exam.exam_id,
              instanceId: instanceId,
              files: selectedFiles,
            };

            mutate(params, {
              onSuccess: (data) => {
                Alert.alert(
                  "Success",
                  `${data.message}\n\n${data.count} file(s) uploaded successfully.`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        setSelectedFiles([]);
                        onClose();
                      },
                    },
                  ],
                );
              },
              onError: (error: any) => {
                // Handle specific backend error messages
                let errorMessage =
                  "Failed to submit your files. Please try again.";

                if (error?.message) {
                  // Backend specific errors
                  if (error.message.includes("Already submitted")) {
                    errorMessage = "You have already submitted this exam.";
                  } else if (error.message.includes("Not enrolled")) {
                    errorMessage = "You are not enrolled in this course.";
                  } else if (error.message.includes("Only PDF")) {
                    errorMessage = "Only PDF files are accepted.";
                  } else if (error.message.includes("Too large")) {
                    errorMessage = "One or more files exceed the 10MB limit.";
                  } else if (error.message.includes("Max")) {
                    errorMessage = "You can upload a maximum of 10 files.";
                  } else {
                    errorMessage = error.message;
                  }
                }

                Alert.alert("Submission Failed", errorMessage);
              },
            });
          },
        },
      ],
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 rounded-t-3xl" style={{ backgroundColor: theme.surface }}>
          {/* Header */}
          <View className="px-6 py-5 rounded-t-3xl" style={{ backgroundColor: theme.school }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white mb-1">
                  Submission
                </Text>
                <Text
                  style={{ color: "#FFFFFF", opacity: 0.9 }}
                  className="text-sm"
                >
                  {exam.exam_name}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: theme.surfaceAccent }}
                disabled={isPending}
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              {/* Submission Instructions */}
              <View className="rounded-2xl p-5 mb-6 border" style={{ backgroundColor: theme.surfaceMuted, borderColor: theme.border }}>
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: theme.primary }}>
                    <Ionicons name="information" size={20} color="white" />
                  </View>
                  <Text className="text-lg font-bold" style={{ color: theme.text }}>
                    Instructions
                  </Text>
                </View>
                <Text className="text-sm leading-6" style={{ color: theme.text }}>
                  {exam.submission_instruction ||
                    "Please upload your exam answers in PDF format."}
                </Text>
              </View>

              {/* Requirements */}
              <View className="rounded-2xl p-5 mb-6 border" style={{ backgroundColor: theme.surfaceAccent, borderColor: theme.warning }}>
                <View className="flex-row items-center mb-4">
                  <Ionicons name="warning" size={20} color={theme.warning} />
                  <Text className="text-base font-bold ml-2" style={{ color: theme.text }}>
                    Requirements:
                  </Text>
                </View>

                <View className="space-y-3">
                  <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: theme.warning }} />
                    <Text className="text-sm flex-1" style={{ color: theme.text }}>
                      Only PDF files are accepted
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: theme.warning }} />
                    <Text className="text-sm flex-1" style={{ color: theme.text }}>
                      Maximum 10 files per submission
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: theme.warning }} />
                    <Text className="text-sm flex-1" style={{ color: theme.text }}>
                      Maximum file size: 10MB per file
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full mt-2 mr-3" style={{ backgroundColor: theme.warning }} />
                    <Text className="text-sm flex-1 font-semibold" style={{ color: theme.text }}>
                      Only one submission attempt allowed
                    </Text>
                  </View>
                </View>
              </View>

              {/* File Upload Section */}
              <View className="mb-6">
                <Text className="text-base font-bold mb-3" style={{ color: theme.text }}>
                  Upload Files ({selectedFiles.length}/10)
                </Text>

                {/* Upload Button */}
                <Pressable
                  onPress={handlePickDocuments}
                  disabled={selectedFiles.length >= 10 || isPending}
                  className="border-2 border-dashed rounded-2xl p-8 items-center"
                  style={({ pressed }) => ({
                    borderColor: selectedFiles.length >= 10 ? theme.border : theme.school,
                    backgroundColor: selectedFiles.length >= 10
                      ? theme.canvas
                      : pressed
                        ? theme.surfaceAccent
                        : theme.surfaceAccent,
                  })}
                >
                  <View className="w-16 h-16 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: theme.surfaceAccent }}>
                    <Ionicons
                      name="cloud-upload"
                      size={32}
                      color={selectedFiles.length >= 10 ? theme.tabInactive : theme.school}
                    />
                  </View>
                  <Text
                    className="text-base font-bold mb-1"
                    style={{ color: selectedFiles.length >= 10 ? theme.tabInactive : theme.text }}
                  >
                    {selectedFiles.length >= 10
                      ? "Maximum files reached"
                      : "Tap to select PDF files"}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textMuted }}>
                    You can select multiple files at once
                  </Text>
                </Pressable>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <View className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <View
                        key={index}
                        className="rounded-xl p-4 border flex-row items-center"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                      >
                        <View className="w-10 h-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: theme.surfaceAccent }}>
                          <MaterialIcons
                            name="picture-as-pdf"
                            size={20}
                            color={theme.school}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: theme.text }}
                            numberOfLines={1}
                          >
                            {file.name}
                          </Text>
                          <Text className="text-xs" style={{ color: theme.textMuted }}>
                            {formatFileSize(file.size)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleRemoveFile(index)}
                          disabled={isPending}
                          className="w-8 h-8 rounded-lg items-center justify-center"
                          style={({ pressed }) => ({ backgroundColor: pressed ? theme.surfaceAccent : theme.canvas })}
                        >
                          <Ionicons name="trash" size={18} color={theme.danger} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            className="p-6 border-t"
            style={{ paddingBottom: Math.max(insets.bottom, 24), backgroundColor: theme.canvas, borderColor: theme.border }}
          >
            <Pressable
              onPress={handleSubmit}
              disabled={selectedFiles.length === 0 || isPending}
              className="py-4 rounded-xl items-center"
              style={({ pressed }) => ({
                backgroundColor: selectedFiles.length === 0 || isPending
                  ? theme.tabInactive
                  : pressed
                    ? theme.primaryPressed
                    : theme.school,
              })}
            >
              {isPending ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Submitting...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="send" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Submit
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={isPending}
              className="mt-3 py-3 items-center"
            >
              <Text className="font-semibold" style={{ color: theme.textMuted }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
