.PHONY: up down logs infra-up

up:
	docker compose up -d --build

down:
	docker compose down

infra-up:
	docker compose up -d nats redis

logs:
	docker compose logs -f