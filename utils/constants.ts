export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const MAX_QUIZ_ATTEMPTS = 3;

/** Join an API-relative path to the configured base without dropping /api. */
export const apiUrl = (path: string): string => {
  const baseUrl = BASE_URL?.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  return baseUrl ? `${baseUrl}/${relativePath}` : `/${relativePath}`;
};
