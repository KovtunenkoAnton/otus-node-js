# Home_work_19 — Event-Driven Microservices (Kafka)

Четыре микросервиса общаются через Kafka.
Жизненный цикл заказа — **сага**: резерв → авторизация платежа → подтверждение +
уведомление клиента. При провале любого шага выполняется **компенсация**
(освобождение резерва) и заказ отклоняется.

## Стек

- **NestJS 12** — монорепо: 4 приложения + 2 библиотеки, TypeScript (CJS)
- **Kafka** — брокер (kafkajs 2.x), одиночный узел KRaft в Docker (`confluentinc/cp-kafka`)
- **PostgreSQL + TypeORM** — у order-service БД `home_work_19`, у inventory-service `home_work_19_inventory`
- **Zod** — контракты сообщений (конверт + payload), валидация на входе consumer'а

## Архитектура

order-service — оркестратор саги, остальные три — участники:

```
                         ┌──────────────┐
   POST /orders ────────▶│  order-svc   │  (HTTP :3000 + Kafka, БД home_work_19)
                         └──────┬───────┘
                                │ order.create
                                ▼
                     ┌─────────────────────┐
                     │  order-svc (сага)   │
                     └──────────┬──────────┘
                                │ inventory.reserve
                                ▼
                  ┌────────────────────────┐    inventory.reserved
                  │   inventory-service    │─────────────────────┐   (БД home_work_19_inventory)
                  └───────────┬────────────┘                     │
                              │ inventory.failed                 ▼
                              │ (нет остатка / нет товара)  payment.authorize
                              │                              ▼
                              │             ┌────────────────────────────┐
                              │             │       payment-service      │   (без БД, симуляция 80/20)
                              │             └────────────┬───────────────┘
                              │                          │ payment.authorized / payment.failed
                              ▼                          ▼
        order.rejected ◀── компенсация ── inventory.release
        (при inventory.failed —
         без release: резерв не был сделан)

        payment.authorized ──▶ order.confirmed + notification.send
                                                        │
                                                        ▼
                                          ┌──────────────────────────────┐
                                          │      notification-service    │  (без БД, «письмо» = лог)
                                          └──────────────┬───────────────┘
                                                         │ notification.sent
```

Каждый сервис — отдельный процесс со своим consumer group, своим дедуплицированием
и (для order/inventory) своей БД. Общие: топики, контракты (`libs/contracts`) и
обвязка сообщений (`libs/messaging`).

## Топики

Команды — тоже сообщения того же формата, они не предполагают ответа;
на результат сервиса подписывается оркестратор через события:

| Команды | События |
|---|---|
| `order.create` | `inventory.reserved` |
| `inventory.reserve` | `inventory.failed` |
| `inventory.release` | `payment.authorized` |
| `payment.authorize` | `payment.failed` |
| `notification.send` | `order.confirmed` / `order.rejected` / `order.cancelled` |
| | `notification.sent` |

К каждому топик `<topic>.dlq` — «мёртвый конвейер» для сообщений, которые не удалось
обработать (нарушение контракта или 3 неудачные попытки). Итого 26 топиков, все
создаёт `scripts/create-topics.sh`.

## Контракт сообщения

Все сообщения — конверт, описанный и валидируемый Zod-схемой:

```json
{
  "version": 1,
  "type": "inventory.reserve",
  "messageId": "uuid",
  "correlationId": "uuid",
  "timestamp": "2026-11-01T12:00:00.000Z",
  "payload": { "orderId": "uuid", "productId": "uuid", "quantity": 1 },
  "retryCount": 0
}
```

- `messageId` — ключ идемпотентности (однакождовость обработки);
- `correlationId` — сквозной id «заказа» для трассировки цепочки;
- `retryCount` — появляется только у сообщения после ретрая;
- `type` и поля `payload` строго типизированы (`libs/contracts/src/*.messages.ts`) —
  нарушитель не пройдёт `parseMessage` и улетит в DLQ.

