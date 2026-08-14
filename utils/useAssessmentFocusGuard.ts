import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

type FocusGuardOptions = {
  active: boolean;
  ignoreFocusLossRef: React.RefObject<boolean>;
  recordFocusLoss: () => number;
  reportFocusLoss: (count: number) => Promise<boolean>;
  onSecondEpisode: () => void;
};

export const useAssessmentFocusGuard = ({
  active,
  ignoreFocusLossRef,
  recordFocusLoss,
  reportFocusLoss,
  onSecondEpisode,
}: FocusGuardOptions) => {
  const appStateRef = useRef(AppState.currentState);
  const episodeOpenRef = useRef(false);
  const warnOnReturnRef = useRef(false);
  const activeRef = useRef(active);
  const onSecondEpisodeRef = useRef(onSecondEpisode);
  const reportFocusLossRef = useRef(reportFocusLoss);
  const [warningVisible, setWarningVisible] = useState(false);
  const [contentObscured, setContentObscured] = useState(false);

  activeRef.current = active;
  onSecondEpisodeRef.current = onSecondEpisode;
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
        warnOnReturnRef.current = count === 1;
        let submissionTriggered = false;
        const submitOnce = () => {
          if (submissionTriggered) return;
          submissionTriggered = true;
          onSecondEpisodeRef.current();
        };
        void reportFocusLossRef.current(count)
          .then((mustSubmit) => {
            if (mustSubmit) submitOnce();
          })
          .catch(() => {
            if (count >= 2) submitOnce();
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
  }, [ignoreFocusLossRef, recordFocusLoss]);

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
