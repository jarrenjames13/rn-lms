import type { SubmitExamFilesParams } from "@/api/QueryFunctions/postSubmissionFile";
import { useSubmissionFile } from "@/api/QueryOptions/submissionFileMutation";
import { ExamDetails } from "@/types/api";
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
        <View className="flex-1 mt-20 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="bg-red-500 px-6 py-5 rounded-t-3xl">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white mb-1">
                  Submission
                </Text>
                <Text
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                  className="text-sm"
                >
                  {exam.exam_name}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
                disabled={isPending}
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              {/* Submission Instructions */}
              <View className="bg-blue-50 rounded-2xl p-5 mb-6 border border-blue-100">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-blue-500 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="information" size={20} color="white" />
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    Instructions
                  </Text>
                </View>
                <Text className="text-sm text-gray-700 leading-6">
                  {exam.submission_instruction ||
                    "Please upload your exam answers in PDF format."}
                </Text>
              </View>

              {/* Requirements */}
              <View className="bg-yellow-50 rounded-2xl p-5 mb-6 border border-yellow-200">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                  <Text className="text-base font-bold text-gray-900 ml-2">
                    Requirements:
                  </Text>
                </View>

                <View className="space-y-3">
                  <View className="flex-row items-start">
                    <View className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3" />
                    <Text className="text-sm text-gray-700 flex-1">
                      Only PDF files are accepted
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3" />
                    <Text className="text-sm text-gray-700 flex-1">
                      Maximum 10 files per submission
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3" />
                    <Text className="text-sm text-gray-700 flex-1">
                      Maximum file size: 10MB per file
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3" />
                    <Text className="text-sm text-gray-700 flex-1 font-semibold">
                      Only one submission attempt allowed
                    </Text>
                  </View>
                </View>
              </View>

              {/* File Upload Section */}
              <View className="mb-6">
                <Text className="text-base font-bold text-gray-900 mb-3">
                  Upload Files ({selectedFiles.length}/10)
                </Text>

                {/* Upload Button */}
                <Pressable
                  onPress={handlePickDocuments}
                  disabled={selectedFiles.length >= 10 || isPending}
                  className={`border-2 border-dashed rounded-2xl p-8 items-center ${
                    selectedFiles.length >= 10
                      ? "border-gray-300 bg-gray-50"
                      : "border-red-300 bg-red-50 active:bg-red-100"
                  }`}
                >
                  <View className="w-16 h-16 bg-red-100 rounded-2xl items-center justify-center mb-3">
                    <Ionicons
                      name="cloud-upload"
                      size={32}
                      color={selectedFiles.length >= 10 ? "#9CA3AF" : "#EF4444"}
                    />
                  </View>
                  <Text
                    className={`text-base font-bold mb-1 ${
                      selectedFiles.length >= 10
                        ? "text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    {selectedFiles.length >= 10
                      ? "Maximum files reached"
                      : "Tap to select PDF files"}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    You can select multiple files at once
                  </Text>
                </Pressable>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <View className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <View
                        key={index}
                        className="bg-white rounded-xl p-4 border border-gray-200 flex-row items-center"
                      >
                        <View className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center mr-3">
                          <MaterialIcons
                            name="picture-as-pdf"
                            size={20}
                            color="#EF4444"
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-semibold text-gray-900"
                            numberOfLines={1}
                          >
                            {file.name}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleRemoveFile(index)}
                          disabled={isPending}
                          className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center active:bg-red-100"
                        >
                          <Ionicons name="trash" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-6 bg-gray-50 border-t border-gray-200">
            <Pressable
              onPress={handleSubmit}
              disabled={selectedFiles.length === 0 || isPending}
              className={`py-4 rounded-xl items-center ${
                selectedFiles.length === 0 || isPending
                  ? "bg-gray-300"
                  : "bg-red-500 active:bg-red-600"
              }`}
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
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
