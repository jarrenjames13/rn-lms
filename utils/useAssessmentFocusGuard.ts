import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { SecurityEventResponse } from "@/api/QueryFunctions/assessmentSessionLease";

type FocusGuardOptions = {
  active: boolean;
  ignoreFocusLossRef: React.RefObject<boolean>;
  recordFocusLoss: () => number;
  reportFocusLoss: (count: number) => Promise<SecurityEventResponse>;
  focusThreshold?: number;
  onThresholdReached: () => void;
  onReportError?: (error: unknown) => void;
};

export const useAssessmentFocusGuard = ({
  active,
  ignoreFocusLossRef,
  recordFocusLoss,
  reportFocusLoss,
  focusThreshold = 2,
  onThresholdReached,
  onReportError,
}: FocusGuardOptions) => {
  const appStateRef = useRef(AppState.currentState);
  const episodeOpenRef = useRef(false);
  const warnOnReturnRef = useRef(false);
  const activeRef = useRef(active);
  const onThresholdReachedRef = useRef(onThresholdReached);
  const reportFocusLossRef = useRef(reportFocusLoss);
  const [warningVisible, setWarningVisible] = useState(false);
  const [contentObscured, setContentObscured] = useState(false);

  activeRef.current = active;
  onThresholdReachedRef.current = onThresholdReached;
  reportFocusLossRef.current = reportFocusLoss;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next: AppStateStatus) => {
      const leftForeground =
        (appStateRef.current === "active" && next !== "active") ||
        (appStateRef.current === "inactive" && next === "background");
      const ignoreTransition =
        ignoreFocusLossRef.current && next !== "background";

      if (
        leftForeground &&
        activeRef.current &&
        !ignoreTransition &&
        !episodeOpenRef.current
      ) {
        episodeOpenRef.current = true;
        setContentObscured(true);
        const count = recordFocusLoss();
        warnOnReturnRef.current = count < focusThreshold;
        let submissionTriggered = false;
        const submitOnce = () => {
          if (submissionTriggered) return;
          submissionTriggered = true;
          onThresholdReachedRef.current();
        };
        void reportFocusLossRef.current(count)
          .then((response) => {
            const threshold = response.threshold || focusThreshold;
            warnOnReturnRef.current = response.warning_count < threshold;
            if (response.must_submit) submitOnce();
            else if (appStateRef.current === "active" && !episodeOpenRef.current) {
              setWarningVisible(warnOnReturnRef.current);
              setContentObscured(false);
            }
          })
          .catch((error) => {
            onReportError?.(error);
          });
      }

      if (next === "active") {
        if (episodeOpenRef.current) {
          episodeOpenRef.current = false;
          if (activeRef.current && warnOnReturnRef.current) {
            setWarningVisible(true);
          } else {
            setContentObscured(false);
          }
          warnOnReturnRef.current = false;
        } else if (!activeRef.current || ignoreFocusLossRef.current) {
          setContentObscured(false);
        }
      }

      appStateRef.current = next;
    });
    return () => subscription.remove();
  }, [focusThreshold, ignoreFocusLossRef, onReportError, recordFocusLoss]);

  useEffect(() => {
    if (!active) {
      setWarningVisible(false);
      setContentObscured(false);
    }
  }, [active]);

  const returnToAnswering = useCallback(() => {
    setWarningVisible(false);
    setContentObscured(false);
  }, []);

  return { warningVisible, contentObscured, returnToAnswering };
};