## Ключевые механизмы

### At-least-once и идемпотентность

Nest коммитит offset после любого исхода handler'а, а Kafka не умеет «переставить
сообщение назад». Поэтому:

- если процесс падает **до** коммита — брокер доставит сообщение заново после рестарта
  (at-least-once);
- повторная доставка того же `messageId` гасится дедупом: order/inventory — таблица
  `processed_messages` (своя в каждой БД), payment/notification — in-memory `Set`
  (у них нет БД; переживает только жизнь процесса).

### Ретраи и DLQ

`MessageConsumer` (`libs/messaging`) — единая обвязка всех consumer'ов:

1. Zod-валидация: нарушение контракта → сразу `<topic>.dlq`, ретраи бессмысленны;
2. ошибка handler'а → сообщение републикуется с тем же `messageId`, но `retryCount++`;
3. после 3 неудач (`MAX_ATTEMPTS`) → `<topic>.dlq`.

### Компенсации

Оплата не прошла → оркестратор шлёт `inventory.release`, заказ → `REJECTED`.
Резерв не прошёл → освобождать нечего, сразу `REJECTED`.

## Структура проекта

```
Home_work_19/
├── apps/
│   ├── order-service/        # HTTP :3000 + сага (оркестратор), БД home_work_19
│   ├── inventory-service/    # Kafka-only, Product (stock/reserved), БД home_work_19_inventory
│   ├── payment-service/      # Kafka-only, симуляция провайдера 80/20
│   └── notification-service/ # Kafka-only, «письмо» в лог
├── libs/
│   ├── contracts/            # топики, конверт, Zod-схемы всех 13 сообщений
│   └── messaging/            # KafkaPublisher, MessageConsumer (ретраи/DLQ), опции Kafka
├── docker-compose.yml        # cp-kafka (KRaft), порт 9092
├── scripts/create-topics.sh  # 26 топиков (13 + 13 .dlq)
└── .env.example
```

## Запуск

```bash
# 1. Конфиг (значения по умолчанию подходят для локального Postgres)
cp .env.example .env

# 2. Kafka
docker compose up -d

# 3. Топики — ОБЯЗАТЕЛЬНО до старта сервисов:
#    kafkajs 2 падает процессом, если consumer подписывается на несуществующий топик
bash scripts/create-topics.sh

# 4. Сборка (Nest CLI на Node 20.19 сломан, сборка через tsc напрямую)
npm install
npm run build

# 5. Сервисы — в четырёх терминалах
npm run start:order
npm run start:inventory
npm run start:payment
npm run start:notification
```

Базы данных создайте заранее: `createdb home_work_19` и `createdb home_work_19_inventory`
(таблицы создаст TypeORM, `synchronize: true`). Продукты (Coffee, Cup) seeder вставляет
сам при старте inventory-service.

## Демо-данные

| Товар | UUID | Остаток |
|---|---|---|
| Coffee | `11111111-1111-4111-8111-111111111111` | 10 |
| Cup | `22222222-2222-4222-8222-222222222222` | 2 |

Платёжный провайдер — симуляция: **80% авторизаций проходят, 20% отклоняются**.

## HTTP API (order-service, порт 3000)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/orders` | Создать заказ (202). Body: `{productId, quantity, amount}` |
| GET | `/orders/:id` | Статус заказа (404 если нет) |
| POST | `/orders/:id/cancel` | Отмена, пока `PENDING` (409 если уже в финальном статусе) |

## Что проверить (сценарии ТЗ)

Все сценарии ниже проверены вживую; команды даны для воспроизведения.

### 1. Успешный заказ

```bash
curl -s -X POST localhost:3000/orders -H 'Content-Type: application/json' \
  -d '{"productId":"11111111-1111-4111-8111-111111111111","quantity":1,"amount":150}'
# → 202 {"orderId":"<id>","status":"PENDING"}
curl -s localhost:3000/orders/<id>
# → {"id":"<id>","status":"CONFIRMED",...}   (с вероятностью 80%)
```

