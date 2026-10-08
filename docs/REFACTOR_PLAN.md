# PB CivilLab — Systematic Engineering Refactor Plan

**Target Application:** PB CivilLab  
**Objective:** Zero-defect deployment on GitHub Pages, uncompromised calculation integrity, unified report architecture, and mobile-to-desktop responsive accessibility.  

---

## 1. Target Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PB CivilLab Application                         │
├────────────────────────────────────────────────────────────────────────┤
│  [UI Layer: React 19 + Tailwind v4 + Accessible Tokens]                │
│    ├── Mobile Drawer & Touch Controls (>=48px touch targets)          │
│    ├── Accessible UnitInput (Combobox + ARIA listbox)                  │
│    └── ErrorBoundary (Safe cache recovery, zero data destruction)      │
├────────────────────────────────────────────────────────────────────────┤
│  [Calculation & Validation Engine (src/utils/engineeringEngine.ts)]    │
│    ├── Central Contract: CalculationStatus ('valid'|'warning'|'invalid')│
│    ├── ValidationIssue[]: Explicit field errors (No Math.max coercion) │
│    ├── Full Double-Precision IEEE 754 Intermediate Computation         │
│    └── Display Layer: formatNumber / formatCurrency / formatFeetInch   │
├────────────────────────────────────────────────────────────────────────┤
│  [Reporting Subsystem (src/report/)]                                   │
│    ├── Canonical ReportDocumentModel                                   │
│    ├── buildReportDocument(result, project, options)                   │
│    ├── EngineeringReportView (Pure DOM for Preview & Native Print)    │
│    └── Dedicated Mount Point: #pb-civillab-print-root                 │
├────────────────────────────────────────────────────────────────────────┤
│  [State & Storage Subsystem]                                           │
│    ├── Versioned Persistence (schemaVersion: 2, appVersion)             │
│    ├── Automatic Migration: migrateV1ToV2                              │
│    ├── Deterministic UUIDs: crypto.randomUUID()                        │
│    └── Backup & Restore: Strict JSON validation                        │
├────────────────────────────────────────────────────────────────────────┤
│  [Deployment & PWA Subsystem]                                          │
│    ├── Vite: base '/PB-CivilLab/' + Content-Hashed Chunks              │
│    ├── Single PWA Authority: vite-plugin-pwa (No duplicate public/sw) │
│    ├── Node 22/24 LTS Toolchain + Deterministic package-lock.json      │
│    └── GitHub Actions: Official pages-artifact deployment              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. P0, P1, P2 Issue Resolution Table

| Phase | Finding ID | Severity | Action Items |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **P0-01, P0-03, P0-04** | **P0** | Fix Vite base path to `/PB-CivilLab/` with environment fallback; delete dead `public/sw.js` and `public/manifest.json`; remove `bun.lock` and generate `package-lock.json`; modernize `.github/workflows/deploy.yml` with GitHub Pages artifact deployment and Node 24 LTS; add `.nvmrc`. |
| **Phase 1** | **P0-02** | **P0** | Strip monkey-patches from `index.html`; introduce production React `ErrorBoundary` with reload and safe cache recovery. |
| **Phase 2** | **P0-05, P0-06** | **P0** | Implement central `CalculationStatus` and `ValidationIssue[]` contract; eliminate silent `Math.max`/`Math.min`/`\|\|` coercion across all calculators in `src/utils/calculations.ts` and `src/utils/engineeringEngine.ts`. |
| **Phase 3** | **P0-07, P1-02, P1-04, P1-07** | **P0/P1** | Consolidate persistence to single source of truth; implement versioned schema and migration; replace `Date.now()` and `Math.random()` with `crypto.randomUUID()`; eliminate fake default metadata. |
| **Phase 4** | **P1-01, P1-03** | **P1** | Build unified reporting pipeline in `src/report/`: `ReportDocumentModel.ts`, `buildReportDocument.ts`, `EngineeringReportView.tsx`, and `report.css`; isolate `#pb-civillab-print-root`. |
| **Phase 5** | **P2-01, P2-02** | **P2** | Overhaul responsive layouts, combobox ARIA accessibility in `UnitInput.tsx`, touch targets >= 48px, and remove awkward text truncation. |
| **Phase 6** | **P1-05, P1-06** | **P1/P2** | Civil engineering domain hardening: BBS cutting logic, surveying closure checks, soil compaction factors, and rate library provenance. |
| **Phase 7** | **QA & Tests** | **P0/P1** | Automated test suite expansion: unit tests for all validation paths, numerical precision invariants, report pagination stress tests, and deployment verification. |

---

## 3. Detailed Refactoring Order & Execution Sequence

