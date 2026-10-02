# PB CivilLab

### Civil Engineering Tools by Prokash Biswas
**Calculate Smarter. Build Better.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

---

## 🏗️ Overview

**PB CivilLab** is a high-precision, production-grade civil engineering software platform designed for structural designers, site engineers, quantity surveyors, estimators, project managers, and civil engineering students.

Unlike black-box calculators, PB CivilLab delivers **total mathematical transparency**: every single calculation displays its governing formula, step-by-step substituted arithmetic trace, material factor assumptions, practical jobsite quality precautions, and relevant building code citations (**BNBC 2020, ACI 318, IS 456 / IS 1786, ASTM, BS 8110 / Eurocode 2**).

---

## 🌟 Key Capabilities & Modules

### 1. 📐 Materials & Concrete Technology
- **Concrete Volume Calculator**: Computes wet concrete volume in both $m^3$ and $\text{CFT}$ for slabs, rectangular/T-beams, rectangular/circular columns, isolated/trapezoidal footings, and retaining walls.
- **Concrete Material Mix Breakdown**: Calculates exact 50 kg cement bags, dry sand ($\text{CFT}$ & $m^3$), coarse aggregate, and mixing water with dry volume factors ($1.54$) and customizable wastage percentages.
- **Water-Cement Ratio ($w/c$) Calculator**: Verifies target durability and slump requirements per ACI 211 / IS 10262.
- **Cement Bags & Bulk Mass**: Converts bulk target weight into standard $50\text{ kg}$ sacks or volumetric silos.

### 2. 🧱 Masonry & Architectural Finishes
- **Brickwork & Mortar Estimator**: Exact modular or traditional brick count, wet/dry mortar volume, cement sacks, and sand requirement with automatic deductions for door and window openings.
- **Wall & Ceiling Plaster Calculator**: Calculates mortar volume with dry factor ($1.33$), cement bags, and sand for $12\text{ mm}$, $15\text{ mm}$, or $20\text{ mm}$ coats.
- **Flooring & Wall Tiles**: Calculates tile piece counts, box numbers, skirting allowances, and net grout area.
- **Paint & Surface Coating Estimator**: Estimates primer, wall putty, and topcoat in liters and gallons based on wall area and coat passes.

### 3. 🔩 Structural RCC & Reinforcement
- **Rebar / Steel Weight & Cost Calculator**: Computes theoretical steel mass using $W = \frac{D^2}{162.2}\text{ kg/m}$ or exact density $\pi \frac{D^2}{4}\rho$ for diameters $\varnothing 6\text{ mm}$ to $\varnothing 40\text{ mm}$.
- **Bar Bending Schedule (BBS) Helper**: Calculates cutting lengths for straight bars, L-bends, U-hooks, and rectangular column ties/stirrups with standard bend deductions.
- **Preliminary Structural Steel Estimator**: Thumb-rule reinforcement mass estimation for slabs ($0.7\text{--}1.0\%$), beams ($1.0\text{--}2.0\%$), columns ($1.0\text{--}4.0\%$), and footings ($0.5\text{--}0.8\%$).
- **Component Calculators**: Dedicated modules for Slabs (One-Way vs Two-Way classification), Beams, Columns, Footings, and Staircases ($2R + T$ rule).
- **Formwork / Shuttering Area**: Computes contact surface area for plywood and steel staging.

### 4. 🚜 Geotechnical & Earthwork
- **Earthwork Excavation & Trenching**: Computes volumes for sloped pits and trapezoidal trenches with side slopes ($1:m$).
- **Soil Volume Conversion**: Interconverts Bank Cubic Meters ($\text{BCM}$), Loose Cubic Meters ($\text{LCM}$), and Compacted Cubic Meters ($\text{CCM}$) using bulking and shrinkage factors.
- **Truck & Trolley Haulage**: Estimates vehicle trip counts based on excavated soil volume and dump truck capacities.
- **Road Earthwork**: Longitudinal highway cutting and filling using Average End-Area and Simpson's Prismoidal formulation.

