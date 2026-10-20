import { create } from "axios";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "../utils/constants";
import { publishAssessmentLeaseTakenOver } from "./assessmentLease";

// Create axios instance
export const apiClient = create({
  baseURL: BASE_URL,
  timeout: 30_000,
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

// Process queued requests after cookie refresh.
const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

const AUTH_COOKIE_KEYS = [
  "access_token_cookie",
  "refresh_token_cookie",
  "csrf_access_token",
  "csrf_refresh_token",
] as const;

function readCookiePairs(headers: any): Record<string, string> {
  const raw = headers?.["set-cookie"] ?? headers?.get?.("set-cookie");
  const lines = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/,(?=\s*[A-Za-z0-9_-]+=)/)
      : [];
  const cookies: Record<string, string> = {};
  for (const line of lines) {
    const pair = String(line).split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    if ((AUTH_COOKIE_KEYS as readonly string[]).includes(name)) {
      cookies[name] = pair.slice(separator + 1).trim();
    }
  }
  return cookies;
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of (cookieHeader || "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    if ((AUTH_COOKIE_KEYS as readonly string[]).includes(name)) {
      cookies[name] = pair.slice(separator + 1).trim();
    }
  }
  return cookies;
}

export async function persistAuthCookies(headers: any): Promise<boolean> {
  const stored = parseCookieHeader(await SecureStore.getItemAsync("auth_cookie"));
  Object.assign(stored, readCookiePairs(headers));
  if (!stored.access_token_cookie || !stored.refresh_token_cookie || !stored.csrf_access_token || !stored.csrf_refresh_token) {
    return false;
  }
  const cookieHeader = AUTH_COOKIE_KEYS
    .filter((name) => stored[name])
    .map((name) => `${name}=${stored[name]}`)
    .join("; ");
  await SecureStore.setItemAsync("auth_cookie", cookieHeader);
  return true;
}

export async function getAuthCookieHeaders(
  method = "GET",
  url = "",
): Promise<Record<string, string>> {
  const cookie = await SecureStore.getItemAsync("auth_cookie");
  if (!cookie) return {};
  const headers: Record<string, string> = { Cookie: cookie };
  if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
    const cookies = parseCookieHeader(cookie);
    const csrfCookie = /\/auth\/(?:refresh|logout)(?:\?|$)/i.test(url)
      ? cookies.csrf_refresh_token
      : cookies.csrf_access_token;
    if (csrfCookie) headers["X-CSRF-TOKEN"] = csrfCookie;
  }
  return headers;
}

// Refresh from the SecureStore cookie jar; never expose JWTs to JavaScript state.
const refreshToken = async (): Promise<void> => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { _skipRefreshRetry: true } as any,
    );
    if (!(await persistAuthCookies(response.headers))) {
      throw new Error("The server did not return a complete authenticated cookie set.");
    }
  } catch (error) {
    await SecureStore.deleteItemAsync("auth_cookie");
    await SecureStore.deleteItemAsync("user");
    if (logoutCallback) await logoutCallback();
    throw error;
  }
};

// Attach the private cookie jar and the matching CSRF cookie on mutations.
apiClient.interceptors.request.use(
  async (config: any) => {
    const headers = await getAuthCookieHeaders(config.method || "GET", config.url || "");
    config.headers = config.headers || {};
    Object.assign(config.headers, headers);
    return config;
  },
  (error) => Promise.reject(error),
);

// Only authentication failures should attempt a token refresh. Validation errors must reach the caller.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    let requestData = originalRequest?.data;
    if (typeof requestData === "string") {
      try {
        requestData = JSON.parse(requestData);
      } catch {
        requestData = undefined;
      }
    }
    publishAssessmentLeaseTakenOver(
      error.response?.data,
      "api",
      requestData?.session_token ?? originalRequest?.headers?.["X-Assessment-Session"],
    );

    // Handle a single unauthorized retry.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry && !originalRequest._skipRefreshRetry
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshToken();
        processQueue();
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError);

        // Refresh failed - user will be logged out via refreshToken function
        console.log("Token refresh failed, user logged out");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Helper to build URL with query parameters
const buildUrlWithParams = (
  url: string,
  params: Record<string, string | number | boolean> = {},
): string => {
  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ).toString();
  return queryString ? `${url}?${queryString}` : url;
};

// Unified request function
const request = async <T = any>(
  method: "get" | "post" | "patch" | "delete" | "put",
  url: string,
  data?: any,
  params: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {},
) => {
  const fullUrl = buildUrlWithParams(url, params);
  return apiClient.request<T>({ method, url: fullUrl, data, headers });
};

export const clearApiAuthorization = () => {
  delete apiClient.defaults.headers.common.Authorization;
  void SecureStore.deleteItemAsync("auth_cookie");
};

// Exported functions
export const getData = <T = any>(
  url: string,
  params: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {},
) => request<T>("get", url, undefined, params, headers);

export const postData = <T = any>(
  url: string,
  data: any,
  headers: Record<string, string> = {},
) => request<T>("post", url, data, {}, headers);

export const patchData = <T = any>(
  url: string,
  data?: any,
  headers: Record<string, string> = {},
) => request<T>("patch", url, data, {}, headers);

export const putData = <T = any>(
  url: string,
  data?: any,
  headers: Record<string, string> = {},
) => request<T>("put", url, data, {}, headers);

export const deleteData = <T = any>(
  url: string,
  params: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {},
) => request<T>("delete", url, undefined, params, headers);
