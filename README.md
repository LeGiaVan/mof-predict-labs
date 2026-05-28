# MOFs Predictor — Scientific Web Application

A modern, full-stack web application for predicting **Drug Loading Capacity** and **Cytotoxicity** of **Metal-Organic Frameworks (MOFs)** materials using simulated machine learning models.

## Deployment: 
https://mof-predict-labs.legiavan0210.workers.dev/

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run Development Server](#run-development-server)
- [Usage](#usage)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

**MOFs Predictor** is a scientific simulation platform designed for researchers studying Metal-Organic Frameworks. The application provides:

- **Drug Loading Capacity Prediction** — Estimate how much drug a MOF can carry (g/g) based on central metal atom, organic ligand, and Morgan fingerprint bits.
- **Cytotoxicity Prediction** — Predict cell viability percentage based on MOF composition, concentration, particle size, Zeta potential, and exposure time.
- **Batch Processing** — Upload CSV or Excel files to run predictions on multiple MOF configurations at once.
- **Prediction History** — View and track all past predictions stored in the database.

> **Note:** This project uses **mock API** endpoints that simulate ML inference with realistic scientific formulas. It is intended for demonstration, research prototyping, and educational purposes.

---

## Features

| Module | Description |
|--------|-------------|
| **Drug Loading Predictor** | Input MOF composition (metal, ligand, fingerprint bits) and get predicted loading capacity with feature impact visualization (SHAP-style bar chart). |
| **Cytotoxicity Predictor** | Input concentration, size, Zeta potential, exposure time to predict cell viability with smart color-coded progress indicator. |
| **Batch Prediction** | Upload `.csv` or `.xlsx` files for bulk predictions. Downloadable template included. |
| **History Dashboard** | View all saved predictions fetched directly from the database with pagination. |
| **Responsive UI** | Built with Tailwind CSS and shadcn/ui components. Works on desktop and mobile. |
| **Real-time Feedback** | Toast notifications for success/error states using Sonner. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19 + SSR/SSG) |
| **Build Tool** | Vite 7 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **Charts** | Recharts |
| **Database** | Supabase (PostgreSQL) |
| **State / Notifications** | Sonner (toasts) |
| **Icons** | Lucide React |

---

## Project Structure

```
mof-predict-labs/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── CytotoxicityModule.tsx    # Cytotoxicity predictor UI
│   │   ├── DrugLoadingModule.tsx     # Drug loading predictor UI
│   │   └── HistoryModule.tsx         # Prediction history table
│   ├── hooks/
│   │   └── use-mobile.tsx            # Mobile breakpoint hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── auth-attacher.ts      # Attach auth to server functions
│   │       ├── auth-middleware.ts    # Auth middleware for server functions
│   │       ├── client.ts           # Supabase browser client
│   │       ├── client.server.ts    # Supabase admin client (server-only)
│   │       └── types.ts            # Auto-generated Supabase types
│   ├── lib/
│   │   ├── batch-input.ts          # CSV/Excel parsing utilities
│   │   ├── error-capture.ts        # Error handling
│   │   ├── error-page.ts           # Error page helpers
│   │   ├── mock-api.ts             # Mock prediction API logic
│   │   └── utils.ts                # General utilities
│   ├── routes/
│   │   ├── __root.tsx              # Root layout (shell)
│   │   └── index.tsx               # Homepage with tabs
│   ├── router.tsx                  # TanStack Router setup
│   ├── server.ts                   # Server entry
│   ├── start.ts                    # TanStack Start configuration
│   └── styles.css                  # Global styles & design tokens
├── supabase/
│   ├── config.toml                 # Supabase local config
│   └── migrations/                 # Database migrations
├── .env                            # Environment variables (not tracked)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc                  # Cloudflare Workers config
```

---

## Getting Started

### Prerequisites

Ensure you have one of the following package managers installed:

- [Node.js](https://nodejs.org/) (v18+) with `npm`
- or `pnpm`
- or `yarn`

> **Note:** This project uses `bun` by default in the Lovable environment. On Windows without Bun, use `npm` instead.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/mof-predict-labs.git
   cd mof-predict-labs
   ```

2. **Install dependencies:**

   ```bash
   # Using npm (recommended for Windows)
   npm install

   # Or using pnpm
   pnpm install

   # Or using yarn
   yarn install
   ```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

> **Important:** The values above are example publishable keys for the connected Supabase project. Replace them with your own if you are using a different backend.

### Run Development Server

```bash
# Using npm
npm run dev

# Or with pnpm
pnpm dev

# Or with yarn
yarn dev
```

The app will be available at: **http://localhost:3000**

---

## Usage

1. **Drug Loading Prediction**
   - Select the central metal atom and organic ligand.
   - Check/uncheck Morgan fingerprint bits.
   - Click **"Predict Loading Capacity"** to see results.
   - View the feature impact bar chart.

2. **Cytotoxicity Prediction**
   - Fill in concentration, particle size, Zeta potential, and exposure time.
   - Click **"Predict Cytotoxicity"** to get cell viability.
   - Observe the color-coded survival progress bar.

3. **Batch Prediction**
   - Download the CSV template from either module.
   - Fill in your data and upload the file.
   - Click **"Predict Batch File"** to process all rows.

4. **View History**
   - Switch to the **History** tab to see all past predictions.
   - Data is fetched live from the Supabase database.

---

## Database Schema

The application uses the following Supabase tables:

### `drug_loading_predictions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `central_metal_atom` | `text` | Metal atom (Zn, Cr, Fe, Cu, Zr, Mg) |
| `organic_ligand` | `text` | Ligand (Dio, Bdc, Isa, Meim) |
| `bit148` | `boolean` | Morgan fingerprint bit 148 |
| `bit223` | `boolean` | Morgan fingerprint bit 223 |
| `bit657` | `boolean` | Morgan fingerprint bit 657 |
| `predicted_loading_capacity` | `float` | Predicted loading in g/g |
| `created_at` | `timestamptz` | Auto-generated timestamp |

### `cytotoxicity_predictions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `central_metal_atom` | `text` | Metal atom |
| `organic_ligand` | `text` | Ligand |
| `concentration` | `float` | Concentration (µg/mL) |
| `size` | `float` | Particle size (nm) |
| `zeta_potential` | `float` | Zeta potential (mV) |
| `exposure_time` | `integer` | Exposure time (hours) |
| `predicted_cell_viability` | `float` | Predicted viability (%) |
| `created_at` | `timestamptz` | Auto-generated timestamp |

Both tables are configured with **Row Level Security (RLS)** policies allowing public read/write access for demonstration purposes.

---

## API Reference

### Mock Prediction Functions

Located in `src/lib/mock-api.ts`:

#### `predictDrugLoading(payload: DrugLoadingPayload): Promise<DrugLoadingResponse>`

Simulates ML inference for drug loading capacity.

**Payload:**
```ts
{
  central_metal_atom: string;  // "Zn", "Cr", "Fe", "Cu", "Zr", "Mg"
  organic_ligand: string;      // "Dio", "Bdc", "Isa", "Meim"
  bit148: boolean;
  bit223: boolean;
  bit657: boolean;
}
```

**Response:**
```ts
{
  loading_capacity: number;    // e.g., 0.234
  unit: "g/g";
}
```

#### `predictCytotoxicity(payload: CytotoxicityPayload): Promise<CytotoxicityResponse>`

Simulates ML inference for cytotoxicity.

**Payload:**
```ts
{
  central_metal_atom: string;
  organic_ligand: string;
  concentration: number;        // µg/mL
  size: number;                 // nm
  zeta_potential: number;       // mV
  exposure_time: number;        // hours (24, 48, 72)
}
```

**Response:**
```ts
{
  cell_viability: number;     // 10 - 100
  unit: "%";
}
```

---

## Screenshots

> *(Screenshots can be added here once the app is running)*

### Drug Loading Module
- Input form with metal/ligand selectors
- SHAP-style feature impact bar chart
- Batch file upload support

### Cytotoxicity Module
- Parameter input form
- Cell viability result with smart progress bar
- Concentration-based survival visualization

### History Tab
- Paginated data table
- Live data from Supabase

---

## License

This project is built for research and educational purposes. Feel free to modify and extend it for your own scientific applications.

---

## Acknowledgments

- Built with [Lovable](https://lovable.dev) — AI-powered full-stack development platform.
- UI components powered by [shadcn/ui](https://ui.shadcn.com).
- Charts powered by [Recharts](https://recharts.org).
- Backend powered by [Supabase](https://supabase.com).

---

> **Made for MOFs Research Community** 🧪🔬
