import { CameraView, useCameraPermissions } from "expo-camera";
import { File } from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import type { CaptureState } from "@/types/assessmentAttempt";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { uploadAssessmentIdentityCapture } from "@/api/QueryFunctions/assessmentSessionLease";

const MAX_CAPTURE_BYTES = 5 * 1024 * 1024;
const CAPTURE_QUALITIES = [0.7, 0.45, 0.3] as const;

export type ExamIdentityCapturePhase =
  | "idle"
  | "permission_required"
  | "waiting_for_camera"
  | "preview_ready"
  | "capturing"
  | "uploading"
  | "uploaded"
  | "error";

export type ExamIdentityCaptureError = {
  operation: "permission" | "camera" | "file" | "upload";
  message: string;
  code?: string;
  status?: number;
  cause?: unknown;
};

export type ExamIdentityCaptureState = {
  phase: ExamIdentityCapturePhase;
  error?: ExamIdentityCaptureError;
};

export type IdentityCaptureUploadResponse = {
  captured: boolean;
  idempotent?: boolean;
  capture_state: string;
  capture_review_status?: string;
  captured_at?: string | null;
};

type PendingPhoto = {
  uri: string;
  name: string;
  type: "image/jpeg";
};

type SharedProps = {
  onStateChange?: (state: ExamIdentityCaptureState) => void;
  onError?: (error: ExamIdentityCaptureError) => void;
};

export type ExamIdentityCaptureProps =
  | (SharedProps & {
      /** Camera permission and front-camera preview only. Never captures/uploads. */
      mode: "preflight";
      onReady?: () => void;
    })
  | (SharedProps & {
      /** Pass the server heartbeat's capture_required/due state. */
      mode: "capture";
      capture_due: boolean;
      session_id: number;
      session_token: string;
      client_id: string;
      lease_generation: number;
      onReconcileCapture?: () => Promise<CaptureState>;
      onUploaded?: (response: IdentityCaptureUploadResponse) => void;
    });

function messageFromError(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object") {
    const message = detail.message ?? detail.error ?? detail.code;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function toCaptureError(
  operation: ExamIdentityCaptureError["operation"],
  error: unknown,
  fallback: string,
): ExamIdentityCaptureError {
  const cause = error as any;
  return {
    operation,
    message: messageFromError(cause, fallback),
    code:
      cause?.response?.data?.code ??
      cause?.response?.data?.detail?.code ??
      cause?.code,
    status: cause?.response?.status,
    cause: error,
  };
}

function deleteTemporaryPhoto(uri: string | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The OS may already have removed a cache file; cleanup must remain safe.
  }
}

/**
 * Captures and uploads one front-camera JPEG after the assessment heartbeat
 * marks an identity capture due. It does not schedule captures itself.
 */