### 5. 🔭 Field Surveying & Road Geometry
- **Leveling — Height of Instrument (HI) Method**: Complete leveling field book sheet with automatic arithmetic check ($\sum BS - \sum FS = \text{Last }RL - \text{First }RL$).
- **Leveling — Rise and Fall Method**: Elevation differentials with verification check ($\sum Rise - \sum Fall = \text{Last }RL - \text{First }RL$).
- **Slope, Gradient & Rise-Run**: Converts between slope percentage ($\%$), gradient ratio ($1:N$), angle in degrees, and horizontal run.
- **Road Chainage & Stations**: Computes incremental chainage markers (e.g. $0+000$, $1+250.50$).
- **DMS ↔ Decimal Degrees**: Instant conversions for theodolite and total station angular data.
- **Coordinate Distance & Azimuth**: Computes grid distance and Whole Circle Bearing ($\text{WCB}$) from Easting/Northing pairs.

### 6. 📊 Quantity Takeoff & Cost Estimation
- **Measurement Sheet Takeoff ($L \times W \times H$)**: Dynamic itemized takeoff spreadsheet with live subtotals.
- **Bill of Quantities (BOQ) Summary**: Comprehensive BOQ generator with customizable currency ($\text{BDT \u09f3}$, $\text{USD \$}$, $\text{INR \u20b9}$, $\text{EUR \u20ac}$), contractor overhead ($\%$), contingencies, and tax/VAT.
- **Unit Rate Analysis for $1\text{ m}^3$ RCC**: Granular breakdown of materials, head mason, helper labor, equipment vibrator, and profit margins.

