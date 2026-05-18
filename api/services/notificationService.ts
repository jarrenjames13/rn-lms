import EventSource from 'react-native-sse';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/utils/constants';

export interface NotificationData {
  notification_id: number;
  type: string;
  timestamp: string;
  [key: string]: any;
}

type NotificationCallback = (data: NotificationData) => void;

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners: Set<NotificationCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect() {
    if (this.eventSource) return;

    const token = await SecureStore.getItemAsync('access_token');
    if (!token) throw new Error('No access token');

    this.eventSource = new EventSource(`${BASE_URL}/notifications/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    this.eventSource.addEventListener('open', () => {
      console.log('[SSE] Connected');
      this.reconnectAttempts = 0;
    });

    this.eventSource.addEventListener('notification', (event) => {
      try {
        const data: NotificationData = JSON.parse(event.data);
        this.listeners.forEach((callback) => callback(data));
      } catch (error) {
        console.error('[SSE] Parse error:', error);
      }
    });

    this.eventSource.addEventListener('error', (error) => {
      console.error('[SSE] Error:', error);
      this.handleReconnect();
    });

    this.eventSource.addEventListener('close', () => {
      console.log('[SSE] Closed');
      this.eventSource = null;
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SSE] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`[SSE] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.disconnect();
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  subscribe(callback: NotificationCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const notificationService = new NotificationService();
