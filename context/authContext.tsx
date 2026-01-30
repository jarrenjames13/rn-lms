import {
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  VerifyUser,
} from "@/types/api";
import { BASE_URL } from "@/utils/constants";
import { setLogoutCallback } from "@/utils/fetcher";
import { showToast } from "@/utils/toast/toast";
import axios, { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
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
    access_token: string | null;
    refresh_token: string | null;
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
}

const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<{
    access_token: string | null;
    refresh_token: string | null;
    success: boolean | null;
    user: {
      user_id: number;
      external_id: string;
      full_name: string;
      role: string;
    } | null;
    isLoading: boolean;
  }>({
    access_token: null,
    refresh_token: null,
    success: null,
    user: null,
    isLoading: true,
  });

  const appState = useRef(AppState.currentState);

  const clearAuth = useCallback(async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user");
    delete axios.defaults.headers.common["Authorization"];

    setAuthState({
      access_token: null,
      refresh_token: null,
      success: null,
      user: null,
      isLoading: false,
    });
  }, []);

  // Helper function to refresh tokens
  const refreshAccessToken = useCallback(
    async (
      currentRefreshToken: string,
    ): Promise<{ access_token: string; refresh_token: string } | null> => {
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${currentRefreshToken}` },
          },
        );

        if (res.status === 200 && res.data.access_token) {
          const newAccessToken = res.data.access_token;
          const newRefreshToken = res.data.refresh_token;

          // Store new tokens
          await SecureStore.setItemAsync("access_token", newAccessToken);
          await SecureStore.setItemAsync("refresh_token", newRefreshToken);

          return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
          };
        }

        return null;
      } catch (error) {
        console.log("Token refresh failed:", error);
        return null;
      }
    },
    [],
  );

  const verifyUser = useCallback(async () => {
    try {
      console.log("Verifying user...");
      const access_token = await SecureStore.getItemAsync("access_token");
      const refresh_token = await SecureStore.getItemAsync("refresh_token");

      if (!access_token || !refresh_token) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      console.log("Found tokens, proceeding with verification...");
      // Attempt to verify with current access token
      try {
        const res = await axios.get<VerifyUser>(`${BASE_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const data = res.data;
        if (res.status === 200 && data.user.role === "student") {
          setAuthState({
            access_token: access_token,
            refresh_token,
            user: data.user,
            success: true,
            isLoading: false,
          });

          axios.defaults.headers.common["Authorization"] =
            `Bearer ${access_token}`;

          if (data.user) {
            console.log("User verified successfully:", data.user);
            await SecureStore.setItemAsync("user", JSON.stringify(data.user));
          }
          return;
        } else if (res.status === 200 && data.user.role !== "student") {
          console.log("User role is not student, clearing auth.");
          await clearAuth();
          return;
        }
      } catch (verifyError: any) {
        // If verification fails with 401, try to refresh the token
        if (verifyError.response?.status === 401) {
          console.log("Access token expired, attempting refresh...");

          const refreshResult = await refreshAccessToken(refresh_token);

          if (refreshResult) {
            // Token refresh successful, verify again with new token
            try {
              const retryRes = await axios.get(`${BASE_URL}/auth/verify`, {
                headers: {
                  Authorization: `Bearer ${refreshResult.access_token}`,
                },
              });

              if (retryRes.status === 200) {
                const data = retryRes.data;

                setAuthState({
                  access_token: refreshResult.access_token,
                  refresh_token: refreshResult.refresh_token,
                  user: data.user,
                  success: true,
                  isLoading: false,
                });

                axios.defaults.headers.common["Authorization"] =
                  `Bearer ${refreshResult.access_token}`;

                console.log("Token refreshed and user verified successfully");
                return;
              }
            } catch (retryError) {
              console.log(
                "Verification failed after token refresh:",
                retryError,
              );
            }
          }

          // If refresh failed or retry verification failed, logout
          console.log(
            "Token refresh or re-verification failed, logging out...",
          );
          await clearAuth();
          return;
        }

        // For other errors, logout
        console.log("Verification failed with non-401 error:", verifyError);
        await clearAuth();
      }
    } catch (error) {
      console.log("Verify user error:", error);
      await clearAuth();
    }
  }, [refreshAccessToken, clearAuth]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      // Only verify when transitioning from background/inactive to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        authState.access_token &&
        authState.refresh_token
      ) {
        console.log("App became active from background, verifying user...");
        verifyUser();
      }

      appState.current = nextAppState;
    },
    [authState.access_token, authState.refresh_token, verifyUser],
  );

  useEffect(() => {
    // Register logout callback for apiClient
    setLogoutCallback(clearAuth);

    verifyUser();
  }, [clearAuth, verifyUser]);

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

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const res = await axios.post<LoginResponse>(`${BASE_URL}/auth/login`, {
        external_id,
        password,
      });
      const data = res.data;

      // Only successful 200 responses reach here
      if (data.success && data.user.role === "student") {
        setAuthState({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
          success: data.success,
          isLoading: false,
        });

        showToast({
          type: "success",
          title: "Login Successful",
          message: data.message || "Login successful.",
        });

        axios.defaults.headers.common["Authorization"] =
          `Bearer ${data.access_token}`;

        await SecureStore.setItemAsync("access_token", data.access_token);
        await SecureStore.setItemAsync("refresh_token", data.refresh_token);
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
      const refresh_token = await SecureStore.getItemAsync("refresh_token");

      if (!refresh_token) {
        await clearAuth();
        return;
      }

      const res = await axios.post<LogoutResponse>(
        `${BASE_URL}/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${refresh_token}` },
        },
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
