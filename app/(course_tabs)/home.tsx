import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";

export default function courseHome() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      router.replace("/(tabs)");
    }, [router])
  );
  return null;
}
