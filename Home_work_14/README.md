# Home work 14 — REST API на NestJS + TypeORM + PostgreSQL

CRUD API для задач (tasks) с тегами (tags), комментариями (comments) и пользователями (users).
Авторизация по JWT, RBAC (user / author / admin), helmet + CORS.

## Стек

- **NestJS 12** — фреймворк для бэкенда
- **TypeORM + PostgreSQL** — ORM и СУБД
- **class-validator** — валидация входящих данных (глобальный `ValidationPipe`)
- **jsonwebtoken** — JWT access-токены (Bearer)
- **bcryptjs** — хэширование паролей (bcrypt, чистый JS, без нативной сборки)
- **helmet** — security-заголовки + `enableCors` с белым списком origin

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

При необходимости отредактируйте `.env` под ваше окружение (хост, порт, логин/пароль и имя БД, JWT-секрет, CORS origin). Файл `.env` не коммитится (он в `.gitignore`).

### 3. Создание базы данных

База данных должна существовать; таблицы создаются автоматически (`synchronize: true`).

```bash
createdb home_work_14
```

или создайте базу с именем `home_work_14` в DBeaver / `psql`.

### 4. Первый admin

Регистрация (`POST /auth/signup`) всегда создаёт пользователя с ролью `user`, поэтому первого admin создаём напрямую в БД (например, в DBeaver). Хэш ниже соответствует паролю `admin123`:

```sql
INSERT INTO users (name, email, "passwordHash", role, status)
VALUES ('Admin', 'admin@example.com', '$2b$10$PtdVFKt7fFRQ.8UOp6kerelD0m.ZQjP9izEtKJbpz0cR3CopsEzlK', 'admin', 'active');
```

### 5. Запуск

```bash
npm run start:dev      # development (watch-режим)
npm run start:prod     # production (сначала npm run build)
```

Сервер поднимется на `http://localhost:3000` (порт настраивается в `.env`).

> **Замечание про Nest CLI:** тулчейн Nest 12 CLI (`@nestjs/schematics`, `@angular-devkit/*`) требует
> Node `^22.22.3 || ^24.15.0 || >=26` (npm предупреждает об этом как `EBADENGINE`). На Node 20
> `nest build` / `nest start` падают с `ERR_REQUIRE_CYCLE_MODULE`. Два варианта:
>
> 1. обновить Node до 22.22+ / 24.15+ (например, через nvm) — CLI заработает штатно;
> 2. собрать и запустить без CLI:
>
> ```bash
> npx tsc -p tsconfig.build.json && node dist/main.js
> ```

## Переменные окружения

| Переменная       | Описание                                        | По умолчанию         |
| ---------------- | ----------------------------------------------- | -------------------- |
| `PORT`           | Порт HTTP-сервера                               | `3000`               |
| `DB_HOST`        | Хост PostgreSQL                                 | `localhost`          |
| `DB_PORT`        | Порт PostgreSQL                                 | `5432`               |
| `DB_USER`        | Пользователь БД                                 | `postgres`           |
| `DB_PASSWORD`    | Пароль пользователя БД                          | `1234567`            |
| `DB_NAME`        | Имя базы данных                                 | `home_work_14`       |
| `JWT_SECRET`     | Секрет подписи JWT (обязательно смените)        | `dev-jwt-secret`     |
| `JWT_EXPIRES_IN` | Время жизни токена, секунды                     | `3600`               |
| `CORS_ORIGIN`    | Разрешённые origin через запятую                | `http://localhost:5173` |

## Авторизация и RBAC

- `POST /auth/signup` — регистрация: `{ name, email, password }`. Пароль хэшируется (bcrypt), email уникален (повтор — `409`), роль всегда `user`, статус `active`.
- `POST /auth/signin` — логин: `{ email, password }`. Успех — `201` + `{ accessToken }`; неверные данные — `401`; заблокированный пользователь — `403`.
- JWT-токен: `Authorization: Bearer <accessToken>`, payload — `{ sub: id, role, iat, exp }`.
- `AuthGuard` проверяет токен на каждом приватном роуте и **добирает пользователя из БД**: статус `blocked` применяется мгновенно даже по старому (ещё действующему) токену — `403`.
- `RolesGuard` + декоратор `@Roles(...)` ограничивают роуты ролями — `403` при недостатке прав.

### Матрица прав

