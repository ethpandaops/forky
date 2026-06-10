# Contributing to Forky

## Prerequisites

- [Go](https://go.dev/dl/) (see `go.mod` for the minimum version)
- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/) (for the web UI)
- [golangci-lint](https://golangci-lint.run/welcome/install/)
- [goreleaser](https://goreleaser.com/install/) (optional, for release checks)

## Development Workflow

```sh
# Build the binary with the embedded web UI
make build

# Run tests
make test

# Run the linter
make lint

# Run all checks (lint + test + vuln + modernize + mod verify)
make audit
```

The backend can be run directly against a config file:

```sh
make run                       # build + run with ./config.yaml
# or
go run ./cmd/forky --config your_config.yaml
```

The web UI has its own workflow — see [`web/CLAUDE.md`](web/CLAUDE.md).

## Pull Request Guidelines

1. Create a feature branch from `master`.
2. Keep changes focused — one concern per PR.
3. Add tests for new functionality.
4. Ensure `make audit` passes before submitting.
5. Use [Conventional Commits](https://www.conventionalcommits.org/) — the web
   package enforces them via commitlint.

## Code Style

- Follow the conventions enforced by `golangci-lint` and `.golangci.yml`.
- Use `github.com/sirupsen/logrus` for logging (consistent with the existing
  codebase — do not mix logging libraries).
- Wrap errors with context using `fmt.Errorf` and `%w`.
- The OpenAPI spec in `api/openapi.yaml` is the source of truth for the typed
  web API client (`pnpm --dir web generate:api`).
