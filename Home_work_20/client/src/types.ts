export interface StoredEvent {
  id: string;
  room: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface UsersPayload {
  room: string;
  users: string[];
}

export interface Ack {
  ok: boolean;
  error?: string;
}

export interface EventsAck {
  ok: boolean;
  events?: StoredEvent[];
  error?: string;
}
