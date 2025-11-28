import * as SecureStore from "expo-secure-store";

export const fetchUser = async () => {
  try {
    const userData = await SecureStore.getItemAsync("user");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.log("Error fetching user data:", error);
    return null;
  }
};
