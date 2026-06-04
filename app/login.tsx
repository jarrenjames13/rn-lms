import { useAuth } from "@/context/authContext";
import { BASE_URL } from "@/utils/constants";
import { showToast } from "@/utils/toast/toast";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HEALTH_CHECK_URL = `${BASE_URL}/health`;
const HEALTH_CHECK_TIMEOUT_MS = 10_000;

type AppStatus = "checking" | "maintenance" | "no_network" | "ready";

// ─── Aurora ring component ────────────────────────────────────────────────
function AuroraRings() {
  // Three rings rotating at different speeds and directions
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Ring 1 — slow clockwise
    Animated.loop(
      Animated.timing(ring1, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Ring 2 — medium counter-clockwise
    Animated.loop(
      Animated.timing(ring2, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Ring 3 — fast clockwise, tilted
    Animated.loop(
      Animated.timing(ring3, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Pulse — icon breathes in and out
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse, ring1, ring2, ring3]);

  const spin1 = ring1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const spin2 = ring2.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });
  const spin3 = ring3.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      className="items-center justify-center"
      style={{ width: 180, height: 180 }}
    >
      {/* Outermost ring — violet, slow */}
      <Animated.View
        style={{
          position: "absolute",
          width: 176,
          height: 176,
          borderRadius: 88,
          borderWidth: 3,
          borderColor: "transparent",
          borderTopColor: "#7C3AED",
          borderRightColor: "#7C3AED44",
          transform: [{ rotate: spin1 }],
        }}
      />

      {/* Middle ring — indigo, medium */}
      <Animated.View
        style={{
          position: "absolute",
          width: 148,
          height: 148,
          borderRadius: 74,
          borderWidth: 2.5,
          borderColor: "transparent",
          borderTopColor: "#6366F1",
          borderLeftColor: "#6366F144",
          transform: [{ rotate: spin2 }],
        }}
      />

      {/* Inner ring — rose/pink, fast */}
      <Animated.View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: "transparent",
          borderTopColor: "#EC4899",
          borderBottomColor: "#EC489944",
          transform: [{ rotate: spin3 }],
        }}
      />

      {/* Glow halo behind icon */}
      <View
        style={{
          position: "absolute",
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: "#7C3AED18",
        }}
      />

      {/* Icon with pulse */}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image
          source={require("@/assets/images/adaptive-icon.png")}
          style={{ width: 76, height: 76, borderRadius: 20 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

// ─── Checking screen ──────────────────────────────────────────────────────
function CheckingScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  return (
    <Animated.View
      className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950"
      style={{ opacity: fadeIn }}
    >
      <AuroraRings />

      <Text
        className="mt-8 text-xl font-extrabold text-violet-600"
        style={{ letterSpacing: 1 }}
      >
        AURORA LMS
      </Text>
      <Text className="mt-2 text-sm text-gray-400">Checking connection…</Text>
    </Animated.View>
  );
}

// ─── Maintenance screen ───────────────────────────────────────────────────
function MaintenanceScreen({ onRetry, isNetworkError }: { onRetry: () => void; isNetworkError: boolean }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <Animated.View
      className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 px-8"
      style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
    >
      {/* Icon with static rings (muted) */}
      <View className="items-center justify-center mb-6">
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 2,
            borderColor: "#E5E7EB",
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              borderWidth: 1.5,
              borderColor: "#E5E7EB",
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={require("@/assets/images/adaptive-icon.png")}
              style={{ width: 64, height: 64, opacity: 0.5, borderRadius: 14 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Message */}
      <Text className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-2">
        {isNetworkError ? "No Connection" : "Under Maintenance"}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-6 mb-8">
        {isNetworkError
          ? "Unable to reach the server. Please check your internet connection and try again."
          : "Aurora LMS is currently undergoing scheduled maintenance. We`&apos;`ll be back shortly. Thank you for your patience."}
      </Text>

      {/* Status badge */}
      <View className="flex-row items-center bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-4 py-2 mb-8">
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#F59E0B",
            marginRight: 8,
          }}
        />
        <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold">
          {isNetworkError ? "Network unreachable" : "Service unavailable"}
        </Text>
      </View>

      {/* Retry button */}
      <Pressable
        onPress={handleRetry}
        disabled={retrying}
        className={`rounded-xl py-4 px-10 items-center ${
          retrying ? "bg-violet-300" : "bg-violet-600 active:bg-violet-700"
        }`}
      >
        {retrying ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-base">Try Again</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [externalId, setExternalId] = useState("");
  const [password, setPassword] = useState("");
  const { onLogin, authState } = useAuth();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  const handleLogin = async () => {
    if (!externalId.trim() || !password.trim()) {
      showToast({
        type: "error",
        title: "Missing information",
        message: "Please enter both your External ID and password.",
      });
      return;
    }

    try {
      await onLogin?.({ external_id: externalId, password });
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Login failed",
        message: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        <Animated.View
          style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        >
          {/* App Title */}
          <View className="mb-10 items-center">
            <Text
              className="text-3xl font-extrabold text-violet-600"
              style={{ letterSpacing: 1 }}
            >
              AURORA LMS
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              Sign in to continue learning
            </Text>
          </View>

          {/* Login Card */}
          <View className="bg-white dark:bg-gray-900 rounded-2xl shadow-md px-6 py-8">
            {/* External ID */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                External ID
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-3 bg-gray-50 dark:bg-gray-800">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter your External ID"
                  placeholderTextColor="#9CA3AF"
                  value={externalId}
                  onChangeText={setExternalId}
                  keyboardType="numeric"
                  editable={!authState?.isLoading}
                  className="flex-1 px-3 py-3 text-base text-gray-800 dark:text-gray-100"
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-3 bg-gray-50 dark:bg-gray-800">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!authState?.isLoading}
                  className="flex-1 px-3 py-3 text-base text-gray-800 dark:text-gray-100"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={authState?.isLoading}
                  hitSlop={10}
                >
                  <AntDesign
                    name={showPassword ? "eye" : "eye-invisible"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={authState?.isLoading}
              className={`rounded-xl py-4 items-center ${
                authState?.isLoading
                  ? "bg-red-300"
                  : "bg-red-500 active:bg-red-600"
              }`}
            >
              {authState?.isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Sign In</Text>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <Text className="text-center text-gray-400 text-xs mt-6">
            © {new Date().getFullYear()} AURORA LMS
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────
export default function Login() {
  const [status, setStatus] = useState<AppStatus>("checking");

  const checkHealth = useCallback(async () => {
    setStatus("checking");

    try {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        HEALTH_CHECK_TIMEOUT_MS,
      );

      const response = await fetch(HEALTH_CHECK_URL, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus("ready");
      } else {
        // Server responded but with an error (503, 500, etc.) — true maintenance
        setStatus("maintenance");
      }
    } catch {
      // fetch threw — no response received, client-side network issue
      setStatus("no_network");
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  if (status === "checking") return <CheckingScreen />;
  if (status === "maintenance" || status === "no_network")
    return <MaintenanceScreen onRetry={checkHealth} isNetworkError={status === "no_network"} />;
  return <LoginForm />;
}
