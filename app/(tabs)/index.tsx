import { useAuth } from "@/context/authContext";
import { useCourseStore } from "@/store/useCourseStore";
import { Enrollment } from "@/types/api";
import { AntDesign } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createEnrollmentsOptions from "../../api/QueryOptions/enrollmentsOptions";
export default function Index() {
  const router = useRouter();
  const { setCourseId, setInstanceId } = useCourseStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const { authState } = useAuth();

  const userId = authState?.user?.user_id ?? null;

  const {
    data,
    isLoading: isEnrollmentsLoading,
    error: enrollmentsError,
    refetch,
  } = useQuery({
    ...createEnrollmentsOptions(userId!),
    enabled: !!userId,
    refetchOnMount: "always",
  });

  const enrollments: Enrollment[] = data?.enrollments ?? [];

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refetch();
      }
    }, [userId, refetch])
  );

  if (isEnrollmentsLoading || authState?.isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (enrollmentsError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-base text-red-500">
          Error fetching enrollments.
        </Text>
      </View>
    );
  }

  const activeEnrollments = enrollments.filter((enrollment) => {
    const now = new Date();
    const startDate = new Date(enrollment.start_date);
    const endDate = new Date(enrollment.end_date);
    return now >= startDate && now <= endDate;
  });

  const completedEnrollments = enrollments.filter((enrollment) => {
    const now = new Date();
    const endDate = new Date(enrollment.end_date);
    return now > endDate;
  });

  const handlePress = async (course_id: number, instance_id: number) => {
    try {
      setIsNavigating(true);

      setCourseId(course_id);
      setInstanceId(instance_id);

      await router.replace({
        pathname: "/(course_tabs)/overview",
      });
    } catch (error) {
      console.log("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-2">
      <ScrollView className="w-full px-6 py-4 bg-gray-100">
        <Text className="text-3xl font-bold text-black py-4 rounded-full px-3 mt-2 text-center">
          Active Courses
        </Text>
        <View className="w-full py-8">
          {activeEnrollments.length === 0 ? (
            <Text className="text-base">No active enrollments.</Text>
          ) : (
            activeEnrollments.map((enrollment) => (
              <View
                key={enrollment.enrollment_id}
                className="bg-white rounded-xl shadow-md mb-4 px-8 py-9"
              >
                <Text className="text-lg font-semibold text-gray-800">
                  {enrollment.course_title}
                </Text>
                <Text className="text-gray-600">
                  Term: {enrollment.term_code}
                </Text>
                <Text className="text-gray-600">
                  Start Date:{" "}
                  {new Date(enrollment.start_date).toLocaleDateString()}
                </Text>
                <Text className="text-gray-600">
                  End Date: {new Date(enrollment.end_date).toLocaleDateString()}
                </Text>
                <Pressable
                  className="mt-6 flex-row items-center justify-center rounded-xl bg-blue-500 active:bg-blue-600 px-3 py-4"
                  onPress={() => {
                    if (!isNavigating) {
                      handlePress(enrollment.course_id, enrollment.instance_id);
                    }
                  }}
                >
                  {isNavigating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">
                      <AntDesign name="eye" size={16} color="white" />
                      View
                    </Text>
                  )}
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Text className="text-3xl font-bold text-black py-4 rounded-full px-3 text-center mt-6">
          Completed Courses
        </Text>
        <View className="w-full px-4 mb-6">
          {completedEnrollments.length === 0 ? (
            <Text className="text-base">No completed enrollments.</Text>
          ) : (
            completedEnrollments.map((enrollment) => (
              <View
                key={enrollment.enrollment_id}
                className="bg-white rounded-xl shadow-md mb-4 px-8 py-9"
              >
                <Text className="text-lg font-semibold text-gray-800">
                  {enrollment.course_title}
                </Text>
                <Text className="text-gray-600">
                  Term: {enrollment.term_code}
                </Text>
                <Text className="text-gray-600">
                  Start Date:{" "}
                  {new Date(enrollment.start_date).toLocaleDateString()}
                </Text>
                <Text className="text-gray-600">
                  End Date: {new Date(enrollment.end_date).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
