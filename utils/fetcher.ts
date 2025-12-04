import axios, { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "../utils/constants";

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "X-Client-Type": "mobile",
  },
});

// Store logout callback reference
let logoutCallback: (() => Promise<void>) | null = null;

// Track ongoing refresh attempt to prevent race conditions
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}[] = [];

// Function to set logout callback from AuthProvider
export const setLogoutCallback = (callback: () => Promise<void>) => {
  logoutCallback = callback;
};

// Process queued requests after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Token refresh function with race condition prevention
const refreshToken = async (): Promise<string> => {
  try {
    const refreshTokenValue = await SecureStore.getItemAsync("refresh_token");

    if (!refreshTokenValue) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshTokenValue}`,
        },
      }
    );

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;

    // Store new tokens
    await SecureStore.setItemAsync("refresh_token", newRefreshToken);
    await SecureStore.setItemAsync("access_token", newAccessToken);

    // Update default axios headers
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${newAccessToken}`;

    return newAccessToken;
  } catch (error) {
    // Handle refresh failure - clear tokens and trigger logout
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user");

    // Trigger logout callback if available
    if (logoutCallback) {
      await logoutCallback();
    }

    throw error;
  }
};

// Request interceptor to add token to each request
apiClient.interceptors.request.use(
  async (config: any) => {
    if (config._skipAuthInterceptor) return config; // skip interceptor

    const token = await SecureStore.getItemAsync("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401/422 errors (token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (unauthorized) or 422 (token expired/invalid)
    if (
      (error.response?.status === 401 || error.response?.status === 422) &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const token = await refreshToken();

        // Process all queued requests with new token
        processQueue(null, token);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError, null);

        // Refresh failed - user will be logged out via refreshToken function
        console.log("Token refresh failed, user logged out");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper to build URL with query parameters
const buildUrlWithParams = (
  url: string,
  params: Record<string, string | number | boolean> = {}
): string => {
  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();
  return queryString ? `${url}?${queryString}` : url;
};

// Unified request function
const request = async <T = any>(
  method: "get" | "post" | "patch" | "delete",
  url: string,
  data?: any,
  params: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {}
) => {
  try {
    const fullUrl = buildUrlWithParams(url, params);

    const config = {
      method,
      url: fullUrl,
      data,
      headers,
    };

    const res = await apiClient.request<T>(config);
    return res;
  } catch (error: any) {
    if (isAxiosError(error) && error.response) {
      return error.response;
    }
    throw error;
  }
};

// Exported functions
export const getData = <T = any>(
  url: string,
  params: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {}
) => request<T>("get", url, undefined, params, headers);

export const postData = <T = any>(
  url: string,
  data: any,
  headers: Record<string, string> = {}
) => request<T>("post", url, data, {}, headers);

export const patchData = <T = any>(
  url: string,
  data: any,
  headers: Record<string, string> = {}
) => request<T>("patch", url, data, {}, headers);

export const deleteData = <T = any>(
  url: string,
  params: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {}
) => request<T>("delete", url, undefined, params, headers);
