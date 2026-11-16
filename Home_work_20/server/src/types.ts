export interface StoredEvent {
  id: string;
  room: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface JoinPayload {
  room: string;
  user: string;
}

export interface NewEventPayload {
  room: string;
  message: string;
}

export interface UsersPayload {
  room: string;
  users: string[];
}

export type Ack = { ok: true } | { ok: false; error: string };

export interface EventsAck {
  ok: boolean;
  events?: StoredEvent[];
  error?: string;
}
