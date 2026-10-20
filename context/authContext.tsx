import {
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  VerifyUser,
} from "@/types/api";

import { BASE_URL } from "@/utils/constants";
import { apiClient, clearApiAuthorization, persistAuthCookies, setLogoutCallback } from "@/utils/fetcher";
import { showToast } from "@/utils/toast/toast";
import NetInfo from "@react-native-community/netinfo";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { useExamStore } from "@/store/useExamStore";
import { useQuizStore } from "@/store/useQuizStore";
import { deactivatePushNotifications } from "@/api/services/pushNotifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

interface AuthProps {
  authState?: {
    success: boolean | null;
    user: {
      user_id: number;
      external_id: string;
      full_name: string;
      role: string;
    } | null;
    isLoading: boolean;
  };
  onLogin?: (payload: LoginPayload) => Promise<void>;
  onLogout?: () => Promise<void>;
  isConnected?: boolean | null;
}

const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<{
    success: boolean | null;
    user: {
      user_id: number;
      external_id: string;
      full_name: string;
      role: string;
    } | null;
    isLoading: boolean;
  }>({
    success: null,
    user: null,
    isLoading: true,
  });

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);
  const hasShownConnectionToast = useRef(false);

  const clearAuth = useCallback(async () => {
    await deactivatePushNotifications(false);
    await SecureStore.deleteItemAsync("auth_cookie");
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("active_quiz_attempt");
    await SecureStore.deleteItemAsync("active_exam_attempt");
    useQuizStore.getState().clearAttempt();
    useExamStore.getState().clearAttempt();
    clearApiAuthorization();

    setAuthState({
      success: null,
      user: null,
      isLoading: false,
    });
  }, []);

  // Check internet connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      if (!connected && !hasShownConnectionToast.current) {
        showToast({
          type: "error",
          title: "No Internet Connection",
          message: "Please check your internet connection and try again.",
        });
        hasShownConnectionToast.current = true;
      }

      return connected;
    } catch (error) {
      console.log("Connection check error:", error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const verifyUser = useCallback(async () => {
    try {
      const hasConnection = await checkConnection();
      if (!hasConnection) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const cookie = await SecureStore.getItemAsync("auth_cookie");
      if (!cookie) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const response = await apiClient.get<VerifyUser>(`${BASE_URL}/auth/verify`);
      if (response.data.user.role !== "student") {
        await clearAuth();
        return;
      }
      await SecureStore.setItemAsync("user", JSON.stringify(response.data.user));
      setAuthState({
        user: response.data.user,
        success: true,
        isLoading: false,
      });
    } catch (error) {
      console.log("Verify user failed; clearing the local session.", error);
      await clearAuth();
    }
  }, [clearAuth, checkConnection]);

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      // Only verify when transitioning from background/inactive to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App became active from background...");

        // Check connection when app becomes active
        const hasConnection = await checkConnection();

        if (
          hasConnection &&
          authState.success
        ) {
          console.log("Verifying user...");
          verifyUser();
        }
      }

      appState.current = nextAppState;
    },
    [
      authState.success,
      verifyUser,
      checkConnection,
    ],
  );

  // Initial connection check and verify user on mount
  useEffect(() => {
    setLogoutCallback(clearAuth);

    const initialize = async () => {
      const hasConnection = await checkConnection();
      if (hasConnection) {
        await verifyUser();
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initialize();
  }, [clearAuth, verifyUser, checkConnection]);

  // Listen to network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = isConnected;
      const nowConnected = state.isConnected ?? false;
      setIsConnected(nowConnected);

      if (wasConnected === false && nowConnected === true) {
        // Connection restored
        showToast({
          type: "success",
          title: "Connection Restored",
          message: "Internet connection is back.",
        });
        hasShownConnectionToast.current = false;

        // Re-verify user when connection is restored
        if (authState.success) {
          verifyUser();
        }
      } else if (wasConnected === true && nowConnected === false) {
        // Connection lost
        showToast({
          type: "error",
          title: "Connection Lost",
          message: "No internet connection.",
        });
        hasShownConnectionToast.current = true;
      }
    });

    return () => unsubscribe();
  }, [
    isConnected,
    authState.success,
    verifyUser,
  ]);

  // Listen to app state changes to verify user when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const login = async ({ external_id, password }: LoginPayload) => {
    if (!external_id || !password) {
      showToast({
        type: "error",
        title: "Login Failed",
        message: "Please provide both external ID and password.",
      });
      return;
    }

    // Check internet connection before attempting login
    const hasConnection = await checkConnection();
    if (!hasConnection) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Verify the server is actually reachable (not just network connectivity)
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const probe = await fetch(`${BASE_URL}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!probe.ok) {
        showToast({
          type: "error",
          title: "Server Unavailable",
          message:
            "The server is currently under maintenance. Please try again later.",
        });
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
    } catch {
      showToast({
        type: "error",
        title: "Cannot Reach Server",
        message:
          "Unable to connect to the server. Please check your connection.",
      });
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const res = await apiClient.post<LoginResponse>(
        `${BASE_URL}/auth/mobile-login`,
        { external_id, password },
        { _skipRefreshRetry: true } as any,
      );
      const data = res.data;

      // Only successful 200 responses reach here
      if (data.success && data.user.role === "student") {
        if (!(await persistAuthCookies(res.headers))) {
          throw new Error("Secure session cookies were not returned by the server.");
        }
        setAuthState({
          user: data.user,
          success: data.success,
          isLoading: false,
        });

        showToast({
          type: "success",
          title: "Login Successful",
          message: data.message || "Login successful.",
        });

        await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      } else if (data.success && data.user.role !== "student") {
        console.log("User role is not student, clearing auth.");
        showToast({
          type: "error",
          title: "Login Failed",
          message: "LMS is only dedicated for students.",
        });
        await clearAuth();
        return;
      }
    } catch (error: any) {
      console.log("Login error caught:", error);

      // Handle axios errors (including 401, 400, etc.)
      if (isAxiosError(error) && error.response) {
        const data = error.response.data;

        showToast({
          type: "error",
          title: "Login Failed",
          message: data?.detail || data?.message || "Invalid credentials.",
        });
      } else {
        // Handle network errors or other exceptions
        showToast({
          type: "error",
          title: "Login Failed",
          message:
            error.message || "Internal server error occurred during login.",
        });
      }

      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const logout = async () => {
    try {
      // Check internet connection before attempting logout
      const hasConnection = await checkConnection();

      if (hasConnection) {
        await deactivatePushNotifications();
      }

      const authCookie = await SecureStore.getItemAsync("auth_cookie");

      if (!authCookie) {
        await clearAuth();
        return;
      }

      // Only attempt API logout if connected
      if (hasConnection) {
        const res = await apiClient.post<LogoutResponse>(
          `${BASE_URL}/auth/logout`,
          {},
        );

        const data = res.data;

        await clearAuth();

        if (res.status === 200 && "success" in data && data.success) {
          showToast({
            type: "success",
            title: "Logout Successful",
            message: data.message,
          });
        } else {
          showToast({
            type: "error",
            title: "Logout Failed",
            message:
              "detail" in data ? data.detail : "An unknown error occurred.",
          });
        }
      } else {
        // Clear auth locally even without internet
        await clearAuth();
        showToast({
          type: "success",
          title: "Logged Out",
          message: "You have been logged out locally.",
        });
      }
    } catch (error: any) {
      let message = "Internal server error occurred during logout.";

      if (isAxiosError(error)) {
        if (error.response?.data) {
          const data = error.response.data as LogoutResponse;
          message =
            "detail" in data ? data.detail : "An unknown error occurred.";
        } else if (error.message) {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      await clearAuth();

      showToast({
        type: "error",
        title: "Logout Failed",
        message,
      });
    }
  };

  const value = {
    authState,
    onLogin: login,
    onLogout: logout,
    verifyUser,
    isConnected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
