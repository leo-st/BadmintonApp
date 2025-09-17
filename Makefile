APP_NAME = badminton_app
APP_IMAGE = $(APP_NAME):local
GIT_BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
TAG ?= v0.0.0
PROJECT_VERSION = v$(shell poetry version --short)
IS_PRERELEASE_VERSION = $(shell poetry version --short | grep -qE "a|b|rc" && echo "TRUE" || echo "FALSE")
ENV_FILE ?= .env.dev
COMPOSE_FILE = docker-compose.local.yml

.PHONY: help
help:
	@echo Makefile targets:
	@echo init - install dependencies
	@echo test - runs tests with coverage
	@echo test-unit - runs unit tests only
	@echo test-integration - runs integration tests only
	@echo lint - runs ruff
	@echo type-check - runs mypy type checking
	@echo build - builds containers
	@echo up - starts services in foreground
	@echo up-detached - starts in background
	@echo down - stops and removes containers
	@echo logs - shows logs (press Ctrl+C to exit)
	@echo restart - restarts everything
	@echo rebuild - rebuild and run
	@echo clean - clean up containers and volumes
	@echo create_version_tag - create git tag with current project version
	@echo check_tag_version - checks if tag and project version match

.PHONY: init
init:
	poetry install

.PHONY: test
test: init
	poetry run coverage run -m pytest
	poetry run coverage report
	poetry run coverage html

.PHONY: test-unit
test-unit: init
	poetry run pytest tests/unit/ -v

.PHONY: test-integration
test-integration: init
	poetry run pytest tests/integration/ -v

.PHONY: lint
lint: init
	poetry run ruff check .

.PHONY: lint-fix
lint-fix: init
	poetry run ruff check . --fix

.PHONY: type-check
type-check: init
	poetry run mypy app/

.PHONY: prepare_for_docker_build
prepare_for_docker_build: init
	rm -rf dist
	poetry build --format wheel
	poetry export --without-hashes > dist/requirements.txt

.PHONY: build
build:
	docker compose -f $(COMPOSE_FILE) build

.PHONY: up
up:
	docker compose -f $(COMPOSE_FILE) up

.PHONY: up-detached
up-detached:
	docker compose -f $(COMPOSE_FILE) up -d

.PHONY: down
down:
	docker compose -f $(COMPOSE_FILE) down

.PHONY: logs
logs:
	docker compose -f $(COMPOSE_FILE) logs -f

.PHONY: restart
restart: down up

.PHONY: rebuild
rebuild:
	docker compose -f $(COMPOSE_FILE) up --build

.PHONY: ps
ps:
	docker compose -f $(COMPOSE_FILE) ps

.PHONY: clean
clean:
	docker compose -f $(COMPOSE_FILE) down -v
	docker system prune -f

.PHONY: check_tag_version
check_tag_version: prepare_for_docker_build
ifneq ($(TAG), $(PROJECT_VERSION))
	@echo "Tag $(TAG) is different from project version $(PROJECT_VERSION)"
	@exit 1
else
	@echo "Tag and project version match"
endif

.PHONY: create_version_tag
create_version_tag:
	@echo "Creating tag $(PROJECT_VERSION) on '$(GIT_BRANCH)' branch"
ifeq ($(GIT_BRANCH), main)
ifeq ($(IS_PRERELEASE_VERSION), TRUE)
	@echo "ERROR: On 'main' branch we cannot create tags for prerelease versions."
	@exit 1
else
	git tag $(PROJECT_VERSION)
	git push origin $(PROJECT_VERSION)
endif
else
ifeq ($(IS_PRERELEASE_VERSION), TRUE)
	git tag $(PROJECT_VERSION)
	git push origin $(PROJECT_VERSION)
else
	@echo "ERROR: On 'non-main' branch we cannot create tags for release versions."
	@exit 1
endif
endif

.PHONY: increase_alpha_version
increase_alpha_version:
	poetry version prerelease

.PHONY: increase_beta_version
increase_beta_version:
	poetry version prerelease

.PHONY: increase_production_version
increase_production_version:
	poetry version patch

.PHONY: increase_version_alpha_to_beta
increase_version_alpha_to_beta:
	poetry version prerelease --next-phase

.PHONY: increase_version_beta_to_production
increase_version_beta_to_production:
	poetry version prerelease --next-phase

.PHONY: dev-setup
dev-setup: init
	@echo "Setting up development environment..."
	@echo "Run 'make up-detached' to start services"
	@echo "Run 'make test' to run tests"
	@echo "Run 'make lint' to check code quality"
