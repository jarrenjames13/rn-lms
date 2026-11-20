import {
  autosaveAssessmentAnswer,
  heartbeatAssessmentSession,
  reportAssessmentSecurityEvent,
} from "@/api/QueryFunctions/assessmentSessionLease";
import type { CaptureState } from "@/types/assessmentAttempt";
import type { OptionKey } from "@/types/api";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { getAssessmentHttpError } from "./assessmentHttpError";
import {
  createAssessmentOperationId,
  getAssessmentClientId,
} from "./assessmentClientId";

type LeaseState = {
  status: string;
  session_id?: string | number;
  session_token: string;
  lease_generation?: number;
  client_id?: string;
};

type RuntimeOptions = {
  getAttempt: () => LeaseState;
  setAnswerRevision: (revision: number) => void;
  setRemainingSeconds: (seconds: number) => void;
  setCaptureState: (state: CaptureState) => void;
  onSessionTerminal?: (code: string) => void;
  leaseKey: string;
};

const leaseIdentity = (attempt: LeaseState) =>
  `${attempt.session_id}:${attempt.lease_generation}:${attempt.session_token}`;

const getLease = async (getAttempt: () => LeaseState) => {
  const attempt = getAttempt();
  const sessionId = Number(attempt.session_id);
  if (
    attempt.status !== "active" ||
    !Number.isFinite(sessionId) ||
    !attempt.session_token ||
    attempt.lease_generation == null
  ) return null;
  const clientId = attempt.client_id ?? await getAssessmentClientId();
  const current = getAttempt();
  if (leaseIdentity(current) !== leaseIdentity(attempt)) return null;
  return {
    sessionId,
    session_token: attempt.session_token,
    lease_generation: attempt.lease_generation,
    client_id: clientId,
  };
};

export const useAssessmentSessionRuntime = ({
  getAttempt,
  setAnswerRevision,
  setRemainingSeconds,
  setCaptureState,
  onSessionTerminal,
  leaseKey,
}: RuntimeOptions) => {
  const versionsRef = useRef(new Map<number, number>());
  const savesRef = useRef(new Map<number, Promise<void>>());

  const sendHeartbeat = useCallback(async () => {
    const lease = await getLease(getAttempt);
    if (!lease || AppState.currentState !== "active") return;
    const { sessionId, ...payload } = lease;
    try {
      const response = await heartbeatAssessmentSession(sessionId, payload);
      if (leaseIdentity(getAttempt()) !== `${sessionId}:${payload.lease_generation}:${payload.session_token}`) return;
      setRemainingSeconds(Math.max(0, response.remaining_seconds));
      setCaptureState(response.capture_state);
    } catch (error) {
      const { code } = getAssessmentHttpError(error);
      if (code === "ASSESSMENT_SESSION_TERMINAL" || code === "ASSESSMENT_DEADLINE_EXPIRED") {
        onSessionTerminal?.(code);
      }
      throw error;
    }
  }, [getAttempt, onSessionTerminal, setCaptureState, setRemainingSeconds]);

  useEffect(() => {
    const attempt = getAttempt();
    if (attempt.status !== "active" || attempt.session_id == null) return;

    void sendHeartbeat().catch(() => undefined);
    const interval = setInterval(() => {
      void sendHeartbeat().catch(() => undefined);
    }, 15_000);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void sendHeartbeat().catch(() => undefined);
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [getAttempt, leaseKey, sendHeartbeat]);

  useEffect(
    () => () => {
      versionsRef.current.clear();
      savesRef.current.clear();
    },
    [leaseKey],
  );

  const queueAutosave = useCallback(
    (sessionQuestionId: number | undefined, selectedAnswer: OptionKey) => {
      if (sessionQuestionId == null) return;
      const queuedLeaseIdentity = leaseIdentity(getAttempt());
      const operationId = createAssessmentOperationId("answer");
      const saveAnswer = async () => {
        const lease = await getLease(getAttempt);
        if (!lease) return;
        if (leaseIdentity(getAttempt()) !== queuedLeaseIdentity) return;
        const { sessionId, ...payload } = lease;
        const save = (version: number) =>
          autosaveAssessmentAnswer(sessionId, {
            ...payload,
            session_question_id: sessionQuestionId,
            selected_answer: selectedAnswer,
            client_operation_id: operationId,
            version,
          });
        let response;
        try {
          response = await save(versionsRef.current.get(sessionQuestionId) ?? 0);
        } catch (error: any) {
          const detail = error?.response?.data?.detail;
          if (
            error?.response?.status !== 409 ||
            detail?.code !== "ANSWER_VERSION_CONFLICT" ||
            !Number.isFinite(Number(detail.current_version))
          ) throw error;
          response = await save(Number(detail.current_version));
        }
        if (leaseIdentity(getAttempt()) !== queuedLeaseIdentity) return;
        versionsRef.current.set(sessionQuestionId, response.version);
        setAnswerRevision(response.answer_revision);
      };
      const previous = savesRef.current.get(sessionQuestionId) ?? Promise.resolve();
      const next = previous.catch(() => undefined).then(saveAnswer);
      savesRef.current.set(sessionQuestionId, next);
      const clearCurrentSave = () => {
        if (savesRef.current.get(sessionQuestionId) === next) {
          savesRef.current.delete(sessionQuestionId);
        }
      };
      void next.then(clearCurrentSave, clearCurrentSave);
    },
    [getAttempt, setAnswerRevision],
  );

  const reportSecurityEvent = useCallback(async (
    eventType: "fullscreen_exit" | "focus_loss" | "tab_switch" | "navigation_attempt",
    eventPayload: Record<string, unknown> = {},
  ) => {
    await Promise.allSettled([...savesRef.current.values()]);
    const lease = await getLease(getAttempt);
    if (!lease) throw new Error("Assessment lease is not available.");
    const { sessionId, ...leasePayload } = lease;
    return reportAssessmentSecurityEvent(sessionId, {
      ...leasePayload,
      event_type: eventType,
      idempotency_key: createAssessmentOperationId(eventType),
      payload: eventPayload,
    });
  }, [getAttempt]);

  const reportFocusLoss = useCallback(
    (localCount: number) => reportSecurityEvent("focus_loss", { local_count: localCount }),
    [reportSecurityEvent],
  );

  const flushPendingSaves = useCallback(async () => {
    while (savesRef.current.size > 0) {
      await Promise.allSettled([...savesRef.current.values()]);
    }
  }, []);

  const setAnswerVersions = useCallback((versions: Record<number, number>) => {
    Object.entries(versions).forEach(([questionId, version]) => {
      versionsRef.current.set(Number(questionId), Number(version));
    });
  }, []);

  return {
    queueAutosave,
    flushPendingSaves,
    reportFocusLoss,
    reportSecurityEvent,
    setAnswerVersions,
    sendHeartbeat,
  };
};