Ожидаемо в логах по цепочке: inventory `reserved 1 → inventory.reserved` →
payment `authorized 150 → payment.authorized` → order `→ CONFIRMED` →
notification `email → client: order <id>: Заказ <id> подтверждён`.
В БД: `products.reserved` вырос на 1 (компенсации не было).
Если оплата «не прошла» (20%) — это сценарий 2; создайте ещё один заказ.

### 2. Провал оплаты → компенсация

Тот же запрос к `/orders`. Ожидаемо: payment `payment provider declined … →
payment.failed` → inventory `released 1 (compensation)` → заказ `REJECTED`,
`reason = "payment failed: payment provider declined …"`. Остаток `reserved`
вернулся к исходному.

### 3. Провал резерва (недостаточно остатка)

```bash
curl -s -X POST localhost:3000/orders -H 'Content-Type: application/json' \
  -d '{"productId":"22222222-2222-4222-8222-222222222222","quantity":5,"amount":50}'
```

Ожидаемо: inventory `product "Cup": available 2, requested 5 → inventory.failed`
→ заказ `REJECTED`, `reason = "inventory reserve failed: …"`. `inventory.release`
не шлётся — резерв так и не был сделан.

### 4. Повторная доставка (идемпотентность)

Пересылаем уже обработанное сообщение с тем же `messageId`:

```bash
MSG=$(docker exec hw19-kafka kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic inventory.reserve --from-beginning --timeout-ms 5000 --max-messages 1 2>/dev/null | head -1)
printf '%s' "$MSG" | docker exec -i hw19-kafka kafka-console-producer \
  --bootstrap-server localhost:9092 --topic inventory.reserve
```

Ожидаемо в логе inventory-service: `topic inventory.reserve: duplicate messageId=… —
skipped`; в БД дублей нет (заказ не создался дважды, `reserved` не изменился).

### 5. Ретраи и DLQ

**5а. Нарушение контракта → сразу DLQ (без ретраев).** Публикуем сообщение с
невалидным payload (`quantity` — строка вместо числа):

```bash
printf '%s' '{"version":1,"type":"inventory.reserve","messageId":"11111111-1111-4111-8111-999999999999","correlationId":"22222222-2222-4222-8222-222222222222","timestamp":"2026-11-01T12:00:00.000Z","payload":{"orderId":"11111111-1111-4111-8111-111111111111","productId":"11111111-1111-4111-8111-111111111111","quantity":"abc"}}' \
  | docker exec -i hw19-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic inventory.reserve
```

Ожидаемо: в логе MessageConsumer `topic "inventory.reserve": invalid message, sending
to inventory.reserve.dlq: validation: payload.quantity: …`; в `inventory.reserve.dlq`
лежит исходное сообщение.

**5б. Ошибка handler'а → 3 ретрая → DLQ.** Публикуем валидное по схеме событие про
несуществующий заказ (handler order-service упадёт на `mustFind`):

```bash
printf '%s' '{"version":1,"type":"payment.authorized","messageId":"33333333-3333-4333-8333-333333333333","correlationId":"22222222-2222-4222-8222-222222222222","timestamp":"2026-11-01T12:00:00.000Z","payload":{"orderId":"00000000-0000-4000-8000-000000000000","amount":100,"paymentId":"deadbeef"}}' \
  | docker exec -i hw19-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic payment.authorized
```

Ожидаемо: три лог-строки `attempt 1/3 failed: order 0000… not found, republishing` …
`attempt 3/3`, затем `failed 3 times, sending to payment.authorized.dlq`. В
`payment.authorized.dlq` — сообщение с `retryCount: 2`.

Посмотреть содержимое любого DLQ:

```bash
docker exec hw19-kafka kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic <topic>.dlq --from-beginning --timeout-ms 5000
```