# Makefile for Sahayak Project

# Configuration
DC=docker-compose
PYTHON_ENV=.venv/bin

.PHONY: init up down test lint ingest eval db-migrate db-history

# Set up local workspace dependencies
init:
	python3 -m venv .venv
	$(PYTHON_ENV)/pip install --upgrade pip
	$(PYTHON_ENV)/pip install -e ".[dev]"
	npm install --prefix web

# Spin up Postgres, FastAPI and Vite React containers
up:
	$(DC) --env-file .env -f infra/docker-compose.yml up --build -d

# Take down all containers
down:
	$(DC) --env-file .env -f infra/docker-compose.yml down

# Run backend tests
test:
	$(PYTHON_ENV)/pytest

# Run static analysis and linting
lint:
	$(PYTHON_ENV)/ruff check api/
	$(PYTHON_ENV)/mypy api/
	# Web build lint check
	npm run --prefix web lint || true

# Run scheme ingestion CLI
ingest:
	$(DC) --env-file .env -f infra/docker-compose.yml exec api python ingest/run.py

# Run evaluation harness
eval:
	$(DC) --env-file .env -f infra/docker-compose.yml exec api python eval/run_eval.py

# Run database migrations using Alembic
db-migrate:
	$(DC) --env-file .env -f infra/docker-compose.yml exec api alembic upgrade head

# Check Alembic migration history
db-history:
	$(PYTHON_ENV)/alembic history --verbose
