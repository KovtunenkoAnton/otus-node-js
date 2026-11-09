import type { StoredEvent } from './types.js';

const MAX_EVENTS_PER_ROOM = 500;

export class EventStore {
  private byRoom = new Map<string, StoredEvent[]>();

  add(event: StoredEvent): void {
    const list = this.byRoom.get(event.room) ?? [];
    list.push(event);
    if (list.length > MAX_EVENTS_PER_ROOM) {
      list.splice(0, list.length - MAX_EVENTS_PER_ROOM);
    }
    this.byRoom.set(event.room, list);
  }

  list(room: string): StoredEvent[] {
    return this.byRoom.get(room) || [];
  }
}
