# Security policy

## Supported versions

Security fixes are applied to the latest commit on `main`.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub private vulnerability reporting for this repository. Include impact, reproduction steps, and any proposed mitigation. Acknowledgement is targeted within three business days.

## Built-in controls

- Global fixed-window rate limiting
- RFC 9457-style Problem Details responses without stack traces
- Non-root container runtime
- Dependency updates through Dependabot
- CodeQL analysis on changes and weekly
- No secrets or production credentials in the repository
