FROM node:24-alpine AS web-build
WORKDIR /src/web
RUN npm install --global pnpm@10.14.0
COPY src/SignalForge.Web/package.json src/SignalForge.Web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src/SignalForge.Web/ ./
RUN pnpm build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY SignalForge.sln Directory.Build.props global.json ./
COPY src/SignalForge.Domain/SignalForge.Domain.csproj src/SignalForge.Domain/
COPY src/SignalForge.Application/SignalForge.Application.csproj src/SignalForge.Application/
COPY src/SignalForge.Infrastructure/SignalForge.Infrastructure.csproj src/SignalForge.Infrastructure/
COPY src/SignalForge.Api/SignalForge.Api.csproj src/SignalForge.Api/
RUN dotnet restore src/SignalForge.Api/SignalForge.Api.csproj
COPY src/ ./src/
RUN dotnet publish src/SignalForge.Api/SignalForge.Api.csproj --configuration Release --no-restore --output /app/publish
COPY --from=web-build /src/web/dist /app/publish/wwwroot

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update && apt-get install --yes --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=api-build /app/publish .
RUN mkdir -p /app/data && chown -R app:app /app
USER app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 CMD curl --fail http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "SignalForge.Api.dll"]
