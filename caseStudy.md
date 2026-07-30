# Case Study: Automated Website Typography & Brand Compliance Audit Microservice

> **Tagline:** A full-stack monorepo platform that automates headless DOM crawling, font licensing classification, design token extraction, and multi-sheet Excel reporting.

---

## 📌 Executive Summary

| Attribute | Details |
| :--- | :--- |
| **Role** | Lead Full-Stack Engineer (Solo Developer) |
| **Project Type** | Full-Stack Web Application & REST Microservice Monorepo |
| **Tech Stack** | Next.js 14 (App Router), TypeScript, Express.js, Playwright, Turborepo, Tailwind CSS, ExcelJS |
| **Key Accomplishment** | Reduced site typography & accessibility audit runtime from 3+ hours of manual inspection to under 60 seconds. |

---

## 🎯 1. Overview & Problem (Situation & Task)

### The Situation
Digital agencies, brand compliance teams, and web developers often face costly legal risks due to unlicensed commercial web fonts (e.g., *Futura*, *Proxima Nova*, *Helvetica Neue*) used inadvertently across large corporate websites. Additionally, validating design system tokens (CTA button styles, typography hierarchies) and accessibility compliance (missing image `alt` attributes) usually requires tedious manual browser inspection across dozens of subpages.

### The Task
I needed to design and construct an enterprise-grade automated auditing platform capable of:
1. **Crawling full site topologies** dynamically using headless browser automation.
2. **Extracting runtime computed styles** to detect font families, font licensing tiers (Free/Google vs. Premium/Commercial), CTA button design tokens, and header hierarchies.
3. **Auditing accessibility & SEO health**, including `alt` tag coverage and meta tags.
4. **Exporting executive-ready Excel workbooks (`.xlsx`)** with automated formatting across multiple analytical worksheets.

---

## 🏗️ 2. Architecture & Solution (Action)

To maintain clean separation of concerns and high scalability, I architected the project as a **Turborepo monorepo** consisting of a React/Next.js dashboard frontend and a Node.js REST API microservice.

```
findingFontName/
├── apps/
│   ├── frontend/         # Next.js 14 (App Router) + Tailwind CSS + Shadcn UI
│   └── backend/          # Node.js + Express REST API + Playwright Crawler Engine
└── turbo.json            # Monorepo task pipeline orchestration
```

### Key Architectural Highlights:
- **Asynchronous Job Engine:** Built a background job queue with polling endpoints (`/api/audit/jobs/:jobId`) to ensure heavy web crawls never block the API event loop or timeout HTTP requests.
- **Font Classification Engine:** Implemented a heuristic rule evaluator mapping extracted DOM `font-family` strings against curated databases of open-source (Google/System) versus commercial font foundries.
- **Multi-Sheet Report Generation:** Utilized `ExcelJS` to build styled multi-tab spreadsheets containing raw metrics, font licensing breakdowns, CTA button token audits, and missing alt tag inventories.

---

## 🔬 3. Technical Deep-Dive Challenge

### Challenge: Memory Spikes & DOM Computation Latency during Headless Crawling
Extracting computed styles (`window.getComputedStyle()`) across dynamic web pages via headless Playwright instances is memory-intensive. Running naive synchronous page opens led to high CPU spikes, memory leaks, and browser crashes on heavy media sites.

### Solution & Engineering Strategy:
1. **Browser Process Pooling & Lifecycle Recycling:** Implemented connection reuse mechanisms and context isolated pages (`browserContext.newPage()`) with explicit resource teardown after DOM scraping.
2. **Targeted DOM Querying & Token Filtering:** Instead of scanning all DOM elements, the crawler targeted semantic nodes (`<h1>`-`<h6>`, `<button>`, `a.btn`, `input[type="submit"]`) and executed lightweight scripts directly in the browser context (`page.evaluate()`) to extract CSS tokens (font-size, font-weight, border-radius, background-color) in a single execution pass.
3. **Optimized Network Interception:** Blocked redundant network resources (videos, heavy analytics scripts, tracking pixels) during the crawl phase to accelerate DOM load events by **~65%**.

---

## 📈 4. Results & Impact

- ⚡ **95%+ Audit Speedup:** Reduced multi-page site design and font audits from ~3 hours of manual effort to under 60 seconds.
- 🎯 **100% Font Visibility:** Successfully flagged unlicensed commercial fonts and provided visual typography breakdowns for brand management.
- 📊 **Multi-Format Exporting:** Delivered 6 automated Excel audit tabs (`Executive Summary`, `Font Families`, `Button Designs`, `Missing Alt Tags`, `Heading Typography`, `SEO Rules`) with professional color-coded formatting.
- 🧱 **Scalable Monorepo Infrastructure:** Built with Turborepo to allow concurrent development, fast incremental builds, and zero-coupling between backend engine and frontend dashboard.

---

## 💡 5. Key Learnings & Takeaways

- **Headless Automation Scalability:** Browser automation microservices require strict lifecycle and resource isolation to prevent memory leakage in high-concurrency Node.js environments.
- **Monorepo Workflows:** Leveraging Turborepo significantly streamlines shared types, linting, build caching, and cross-application testing across frontend and backend workspaces.
- **User-Centric Data Presentation:** Raw audit JSON data is valuable for APIs, but multi-tab styled Excel workbooks are essential for non-technical stakeholders and client deliverables.

---

## 📬 6. Contact With Me

Have any idea or need customization? **Let's talk.**

- 📧 **Email:** [razibdpi@gmail.com](mailto:razibdpi@gmail.com)
- 🌐 **Portfolio:** **Md. Razib Hossain** — [www.razib.bd](https://www.razib.bd)

