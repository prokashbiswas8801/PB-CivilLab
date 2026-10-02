# Changelog

All notable changes to the **PB CivilLab** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-02

### Changed
- **Deterministic 100% Client-Side Engine**: Removed external AI Advisor feature at user request to ensure complete offline reliability, zero external API key requirements, and instant performance across all network environments.
- **Optimized Bundle Size**: Reduced JavaScript bundle size by over 26 KB and eliminated all external AI SDK dependencies (`@google/genai`).
- **Static Hosting Hardening**: Streamlined repository for seamless zero-config GitHub Pages hosting with no server or API key overhead.

## [1.0.0] - 2026-10-01

### Added
- **Complete Civil Engineering Suite**: 27+ specialized engineering calculators and utilities spanning Concrete, Structural RCC, Masonry, Earthworks, Surveying, and Costing.
- **Universal Unit Converter**: High-precision conversion engine covering Length, Area (with regional land units: *Decimal*, *Katha*, *Bigha*, *Acre*), Volume (CFT & $m^3$), Mass, Stress, Force, Density, and Slope.
- **Feet-Inch Decimal Parser**: Site dimension utility converting construction notations (e.g. $12'\text{--}4\ \frac{1}{2}''$) to decimal feet, meters, and millimeters.
- **Universal Intelligent Command Palette (`Ctrl + K` / `/`)**: Instant multi-tier search engine indexing calculators, units, and standard equations with keyboard navigation and local analytics.
- **Dedicated Engineering Print & PDF Engine**: Full-screen WYSIWYG print preview canvas supporting A4, Letter, Legal, A3, and A5 with customizable project metadata, section toggles, and quality assurance verification sign-off blocks.
- **Quantity Takeoff & BOQ Estimator**: Dynamic $L \times W \times H$ measurement sheet with customizable currency ($\text{BDT \u09f3}$, $\text{USD \$}$, $\text{INR \u20b9}$, $\text{EUR \u20ac}$), wastage, contractor overhead, and tax percentages.
- **Rate Analysis for $1\text{ m}^3$ RCC**: Granular breakdown of materials, head mason, helper labor, equipment, and profit margins.
- **Surveying Field Book Sheets**: Height of Instrument (HI) and Rise & Fall leveling calculators with automatic arithmetic checks.
- **AI Civil Engineering Advisor**: Server-side Google Gemini (`gemini-2.5-flash`) integration for code compliance audits and technical consultations.
- **PWA & Offline Capability**: Web App Manifest and local-first architecture for jobsite functionality with zero network connectivity.
- **Automated Engineering Test Suite**: 23 automated regression tests verifying rebar weights, mix formulations, brick quantities, leveling balances, and unit conversions (`npm test`).
- **GitHub Pages Dual-Deployment Architecture**: Automated `/docs` static release pipeline with relative base paths (`./`) and SPA redirection (`404.html`).

### Security
- **Backend API Proxy**: External AI integration isolated on Node.js/Express server; zero client-side secret exposure.
- **Server Rate Limiting**: In-memory rate limiting on `/api/ai/*` endpoints ($30\text{ req/min}$ per IP).
- **Request Payload Sanitization**: Strict validation of request bodies, input lengths, and content types.
- **Security Headers & HSTS**: Production headers enforced (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security`).
