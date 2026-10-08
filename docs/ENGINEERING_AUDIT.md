# PB CivilLab — Forensic Engineering Audit

**Date:** 2026-10-08  
**System:** PB CivilLab (Civil Engineering Smart Toolkit & Computational Suite)  
**Lead Auditor:** Senior Civil Engineering Software Architect & Full-Stack Systems Specialist  
**Target Environment:** GitHub Pages (`/PB-CivilLab/`) & Offline Progressive Web App  

---

## 1. Executive Summary

PB CivilLab is a specialized civil engineering calculation suite designed for site engineers, quantity surveyors, and project managers. An exhaustive forensic audit was conducted across every module: engineering algorithms, validation routines, unit conversions, state management, storage, reporting engines (Preview, Browser Print, jsPDF, CSV, JSON, Excel), PWA caching, Vite configuration, GitHub Actions workflow, and responsive accessibility.

While the application features extensive calculation coverage, several critical engineering and deployment vulnerabilities were identified:
1. **P0 (Deployment & Data Integrity):** Silent coercion of invalid engineering inputs via `Math.max`/`Math.min`/`||` defaults; case-sensitive GitHub Pages URL mismatch (`/pb-civillab/` vs `/PB-CivilLab/`); duplicated PWA service workers in `public/sw.js` conflicting with `vite-plugin-pwa`; monkey-patched global errors hiding runtime failures in `index.html`; lack of deterministic package lockfile (`bun.lock` vs `package-lock.json`).
2. **P1 (Reporting & Architecture):** Fragmented report generation logic duplicated across `PrintPreviewModal.tsx`, `pdfExport.ts`, and `exportEngine.ts`; risk of text truncation and uncoordinated page breaking; dual persistence models (global `history` vs project `history`) risking desynchronization; fabricated default metadata (prefilling fake clients and jobsites).
3. **P2 (Usability & Polish):** Mobile touch targets below 48px; lack of accessible combobox semantics for unit selectors; mixed color tokens and truncation of formulas in compact viewports.

---

## 2. P0, P1, P2 Forensic Findings Matrix

| ID | Severity | Category | Component | Description & Engineering Risk |
| :--- | :--- | :--- | :--- | :--- |
| **P0-01** | **P0** | **Deployment** | `vite.config.ts` | Case sensitivity mismatch: repo base `/pb-civillab/` vs GitHub Pages `/PB-CivilLab/` caused blank white screens on asset 404s. |
| **P0-02** | **P0** | **Deployment** | `index.html` | Aggressive monkey-patching of `window.fetch`, `window.WebSocket`, `console.error`, and `unhandledrejection` suppressed real runtime exceptions. |
| **P0-03** | **P0** | **Deployment** | `public/sw.js` & `public/manifest.json` | Duplicate static PWA files in `public/` collided with `vite-plugin-pwa` build outputs (`dist/sw.js` and `manifest.webmanifest`), causing stale chunk caching. |
| **P0-04** | **P0** | **Deployment** | Root Toolchain | Presence of `bun.lock` with missing `package-lock.json`; GitHub Actions workflow used non-deterministic `npm ci \|\| npm install --legacy-peer-deps`. |
| **P0-05** | **P0** | **Engineering** | `src/utils/calculations.ts` | Ubiquitous use of `Math.max(0, ...)`, `Math.max(1, ...)`, `\|\| 1.25`, and `??` silently turning invalid/negative/zero engineering inputs into valid-looking output. |
| **P0-06** | **P0** | **Engineering** | All Calculators | Lack of unified `CalculationStatus = 'valid' \| 'warning' \| 'invalid'` result contract. Invalid calculations returned plausible numbers instead of blocking execution. |
| **P0-07** | **P0** | **Data Loss** | `src/App.tsx` | Split persistence between `pb_civillab_history` and `pb_civillab_projects[].history` caused history items to desync or disappear during workspace switching. |
| **P1-01** | **P1** | **Reporting** | Reporting Architecture | 3 independent report generation engines (`PrintPreviewModal.tsx`, `pdfExport.ts`, `exportEngine.ts`) with diverging layout logic, formula text truncation, and inconsistent margins. |
| **P1-02** | **P1** | **Ethics / Data** | `src/App.tsx` | Prefilling fabricated project metadata (`Client: Site Engineering Office`, `Location: Jobsite Location`, `Prepared By: Prokash Biswas`) violates Rule #1. |
| **P1-03** | **P1** | **Reporting** | `pdfExport.ts` & Print | Global print CSS rules rewrote standard application DOM (`* { box-shadow: none !important }`) instead of isolating a dedicated `#pb-civillab-print-root`. |
| **P1-04** | **P1** | **Identities** | IDs & Document Nos | Usage of `Date.now()` and `Math.random()` to generate document numbers and IDs causes documents to change identity on every preview open. |
| **P1-05** | **P1** | **Engineering** | Concrete & Masonry | Hard-coded nominal mix ratios presented as guaranteed strength grades without explicit warning that nominal proportions require laboratory trial batches. |
| **P1-06** | **P1** | **Engineering** | Surveying HI / Rise & Fall | Fallback to arbitrary Benchmark RL = 100 when user provided 0 or empty datum; potential loss of floating-point precision on intermediate legs. |
| **P1-07** | **P1** | **Persistence** | Storage Architecture | Unversioned JSON storage in `localStorage` without schema migration handlers (`migrateV1ToV2`), risking app crash on future schema evolution. |
| **P1-08** | **P1** | **Deployment** | GitHub Actions | Deprecated `gh-pages` branch commit action instead of official GitHub Pages Artifact workflow (`actions/upload-pages-artifact` + `actions/deploy-pages`). |
| **P2-01** | **P2** | **A11y / UI** | `UnitInput.tsx` | Unit selector lacked accessible combobox/listbox ARIA semantics (`aria-expanded`, keyboard arrows, focus trap) and collision-aware dropup. |
| **P2-02** | **P2** | **Responsive** | Calculator Inputs | Some numeric inputs on mobile viewports (<360px) caused layout squeeze or lacked minimum 44–48px touch targets for jobsite gloved usage. |
| **P2-03** | **P2** | **Code Hygiene** | Unused Files | Redundant files and duplicated components (`CodeSelector.tsx` in both root components and Common) created confusing import paths. |
| **P2-04** | **P2** | **Docs / README** | `README.md` | Inaccurate documentation claims regarding backend services and legacy Node requirements. |