```
1. TOOLCHAIN & DEPLOYMENT (P0)
   ├── 1.1 Remove bun.lock, generate package-lock.json
   ├── 1.2 Add .nvmrc (24.0.0)
   ├── 1.3 Clean index.html monkey-patches & add React ErrorBoundary
   ├── 1.4 Delete duplicate public/sw.js and public/manifest.json
   ├── 1.5 Update vite.config.ts (base: process.env.BASE_PATH || '/PB-CivilLab/', restore content hashes)
   └── 1.6 Modernize .github/workflows/deploy.yml (pages-artifact action)

2. CALCULATION ENGINE & VALIDATION HARDENING (P0)
   ├── 2.1 Define CalculationStatus & ValidationIssue contract in src/types/
   ├── 2.2 Refactor all calculation functions to reject invalid inputs without Math.max/min coercion
   ├── 2.3 Separate raw calculation results from display formatting
   └── 2.4 Add input validation tests for zero, negative, NaN, Infinity, and impossible geometry

3. PERSISTENCE, STATE & IDENTITY REFACTOR (P0/P1)
   ├── 2.1 Implement schemaVersion: 2 with migration from v1
   ├── 2.2 Consolidate history under ProjectWorkspace
   ├── 2.3 Replace Math.random() / Date.now() with crypto.randomUUID()
   ├── 2.4 Remove fabricated default project metadata
   └── 2.5 Implement validated Project Backup export/import

4. UNIFIED REPORTING SUBSYSTEM (P1)
   ├── 4.1 Create src/report/ReportDocumentModel.ts
   ├── 4.2 Create src/report/buildReportDocument.ts
   ├── 4.3 Create src/report/EngineeringReportView.tsx & src/report/report.css
   ├── 4.4 Mount #pb-civillab-print-root for synchronized preview and print
   └── 4.5 Deprecate disconnected text-clipping code in pdfExport.ts

5. RESPONSIVE DESIGN & ACCESSIBILITY OVERHAUL (P2)
   ├── 5.1 UnitInput combobox ARIA overhaul with keyboard support
   ├── 5.2 Responsive breakpoint tuning (320px to 4K) with min-h-[48px] touch targets
   └── 5.3 Removal of text truncation from formulas and engineering notes

6. AUTOMATED VERIFICATION & RELEASE HARDENING
   ├── 6.1 Run npm run typecheck
   ├── 6.2 Run comprehensive automated test suite (npm test)
   ├── 6.3 Run production build (npm run build)
   └── 6.4 Verify dist output paths and hash consistency
```

---

## 4. Files to Create, Replace, Merge, or Delete

### Files to Create:
- `docs/ENGINEERING_AUDIT.md` (Forensic audit documentation)
- `docs/REFACTOR_PLAN.md` (Architectural plan)
- `.nvmrc` (Node 24 LTS version pinning)
- `src/components/ErrorBoundary.tsx` (Production crash recovery)
- `src/report/ReportDocumentModel.ts` (Canonical report schema)
- `src/report/buildReportDocument.ts` (Model builder from calculations)
- `src/report/EngineeringReportView.tsx` (Single DOM for Preview & Print)
- `src/report/report.css` (Targeted report print rules)
- `tests/validation.test.ts` (Negative and edge-case calculation tests)
- `tests/report.test.ts` (Report model integrity and text wrapping tests)

### Files to Delete / Merge:
- `bun.lock` -> **DELETE** (Standardize on npm and `package-lock.json`)
- `public/sw.js` -> **DELETE** (Collides with `vite-plugin-pwa` generated service worker)
- `public/manifest.json` -> **DELETE** (Collides with `vite-plugin-pwa` generated manifest)
- `src/components/CodeSelector.tsx` -> **MERGE/ALIAS** with `src/components/Common/CodeSelector.tsx`

---

## 5. Required Automated Tests

1. **Validation & Numerical Safety Tests:**
   - Bar diameter <= 0, length <= 0, quantity < 1 -> Rejected with validation error, status='invalid'.
   - Concrete mix with 0 volume or 0:0:0 ratio -> status='invalid'.
   - Staircase with 0 riser or impossible headroom -> status='invalid'.
   - Surveying benchmark with RL = 0 -> Valid (0 is a legitimate physical datum), no silent fallback to 100.
   - Surveying with run = 0 -> status='invalid' (divide-by-zero blocked, explicit vertical face error).
2. **Precision Invariant Tests:**
   - Intermediate double-precision values maintain full precision across chained arithmetic.
   - Conversion from unit A to B and back to A preserves input value within floating-point epsilon.
3. **Report Model & DOM Tests:**
   - 200+ character project names wrap without clipping.
   - Empty optional metadata fields omit cleanly without rendering "undefined" or fabricated text.
   - Formulas and calculation traces remain readable across multi-page pagination.
4. **Build & Deployment Tests:**
   - `dist/index.html` references hashed JS/CSS assets under `/PB-CivilLab/`.
   - `dist/.nojekyll` and `dist/404.html` exist.
   - Service worker registers without 404s.
