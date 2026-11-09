# Home_work_20 — WebSocket-сервер (socket.io)

Минимально достаточный WebSocket-сервер на Node.js + socket.io: клиенты публикуют
события в комнату, получают события других участников в реальном времени, видят,
кто сейчас онлайн в комнате, и подтягивают историю последних событий при подключении.

## Стек

- **Node.js + socket.io** — WebSocket-сервер, комнаты, рассылка только участникам
- **Express 5** — отдаёт собранного клиента (статика + SPA-fallback) на том же порту
- **TypeScript (ESM)** — и сервер, и клиент
- **React + Vite + socket.io-client** — минимальный фронтенд

Хранилище — **in-memory `Map`** (без БД): переживает только жизнь процесса, что и
требует ТЗ.

## Архитектура

Один HTTP-сервер: Express отдаёт статику, socket.io (прицеплен к тому же
`http.Server`) обслуживает `/socket.io`. Комната — это встроенная комната socket.io:
клиент `socket.join(room)`, рассылка `io.to(room)`.

```
   Браузер (React)                         Node-процесс
 ┌────────────────────────┐            ┌───────────────────────────────────┐
 │  socket.io-client      │  WS/HTTP   │  http.Server (порт 3000)          │
 │  io() → тот же origin  │───────────▶│  ├─ Express:  GET * → client/dist │
 │                        │            │  └─ socket.io: /socket.io         │
 │  room:join / room:leave│            │        ├─ room:join/leave         │
 │  event:new  / event:list│           │        ├─ event:new  (store.add)  │
 │        ▲                │            │        ├─ event:list (store.list) │
 │        │ event:new      │◀───────────│        └─ user:list (broadcast)   │
 │        │ user:list      │  broadcast └───────────────────────────────────┘
 └────────────────────────┘            EventStore: Map<room, StoredEvent[]>
```

Комната — **одна на сокет**: при `room:join` в новую комнату сокет сам покидает
предыдущую. `event:new` и `event:list` работают с «подключённой» комнатой сокета;
если в payload приходит другая комната — сервер отклоняет запрос (так гарантируется
рассылка только участникам комнаты).

## Протокол событий

Все события клиент→сервер отвечают через **ack-callback** socket.io
`{ ok: true } | { ok: false, error }`.

| Направление | Событие | Payload | Что делает |
|---|---|---|---|
| C → S | `room:join` | `{ room, user }` | Подключить сокет к комнате, запомнить `user` |
| C → S | `room:leave` | `{}` | Покинуть текущую комнату |
| C → S | `event:new` | `{ room, message }` | Сохранить и **рассылать** `event:new` всем участникам комнаты |
| C → S | `event:list` | `{ room, limit? }` | Ответить `events` — последние N событий комнаты (N ≤ 200, по умолчанию 50) |
| S → C | `event:new` | `StoredEvent` | Новое событие (broadcast в комнату) |
| S → C | `user:list` | `{ room, users: string[] }` | Текущий состав онлайн-участников; шлётся при каждом изменении (join/leave/disconnect) |

`StoredEvent` = `{ id, room, author, message, timestamp }`:

- `id` — `crypto.randomUUID()`;
- `timestamp` — ISO-8601 (`new Date().toISOString()`);
- `author` — имя, заданное при `room:join`.

## Валидация

Сервер не доверяет клиенту и проверяет каждый вход:

- `room`, `user` — непустые строки ≤ 40 символов (иначе `room:join` отклонён);
- `message` — непустая строка ≤ 500 символов;
- `event:new`/`event:list` — только для комнаты, к которой сокет реально подключён
  (`socket.rooms.has(room)`); чужая комната в payload → отклонение;
- `limit` — целое > 0, иначе 50; в любом случае ≤ 200.

## Хранилище

`EventStore` — `Map<string, StoredEvent[]>` (ключ — комната, значение — события по
возрасту). `add` дописывает в хвост и обрезает хвост до 500 записей на комнату;
`list(room, limit)` возвращает последние `limit`. Никакого IO — чистая память.

## Структура проекта

```
Home_work_20/
├── server/                 # Node + Express + socket.io (TypeScript, ESM)
│   └── src/
│       ├── main.ts         # http-сервер, Express-статика, запуск socket.io
│       ├── events.ts       # обработчики room:*, event:*, presence, валидация
│       ├── store.ts        # EventStore (in-memory Map)
│       └── types.ts        # контракты (StoredEvent, payload, ack)
├── client/                 # React + Vite + socket.io-client
│   └── src/
│       ├── main.tsx        # точка входа React
│       ├── App.tsx         # UI: имя/комната/сообщение, список событий и участников
│       ├── socket.ts       # единственный экземпляр socket.io-client
│       └── types.ts        # те же контракты, что на сервере
└── README.md
```

## Запуск

Два режима. Оба требуют один сервер и один клиент.

### Dev (Vite hot-reload, 2 терминала)

```bash
# терминал 1 — сервер
cd server
npm install
npm run dev            # tsx watch src/main.ts → http://localhost:3000

# терминал 2 — клиент
cd client
npm install
npm run dev            # Vite → http://localhost:5173 (прокси /socket.io → :3000)
```

Откройте **http://localhost:5173**. Vite проксирует `/socket.io` на сервер, поэтому
клиенту не нужно знать адрес бэкенда.

### Prod (одна команда, 1 терминал)

```bash
# 1. Собрать клиента
cd client && npm install && npm run build     # → client/dist

# 2. Собрать и запустить сервер
cd ../server && npm install && npm run build && npm start
```

Откройте **http://localhost:3000** — Express отдаёт `client/dist` + socket.io.

## Сценарии проверки

Две вкладки браузера = два независимых сокета.

1. **Онлайн-состав.** Вкладка A: имя `alice`, комната `general`, «Подключиться».
   Вкладка B: имя `bob`, комната `general`. В обеих вкладках в блоке «В комнате»
   появляются `alice` и `bob` (приходит `user:list`).
2. **Реальное время.** В A отправьте сообщение — оно мгновенно появляется в B
   (и обратно) с автором и временем.
3. **История.** Перезагрузите вкладку B и заново подключитесь в `general` — при
   старте запрашивается `event:list`, и прошлые сообщения восстанавливаются.
4. **Изоляция комнат.** Вкладка C: комната `other`. Сообщения из `general` в C не
   приходят и наоборот.
5. **Presence на отключение.** Закройте вкладку B — в A и C (в их комнатах) `bob`
   исчезает из списка (событие `disconnect` → новый `user:list`).
6. **Валидация.** Пустое имя/комната при подключении — кнопка не сработает
   (клиент) + сервер отклонит. Пустое сообщение — ack `{ ok:false, error }`.

## Команды

| Где | Команда | Назначение |
|---|---|---|
| server | `npm run dev` | запуск с hot-reload (tsx watch) |
| server | `npm run build` | компиляция TS → `dist/` |
| server | `npm start` | запуск собранного `dist/` |
| server | `npm run lint` / `npm run format` | eslint / prettier |
| client | `npm run dev` | Vite dev-сервер (:5173, с прокси) |
| client | `npm run build` | type-check + сборка → `dist/` |
| client | `npm run format` | prettier |
