import * as SecureStore from "expo-secure-store";
import type { StateStorage } from "zustand/middleware";

let writeQueue = Promise.resolve();

export const assessmentStorage: StateStorage = {
  getItem: async (name) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await SecureStore.getItemAsync(name);
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return null;
  },
  setItem: (name, value) => {
    writeQueue = writeQueue
      .catch(() => undefined)
      .then(() => SecureStore.setItemAsync(name, value));
    return writeQueue;
  },
  removeItem: (name) => {
    writeQueue = writeQueue
      .catch(() => undefined)
      .then(() => SecureStore.deleteItemAsync(name));
    return writeQueue;
  },
};

export const flushAssessmentStorage = () => writeQueue;
