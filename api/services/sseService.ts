import EventSource from 'react-native-sse';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/utils/constants';

type Listener = (data: any) => void;

export interface NotificationData {
  notification_id: number;
  type: 'reply' | 'reaction';
  comment_id: number;
  actor_id: number;
  actor_name: string;
  reaction_type?: string;
  parent_comment_id?: number;
  instance_id?: number;
  course_id?: number;
  module_id?: number;
  timestamp: string;
  is_read?: boolean;
}

export const COMMENT_EVENTS = [
  'new_comment', 'new_reply', 'comment_updated', 'comment_deleted',
  'comment_hard_deleted', 'reaction_added', 'reaction_removed', 'comment_status_changed',
] as const;

export type CommentEventType = typeof COMMENT_EVENTS[number];

class SSEService {
  private es: EventSource | null = null;
  private notifListeners = new Set<Listener>();
  private commentListeners = new Map<CommentEventType, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private instanceId?: number;
  private moduleId?: number;

  async connect(instanceId?: number, moduleId?: number) {
    this.instanceId = instanceId;
    this.moduleId = moduleId;
    if (this.es) return;

    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return;

    const params = new URLSearchParams();
    if (instanceId != null) params.set('instance_id', String(instanceId));
    if (moduleId != null) params.set('module_id', String(moduleId));
    const qs = params.toString();

    this.es = new EventSource(`${BASE_URL}/events${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    this.es.addEventListener('open', () => { this.attempts = 0; });

    (this.es as any).addEventListener('notification', (e: any) => {
      try { this.notifListeners.forEach(cb => cb(JSON.parse(e.data))); } catch {}
    });

    for (const type of COMMENT_EVENTS) {
      (this.es as any).addEventListener(type, (e: any) => {
        try {
          const data = JSON.parse(e.data);
          this.commentListeners.get(type)?.forEach(cb => cb(data));
        } catch {}
      });
    }

    this.es.addEventListener('error', () => {
      this.es?.close();
      this.es = null;
      if (this.attempts < 5) {
        const delay = Math.min(1000 * 2 ** this.attempts++, 30_000);
        this.reconnectTimer = setTimeout(() => this.connect(this.instanceId, this.moduleId), delay);
      }
    });
  }

  /** Reconnect with new comment channel params. No-op if params unchanged and connected. */
  async reconnectWith(instanceId?: number, moduleId?: number) {
    if (this.instanceId === instanceId && this.moduleId === moduleId && this.es) return;
    this.disconnect();
    await this.connect(instanceId, moduleId);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.es?.close();
    this.es = null;
    this.attempts = 0;
  }

  onNotification(cb: Listener): () => void {
    this.notifListeners.add(cb);
    return () => this.notifListeners.delete(cb);
  }

  onCommentEvent(type: CommentEventType, cb: Listener): () => void {
    if (!this.commentListeners.has(type)) this.commentListeners.set(type, new Set());
    this.commentListeners.get(type)!.add(cb);
    return () => this.commentListeners.get(type)?.delete(cb);
  }
}

export const sseService = new SSEService();
