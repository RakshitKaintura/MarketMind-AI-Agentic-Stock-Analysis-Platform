# Stock Market App - Architecture Documentation

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    %% Client Layer
    Client((Client Layer\nWeb Browser))

    %% Application Layer (Next.js)
    subgraph "Application Layer (Next.js App Router)"
        UI[Frontend UI\nReact, Tailwind CSS, shadcn]
        API[API Routes\nNext.js Server]
        AuthRoute[Auth Routes\nBetter-Auth]
    end

    %% Background Jobs Layer
    subgraph "Background Processing (Inngest)"
        CronJob[Daily News Cron Job]
        WelcomeJob[Welcome Email Event Job]
    end

    %% External Services
    subgraph "External Services"
        YF[Yahoo Finance API]
        Finnhub[Finnhub API\nNews Data]
        Gemini[Google Generative AI\nGemini 2.5 Flash]
        Email[SMTP Provider\nNodemailer]
    end

    %% Database Layer
    subgraph "Data Layer"
        MongoDB[(MongoDB)]
    end

    %% Connections
    Client <-->|HTTP/REST| UI
    Client <-->|API Calls| API
    Client <-->|Auth Requests| AuthRoute

    UI --> API
    API --> YF
    API --> Gemini
    API <--> MongoDB

    AuthRoute <--> MongoDB
    AuthRoute -.->|Triggers Event| WelcomeJob

    CronJob -->|Fetches Users & Watchlist| MongoDB
    CronJob -->|Fetches News| Finnhub
    CronJob -->|Summarizes| Gemini
    CronJob -->|Sends Email| Email

    WelcomeJob -->|Generates Content| Gemini
    WelcomeJob -->|Sends Email| Email
```

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : manages
    USER ||--o{ WATCHLIST : tracks

    USER {
        string id PK
        string email
        string name
        string image
        boolean emailVerified
        date createdAt
        date updatedAt
        string country
        string investmentGoals
        string riskTolerance
        string preferredIndustry
    }

    SESSION {
        string id PK
        string userId FK
        string sessionToken
        date expiresAt
    }

    ACCOUNT {
        string id PK
        string userId FK
        string provider
        string providerAccountId
        string refreshToken
        string accessToken
    }

    WATCHLIST {
        string _id PK
        string userId FK
        string symbol
        string company
        date addedAt
    }
```
*Note: User, Session, and Account entities are managed by the `better-auth` MongoDB adapter.*

## 3. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant NextJS as Next.js Frontend
    participant API as /api/auth/[...all] (Better-Auth)
    participant MongoDB as MongoDB
    participant Inngest as Inngest (Background)
    participant Gemini as Google GenAI
    participant Email as Nodemailer

    User->>NextJS: Submits Sign Up / Sign In form
    NextJS->>API: POST /api/auth/sign-up (Credentials/OAuth)
    
    API->>MongoDB: Check if user exists / Validate Credentials
    
    alt is New User Sign Up
        API->>MongoDB: Create new User & Session
        API-->>Inngest: Emit `app/user.created` event
        Inngest->>Gemini: Prompt AI for personalized welcome text based on profile
        Gemini-->>Inngest: Return generated welcome message
        Inngest->>Email: Send Welcome Email
    else is Existing User
        API->>MongoDB: Create new Session
    end
    
    MongoDB-->>API: Return Session details
    API-->>NextJS: Set Session Cookie in Header
    NextJS-->>User: Redirect to Dashboard
```

## 4. Request / Sequence Flows

### 4.1 Stock Analysis Flow

```mermaid
sequenceDiagram
    participant User
    participant NextJS as UI (Next.js)
    participant API as API Route (/api/stock-analysis)
    participant YahooFinance as Yahoo Finance API
    participant Gemini as Langchain / Google GenAI

    User->>NextJS: Requests analysis for symbol (e.g., AAPL)
    NextJS->>API: GET /api/stock-analysis?symbol=AAPL
    
    API->>YahooFinance: Fetch historical/real-time stock data
    YahooFinance-->>API: Return market data JSON
    
    API->>Gemini: Send prompt with stock data for analysis
    Gemini-->>API: Return AI-generated analysis/insights
    
    API-->>NextJS: Return formatted analysis JSON
    NextJS-->>User: Render insights on UI
```

### 4.2 Daily News Summary (Background Cron Job)

```mermaid
sequenceDiagram
    participant Cron as Inngest Cron (0 12 * * *)
    participant Inngest as Inngest Function
    participant MongoDB as MongoDB
    participant Finnhub as Finnhub API
    participant Gemini as Google GenAI
    participant Email as Nodemailer

    Cron->>Inngest: Trigger `sendDailyNewsSummary`
    Inngest->>MongoDB: Fetch all users subscribed to news
    MongoDB-->>Inngest: Return Users list
    
    loop For Each User
        Inngest->>MongoDB: Fetch user's Watchlist symbols
        MongoDB-->>Inngest: Return Symbols [AAPL, TSLA, etc.]
        
        Inngest->>Finnhub: Fetch news for Watchlist symbols
        Finnhub-->>Inngest: Return News Articles
        
        Inngest->>Gemini: Request summary of fetched articles
        Gemini-->>Inngest: Return concise News Summary
        
        Inngest->>Email: Send formatted summary email to User
    end
```

## 5. Technology Decision Sheet

| Category | Technology | Rationale / Use Case |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | Enables full-stack development within a single repository. Excellent for SEO, Server-Side Rendering (SSR), and seamless API integrations. |
| **Language** | TypeScript | Provides strict static typing, improving code reliability, developer experience, and reducing runtime errors. |
| **Database** | MongoDB & Mongoose | Flexible, document-based NoSQL database that accommodates rapid schema iteration. Perfect for storing diverse user profiles and watchlist items. |
| **Authentication** | Better-Auth | A modern, framework-agnostic auth solution that integrates easily with Next.js and MongoDB. Handles sessions, credentials, and OAuth out of the box. |
| **Background Jobs** | Inngest | Reliable event-driven and scheduled (Cron) background processing. Used for heavy tasks like batch emailing and AI generation without blocking API routes. |
| **AI / LLM** | Google Generative AI (Gemini) + Langchain | Powering intelligent features: summarizing market news and providing personalized stock analysis and tailored welcome emails. |
| **Financial Data** | Yahoo Finance API & Finnhub | `yahoo-finance2` for robust historical data and stock quotes; Finnhub for real-time market news corresponding to user watchlists. |
| **Email Service** | Nodemailer | Standard, reliable Node.js module for sending transactional emails (Welcome Emails, Daily News Summaries) over SMTP. |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Utility-first styling for rapid, responsive UI development. `shadcn/ui` provides unstyled, accessible, and customizable React components (built on Radix UI). |
