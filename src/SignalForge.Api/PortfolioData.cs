using SignalForge.Application;

namespace SignalForge.Api;

public static class PortfolioData
{
    public static PortfolioProfile Create() => new(
        "RUZO SOLUTIONS",
        "Operate high-volume, personalized customer journeys with observable and resilient delivery pipelines.",
        ["Modular architecture", "Real-time operations", "Asynchronous processing", "Operational resilience", "Cloud-ready delivery", "Automated quality gates"],
        [
            new("2022 - present", "Senior Developer", "Locaweb / Wake", "Marketing technology, campaign delivery, dynamic templates, and messaging at scale."),
            new("2016 - 2022", "Senior Developer", "Social Miner", "Scalable web products, APIs, microservices, observability, and legacy evolution."),
            new("2013 - present", "Full-stack Consultant", "Code Solutions", "End-to-end product delivery, architecture standardization, integrations, and technical debt reduction.")
        ],
        [
            new("Experience", "Fast, accessible operational interface", ["React 19", "TypeScript", "Vite", "SignalR"]),
            new("Edge", "Rate limiting, compression, health, and REST contracts", ["ASP.NET Core 10", "OpenAPI", "Problem Details"]),
            new("Application", "Use-case orchestration and stable boundaries", ["CQRS-ready services", "Dependency inversion"]),
            new("Domain", "Business invariants and lifecycle state machine", ["C# 14", "Rich domain model"]),
            new("Infrastructure", "Durable local data with zero setup", ["EF Core 10", "SQLite", "Docker"])
        ]);
}
