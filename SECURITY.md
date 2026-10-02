# Security Policy

## Supported Versions

Only the latest release of **PB CivilLab** receives active security patches.

| Version | Supported          |
| :---    | :---               |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The security of **PB CivilLab** and the integrity of engineering calculations are taken seriously.

If you discover a security vulnerability, private data leakage issue, or potential exploit:

1. **Do NOT open a public GitHub issue.** Public issues disclose vulnerabilities before a patch can be developed and applied.
2. Please report security issues directly to the author:
   - **Contact**: Prokash Biswas
   - **Email**: `prokashbiswas8801@gmail.com`
3. Please include:
   - Type of issue (e.g. API proxy vulnerability, injection flaw, header misconfiguration)
   - Step-by-step instructions or proof-of-concept to reproduce the behavior
   - Affected component or route (e.g., `/api/ai/*`)
   - Any suggested mitigations if known

---

## Security Practices in PB CivilLab

- **Zero Secrets on Client**: The browser bundle never includes private API keys or database credentials.
- **Server-Side API Proxy**: External AI calls to Google Gemini are mediated via a secure server endpoint (`/api/ai/*`) with payload sanitization and in-memory rate limiting ($30\text{ req/min}$).
- **Local-First Privacy**: User calculations, history, project measurements, and custom unit preferences reside exclusively in the client browser's `localStorage` and are never harvested or forwarded to external telemetry.
- **Hardened HTTP Headers**: Production deployments enforce `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referrer policies.
