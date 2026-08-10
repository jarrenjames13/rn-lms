import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from "expo-screen-capture";
import { useEffect } from "react";

const reportUnexpectedError = (action: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (__DEV__ && !message.includes("current activity is no longer available")) {
    console.warn(`Unable to ${action} screen capture`, error);
  }
};

export const useAssessmentScreenCapture = (key: string) => {
  useEffect(() => {
    void preventScreenCaptureAsync(key).catch((error) => {
      reportUnexpectedError("prevent", error);
    });

    return () => {
      void allowScreenCaptureAsync(key).catch((error) => {
        reportUnexpectedError("allow", error);
      });
    };
  }, [key]);
};
