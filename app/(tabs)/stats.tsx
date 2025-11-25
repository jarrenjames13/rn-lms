import { getData } from '@/utils/fetcher';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assuming postData returns the parsed JSON directly
        const response = await getData<StatsData>('/modules/student-overall-learning-progress',{});
        const data = response.data;
        console.log('Fetched stats data:', data);
        if (response.status === 200){
            setStats(data);
            setIsLoading(false);
        }
        else if (response.status === 400 || response.status === 401 || response.status === 403) {
            console.error('Error fetching stats:', response.data.detail || 'Unknown error');
            setIsLoading(false);
        }
        else {
            console.error('Unexpected response status:', response.status);
            setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);
    //add loading spinner effect when fetching data
    if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading stats...</Text>
      </View>
    );
    }

  if (!stats) {
    return (
      <View>
        <Text>No stats available.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className='py-4 px-6 flex-1 bg-gray-100'>
    <View>
        <Text className='text-3xl font-bold text-black py-4 rounded-full px-3 mb-4 mt-3'>
            Learning Statistics
        </Text>
    </View>
    <View className='mt-4 bg-white px-4 py-6 rounded-xl'>
        <Text className='text-xl font-bold mb-2'>Here is an overview of your learning progress:</Text>
    </View>
    <View className='mt-4 bg-white px-4 py-6 rounded-xl'>
        <Text className='text-lg font-semibold mb-2'>Overall Progress</Text>
        <View className='w-full h-4 bg-gray-300 -rounded-full overflow-hidden'>
            <View className='h-full bg-red-500 rounded-full overflow-hidden' style={{width: `${stats.overall_progress}%`}}></View>
        </View>
        <Text className='mt-2 text-gray-700'>{stats.overall_progress}% completed</Text>
    </View>
    <View className='mt-4 bg-white px-4 py-6 rounded-xl'>
        <Text className='text-lg font-semibold mb-2'>Components Progress</Text>
        <Text className='text-gray-700'>Sections Completed: {stats.counts.sections}</Text>
        <Text className='text-gray-700'>Activities Completed: {stats.counts.activities} </Text>
        <Text className='text-gray-700'>Quizzes Completed: {stats.counts.quizzes} </Text>
        <Text className='text-gray-700'>Exams Completed: {stats.counts.exams} </Text>
    </View>
    <View className='mt-4 bg-white px-4 py-6 rounded-xl'>
        <Text className='text-lg font-semibold mb-2'>Enrolled Courses</Text>
        <Text className='text-gray-700'>You are currently enrolled in {stats.enrolled_courses} course(s).</Text>
    </View>
    </SafeAreaView>
  );
}
