import { apiCall } from './api';

type EventName =
  | 'onboarding_completed'
  | 'daily_checkin_done'
  | 'workout_started'
  | 'workout_completed'
  | 'workout_skipped'
  | 'meal_logged'
  | 'snap_eat_used'
  | 'socio_message_sent'
  | 'mini_mission_completed'
  | 'streak_maintained'
  | 'weekly_retro_viewed'
  | 'socio_score_viewed';

interface QueuedEvent {
  event: EventName;
  properties: Record<string, unknown>;
  occurred_at: string;
}

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH = 20;

class Analytics {
  private queue: QueuedEvent[] = [];
  private getToken: (() => Promise<string | null>) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  init(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  track(event: EventName, properties: Record<string, unknown> = {}) {
    this.queue.push({ event, properties, occurred_at: new Date().toISOString() });
    if (this.queue.length >= MAX_BATCH) this.flush();
  }

  async flush() {
    if (this.queue.length === 0 || !this.getToken) return;
    const batch = this.queue.splice(0, MAX_BATCH);
    try {
      const token = await this.getToken();
      if (!token) {
        // Lost session — drop events silently
        return;
      }
      await apiCall('/api/track', token, {
        method: 'POST',
        body: JSON.stringify({ events: batch }),
      });
    } catch {
      // Silent fail — analytics never breaks the app
    }
  }
}

export const analytics = new Analytics();
