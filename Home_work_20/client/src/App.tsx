import { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import type { Ack, EventsAck, StoredEvent, UsersPayload } from './types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('Самая первая комната');
  const [message, setMessage] = useState('');
  const [joined, setJoined] = useState(false);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState('');

  const joinedRef = useRef(joined);
  joinedRef.current = joined;
  const nameRef = useRef(name);
  nameRef.current = name;
  const roomRef = useRef(room);
  roomRef.current = room;

  const loadHistory = (r: string) => {
    socket.emit('event:list', { room: r, limit: 50 }, (res: EventsAck) => {
      if (res.ok) setEvents(res.events ?? []);
    });
  };

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      if (joinedRef.current) {
        socket.emit(
          'room:join',
          { room: roomRef.current, user: nameRef.current },
          (ack: Ack) => {
            if (ack.ok) loadHistory(roomRef.current.trim());
          },
        );
      }
    };
    const onDisconnect = () => setConnected(false);
    const onEvent = (ev: StoredEvent) => setEvents((prev) => [...prev, ev]);
    const onUsers = (u: UsersPayload) => setUsers(u.users);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('event:new', onEvent);
    socket.on('user:list', onUsers);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('event:new', onEvent);
      socket.off('user:list', onUsers);
    };
  }, []);

  const join = () => {
    if (!name || !room) {
      setError('Укажите имя и комнату');
      return;
    }

    setError('');
    socket.emit('room:join', { room, user: name }, (ack: Ack) => {
      if (!ack.ok) {
        setError(ack.error ?? 'Не удалось подключиться');
        return;
      }
      setJoined(true);
      setEvents([]);
      loadHistory(room);
    });
  };

  const leave = () => {
    if (joined) socket.emit('room:leave', {});
    setJoined(false);
    setEvents([]);
    setUsers([]);
    setError('');
  };

  const send = () => {
    if (!message || !joined) return;
    socket.emit('event:new', { room: room.trim(), message }, (ack: Ack) => {
      if (!ack.ok) setError(ack.error ?? 'Не удалось отправить');
    });
    setMessage('');
  };

  return (
    <div className="wrap">
      <header className="top">
        <h1>Уютный чатик</h1>
        <span
          className={connected ? 'dot on' : 'dot'}
          title={connected ? 'подключено' : 'нет соединения'}
        />
      </header>

      {!connected && (
        <div className="banner">
          Нет соединения с сервером. Перезапустите сервер.
        </div>
      )}

      {!joined ? (
        <section className="card">
          <h2>Подключение</h2>
          <label>
            Имя
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Вениамин"
              maxLength={40}
            />
          </label>
          <label>
            Комната
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Название комнаты"
              maxLength={40}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" onClick={join} disabled={!connected}>
            Подключиться
          </button>
        </section>
      ) : (
        <>
          <section className="card row">
            <div>
              <h2>Комната «{room}»</h2>
              <p className="muted">Вы: {name}</p>
            </div>
            <button onClick={leave}>Выйти</button>
          </section>

          <div className="grid">
            <section className="card">
              <h2>События</h2>
              <div className="events">
                {events.length === 0 && (
                  <p className="muted">Пока нет событий</p>
                )}
                {events.map((ev) => (
                  <div key={ev.id} className="event">
                    <span className="who">{ev.author}</span>
                    <span className="text">{ev.message}</span>
                    <span className="time">{formatTime(ev.timestamp)}</span>
                  </div>
                ))}
              </div>
              <div className="composer">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Сообщение…"
                  maxLength={500}
                />
                <button className="primary" onClick={send}>
                  Отправить
                </button>
              </div>
              {error && <div className="error">{error}</div>}
            </section>

            <aside className="card">
              <h2>В комнате ({users.length})</h2>
              <ul className="users">
                {users.map((u) => (
                  <li key={u}>{u}</li>
                ))}
                {users.length === 0 && <p className="muted">Никого нет</p>}
              </ul>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