---

## 3. Deep-Dive Subsystem Audits

### 3.1. Calculations & Mathematical Safety
- **Silent Coercion:**
  - `calculateBBS`: `Math.max(1, barDiaMm)`, `Math.max(0, dims.a)` coerced negative bar diameters to 1mm.
  - `calculateConcreteMix`: `Math.max(0, wetVolM3)`, `Math.max(1, dryFactor)` disguised zero volume as valid computation.
  - `calculateBrickwork`: `Math.max(0, wallLengthM)` allowed 0m wall to produce 0 bricks without emitting an invalid input error.
  - `calculateStaircase`: Coerced tread/risers with `Math.max(1, riserMm)` preventing detection of impossible geometric headroom or stairs with 0 steps.
  - `calculateSlope`: Did not distinguish between horizontal level ground (rise=0, run>0) and impossible vertical plumb face with divide-by-zero (run=0).
- **Intermediate Rounding:**
  - Surveying and rebar calculations previously rounded numbers before downstream multiplication, accumulating IEEE 754 precision errors.
- **Contract Standardization:**
  - Need a standardized `CalculationStatus` ('valid' | 'warning' | 'invalid') and `ValidationIssue[]` array so UI and reports can refuse to compute or display invalid states.

### 3.2. Print, Preview, and PDF Pipeline
- **Root Cause of Reporting Inconsistencies:**
  - Preview renders React DOM inside a modal.
  - Native browser print relied on global CSS in `src/print.css` attempting to hide everything except modal elements via complex `:not()` selectors.
  - `exportCalculationToPDF` used `jspdf` drawing primitives with hardcoded character coordinate math, arbitrary string slices (`text.slice(0, 32)`), and different margin calculations.
- **Unified Target Solution:**
  - Introduce **`ReportDocumentModel`**: A single immutable document structure.
  - Introduce **`EngineeringReportView`**: A pure React component that renders the canonical DOM for preview and browser print into a dedicated `#pb-civillab-print-root`.
  - Zero text clipping: Use `overflow-wrap: anywhere`, `word-break: break-word`, and `break-inside: avoid` on atomic table rows and QA blocks rather than entire sections.

### 3.3. GitHub Pages Deployment & Build Pipeline
- **Asset Resolution:**
  - When hosted at `https://<user>.github.io/PB-CivilLab/`, all asset URLs must correctly resolve either with base `/PB-CivilLab/` or robust relative paths.
  - Vite Rollup configuration had fixed non-hashed names (`assets/[name].js`), preventing cache busting when new updates were deployed.
  - Duplicate `public/sw.js` clashed with Workbox `sw.js` generated by `vite-plugin-pwa`.
- **GitHub Actions:**
  - Move to modern GitHub Pages artifact deployment with explicit Node 22/24 LTS alignment and `npm ci`.

### 3.4. State, Persistence & Document Identity
- **Single Source of Truth:**
  - Project Workspaces must own their history. Global history is a derived view or fallback.
  - Stored data must include `schemaVersion: 2`, `appVersion`, and an automatic migration routine.
  - All IDs must use standard `crypto.randomUUID()`.
  - Document numbers must be persistent attributes of the report or project revision, not recomputed via `Math.random()` on modal open.
