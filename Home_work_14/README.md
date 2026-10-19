# Home work 14 — REST API на NestJS + TypeORM + PostgreSQL

CRUD API для задач (tasks) с тегами (tags), комментариями (comments) и пользователями (users).

## Стек

- **NestJS 12** — фреймворк для бэкенда
- **TypeORM + PostgreSQL** — ORM и СУБД
- **class-validator** — валидация входящих данных (глобальный `ValidationPipe`)

## Требования

- Node.js 20+
- PostgreSQL (локальный, Docker или любой другой доступный)

## Запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
```

При необходимости отредактируйте `.env` под ваше окружение (хост, порт, логин/пароль и имя БД). Файл `.env` не коммитится (он в `.gitignore`).

### 3. Создание базы данных

База данных должна существовать; таблицы создаются автоматически (`synchronize: true`).

```bash
createdb home_work_14
```

или создайте базу с именем `home_work_14` в DBeaver / `psql`.

### 4. Запуск

```bash
# development (watch-режим)
npm run start:dev

# production
npm run build
npm run start:prod
```

Сервер поднимется на `http://localhost:3000` (порт настраивается в `.env`).

## Переменные окружения

| Переменная    | Описание               | По умолчанию  |
| ------------- | ---------------------- | ------------- |
| `PORT`        | Порт HTTP-сервера      | `3000`        |
| `DB_HOST`     | Хост PostgreSQL        | `localhost`   |
| `DB_PORT`     | Порт PostgreSQL        | `5432`        |
| `DB_USER`     | Пользователь БД        | `postgres`    |
| `DB_PASSWORD` | Пароль пользователя БД | `1234567`     |
| `DB_NAME`     | Имя базы данных        | `home_work_14`|

## API

### Tasks (`/tasks`)

- `GET /tasks` — список задач. Фильтры: `?tag=`, `?status=`, `?author=`, `?q=` (поиск по названию и описанию). Пагинация: `?page=&limit=`. Ответ: `{ items, total, page, limit }`.
- `GET /tasks/:id` — задача по id.
- `POST /tasks` — создание задачи.
- `PUT /tasks/:id` — обновление (автор задачи или admin).
- `DELETE /tasks/:id` — удаление (автор задачи или admin).

### Tags (`/tags`)

- `GET /tags` — список тегов.
- `POST /tags` — создание тега (admin).
- `PUT /tags/:id` — обновление тега (admin).
- `DELETE /tags/:id` — удаление тега (admin).

### Comments (`/comments`)

- `GET /comments` — список видимых комментариев.
- `POST /comments` — добавление комментария к задаче.
- `PUT /comments/:id` — обновление собственного комментария.
- `DELETE /comments/:id` — удаление собственного комментария.
- Скрытие/показ комментария — автор задачи или admin.

### Users (`/users`)

- `GET /users` — список пользователей.
- `POST /users` — регистрация пользователя.
- `PUT /users/:id` — изменение роли/статуса (admin).

## Формат ошибок

Все ошибки возвращаются в едином JSON-формате:

```json
{ "error": { "message": "...", "details": ["..."] } }
```

- `400` — ошибка валидации (`details` — список проблем по полям);
- `404` — ресурс не найден (или неизвестный маршрут);
- `500` — внутренняя ошибка сервера.

## Полезные команды

```bash
npm run lint       # линтинг (oxlint)
npm run test       # unit-тесты (vitest)
npm run test:cov   # тесты с покрытием
npm run format     # форматирование (prettier)
```
