import {
  autosaveAssessmentAnswer,
  heartbeatAssessmentSession,
  reportAssessmentSecurityEvent,
} from "@/api/QueryFunctions/assessmentSessionLease";
import type { OptionKey } from "@/types/api";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  createAssessmentOperationId,
  getAssessmentClientId,
} from "./assessmentClientId";

type LeaseState = {
  status: string;
  session_id?: string | number;
  session_token: string;
  lease_generation?: number;
};

type RuntimeOptions = {
  getAttempt: () => LeaseState;
  setAnswerRevision: (revision: number) => void;
  setRemainingSeconds: (seconds: number) => void;
  leaseKey: string;
};

const getLease = async (getAttempt: () => LeaseState) => {
  const attempt = getAttempt();
  const sessionId = Number(attempt.session_id);
  if (
    attempt.status !== "active" ||
    !Number.isFinite(sessionId) ||
    !attempt.session_token ||
    attempt.lease_generation == null
  ) return null;
  return {
    sessionId,
    session_token: attempt.session_token,
    lease_generation: attempt.lease_generation,
    client_id: await getAssessmentClientId(),
  };
};

export const useAssessmentSessionRuntime = ({
  getAttempt,
  setAnswerRevision,
  setRemainingSeconds,
  leaseKey,
}: RuntimeOptions) => {
  const versionsRef = useRef(new Map<number, number>());
  const savesRef = useRef(new Map<number, Promise<void>>());

  const sendHeartbeat = useCallback(async () => {
    const lease = await getLease(getAttempt);
    if (!lease || AppState.currentState !== "active") return;
    const { sessionId, ...payload } = lease;
    const response = await heartbeatAssessmentSession(sessionId, payload);
    setRemainingSeconds(Math.max(0, response.remaining_seconds));
  }, [getAttempt, setRemainingSeconds]);

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
      const operationId = createAssessmentOperationId("answer");
      const saveAnswer = async () => {
        const lease = await getLease(getAttempt);
        if (!lease) return;
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
        versionsRef.current.set(sessionQuestionId, response.version);
        setAnswerRevision(response.answer_revision);
      };
      const previous = savesRef.current.get(sessionQuestionId) ?? Promise.resolve();
      const next = previous.catch(() => undefined).then(saveAnswer);
      savesRef.current.set(sessionQuestionId, next);
      void next.finally(() => {
        if (savesRef.current.get(sessionQuestionId) === next) {
          savesRef.current.delete(sessionQuestionId);
        }
      });
    },
    [getAttempt, setAnswerRevision],
  );

  const reportFocusLoss = useCallback(async (localCount: number) => {
    await Promise.allSettled([...savesRef.current.values()]);
    const lease = await getLease(getAttempt);
    if (!lease) throw new Error("Assessment lease is not available.");
    const { sessionId, ...payload } = lease;
    const response = await reportAssessmentSecurityEvent(sessionId, {
      ...payload,
      event_type: "focus_loss",
      idempotency_key: createAssessmentOperationId("focus"),
      payload: { local_count: localCount },
    });
    return response.must_submit;
  }, [getAttempt]);

  const setAnswerVersions = useCallback((versions: Record<number, number>) => {
    Object.entries(versions).forEach(([questionId, version]) => {
      versionsRef.current.set(Number(questionId), Number(version));
    });
  }, []);

  return { queueAutosave, reportFocusLoss, setAnswerVersions };
};
