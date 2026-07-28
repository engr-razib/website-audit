# 🚀 Website Audit Monorepo (`turbo`)

A high-performance, full-stack **Website Audit Platform & Microservice** built as a modern monorepo powered by **Turborepo (`turbo`)**.

It features a **Next.js 14+ (App Router) + Tailwind CSS + Shadcn UI** web dashboard frontend, backed by a **Node.js, Express, Playwright & ExcelJS** REST API backend service.

---

## 🏗️ Monorepo Architecture

```
findingFontName/
├── package.json               # Root monorepo workspace configuration
├── turbo.json                 # Turborepo task pipelines (dev, build, test, lint)
├── README.md                  # Complete monorepo documentation
├── apps/
│   ├── backend/               # @audit/backend (Express REST API - Port 3000)
│   │   ├── package.json       # Express, Playwright, ExcelJS dependencies
│   │   ├── server.js          # REST API server
│   │   ├── services/          # Audit crawler, font classifier, Excel generator
│   │   ├── tests/             # Node native unit tests (API endpoints)
│   │   ├── postman_collection.json
│   │   └── postman_environment.json
│   │
│   └── frontend/              # @audit/frontend (Next.js App Router - Port 3001)
│       ├── package.json       # Next.js, Tailwind CSS, Lucide icons
│       ├── src/
│       │   ├── app/           # App Router pages, layout, and global CSS
│       │   ├── components/    # Shadcn UI primitives & Audit Dashboard views
│       │   └── lib/           # API client & Tailwind helper utilities
│       └── tests/             # Frontend structure tests
```

---

## 🌟 Key Features

1. **Font Licensing & Classification**:
   - Classifies fonts into **Free / Google / System Fonts** (e.g. Barlow, Roboto, Inter, Open Sans, Montserrat) vs **Premium / Commercial Fonts** (e.g. Dinot, Proxima Nova, Futura, Helvetica Neue).
   - Generates interactive font family cards and visual previews.

2. **CTA Button Design Token Audit**:
   - Scans call-to-action buttons (`<button>`, `a.btn`, `input[type="submit"]`).
   - Extracts design tokens: font family, font size, font weight, background color, text color, border radius, padding, and CSS selector.

3. **Accessibility (Alt Tag) & SEO Rules Compliance**:
   - Identifies images missing `alt` attributes or containing empty `alt=""`.
   - Audits heading hierarchy (`<h1>` - `<h6>`), page title length, and meta descriptions.

4. **Multi-Tab Excel & JSON Export**:
   - Downloads styled Excel workbooks (`.xlsx`) with 6 worksheets:
     - `Executive Summary`
     - `Font Families Audit`
     - `Button & CTA Designs`
     - `Missing Alt Tag Images`
     - `Heading Typography (H1-H6)`
     - `SEO Rules Audit`

---

## ⚙️ Getting Started & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
Clone the repository and install all monorepo dependencies in one command:

```bash
npm install
```

---

## 🚀 Running the Monorepo

### 1. Concurrent Development Mode (Backend + Frontend)
Run Turborepo dev mode to start both backend and frontend applications concurrently:

```bash
npm run dev
```

- **Frontend App**: `http://localhost:3001`
- **Backend REST API**: `http://localhost:3000`

### 2. Building for Production
Build all applications in parallel using Turborepo:

```bash
npm run build
```

---

## 🧪 Running Test Suites

Run unit and integration test suites across both applications (`@audit/backend` and `@audit/frontend`):

```bash
npm test
```

### Individual Application Tests
- **Backend Tests**: `npm --workspace=@audit/backend test`
- **Frontend Tests**: `npm --workspace=@audit/frontend test`

---

## 🔌 REST API Endpoints Reference

The backend Express microservice exposes the following endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/audit/quick-scan` | Synchronous single-page quick scan |
| `POST` | `/api/audit/full` | Asynchronous XML sitemap crawler job |
| `GET` | `/api/audit/jobs/:jobId` | Poll background audit job status |
| `GET` | `/api/audit/jobs/:jobId/download/excel` | Download formatted Excel `.xlsx` report |
| `GET` | `/api/audit/jobs/:jobId/download/json` | Download full structured JSON report |

---

## 📑 Postman Collection

Ready-to-use Postman files are available inside `apps/backend/`:
1. `apps/backend/postman_collection.json`
2. `apps/backend/postman_environment.json`

Import both files into Postman to test all endpoints.
