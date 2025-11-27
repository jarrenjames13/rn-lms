import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "./constants";

export const refreshAccessToken = async (
  onLogout?: () => void
): Promise<string> => {
  try {
    const refresh_token = await SecureStore.getItemAsync("refresh_token");
    if (!refresh_token) throw new Error("No refresh token");

    const res = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refresh_token}` } }
    );

    const newAccessToken = res.data.access_token;
    const newRefreshToken = res.data.refresh_token;

    await SecureStore.setItemAsync("access_token", newAccessToken);
    await SecureStore.setItemAsync("refresh_token", newRefreshToken);

    axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
    return newAccessToken;
  } catch (err) {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    if (onLogout) onLogout();
    throw new Error("Session expired, logged out");
  }
};
