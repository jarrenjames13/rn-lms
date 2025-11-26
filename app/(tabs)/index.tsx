import { Enrollment } from "@/types/api";
import { getData } from "@/utils/fetcher";
import { showToast } from "@/utils/toast/toast";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
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

  useFocusEffect (() => {
    useCallback(() => {
      const fetchEnrollments = async () => {
        if (userId === null) return;
        try {
          const response = await getData<Enrollment[]>(`/enrollments/student/${userId}`,{});
          const data = response.data;
          console.log('Fetched enrollments data:', data);
          if (response.status === 200){
              setEnrollments(data);
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
    },[])
  })
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}
