import { Enrollment } from "@/types/api";
import { getData } from "@/utils/fetcher";
import { showToast } from "@/utils/toast/toast";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
          const fetchUser = async () => {
            try {
              const userData = await SecureStore.getItemAsync('user');
              if (userData) {
                const user = JSON.parse(userData);
                setUserId(user.user_id);
              }
            } catch (error) {
              console.log("Error fetching user data:", error);
            }
          }
          fetchUser();
      }, []);

  useFocusEffect (
    useCallback(() => {
      const fetchEnrollments = async () => {
        if (userId === null) return;
        try {
          const response = await getData<Enrollment[]>(`/enrollments/student/${userId}`,{});
          const data = response.data;
          console.log('Fetched enrollments data:', data);
          if (response.status === 200){
              setEnrollments(data.enrollments);
          }
          else if (response.status === 400 || response.status === 401 || response.status === 403) {
            showToast({
                type: 'error',
                title: 'Error Fetching Enrollments',
                message: data.detail || 'Unknown error.'
            });
              console.error('Error fetching enrollments:', response.data.detail || 'Unknown error');
          }
          else {
              console.error('Unexpected response status:', response.status);
              showToast({
                type: 'error',
                title: 'Error Fetching Enrollments',
                message: 'Unexpected response status: ' + response.status
              });
          }
        } catch (error:any) {
          console.error("Error fetching enrollments:", error);
          showToast({
            type: 'error',
            title: 'Error Fetching Enrollments',
            message: error.message || 'An error occurred while fetching enrollments.'
          });
        }
      }
      fetchEnrollments();
    },[userId])
  )

  const activeEnrollments = enrollments.filter(enrollment => {
    const now = new Date();
    const startDate = new Date(enrollment.start_date);
    const endDate = new Date(enrollment.end_date);
    return now >= startDate && now <= endDate;
  });

  const completedEnrollments = enrollments.filter(enrollment => {
    const now = new Date();
    const endDate = new Date(enrollment.end_date);
    return now > endDate;
  });

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
              <View key={enrollment.enrollment_id} className="bg-white rounded-xl shadow-md mb-4 px-8 py-9">
                <Text className="text-lg font-semibold text-gray-800">{enrollment.course_title}</Text>
                <Text className="text-gray-600">Term: {enrollment.term_code}</Text>
                <Text className="text-gray-600">Start Date: {new Date(enrollment.start_date).toLocaleDateString()}</Text>
                <Text className="text-gray-600">End Date: {new Date(enrollment.end_date).toLocaleDateString()}</Text>
                <Pressable className="mt-6 bg-blue-500 rounded-xl py-2 px-3 items-center">
                  <Text className="text-white text-lg font-semibold">View Details</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Text className="text-3xl font-bold text-black py-4 rounded-full px-3 textt-center mt-6">
          Completed Courses
        </Text>
        <View className="w-full px-4 mb-6">
          {completedEnrollments.length === 0 ? (
            <Text className="text-base">No completed enrollments.</Text>
          ) : (
            completedEnrollments.map((enrollment) => (
              <View key={enrollment.enrollment_id} className="bg-white rounded-xl shadow-md mb-4 px-8 py-9">
                <Text className="text-lg font-semibold text-gray-800">{enrollment.course_title}</Text>
                <Text className="text-gray-600">Term: {enrollment.term_code}</Text>
                <Text className="text-gray-600">Start Date: {new Date(enrollment.start_date).toLocaleDateString()}</Text>
                <Text className="text-gray-600">End Date: {new Date(enrollment.end_date).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
