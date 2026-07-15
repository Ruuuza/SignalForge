# ADR 0001: Start as a modular monolith

- Status: Accepted
- Date: 2026-07-15

## Context

The project must be serious enough to demonstrate architectural depth and simple enough to run locally without cloud accounts, brokers, or external databases.

## Decision

Use one ASP.NET Core process with separately compiled Domain, Application, Infrastructure, and API projects. Keep messaging semantics explicit through application ports and a background worker. Use SQLite as the zero-configuration durable store.

## Consequences

- A contributor can run the complete product with one command or one container.
- Compile-time boundaries expose coupling early.
- Operational deployment remains small and inexpensive.
- Independent scaling requires a later process extraction.
- The application ports and domain isolation reduce the cost of that extraction.
