import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import type { EventStore } from './store.js';
import type {
  Ack,
  EventsAck,
  JoinPayload,
  NewEventPayload,
  StoredEvent,
  UsersPayload,
} from './types.js';

export function registerEvents(io: Server, store: EventStore) {
  const roomUsers = (room: string): string[] => {
    const users = new Set<string>();
    for (const socket of io.sockets.sockets.values()) {
      if (socket.rooms.has(room) && typeof socket.data.user === 'string') {
        users.add(socket.data.user as string);
      }
    }
    return [...users].sort((a, b) => a.localeCompare(b));
  };

  const broadcastUsers = (room: string): void => {
    const payload: UsersPayload = { room, users: roomUsers(room) };
    io.to(room).emit('user:list', payload);
  };

  io.on('connection', (socket: Socket) => {
    socket.on('room:join', (raw: unknown, ack?: (res: Ack) => void) => {
      const p = raw as Partial<JoinPayload> | undefined;

      const room = p?.room;
      const user = p?.user;

      if (!room || !user) return;

      const prev: string = socket.data.room;

      if (prev && prev !== room) {
        socket.leave(prev);
        broadcastUsers(prev);
      }

      socket.data.room = room;
      socket.data.user = user;
      socket.join(room);
      broadcastUsers(room);
      ack?.({ ok: true });
    });

    socket.on('room:leave', (_raw: unknown, ack?: (res: Ack) => void) => {
      const room = socket.data.room;

      if (room) {
        socket.leave(room);
        broadcastUsers(room);
      }
      socket.data.room = undefined;
      socket.data.user = undefined;
      ack?.({ ok: true });
    });

    socket.on('event:new', (raw: unknown, ack?: (res: Ack) => void) => {
      const p = raw as Partial<NewEventPayload> | undefined;
      const message = p?.message;
      const room = socket.data.room;
      
      const event: StoredEvent = {
        id: randomUUID(),
        room,
        author: socket.data.user,
        message: message || "",
        timestamp: new Date().toISOString(),
      };

      store.add(event);
      io.to(room).emit('event:new', event);
      ack?.({ ok: true });
    });

    socket.on('event:list', (raw: unknown, ack?: (res: EventsAck) => void) => {
      const room = socket.data.room;

      ack?.({ ok: true, events: store.list(room) });
    });

    socket.on('disconnect', () => {
      const room = socket.data.room;
      if (room) broadcastUsers(room);
    });
  });
}
