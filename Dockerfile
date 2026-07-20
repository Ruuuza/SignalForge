FROM node:24-alpine AS web-build
WORKDIR /src/web
RUN npm install --global pnpm@10.14.0
COPY src/RuzoSolutions.Web/package.json src/RuzoSolutions.Web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src/RuzoSolutions.Web/ ./
RUN pnpm build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY RuzoSolutions.sln Directory.Build.props global.json ./
COPY src/RuzoSolutions.Domain/RuzoSolutions.Domain.csproj src/RuzoSolutions.Domain/
COPY src/RuzoSolutions.Application/RuzoSolutions.Application.csproj src/RuzoSolutions.Application/
COPY src/RuzoSolutions.Infrastructure/RuzoSolutions.Infrastructure.csproj src/RuzoSolutions.Infrastructure/
COPY src/RuzoSolutions.Api/RuzoSolutions.Api.csproj src/RuzoSolutions.Api/
RUN dotnet restore src/RuzoSolutions.Api/RuzoSolutions.Api.csproj
COPY src/ ./src/
RUN dotnet publish src/RuzoSolutions.Api/RuzoSolutions.Api.csproj --configuration Release --no-restore --output /app/publish
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
ENTRYPOINT ["dotnet", "RuzoSolutions.Api.dll"]
