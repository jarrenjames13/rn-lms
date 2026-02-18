import * as SecureStore from "expo-secure-store";

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync("access_token");
};
