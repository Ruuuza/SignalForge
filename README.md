# Ruzo Solutions

[![CI](https://github.com/Ruuuza/Ruzo-Solutions/actions/workflows/ci.yml/badge.svg)](https://github.com/Ruuuza/Ruzo-Solutions/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Ruuuza/Ruzo-Solutions/actions/workflows/codeql.yml/badge.svg)](https://github.com/Ruuuza/Ruzo-Solutions/actions/workflows/codeql.yml)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c5cff.svg)](LICENSE)

**A production-minded campaign operations control plane built with .NET 10 LTS, C# 14, React 19, and TypeScript.**

Ruzo Solutions turns high-volume journey delivery into an observable system. It is a compact but deep reference implementation of the engineering problems behind marketing automation: campaign lifecycle, asynchronous processing, real-time operational feedback, durable state, resilient interfaces, and disciplined architectural boundaries.

> Designed and engineered by Rodrigo Alves Ruza as an executable demonstration of senior full-stack and solution architecture experience.

![Ruzo Solutions campaign operations dashboard](docs/images/ruzo-solutions-dashboard.png)

## Why this project exists

The repository translates real career signals into running software rather than presenting another static portfolio:

- intelligent campaign delivery and personalized customer journeys;
- robust messaging flows that reduce overhead and data loss;
- scalable APIs and responsive operational interfaces;
- coexistence with legacy systems and an intentional modernization path;
- cloud-ready delivery, observability, and automated quality gates;
- architecture that is practical today and extractable tomorrow.

## Product capabilities

- Live dashboard with throughput, queue depth, latency, and delivery quality
- Campaign creation and lifecycle commands with explicit domain invariants
- Durable SQLite persistence with zero infrastructure setup
- Asynchronous delivery simulation through a bounded background worker
- Real-time SignalR events and automatic client reconnection
- Responsive dark operations UI with accessible interaction states
- Segmented pt-BR / en-US language controls with persisted preference
- Technical comparison between the modular monolith and a microservices scale-out variant
- Public project gallery with live previews and direct repository links
- Career narrative and language-specific resume viewing and downloads
- Resilient frontend demo snapshot when the API is unavailable
- REST, OpenAPI, health, compression, rate limiting, and Problem Details
- Multi-stage, non-root Docker image with persistent data and a health check
- Backend, frontend, test, container, CodeQL, and Dependabot automation

## Technology

| Concern | Choice |
| --- | --- |
| Runtime | .NET 10 LTS / ASP.NET Core 10 / C# 14 |
| Frontend | React 19 / TypeScript / Vite |
| Persistence | EF Core 10 / SQLite |
| Real time | SignalR |
| Architecture | Modular monolith / rich domain model / dependency inversion |
| Operations | Health checks / rate limiting / compression / structured logging |
| Delivery | Docker / Compose / GitHub Actions / CodeQL / Dependabot |
| Quality | xUnit / strict TypeScript / oxlint / warnings as errors |

## Run the complete product

### Docker

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). Data is retained in the named `ruzo-solutions-data` volume.

### Local development

Requirements: .NET SDK 10 and Node.js 24 with pnpm 10.

```bash
dotnet run --project src/RuzoSolutions.Api
```

In another terminal:

```bash
pnpm --dir src/RuzoSolutions.Web install
pnpm --dir src/RuzoSolutions.Web dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies API and SignalR traffic to ASP.NET Core.

## Quality gate

```bash
dotnet restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
pnpm --dir src/RuzoSolutions.Web install --frozen-lockfile
pnpm --dir src/RuzoSolutions.Web lint
pnpm --dir src/RuzoSolutions.Web typecheck
pnpm --dir src/RuzoSolutions.Web build
docker build -t ruzo-solutions:local .
```

## API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Aggregated operational snapshot |
| `GET` | `/api/campaigns` | Campaign list and delivery state |
| `POST` | `/api/campaigns` | Create a validated draft campaign |
| `POST` | `/api/campaigns/{id}/launch` | Launch or resume a campaign |
| `POST` | `/api/campaigns/{id}/pause` | Pause a live campaign |
| `GET` | `/api/portfolio` | Project-to-career evidence map |
| `GET` | `/health` | Runtime health probe |
| WebSocket | `/hubs/delivery` | Live delivery event stream |

The OpenAPI document is exposed at `/openapi/v1.json` in Development.

## Repository structure

```text
src/
  RuzoSolutions.Domain/          Business invariants and campaign lifecycle
  RuzoSolutions.Application/     Use cases, contracts, and infrastructure ports
  RuzoSolutions.Infrastructure/  EF Core, SQLite, repository, and demo seed
  RuzoSolutions.Api/             HTTP edge, SignalR, worker, and composition root
  RuzoSolutions.Web/             React operations console
tests/
  RuzoSolutions.Tests/           Domain behavior tests
docs/
  architecture.md              Runtime and dependency model
  adr/                         Architectural decision records
```

Read [the architecture guide](docs/architecture.md) and [ADR 0001](docs/adr/0001-modular-monolith.md) for the reasoning behind the design.

## Engineering decisions

### Modular monolith first

Distribution is a deployment decision, not a prerequisite for good boundaries. Ruzo Solutions compiles the layers independently and keeps the domain free of framework concerns while shipping one low-friction runtime. The worker can later move behind Kafka or RabbitMQ without rewriting the business lifecycle.

### SQLite for self-sufficiency

The product starts without a database account, broker, or cloud subscription. EF Core keeps the persistence boundary portable, and Docker Compose retains state through a named volume. PostgreSQL is a straightforward production substitution.

### Reconciliation plus live events

SignalR makes operations immediate; periodic dashboard refresh reconciles the client with durable truth. Losing a transient event therefore never leaves the UI permanently inconsistent.

### Explicit tradeoffs

- The worker simulates transport adapters; a production system would use an outbox plus Kafka or RabbitMQ.
- Authentication is intentionally outside this public demo; production should integrate an OIDC provider at the edge.
- SQLite favors local autonomy over horizontal write scaling.
- Metrics are operational demo data, not business claims from prior employers.

## Security and license

Review [SECURITY.md](SECURITY.md) before reporting a vulnerability. The project is available under the [MIT License](LICENSE).
