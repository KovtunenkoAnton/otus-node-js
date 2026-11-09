#!/usr/bin/env bash
set -euo pipefail

BOOTSTRAP="${1:-localhost:9092}"

TOPICS=(
  order.create
  inventory.reserve
  inventory.release
  payment.authorize
  notification.send
  inventory.reserved
  inventory.failed
  payment.authorized
  payment.failed
  order.confirmed
  order.rejected
  order.cancelled
  notification.sent
)

for topic in "${TOPICS[@]}"; do
  for t in "$topic" "$topic.dlq"; do
    docker exec hw19-kafka kafka-topics \
      --create --if-not-exists \
      --topic "$t" \
      --partitions 1 \
      --replication-factor 1 \
      --bootstrap-server "$BOOTSTRAP" >/dev/null
  done
done

echo "Топиков создано: $(docker exec hw19-kafka kafka-topics --list --bootstrap-server "$BOOTSTRAP" | wc -l | tr -d ' ')"
