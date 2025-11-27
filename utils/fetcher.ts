import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "../utils/constants";

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "X-Client-Type": "mobile",
  },
});

// Token refresh function
const refreshToken = async (): Promise<string> => {
  try {
    const refreshTokenValue = await SecureStore.getItemAsync("refresh_token");

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

    // Store new refresh token
    await SecureStore.setItemAsync("refresh_token", newRefreshToken);

    // Store new access token
    await SecureStore.setItemAsync("access_token", newAccessToken);

    return newAccessToken;
  } catch (error) {
    // Handle refresh failure (e.g., redirect to login)
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    //logout

    throw error;
  }
};

// Request interceptor to add token to each request
apiClient.interceptors.request.use(async (config: any) => {
  if (config._skipAuthInterceptor) return config; // skip interceptor
  const token = await SecureStore.getItemAsync("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle 422 errors (token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 422 and haven't retried this request yet
    if (error.response?.status === 422 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh the token
        const token = await refreshToken();

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login or handle refresh failure
        return Promise.reject(refreshError);
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
    if (axios.isAxiosError(error) && error.response) {
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
