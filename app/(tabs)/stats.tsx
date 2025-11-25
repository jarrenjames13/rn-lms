import { getData } from '@/utils/fetcher';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatsData {
  overall_progress: number;
  components: {
    sections: number;
    activties: number; // typo in your original code? probably 'activities'
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assuming postData returns the parsed JSON directly
        const response = await getData<StatsData>('/modules/student-overall-learning-progress');
        const data = response.data;
        console.log('Fetched stats data:', data);
        if (response.status === 200){
            setStats(data);
        }
        else if (response.status === 400 || response.status === 401 || response.status === 403) {
            console.error('Error fetching stats:', response.data.detail || 'Unknown error');
        }
        else {
            console.error('Unexpected response status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []); // run once on mount

  if (!stats) {
    return (
      <View>
        <Text>Loading stats...</Text>
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
    <View className='mt-4 bg-gray-300 px-4 py-6 rounded-xl'>
      <Text className='py-4 text-lg font-semibold'>Overall Progress: {stats.overall_progress}%</Text>
      <Text className='py-4 text-lg font-semibold'>Enrolled Courses: {stats.enrolled_courses}</Text>
      <Text className='py-4 text-lg font-semibold'>Sections Completed: {stats.counts.sections}/{stats.components.sections}</Text>
      <Text className='py-4 text-lg font-semibold'>Activities Completed: {stats.counts.activities}/{stats.components.activties}</Text>
      <Text className='py-4 text-lg font-semibold'>Quizzes Completed: {stats.counts.quizzes}/{stats.components.quizzes}</Text>
      <Text className='py-4 text-lg font-semibold'>Exams Completed: {stats.counts.exams}/{stats.components.exams}</Text>
    </View>
    </SafeAreaView>
  );
}
