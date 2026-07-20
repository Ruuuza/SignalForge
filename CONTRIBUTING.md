# Contributing

## Local quality gate

```bash
dotnet restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
pnpm --dir src/RuzoSolutions.Web install
pnpm --dir src/RuzoSolutions.Web lint
pnpm --dir src/RuzoSolutions.Web build
```

Use focused commits, add tests for behavior changes, and record significant architectural decisions under `docs/adr`.

## Pull requests

Describe the problem, the chosen tradeoff, user impact, and validation performed. Keep refactors separate from behavior changes where practical.