| Действие                                   | user        | author      | admin |
| ------------------------------------------ | ----------- | ----------- | ----- |
| `GET /tasks`, `GET /tasks/:id`, `GET /comments`, `GET /tags` | ✔ (auth) | ✔ (auth)    | ✔ (auth) |
| `POST /tasks`                              | —           | ✔           | ✔     |
| `PUT/DELETE /tasks/:id`                    | —           | свои задачи | любые |
| `POST /comments`                           | ✔           | ✔           | ✔     |
| `PUT/DELETE /comments/:id`                 | свои        | свои        | свои  |
| `PUT /comments/:id/status` (скрыть/показать) | —         | автор задачи | ✔     |
| `POST/PUT/DELETE /tags`                    | —           | —           | ✔     |
| `GET /users`                               | —           | —           | ✔     |
| `POST/DELETE /users`                       | —           | —           | ✔     |
| `PUT /users/:id`                           | имя/email — только себе | имя/email — только себе | любые поля |
| `PUT /users/:id/status` (роль/статус)      | —           | —           | ✔     |

## API

Swagger: `http://localhost:3000/api/docs` (публичные секции: auth, tags).

### Auth (`/auth`)

- `POST /auth/signup` — регистрация (`name`, `email`, `password` ≥ 6 символов). Ответ — пользователь без `passwordHash`.
- `POST /auth/signin` — логин. Ответ: `{ accessToken }`.

### Tasks (`/tasks`) — только авторизованные

- `GET /tasks` — список задач (любая роль). Фильтры: `?tag=`, `?status=`, `?author=`, `?q=`. Пагинация: `?page=&limit=`. Ответ: `{ items, total, page, limit }`.
- `GET /tasks/:id` — одна задача (любая роль); `404`, если не существует.
- `POST /tasks` — создание (author, admin).
- `PUT /tasks/:id` — обновление полей (автор задачи или admin).
- `DELETE /tasks/:id` — удаление (автор задачи или admin).

### Tags (`/tags`)

- `GET /tags` — список тегов (публично).
- `POST /tags`, `PUT /tags/:id`, `DELETE /tags/:id` — только admin.

### Comments (`/comments`)

- `GET /comments` — список видимых комментариев (публично).
- `POST /comments` — добавление к задаче (любой авторизованный).
- `PUT /comments/:id`, `DELETE /comments/:id` — только автор комментария.
- `PUT /comments/:id/status` — скрыть/показать (автор задачи или admin).

### Users (`/users`) — только авторизованные

- `GET /users` — список пользователей (admin).
- `POST /users` — создание пользователя (admin; `password` опционален).
- `PUT /users/:id` — сам пользователь (имя/email) или admin (все поля).
- `PUT /users/:id/status` — смена роли/статуса (admin).
- `DELETE /users/:id` — удаление (admin).

## Формат ошибок

Все ошибки возвращаются в едином JSON-формате:

```json
{ "error": { "message": "...", "details": ["..."] } }
```

- `400` — ошибка валидации (`details` — список проблем по полям);
- `401` — нет токена / битый / неверные email+пароль;
- `403` — недостаточно прав или пользователь заблокирован;
- `404` — ресурс не найден (или неизвестный маршрут);
- `409` — email уже занят;
- `500` — внутренняя ошибка сервера.

## e2e-тесты

CRUD-тесты (`test/app.e2e-spec.ts`, Nest Testing Module + Supertest) работают против **локального PostgreSQL** — того же, что и приложение (хост/порт/логин/пароль берутся из `.env`):

- отдельная база `home_work_14_e2e` создаётся автоматически перед запуском (имя БД переопределяется в `test/e2e-env.ts`, дев-база `home_work_14` не затрагивается);
- таблицы создаются через `synchronize: true`;
- данные очищаются перед каждым кейсом (`TRUNCATE ... CASCADE`).

Если Postgres ещё не поднят, включите любой локальный вариант, например Docker:

```bash
docker run -d --name hw14-pg -e POSTGRES_PASSWORD=1234567 -p 5432:5432 postgres:16
```

Либо используйте уже запущенный Postgres (как при обычном запуске приложения — см. раздел «Запуск»).

Запуск:

```bash
npm run test:e2e
```

## Полезные команды

```bash
npm run lint       # линтинг (oxlint)
npm run test       # unit-тесты (vitest)
npm run test:e2e   # e2e-тесты (vitest + Supertest, нужен локальный Postgres)
npm run test:cov   # тесты с покрытием
npm run format     # форматирование (prettier)
```
