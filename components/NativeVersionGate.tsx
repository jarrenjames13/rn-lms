import * as Application from "expo-application";
import Constants from "expo-constants";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, Linking, Modal, Platform, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/context/authContext";
import { useExamStore } from "@/store/useExamStore";
import { useQuizStore } from "@/store/useQuizStore";
import { useAppTheme } from "@/theme";
import { BASE_URL } from "@/utils/constants";
import { AppButton } from "./ui";

type NativeRelease = {
  id: string;
  version_name: string;
  version_code: number;
  release_notes?: string | null;
  file_size: number;
  is_mandatory: boolean;
  download_url: string;
};

type CheckResponse = {
  update_available: boolean;
  update_required: boolean;
  release?: NativeRelease;
};

type NativeUpdateContextValue = {
  checkForUpdate: () => Promise<void>;
  isChecking: boolean;
};

const NativeUpdateContext = createContext<NativeUpdateContextValue | null>(null);
const CHECK_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export function useNativeUpdate() {
  const context = useContext(NativeUpdateContext);
  if (!context) throw new Error("useNativeUpdate must be used within NativeUpdateProvider");
  return context;
}

export function NativeUpdateProvider({ children }: React.PropsWithChildren) {
  const { authState } = useAuth();
  const { theme } = useAppTheme();
  const quizStatus = useQuizStore((state) => state.status);
  const examStatus = useExamStore((state) => state.status);
  const [release, setRelease] = useState<NativeRelease | null>(null);
  const [required, setRequired] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckedAt = useRef(0);

  const assessmentActive = ["starting", "active", "submitting", "recovery_error"].includes(quizStatus) || ["starting", "active", "submitting", "recovery_error"].includes(examStatus);

  const checkForUpdate = useCallback(async (force = true) => {
    if (Platform.OS !== "android" || !BASE_URL) return;
    const versionCode = Number(Application.nativeBuildVersion);
    const channel = Constants.expoConfig?.extra?.appVariant === "preview" ? "preview" : "production";
    if (!Number.isSafeInteger(versionCode) || versionCode < 1) return;
    if (!force && Date.now() - lastCheckedAt.current < CHECK_COOLDOWN_MS) return;
    setIsChecking(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const url = new URL("/mobile-releases/public/check", BASE_URL);
      url.searchParams.set("package_name", Application.applicationId ?? "");
      url.searchParams.set("channel", channel);
      url.searchParams.set("version_code", String(versionCode));
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) return;
      const data = await response.json() as CheckResponse;
      lastCheckedAt.current = Date.now();
      if (!data.update_available || !data.release) return;
      const dismissed = await SecureStore.getItemAsync(`native_update_dismissed:${data.release.version_code}`);
      if (!data.update_required && dismissed === "1" && !force) return;
      setRequired(data.update_required || data.release.is_mandatory);
      setRelease(data.release);
    } catch {
      // Release checks must never block normal app use when the API is unavailable.
    } finally {
      clearTimeout(timeout);
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!authState?.isLoading && !assessmentActive) void checkForUpdate(false);
  }, [assessmentActive, authState?.isLoading, checkForUpdate]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !assessmentActive) void checkForUpdate(false);
    });
    return () => subscription.remove();
  }, [assessmentActive, checkForUpdate]);

  const dismiss = async () => {
    if (!release || required) return;
    await SecureStore.setItemAsync(`native_update_dismissed:${release.version_code}`, "1");
    setRelease(null);
  };

  const install = async () => {
    if (!release || assessmentActive) return;
    const url = new URL(release.download_url, BASE_URL).toString();
    await Linking.openURL(url);
  };

  return (
    <NativeUpdateContext.Provider value={{ checkForUpdate: () => checkForUpdate(true), isChecking }}>
      {children}
      <Modal visible={Boolean(release) && !assessmentActive} transparent animationType="fade" onRequestClose={() => void dismiss()} statusBarTranslucent>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full rounded-3xl p-6" style={{ backgroundColor: theme.surface }}>
            <Text className="text-xl font-bold" style={{ color: theme.text }}>{required ? "Update required" : "New update available"}</Text>
            <Text className="mt-2 text-sm" style={{ color: theme.textMuted }}>Aurora LMS {release?.version_name} is ready to install.</Text>
            {release?.release_notes ? <Text className="mt-3 text-sm leading-5" style={{ color: theme.text }}>{release.release_notes}</Text> : null}
            <Text className="mt-3 text-xs" style={{ color: theme.textMuted }}>The update downloads in your browser. Android will ask you to confirm installation.</Text>
            <View className="mt-6 gap-3"><AppButton label="Update now" onPress={install} accessibilityLabel="Download Aurora LMS update" />{!required ? <AppButton label="Later" variant="secondary" onPress={dismiss} /> : null}</View>
          </View>
        </View>
      </Modal>
    </NativeUpdateContext.Provider>
  );
}
