# AI-Powered Stock Market Analysis Platform

A compact, opinionated Next.js dashboard for stock tracking, news aggregation, and on-demand analysis — built with TypeScript, Tailwind CSS, MongoDB, and an agentic AI analysis pipeline powered by LangGraph + Gemini. 🚀

[![Build Status](https://img.shields.io/badge/build-pending-lightgrey)](https://example.com) [![Deploy](https://img.shields.io/badge/deploy-ready-blue)](https://example.com) [![Live Demo](https://img.shields.io/badge/demo-online-brightgreen)](https://stock-market-sandy.vercel.app)

---

## Visuals

Below are curated screenshots that showcase the main flows and UI of the app. Each image is presented individually with a short caption to make the README cleaner and easier to scan.

### Dashboard
![Dashboard](public/assets/readme_images/dashboard.png)
A high-level market overview with TickerTape and heatmap, designed for quick monitoring.

---

### Watchlist
![Watchlist](public/assets/readme_images/Watchlist.png)
Personal watchlist with real-time prices, quick actions, and latest related news.

---

### Stock Screener
![Stock Screener](public/assets/readme_images/Stock_Screener.png)
Filter and discover stocks using multiple criteria and exportable results.

---

### Stock Page
![Stock Page](public/assets/readme_images/Stock_page.png)
Detailed single-stock view with charts, fundamentals, and technical indicators.

---

### Stock Analysis
![Stock Analysis](public/assets/readme_images/Stock_Analysis.png)
Agentic AI analysis output (LangGraph + Gemini) shown as structured markdown insights.

---

### Login Page
![Login Page](public/assets/readme_images/Login_Page.png)
Clean authentication UI with email/password signup and contextual onboarding.

---

> Add the PNG files to `public/assets/readme_images/` so screenshots render in the README.

Live demo: https://stock-market-sandy.vercel.app

---

## The Why

Investors and traders need a lightweight, fast interface to monitor prices, collect news, and keep personal watchlists without the overhead of heavy trading platforms. Stock Markett provides:

- A single-pane dashboard for quick stock lookups and visualizations
- Persistent user watchlists and signup flows
- Automated background tasks for digest emails and lightweight analytics

This project is ideal as a portfolio piece because it demonstrates full-stack capabilities: authentication, persistent storage, third-party data integration, background processing, and a modern React UI.

---

## Key Features

- **Next.js App Router + TypeScript** — modern SSR/SSG and clean type-safety across the stack.
- **Persistent Watchlist (MongoDB + Mongoose)** — users can save & manage watchlists stored in MongoDB.
- **Auth with Better Auth** — email/password auth with `better-auth` and cookie-based session handling.
- **Trading UIs** — embedded TradingView widgets and TickerTape components for interactive charts.
- **AI Stock Analysis (LangGraph + Gemini)** — agentic analysis pipeline using `@langchain/langgraph` and `@langchain/google-genai` to orchestrate data-fetch → LLM analysis nodes.
- **Background Jobs (Inngest)** — async workflows for welcome emails and daily news summaries.
- **Email Notifications (Nodemailer)** — transactional emails for signup & digests.

---

## AI Stock Analysis (LangGraph Agentic Workflow)

This project implements an advanced agentic, state-graph workflow for per-symbol AI-driven analysis located at [app/api/stock-analysis/route.ts](app/api/stock-analysis/route.ts). The pipeline has been significantly upgraded to provide professional-grade, actionable insights:

- **3-Node Orchestration**: A LangGraph `StateGraph` runs `fetch_stock` and `fetch_news` in parallel to gather quantitative metrics and real-time market context, followed by the `analyze` node.
- **Richer Technical Data**: The `fetch_stock` node computes advanced indicators including EMA (12 & 26), MACD crossovers, Bollinger Bands, and Volume Trends.
- **Peer & Industry Context**: The AI actively compares the target stock's valuation (P/E, ROE, margins) against top sector peers (e.g., TCS vs INFY) to ground its analysis.
- **Streaming Structured JSON**: Uses LangChain's `.stream()` API to stream strict, validated JSON directly to the frontend. This creates a ChatGPT-like real-time typing experience, eliminating long loading spinners.
- **MongoDB Caching**: Analysis results are stored in a MongoDB `AnalysisCache` collection with a 1-hour TTL. Repeat requests load instantly, saving Gemini API costs.
- **Sector-Aware UI Scoring**: The client-side dashboard dynamically scores the stock using sector-specific P/E benchmarks (e.g., scoring a P/E of 60 differently for Tech vs Banks).
- **Analysis History & Comparison**: Users can revisit past analyses stored in the database or run side-by-side comparison modes to evaluate two stocks against each other.
- **Actionable Prompt Engineering**: The Gemini LLM is prompted with strict SEBI-analyst constraints to return precise numbers, trigger levels, and concrete Bull & Bear case scenarios instead of vague advice.

Example request (curl):

```bash
curl -X POST http://localhost:3000/api/stock-analysis \
	-H "Content-Type: application/json" \
	-d '{"symbol":"TCS", "timeframe":"medium", "riskProfile":"balanced"}'
```

Response (trimmed): JSON containing `symbol`, `timeframe`, `riskProfile`, `stockData` (snapshot) and `analysis` (markdown string).

---

---

## Tech Stack

Frontend

- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS

Backend

- Node.js (Next.js API routes)
- Inngest (background functions)
- `better-auth` for authentication

Database / Tools

- MongoDB (mongoose)
- Nodemailer (SMTP)
- Yahoo Finance / Gemini AI (integration points)
- ESLint, TypeScript, Turbopack

---

## Getting Started

### Prerequisites

- Node.js 18+ (or latest LTS)
- npm (or yarn/pnpm)
- A running MongoDB instance (Atlas or local)
- SMTP credentials (for sending email)

### Installation

```bash
git clone <your-repo-url>
cd stock_market
npm install
# or: pnpm install
```

### Environment

Create a `.env` from the template and fill in values:

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/stock_market

# Better Auth configuration
BETTER_AUTH_SECRET=replace_me_with_a_strong_random_secret
BETTER_AUTH_URL=http://localhost:3000

# Gemini / AI key used by Inngest AI integrations
GEMINI_API_KEY=replace_with_gemini_api_key

# Nodemailer SMTP
NODEMAILER_EMAIL=you@example.com
NODEMAILER_PASSWORD=supersecretpassword

# Optional: NODE_ENV (development|production)
NODE_ENV=development
```

Save the file as `.env` at project root.

### Run (dev)

```bash
npm run dev
# Visit http://localhost:3000
```

### Build & Start (production)

```bash
npm run build
npm start
```

---

## Architecture / Project Structure

Top-level layout (trimmed):

- `app/` — Next.js App Router pages and layouts
- `components/` — UI components and widgets (TradingView, TickerTape, Watchlist UI)
- `lib/` — client libraries, API wrappers, actions, Inngest functions, and nodemailer templates
- `database/` — MongoDB connection (`mongoose.ts`) and models (`models/*.ts`)
- `hooks/` — React hooks (`useDebounce`, TradingView hook)
- `api/` — server API routes used by client pages (`/api/news`, `/api/stock-analysis`, `/api/inngest`)

Example important files:

- [database/mongoose.ts](database/mongoose.ts) — MongoDB connection helper
- [lib/better-auth/auth.ts](lib/better-auth/auth.ts) — authentication setup
- [lib/inngest/client.ts](lib/inngest/client.ts) — background job client
- [components/WatchlistTable.tsx](components/WatchlistTable.tsx) — watchlist UI

---

## Future Roadmap

1. Add OAuth providers (Google/GitHub) via `better-auth` for faster onboarding.
2. Real-time WebSocket feed for live quotes and push notifications.
3. Advanced analytics: portfolio P&L, historical charts, and export CSVs.
4. CI/CD + Vercel deployment template with preview environments and test coverage reporting.

---

## Contact / Support

- GitHub: https://github.com/your-username/stock_market
- LinkedIn: https://www.linkedin.com/in/your-name
- Email: your.email@example.com