### 7. 🔄 Universal Engineering Unit Converter
- Comprehensive dimensional conversions for **Length**, **Area** (including regional land units: *Decimal*, *Katha*, *Bigha*, *Acre*, *Hectare*), **Volume** ($\text{CFT}$, $m^3$, liters, gallons), **Mass**, **Pressure / Stress** ($\text{MPa}$, $\text{psi}$, $\text{kPa}$, $\text{N/mm}^2$), **Force** ($\text{kN}$, $\text{kip}$, $\text{lbf}$), and **Slope**.
- Includes a dedicated construction **Feet-Inch Decimal Parser** (e.g. converts $12'\text{--}4\ \frac{1}{2}''$ to decimal feet, meters, and millimeters).

### 8. 🔍 Universal Intelligent Launcher (`Ctrl + K` or `/`)
- Instant search starting from the first character (`c`, `reb`, `cft`, `m3`, `rl`, `slab`, `boq`).
- Multi-tier relevance engine indexing calculators, engineering units, and standard equations.
- Fully navigable with keyboard (`\u2191`, `\u2193`, `Enter`, `Esc`).
- Privacy-preserving local analytics tracking recently used and frequent tools.

### 9. 🖨️ Dedicated Engineering Print & PDF Report Engine
- Full-screen **WYSIWYG Print Preview Canvas** with live paper margins and typography.
- Supports **A4, Letter, Legal, A3, and A5** in both **Portrait and Landscape**.
- Generates official document numbers (`PBCL-2026-XXXXXX`) and captures project metadata (Project Name, Client, Location, Engineer, Revision).
- **Quality Assurance Sign-Off Block**: Standard 3-signature verification area (*Prepared By*, *Checked By*, *Approved By*).
- Exports clean, un-clipped physical prints and vector PDFs directly through browser print engines with zero external server dependencies.

---

## 🔒 Security & Privacy Architecture

PB CivilLab is built with a **strict local-first, zero-leak security architecture**:

1. **100% Client-Side Deterministic Privacy**: All calculations run locally in the browser with zero external network dependencies or telemetry.
2. **Hardened HTTP Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-XSS-Protection: 1; mode=block`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
3. **Local Data Isolation**: All calculation history, favorites, custom units, and project settings reside strictly in the user's browser (`localStorage`). No project data is ever transmitted to remote servers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans, JetBrains Mono |
| **Build Tooling** | Vite 8, ESBuild, PostCSS |
| **Backend & Static Server** | Node.js, Express 4, TSX, Dotenv |
| **Offline & PWA** | Web App Manifest, Service Worker Caching, Mobile Viewport Adaptations |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prokashbiswas8801/pb-civillab.git
   cd pb-civillab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your Google Gemini API key (optional, only required for the AI Advisor module):
   ```env
   PORT=3000
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Production Build & Deployment

### 1. Build the Application
To build the optimized client bundle:
```bash
npm run build
```
This generates production assets in the `/dist` directory.

### 2. Verify with Type Check
```bash
npm run lint
```

### 3. Run Automated Engineering Verification Tests
```bash
npm test
```
Executes regression tests verifying structural formulas, rebar weights ($D^2/162.2$), concrete mix designs ($1.54$ dry factor), brick counts ($1.33$ mortar factor), and field surveying checks.

### 4. Run Production Server Locally
```bash
NODE_ENV=production npm start
```

---

## ☁️ Deployment Guides

### Option A: GitHub Pages (1-Click Static Deployment)
PB CivilLab includes a pre-compiled, relative-asset `/docs` folder for zero-config GitHub Pages hosting:
1. Open your repository on GitHub: `Settings` ➔ `Pages`.
2. Under **Build and deployment** > **Branch**:
   - Select branch: **`main`**
   - Select folder: **`/docs`**
   - Click **Save**.
3. Your live application will be available at:  
   `https://<username>.github.io/<repository-name>/`

### Option B: Render / Railway / Heroku (Full-Stack with AI Advisor)
1. Connect your GitHub repository.
2. Set Environment to **Node**.
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Under Environment Variables, set `NODE_ENV=production`.

### Option C: Docker / Container
A minimal Dockerfile for PB CivilLab:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

### Option D: Google Cloud Run
1. Build the container image using Cloud Build:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/pb-civillab
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy pb-civillab \
     --image gcr.io/PROJECT_ID/pb-civillab \
     --platform managed \
     --set-env-vars NODE_ENV=production \
     --allow-unauthenticated
   ```

---

## 📂 Project Structure

```text
pb-civillab/
├── public/                 # Static assets, logos, favicon & PWA manifest
│   ├── logo.svg
│   ├── logo-icon.svg
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/         # Modular UI components
│   │   ├── Calculators/    # 27+ specialized engineering calculators
│   │   ├── Common/         # PrintPreviewModal, QuickUnitConverter, Toast
│   │   ├── Dashboard.tsx   # Engineering overview & quick launcher
│   │   ├── Header.tsx      # Application header & search trigger
│   │   ├── Sidebar.tsx     # Collapsible navigation drawer
│   │   ├── ResultPanel.tsx # Output display with formula breakdown
│   │   └── SearchModal.tsx # Universal intelligent command palette
│   ├── constants/          # Engineering standards, densities, tools catalog
│   ├── types/              # Comprehensive TypeScript interfaces
│   ├── utils/              # Calculation formulas & unit conversion matrix
│   ├── App.tsx             # Root application orchestrator
│   ├── main.tsx            # Client entry point
│   └── index.css           # Tailwind CSS & print engine media queries
├── server.ts               # Production Express server & secure AI proxy
├── .env.example            # Safe environment template
├── .gitignore              # Git ignore rules for secrets and build artifacts
├── LICENSE                 # Proprietary legal notice
├── SECURITY.md             # Vulnerability disclosure policy
├── CHANGELOG.md            # Release version history
└── package.json            # Dependencies and build scripts
```

---

## ⚖️ Engineering Disclaimer

PB CivilLab is an engineering computation tool created to aid qualified civil engineers, architects, project managers, and surveyors. While every algorithm is rigorously designed around recognized building codes (**BNBC, ACI 318, IS 456, ASTM, Eurocode**), software calculations must always be independently audited, reviewed, and certified by a registered Professional Engineer (PE) or licensed structural engineer before physical fabrication, casting, excavation, or construction execution.

---

## 👤 Author & Creator

**PB CivilLab** was conceived, designed, and developed by:

**Prokash Biswas**  
*Civil Engineering Software & Technology*  
*Calculate Smarter. Build Better.*

---

## 📄 License

Copyright &copy; 2026 **Prokash Biswas**. All rights reserved.  
Unauthorized copying, duplication, distribution, modification, or commercial exploitation is strictly prohibited. See [LICENSE](LICENSE) for full legal terms.
