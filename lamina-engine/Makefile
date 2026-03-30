.PHONY: dev run build docker-up docker-down check fmt

check:
	cargo check

fmt:
	cargo fmt --all

build:
	cargo build --release

dev-orchestrator:
	RUST_LOG=debug cargo run --bin orchestrator

dev-worker:
	RUST_LOG=debug cargo run --bin worker -- --nodes-dir $(PWD)/test/nodes

dev:
	make -j2 dev-orchestrator dev-worker

run-orchestrator:
	cargo run --release --bin orchestrator

run-worker:
	cargo run --release --bin worker

docker-up:
	docker compose -f docker/docker-compose.yml --env-file .env up --build

docker-up-detached:
	docker compose -f docker/docker-compose.yml --env-file .env up --build -d

docker-down:
	docker compose -f docker/docker-compose.yml down -v

docker-logs:
	docker compose -f docker/docker-compose.yml logs -f

docker-scale-workers:
	docker compose -f docker/docker-compose.yml up --scale worker=$(n) -d

dev-infra:
	docker compose -f docker/docker-compose.dev.yml up -d

dev-infra-down:
	docker compose -f docker/docker-compose.dev.yml down -v

install:
	cargo install --path crates/cli

dev-cli:
	cargo run --bin lamina --