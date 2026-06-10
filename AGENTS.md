# forky

Forky captures, stores, indexes and serves Ethereum Beacon Chain fork-choice
data, providing a live and historical view of the network. It runs as a single
service with an embedded operator web UI.

## Architecture

- `cmd/forky/main.go` — cobra CLI entrypoint; builds the logger, loads config,
  constructs the server and runs it until a signal is received.
- `forkchoice.go` / `http.go` / `config.go` — application root (package `forky`
  at the repo root). `NewServer` wires dependencies; `Start` runs the service.
  `NewConfigFromYAMLFile` loads `Config` from YAML.
- `internal/` — application packages, each a cohesive capability:
  - `store/` — frame storage backends (memory, filesystem, S3).
  - `source/` — fork-choice data sources (beacon node, Xatu).
  - `service/` — fork-choice orchestration, backfill, pagination, purging.
  - `db/` — frame metadata indexer (SQLite, Postgres).
  - `api/` — HTTP handlers for the JSON API under `/api/v1`.
  - `ethereum/`, `types/`, `human/` — domain support.
  - `version/` — build metadata (set via `-ldflags`).
  - `yaml/` — raw config helpers.
- `web/` — operator UI (React + Vite). The built assets are embedded into the
  binary and served by the API server. See `web/CLAUDE.md`.

New subsystems get their own package under `internal/` and are wired in from the
root `forky` package.

## Conventions

- Go: `github.com/sirupsen/logrus` for logging (existing project — do not mix
  logging libraries), `fmt.Errorf("...: %w", err)` for error wrapping. Linting
  is governed by `.golangci.yml`.
- Web: see `web/CLAUDE.md`. Colors must use the semantic tokens in
  `web/src/index.css` (enforced by custom ESLint rules).
- The OpenAPI spec in `api/openapi.yaml` is the source of truth for the typed
  web API client (`pnpm --dir web generate:api`).

## Commands

```sh
make build      # compile the binary
make build-web  # build the embedded frontend assets
make test       # go test -race
make lint       # golangci-lint
make audit      # lint + test + vuln + modernize + mod verify
```
