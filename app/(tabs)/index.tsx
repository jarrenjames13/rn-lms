import { useAuth } from "@/context/authContext";
import { useCourseStore } from "@/store/useCourseStore";
import { Enrollment } from "@/types/api";
import { AntDesign, Entypo } from "@expo/vector-icons";
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
    <ScrollView
      className="w-full  py-4  bg-gray-100"
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      {/** Header Section */}
      <View className="bg-gray-100 py-7 w-full">
        <Text className="text-3xl font-bold text-violet-500 rounded-full px-3 text-center">
          Aurora LMS
        </Text>
      </View>
      {/* <View className="border-t border-gray-300 mb-6" /> */}
      {/** Active Enrollments Header */}
      <View className=" bg-gray-150 rounded-lg ">
        <Text className="text-2xl font-bold text-black py-4 rounded-full px-3 text-center">
          Active Courses
        </Text>
      </View>
      {/** Active Enrollments List */}
      <View className="w-full py-8 px-6">
        {activeEnrollments.length === 0 ? (
          <Text className="text-base text-gray-600 text-center">
            No active enrollments.
          </Text>
        ) : (
          activeEnrollments.map((enrollment) => (
            <View
              key={enrollment.enrollment_id}
              className="bg-white rounded-2xl  mb-4 px-8 py-9 border bg border-gray-300"
            >
              <View className="border-l-4 border-red-500 pl-4 mb-4">
                <Text className="text-xl font-bold text-gray-800">
                  {enrollment.course_title}
                </Text>
              </View>
              {/** Course Details Section **/}
              <View className="space-y-2 mb-6">
                <View className="flex-row items-center">
                  <Entypo
                    name="calendar"
                    size={18}
                    color="red"
                    className="pr-2"
                  />
                  <Text className="text-gray-700 font-medium">
                    Term:{" "}
                    <Text className="text-purple-600 text-lg font-semibold">
                      {enrollment.term_code}
                    </Text>
                  </Text>
                </View>
                {/** Start Date */}
                <View className="flex-row items-center py-2">
                  <Text className="text-gray-700 font-medium">
                    <AntDesign name="clock-circle" size={18} color="red" />
                    <Text className="text-gray-600">
                      {" "}
                      {new Date(enrollment.start_date).toLocaleDateString()}
                      {" - "}
                      {new Date(enrollment.end_date).toLocaleDateString()}
                    </Text>
                  </Text>
                </View>
              </View>
              {/** View Course Button */}
              <View className="items-center">
                <Pressable
                  className="w-40 mt-4 flex-row items-center justify-center rounded-xl bg-red-500 active:bg-red-600 px-4 py-4 shadow-md"
                  onPress={() => {
                    if (!isNavigating) {
                      handlePress(enrollment.course_id, enrollment.instance_id);
                    }
                  }}
                >
                  <AntDesign name="eye" size={18} color="white" />
                  {isNavigating ? (
                    <ActivityIndicator color="white" className="ml-2" />
                  ) : (
                    <Text className="text-white text-lg font-bold ml-2">
                      View Course
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
      <View className=" bg-gray-150 rounded-lg">
        <Text className="text-2xl font-bold text-black py-4 rounded-full px-3 mt-2 text-center">
          Completed Courses
        </Text>
      </View>
      {/** Completed Enrollments List */}
      <View className="w-full py-8 px-4">
        {completedEnrollments.length === 0 ? (
          <Text className="text-base text-gray-600 text-center">
            No completed enrollments.
          </Text>
        ) : (
          completedEnrollments.map((enrollment) => (
            <View
              key={enrollment.enrollment_id}
              className="bg-gradient-to-br from-white to-purple-50 rounded-2xlsh\ mb-4 px-8 py-9 border border-purple-100"
            >
              <View className="border-l-4 border-red-500 pl-4 mb-4">
                <Text className="text-xl font-bold text-gray-800">
                  {enrollment.course_title}
                </Text>
              </View>
              {/** Course Details Section */}
              <View className="space-y-2 mb-6">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-purple-400 mr-3" />
                  <Text className="text-gray-700 font-medium">
                    Term:{" "}
                    <Text className="text-purple-600 font-semibold">
                      {enrollment.term_code}
                    </Text>
                  </Text>
                </View>
                {/** Start Date */}
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-purple-400 mr-3" />
                  <Text className="text-gray-700 font-medium">
                    <Text className="text-gray-600">
                      {new Date(enrollment.start_date).toLocaleDateString()}
                    </Text>
                  </Text>
                </View>
                {/** End Date Section */}
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-purple-400 mr-3" />
                  <Text className="text-gray-700 font-medium">
                    End:{" "}
                    <Text className="text-gray-600">
                      {new Date(enrollment.end_date).toLocaleDateString()}
                    </Text>
                  </Text>
                </View>
              </View>
              {/** View Course Button */}
              <View className="items-center">
                <Pressable
                  className="w-40 mt-4 flex-row items-center justify-center rounded-xl bg-red-500 active:bg-red-600 px-4 py-4 shadow-md"
                  onPress={() => {
                    if (!isNavigating) {
                      handlePress(enrollment.course_id, enrollment.instance_id);
                    }
                  }}
                >
                  <AntDesign name="eye" size={18} color="white" />
                  {isNavigating ? (
                    <ActivityIndicator color="white" className="ml-2" />
                  ) : (
                    <Text className="text-white text-lg font-bold ml-2">
                      View Course
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
