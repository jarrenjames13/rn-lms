import * as SecureStore from "expo-secure-store";

const CLIENT_ID_KEY = "assessment_installation_client_id";
let clientIdPromise: Promise<string> | null = null;

const createClientId = () =>
  `rn-${Date.now().toString(36)}-${Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 10),
  ).join("")}`.slice(0, 64);

export const getAssessmentClientId = () => {
  if (!clientIdPromise) {
    clientIdPromise = SecureStore.getItemAsync(CLIENT_ID_KEY).then(async (stored) => {
      if (stored) return stored;
      const clientId = createClientId();
      await SecureStore.setItemAsync(CLIENT_ID_KEY, clientId);
      return clientId;
    });
  }
  return clientIdPromise;
};

export const createAssessmentOperationId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
