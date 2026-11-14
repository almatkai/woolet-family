# Woolet 💰

Woolet is a sophisticated personal finance and investment tracking application built with a modern full-stack TypeScript architecture. It helps users manage their bank accounts, track daily transactions, monitor debts and mortgages, and manage long-term investment portfolios with multi-currency support.

## 🚀 Features

-   **Dashboard**: Overview of your financial health with interactive charts and summaries.
-   **Transaction Management**: Track income and expenses with customizable categories.
-   **Investing Module**: 
    -   Portfolio tracking with stock search.
    -   Historical price charting and performance analytics.
    -   Benchmark comparisons (e.g., S&P 500).
    -   Multi-currency support for global assets.
-   **Debt & Credits**: Manage what you owe and what others owe you.
-   **Subscriptions**: Monitor recurring payments to avoid "subscription creep".
-   **Banks & Accounts**: Organize multiple bank accounts and deposits.
-   **Data Sync**: Export and import your entire financial history for backup and portability.
-   **Multi-Currency**: Automatic FX conversion for a unified view of your net worth.

## 🛠️ Tech Stack

### Frontend (`apps/web`)
-   **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
-   **Routing**: [TanStack Router](https://tanstack.com/router/latest)
-   **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) & [tRPC](https://trpc.io/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Authentication**: [Clerk](https://clerk.com/)

### Backend (`apps/api`)
-   **Runtime**: [Bun](https://bun.sh/)
-   **Server**: [Hono](https://hono.dev/)
-   **API**: [tRPC](https://trpc.io/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
-   **Caching**: [Redis](https://redis.io/)
-   **Authentication**: [Clerk Backend SDK](https://clerk.com/docs/reference/backend-api)

### Shared (`packages/shared`)
-   Zod schemas and TypeScript types shared between frontend and backend.

## 📁 Project Structure

```text
├── apps/
│   ├── api/          # Bun + Hono + tRPC backend
│   └── web/          # React + Vite + Tailwind frontend
├── packages/
│   └── shared/       # Shared Zod schemas and types
├── docs/             # Technical design documents
│   ├── INVESTING_MODULE_DESIGN.md
│   └── POSTHOG_IMPLEMENTATION.md # Analytics & User Behavior Tracking
└── docker-compose.yml # Infrastructure (Postgres, Redis)
```

## 🏁 Getting Started

### Prerequisites
-   [Bun](https://bun.sh/) installed.
-   Docker (for running the database and Redis).

### Setup
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/woollet.git
    cd woollet
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Spin up infrastructure**:
    ```bash
    docker-compose up -d
    ```

4.  **Configure environment variables**:
    Create `.env` files in `apps/api` and `apps/web` (refer to `.env.example` if available).

5.  **Run migrations**:
    ```bash
    bun run db:generate
    bun run db:migrate
    ```

6.  **Start development servers**:
    ```bash
    bun run dev
    ```

### Paddle Billing

Clerk remains the authentication provider; Paddle handles paid plans and checkout.

1. Create the Pro and Premium recurring prices in Paddle (the Sandbox catalog is already seeded for local development).
2. Add the client-side token, environment, price IDs, and display labels from `.env.example` to the web environment. Add the matching server price IDs, `PADDLE_API_KEY`, and notification secret to the API environment. API keys stay server-side; Paddle.js uses a client-side token.
3. In Paddle, approve the checkout domain, set a default payment link, and create a notification destination pointing to `https://your-api-domain.example/webhooks/paddle`.
4. Subscribe the destination to `transaction.completed`, `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.trialing`, `subscription.activated`, `subscription.past_due`, `subscription.paused`, and `subscription.resumed`.
5. Use the Sandbox test card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, and any postal code. Confirm the browser returns to `/pricing?checkout=success`, the webhook log shows `200`, and the user row changes to `pro` or `premium`.

The API verifies Paddle signatures against the raw request body, tolerates out-of-order webhook delivery, and updates `users.subscription_tier` only for the configured Paddle price IDs. The account panel uses Paddle's customer portal for active subscribers; portal URLs are minted server-side from the authenticated user's stored Paddle customer ID. Access is provisioned by the webhook, not by the browser redirect. Sandbox and Live have separate products, prices, client tokens, API keys, and notification destinations.

## 🤝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and coding standards.

## 📄 License

This project is licensed under the MIT License.