export function ExamIdentityCapture(props: ExamIdentityCaptureProps) {
  const { mode, onStateChange, onError } = props;
  const captureProps = mode === "capture" ? props : null;
  const capture_due = mode === "capture" && props.capture_due;
  const session_id = captureProps?.session_id;
  const session_token = captureProps?.session_token;
  const client_id = captureProps?.client_id;
  const lease_generation = captureProps?.lease_generation;
  const onUploaded = captureProps?.onUploaded;
  const onReconcileCapture = captureProps?.onReconcileCapture;
  const onReady = mode === "preflight" ? props.onReady : undefined;
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraEpoch, setCameraEpoch] = useState(0);
  const [state, setState] = useState<ExamIdentityCaptureState>({ phase: "idle" });
  const pendingPhotoRef = useRef<PendingPhoto | null>(null);
  const activeKeyRef = useRef("");
  const generationRef = useRef(0);
  const captureStartedRef = useRef(false);
  const captureQualityIndexRef = useRef(0);
  const uploadInFlightRef = useRef(false);
  const reconcileInFlightRef = useRef(false);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const connectedRef = useRef<boolean | null>(null);
  const mountedRef = useRef(false);
  const deleteAfterUploadRef = useRef(false);

  const captureKey =
    mode === "capture" ? `${session_id}:${lease_generation}` : "preflight";

  const reportState = useCallback(
    (next: ExamIdentityCaptureState) => {
      setState(next);
      onStateChange?.(next);
      if (next.error) onError?.(next.error);
    },
    [onError, onStateChange],
  );

  const clearPendingPhoto = useCallback((expectedUri?: string) => {
    const pendingPhoto = pendingPhotoRef.current;
    if (!pendingPhoto || (expectedUri && pendingPhoto.uri !== expectedUri)) return;
    pendingPhotoRef.current = null;
    deleteTemporaryPhoto(pendingPhoto.uri);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      if (uploadInFlightRef.current) {
        // The upload helper does not expose cancellation; let the native request
        // finish before deleting the file it is reading.
        deleteAfterUploadRef.current = true;
        uploadControllerRef.current?.abort();
      } else {
        clearPendingPhoto();
      }
    };
  }, [clearPendingPhoto]);

  useEffect(() => {
    if (!captureKey || activeKeyRef.current === captureKey) return;
    activeKeyRef.current = captureKey;
    generationRef.current += 1;
    captureStartedRef.current = false;
    captureQualityIndexRef.current = 0;
    setCameraReady(false);
    if (uploadInFlightRef.current) {
      deleteAfterUploadRef.current = true;
      uploadControllerRef.current?.abort();
    } else {
      clearPendingPhoto();
      deleteAfterUploadRef.current = false;
    }
    setState({
      phase: mode === "preflight" || capture_due ? "permission_required" : "idle",
    });
  }, [captureKey, capture_due, clearPendingPhoto, mode]);

  useEffect(() => {
    if (mode !== "capture" || capture_due || uploadInFlightRef.current) return;
    if (
      pendingPhotoRef.current &&
      state.error?.code === "IDENTITY_CAPTURE_NOT_DUE"
    ) return;
    captureStartedRef.current = false;
    clearPendingPhoto();
    if (state.phase !== "idle" && state.phase !== "uploaded") {
      reportState({ phase: "idle" });
    }
  }, [capture_due, clearPendingPhoto, mode, reportState, state.error?.code, state.phase]);

  const uploadPendingPhoto = useCallback(async () => {
    const photo = pendingPhotoRef.current;
    if (!photo || uploadInFlightRef.current) return;

    if (
      mode !== "capture" ||
      !capture_due ||
      typeof session_id !== "number" ||
      !Number.isInteger(session_id) ||
      session_id < 1 ||
      typeof session_token !== "string" ||
      !session_token ||
      typeof client_id !== "string" ||
      !client_id ||
      typeof lease_generation !== "number" ||
      !Number.isInteger(lease_generation) ||
      lease_generation < 1
    ) {
      const error: ExamIdentityCaptureError = {
        operation: "upload",
        message: "The assessment session is missing valid capture credentials.",
      };
      reportState({ phase: "error", error });
      return;
    }

    const generation = generationRef.current;
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    uploadInFlightRef.current = true;
    deleteAfterUploadRef.current = false;
    reportState({ phase: "uploading" });

    try {
      const response = (await uploadAssessmentIdentityCapture(session_id, {
        session_token,
        client_id,
        lease_generation,
        image: photo,
      }, controller.signal)) as IdentityCaptureUploadResponse;
      if (
        response?.captured !== true ||
        typeof response.idempotent !== "boolean" ||
        response.capture_state !== "uploaded" ||
        typeof response.capture_review_status !== "string" ||
        (response.captured_at !== undefined &&
          response.captured_at !== null &&
          typeof response.captured_at !== "string")
      ) {
        throw new Error("The server did not confirm the identity capture upload.");
      }
      clearPendingPhoto(photo.uri);
      if (deleteAfterUploadRef.current) {
        deleteTemporaryPhoto(photo.uri);
        deleteAfterUploadRef.current = false;
      }
      if (mountedRef.current && generationRef.current === generation) {
        captureStartedRef.current = true;
        reportState({ phase: "uploaded" });
        onUploaded?.(response);
      }
    } catch (cause) {
      const error = toCaptureError(
        "upload",
        cause,
        "Unable to upload the exam identity photo.",
      );
      if (error.status === 413 || error.status === 415) {
        clearPendingPhoto(photo.uri);
        captureStartedRef.current = false;
        captureQualityIndexRef.current = Math.min(
          captureQualityIndexRef.current + 1,
          CAPTURE_QUALITIES.length - 1,
        );
      }
      if (deleteAfterUploadRef.current) {
        clearPendingPhoto(photo.uri);
        deleteAfterUploadRef.current = false;
      }
      if (mountedRef.current && generationRef.current === generation) {
        reportState({ phase: "error", error });
      }
    } finally {
      uploadInFlightRef.current = false;
      if (uploadControllerRef.current === controller) uploadControllerRef.current = null;
      if (
        mountedRef.current &&
        generationRef.current !== generation &&
        mode === "capture" &&
        capture_due
      ) {
        captureStartedRef.current = false;
        reportState({ phase: "waiting_for_camera" });
      }
    }
  }, [
    capture_due,
    clearPendingPhoto,
    client_id,
    lease_generation,
    mode,
    onUploaded,
    reportState,
    session_id,
    session_token,
  ]);

  const captureAndUpload = useCallback(async () => {
    if (
      mode !== "capture" ||
      !capture_due ||
      !cameraReady ||
      uploadInFlightRef.current ||
      !cameraRef.current ||
      captureStartedRef.current
    ) {
      return;
    }
    if (
      typeof session_id !== "number" ||
      !Number.isInteger(session_id) ||
      session_id < 1 ||
      typeof session_token !== "string" ||
      !session_token ||
      typeof client_id !== "string" ||
      !client_id ||
      typeof lease_generation !== "number" ||
      !Number.isInteger(lease_generation) ||
      lease_generation < 1
    ) {
      const error: ExamIdentityCaptureError = {
        operation: "upload",
        message: "The assessment session is missing valid capture credentials.",
      };
      reportState({ phase: "error", error });
      return;
    }

    const generation = generationRef.current;
    captureStartedRef.current = true;
    reportState({ phase: "capturing" });

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: CAPTURE_QUALITIES[captureQualityIndexRef.current],
        base64: false,
        exif: false,
      });
      if (!picture?.uri) throw new Error("The camera did not return an image file.");
      if (generationRef.current !== generation) {
        deleteTemporaryPhoto(picture.uri);
        return;
      }

      let size: number | undefined;
      try {
        size = new File(picture.uri).info().size;
      } catch {
        deleteTemporaryPhoto(picture.uri);
        throw Object.assign(
          new Error("The captured image file could not be read."),
          { captureOperation: "file" },
        );
      }
      if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
        deleteTemporaryPhoto(picture.uri);
        throw Object.assign(
          new Error("The captured image file could not be read."),
          { captureOperation: "file" },
        );
      }
      if (size > MAX_CAPTURE_BYTES) {
        deleteTemporaryPhoto(picture.uri);
        captureStartedRef.current = false;
        captureQualityIndexRef.current = Math.min(
          captureQualityIndexRef.current + 1,
          CAPTURE_QUALITIES.length - 1,
        );
        throw Object.assign(
          new Error("The captured image exceeded the 5 MiB upload limit. Retry to capture a smaller image."),
          { captureOperation: "file" },
        );
      }

      pendingPhotoRef.current = {
        uri: picture.uri,
        name: `exam-identity-${session_id}-${Date.now()}.jpg`,
        type: "image/jpeg",
      };
      await uploadPendingPhoto();
    } catch (cause) {
      const operation =
        (cause as any)?.captureOperation === "file" ? "file" : "camera";
      const error = toCaptureError(
        operation,
        cause,
        "Unable to capture an exam identity photo.",
      );
      if (generationRef.current === generation && mountedRef.current) {
        captureStartedRef.current = false;
        reportState({ phase: "error", error });
      }
    }
  }, [
    cameraReady,
    capture_due,
    client_id,
    lease_generation,
    mode,
    reportState,
    session_id,
    session_token,
    uploadPendingPhoto,
  ]);

  useEffect(() => {
    if (mode === "preflight") {
      if (!permission?.granted) {
        if (permission?.canAskAgain === false && state.phase !== "error") {
          reportState({
            phase: "error",
            error: {
              operation: "permission",
              message:
                "Camera access is blocked. Enable camera access in the device settings to continue.",
            },
          });
        }
        return;
      }
      if (!cameraReady) {
        if (state.phase === "idle" || state.phase === "permission_required") {
          reportState({ phase: "waiting_for_camera" });
        }
        return;
      }
      if (state.phase === "waiting_for_camera" || state.phase === "permission_required") {
        reportState({ phase: "preview_ready" });
        onReady?.();
      }
      return;
    }
    if (!capture_due) return;
    if (!permission?.granted) {
      if (permission?.canAskAgain === false && state.phase !== "error") {
        reportState({
          phase: "error",
          error: {
            operation: "permission",
            message:
              "Camera access is blocked. Enable camera access in the device settings to continue.",
          },
        });
      } else if (state.phase === "idle") {
        reportState({ phase: "permission_required" });
      }
      return;
    }
    if (!cameraReady) {
      if (state.phase === "idle" || state.phase === "permission_required") {
        reportState({ phase: "waiting_for_camera" });
      }
      return;
    }
    if (state.phase === "waiting_for_camera" || state.phase === "permission_required") {
      void captureAndUpload();
    }
  }, [
    cameraReady,
    captureAndUpload,
    capture_due,
    mode,
    onReady,
    permission?.canAskAgain,
    permission?.granted,
    reportState,
    state.phase,
  ]);

  const handlePermissionRequest = useCallback(async () => {
    reportState({ phase: "permission_required" });
    try {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        const error: ExamIdentityCaptureError = {
          operation: "permission",
          message: nextPermission.canAskAgain
            ? "Camera access is required to complete this exam identity check."
            : "Camera access is blocked. Enable camera access in the device settings to continue.",
        };
        reportState({ phase: "error", error });
      } else {
        reportState({ phase: "waiting_for_camera" });
      }
    } catch (cause) {
      const error = toCaptureError(
        "permission",
        cause,
        "Unable to request camera access.",
      );
      reportState({ phase: "error", error });
    }
  }, [reportState, requestPermission]);

  const handleRetry = useCallback(() => {
    if (pendingPhotoRef.current && mode === "capture" && onReconcileCapture) {
      if (reconcileInFlightRef.current) return;
      reconcileInFlightRef.current = true;
      const generation = generationRef.current;
      reportState({ phase: "uploading" });
      void onReconcileCapture()
        .then(async (captureState) => {
          if (!mountedRef.current || generationRef.current !== generation) return;
          if (captureState === "uploaded") {
            clearPendingPhoto();
            captureStartedRef.current = true;
            reportState({ phase: "uploaded" });
            onUploaded?.({ captured: true, idempotent: true, capture_state: "uploaded" });
            return;
          }
          if (captureState === "due") {
            await uploadPendingPhoto();
            return;
          }
          reportState({
            phase: "error",
            error: {
              operation: "upload",
              message: captureState === "missed"
                ? "The identity capture window has ended. Reopen the exam to confirm its status."
                : "The server has not requested the identity photo yet. Keep the exam open and retry when capture is due.",
              code: captureState === "missed" ? "IDENTITY_CAPTURE_MISSED" : "IDENTITY_CAPTURE_NOT_DUE",
            },
          });
        })
        .catch((cause) => {
          if (mountedRef.current && generationRef.current === generation) {
            reportState({
              phase: "error",
              error: toCaptureError("upload", cause, "Unable to verify exam capture status."),
            });
          }
        })
        .finally(() => {
          reconcileInFlightRef.current = false;
        });
      return;
    }
    if (pendingPhotoRef.current) {
      void uploadPendingPhoto();
      return;
    }
    captureStartedRef.current = false;
    if (permission?.granted) {
      if (mode === "preflight") {
        if (cameraReady) {
          reportState({ phase: "preview_ready" });
          onReady?.();
        } else {
          reportState({ phase: "waiting_for_camera" });
          setCameraEpoch((epoch) => epoch + 1);
        }
      } else if (cameraReady) {
        void captureAndUpload();
      } else {
        reportState({ phase: "waiting_for_camera" });
        setCameraEpoch((epoch) => epoch + 1);
      }
    } else if (permission?.canAskAgain) {
      void handlePermissionRequest();
    }
  }, [
    cameraReady,
    captureAndUpload,
    handlePermissionRequest,
    mode,
    onReady,
    permission?.canAskAgain,
    permission?.granted,
    reportState,
    uploadPendingPhoto,
    clearPendingPhoto,
    onReconcileCapture,
    onUploaded,
  ]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const wasConnected = connectedRef.current;
      connectedRef.current = networkState.isConnected ?? null;
      if (
        networkState.isConnected === true &&
        wasConnected === false &&
        mode === "capture" &&
        state.phase === "error" &&
        pendingPhotoRef.current
      ) {
        handleRetry();
      }
    });
    return unsubscribe;
  }, [handleRetry, mode, state.phase]);

  useEffect(() => {
    if (
      mode === "capture" &&
      capture_due &&
      state.error?.code === "IDENTITY_CAPTURE_NOT_DUE" &&
      pendingPhotoRef.current
    ) {
      handleRetry();
    }
  }, [capture_due, handleRetry, mode, state.error?.code]);

  if (
    mode === "capture" &&
    ((!capture_due &&
      !(pendingPhotoRef.current && state.error?.code === "IDENTITY_CAPTURE_NOT_DUE")) ||
      state.phase === "uploaded")
  ) return null;

  return (
    <View style={styles.container}>
      {!permission?.granted ? (
        <View style={styles.notice}>
          <Text style={styles.title}>Identity check required</Text>
          <Text style={styles.message}>
            {state.error?.message ??
              "Allow camera access to take the one-time identity photo requested for this exam."}
          </Text>
          {permission?.canAskAgain !== false ? (
            <Pressable
              accessibilityRole="button"
              onPress={handlePermissionRequest}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Enable camera</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openSettings()}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Open device settings</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <CameraView
            key={`${captureKey}:${cameraEpoch}`}
            ref={cameraRef}
            facing="front"
            mode="picture"
            onCameraReady={() => {
              if (activeKeyRef.current === captureKey) setCameraReady(true);
            }}
            onMountError={(event) => {
              if (activeKeyRef.current !== captureKey) return;
              const error = toCaptureError(
                "camera",
                event,
                "Unable to start the front camera.",
              );
              setCameraReady(false);
              captureStartedRef.current = false;
              reportState({ phase: "error", error });
            }}
            style={styles.camera}
          />
          <View style={styles.status}>
            {state.phase === "capturing" || state.phase === "uploading" ? (
              <ActivityIndicator accessibilityLabel="Uploading identity photo" />
            ) : null}
            <Text style={styles.message}>
            {state.phase === "preview_ready"
              ? "Camera is ready. Preview only; no photo is sent here."
              : state.phase === "waiting_for_camera"
                ? "Starting the camera…"
                : state.phase === "capturing"
                  ? "Capturing identity photo…"
                  : state.phase === "uploading"
                    ? "Uploading identity photo…"
                    : state.error?.message ?? "Camera is ready for the identity check."}
            </Text>
            {state.phase === "error" ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleRetry}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {pendingPhotoRef.current ? "Retry upload" : "Retry identity check"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#101118",
    borderRadius: 12,
    overflow: "hidden",
    padding: 12,
  },
  camera: {
    alignSelf: "center",
    borderRadius: 8,
    height: 260,
    overflow: "hidden",
    width: "100%",
  },
  notice: {
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  status: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    color: "#e9e9ef",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#6d4c9b",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
