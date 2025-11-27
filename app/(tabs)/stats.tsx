import { getData } from "@/utils/fetcher";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface StatsData {
  overall_progress: number;
  components: {
    sections: number;
    activities: number;
    quizzes: number;
    exams: number;
  };
  counts: {
    sections: number;
    activities: number;
    quizzes: number;
    exams: number;
  };
  enrolled_courses: number;
}

export default function Stats() {
  // useFocusEffect(
  //   useCallback(() => {
  //   const fetchStats = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await getData<StatsData>('/modules/student-overall-learning-progress',{});
  //       const data = response.data;
  //       console.log('Fetched stats data:', data);
  //       if (response.status === 200){
  //           setStats(data);
  //           setIsLoading(false);
  //       }
  //       else if (response.status === 400 || response.status === 401 || response.status === 403) {
  //           console.error('Error fetching stats:', response.data.detail || 'Unknown error');
  //           setIsLoading(false);
  //       }
  //       else {
  //           console.error('Unexpected response status:', response.status);
  //           setIsLoading(false);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching stats:', error);
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchStats();
  // }, []));

  //   if (isLoading) {
  //   return (
  //     <View className="flex-1 justify-center items-center">
  //       <ActivityIndicator size="large" color="#0000ff" />
  //     </View>
  //   );
  //   }

  // if (!stats) {
  //   return (
  //     <View>
  //       <Text>No stats available.</Text>
  //     </View>
  //   );
  // }

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<StatsData, Error>({
    queryKey: ["studentOverallLearningProgress"],
    queryFn: fetchStats,
    enabled: false,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">
          Error fetching stats: {error.message}
        </Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-semibold">No stats available.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="py-4 px-6 flex-1 bg-gray-100">
      <View>
        <Text className="text-3xl font-bold text-black py-4 rounded-full px-3 mb-4 mt-3">
          Learning Statistics
        </Text>
      </View>
      <View className="mt-4 bg-white px-4 py-6 rounded-xl">
        <Text className="text-xl font-bold mb-2">
          Here is an overview of your learning progress:
        </Text>
      </View>
      <View className="mt-4 bg-white px-4 py-6 rounded-xl">
        <Text className="text-lg font-semibold mb-2">Overall Progress</Text>
        <View className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
          <View
            className="w-full h-full bg-red-500 rounded-full "
            style={{ width: `${stats.overall_progress}%` }}
          ></View>
        </View>
        <Text className="mt-2 text-gray-700">
          {stats.overall_progress}% completed
        </Text>
      </View>
      <View className="mt-4 bg-white px-4 py-6 rounded-xl">
        <Text className="text-lg font-semibold mb-2">Components Progress</Text>
        <Text className="text-gray-700">
          Sections Completed: {stats.counts.sections}
        </Text>
        <Text className="text-gray-700">
          Activities Completed: {stats.counts.activities}{" "}
        </Text>
        <Text className="text-gray-700">
          Quizzes Completed: {stats.counts.quizzes}{" "}
        </Text>
        <Text className="text-gray-700">
          Exams Completed: {stats.counts.exams}{" "}
        </Text>
      </View>
      <View className="mt-4 bg-white px-4 py-6 rounded-xl">
        <Text className="text-lg font-semibold mb-2">Enrolled Courses</Text>
        <Text className="text-gray-700">
          You are currently enrolled in {stats.enrolled_courses} course(s).
        </Text>
      </View>
    </SafeAreaView>
  );
}

const fetchStats = async () => {
  try {
    const response = await getData<StatsData>(
      "/modules/student-overall-learning-progress",
      {}
    );
    const data = response.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail || error.message || "Error fetching stats"
    );
  }
};
