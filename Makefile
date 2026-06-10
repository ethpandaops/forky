.DEFAULT_GOAL := help
.PHONY: build build-web setup-frontend generate lint lint-openapi fmt test clean tidy vuln modernize-check audit check-release run test/cover help

BUILD_DIR := ./cmd/forky
BINARY := forky
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
COMMIT  := $(shell git rev-parse --short HEAD 2>/dev/null || echo none)
LDFLAGS := -s -w \
	-X github.com/ethpandaops/forky/internal/version.Release=$(VERSION) \
	-X github.com/ethpandaops/forky/internal/version.GitCommit=$(COMMIT)

## setup-frontend: ensure web/dist/index.html exists for the embed
setup-frontend:
	@mkdir -p web/dist
	@test -f web/dist/index.html || echo '<!doctype html><html><head><title>forky</title></head><body><h1>forky</h1></body></html>' > web/dist/index.html

## build-web: build the embedded frontend assets (output to web/dist)
build-web: setup-frontend
	@if command -v pnpm >/dev/null 2>&1; then \
		echo "building embedded web assets with pnpm"; \
		cd web && pnpm install && pnpm build; \
	else \
		echo "pnpm not found, skipping web build and using existing web/dist assets"; \
	fi

## build: compile the binary with the embedded frontend
build: setup-frontend
	go build -tags=webui -trimpath -ldflags="$(LDFLAGS)" -o $(BINARY) $(BUILD_DIR)

## generate: regenerate the ogen server (api/rest) and web API client from api/openapi.yaml
generate:
	go generate ./...
	@if command -v pnpm >/dev/null 2>&1; then \
		cd web && pnpm generate:api; \
	else \
		echo "pnpm not found, skipping web API client generation"; \
	fi

## lint: run golangci-lint (only new issues vs origin/master when available)
lint:
	@if git rev-parse --verify --quiet origin/master >/dev/null; then \
		golangci-lint run --new-from-rev="origin/master" ./...; \
	else \
		golangci-lint run ./...; \
	fi

## lint-openapi: lint the OpenAPI spec with Redocly
lint-openapi:
	npx -y @redocly/cli@latest lint api/openapi.yaml --config .redocly.yaml

## fmt: format code
fmt:
	golangci-lint fmt ./...

## test: run tests with the race detector
test:
	go test -race -shuffle=on -coverprofile=coverage.out -covermode=atomic ./...

## clean: remove build outputs
clean:
	rm -f $(BINARY) coverage.out

## tidy: tidy go modules
tidy:
	go mod tidy

## vuln: run govulncheck
vuln:
	go tool govulncheck ./...

## modernize-check: preview Go modernizations without changing files
modernize-check:
	go fix -n ./...

## audit: run all checks
audit: lint test vuln modernize-check
	go mod tidy -diff
	go mod verify

## run: build and run the binary against ./config.yaml
run: build
	./$(BINARY) --config config.yaml

## test/cover: open the HTML coverage report
test/cover: test
	go tool cover -html=coverage.out

## check-release: validate the goreleaser config
check-release:
	goreleaser check -q

## help: show this help
help:
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'
