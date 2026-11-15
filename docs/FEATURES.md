# Woolet features

Woolet is a personal finance app for tracking money across banks and currencies, debts and loans, subscriptions and investments. It has an AI assistant called Woo, and people can send money requests to each other by username.

This document describes the state of the code on 2026-11-15.

| Feature | Where it lives | Status |
| --- | --- | --- |
| Everything in sections 1–9 | `almatkai/woolet`, `main` | Live |
| US taxes (section 10) | `almatkai/woolet` and `almatkai/woolet-family`, `main` | Merged |
| Family mode (section 11) | `almatkai/woolet` and `almatkai/woolet-family`, `main` | Merged |

---

## 1. Banks, accounts and balances

- Add banks, then accounts inside each bank. You can pick the look of each card.
- One account can hold balances in several currencies.
- Move money between your own accounts.
- Deposits have their own page (`/financial/deposits`).

## 2. Transactions and spending

- Record income and expenses with categories. You can create your own categories and pick their icons.
- One "add" sheet creates any kind of record from anywhere in the app.
- The spending page (`/spending`) shows charts over time and a breakdown by category.
- Stats are converted to your main currency.

## 3. Usernames and money between users

- Every user picks a username and can find other people by it.
- **Split bills.** Split any transaction with other people, who can be Woolet users or people you add as contacts. You can track partial payments, record payments, settle up, and see a summary of who owes you what.
- **Incoming requests.** When someone splits a bill with you by username, the request appears in your account. You can:
  - accept or decline it;
  - **pay now** from one of your accounts, which creates matching transactions for both people;
  - import the sender's category into your own categories if you don't have it yet.
- **Incoming receipts.** Money other people pay you waits as a pending receipt until you assign it to one of your accounts.

## 4. Debts, credits and mortgages

- **Debts:** what you owe and what others owe you, with payment history. There's help for debts that aren't linked to an account.
- **Credits:** loans with payment schedules, including compound-interest credits.
- **Mortgages:** a separate page and a payment flow.
- The dashboard and Woo can show a summary of all your liabilities.

## 5. Subscriptions

- Track recurring payments as a list, as upcoming payments or on a calendar.
- Mark a payment as paid, and it posts to the chosen account.
- A background job sends a notification before each payment is due.
- **Chrome extension "Woolet Subscription Tracker":** picks up subscriptions from billing pages.

## 6. Investing

- Search for stocks, add them, and buy or sell them. You can edit or delete past trades.
- Set a price by hand when there's no quote.
- See a portfolio summary and chart, price history for each stock, and the price on any given date.
- Compare your portfolio with a benchmark such as the S&P 500.
- Investment cash has its own balance, which you can deposit into and withdraw from.
- Read market news by category.
- Prices come from Twelve Data and are cached in Redis.

## 7. Woo, the AI assistant

- **Chat** with saved sessions and a counter of how many AI questions you have left.
- **Receipts:** attach a photo or PDF of a receipt, check, bill or bank transfer. Woo reads:
  - the merchant;
  - the amount and currency;
  - whether the money came in or went out;
  - a category and account, when they match yours.

  Woo then shows an **"Add transaction"** button with the fields filled in, and nothing is saved until you confirm. It ignores fiscal metadata such as WOFD, WebKassa, QR links and receipt numbers.
- **Creating transactions from text:** describe a transaction in chat and Woo can create it.
- **Things Woo can do:**
  - search transactions;
  - read account balances and categories;
  - analyze spending;
  - list subscriptions and upcoming payments;
  - summarize debts and loans;
  - break down your net worth;
  - list your portfolio;
  - open a page in the app;
  - answer questions from Woolet's docs.
- **Daily digest:** an AI summary with its own history. Paid plans can regenerate it.
- **Spending anomalies:** Woo points out unusual spending.
- **Admin setup:** admins choose the AI providers and models, set their keys, and test them.

## 8. Dashboard, notifications and settings

- Dashboard of widgets you can drag around. The app tells you when new widgets are added.
- Widgets include summaries, charts, shortcuts and a currency widget.
- Notifications in the app (read and unread, actions, cleanup) and as web push.
- Exchange rates update on a schedule, so every total is shown in one currency.
- Export and import all your data, and delete all your data or your whole account.
- User settings, an admin panel and PostHog analytics with surveys.

## 9. Plans

| | Free | Pro ($8/mo, $64/yr) | Premium ($20/mo, $168/yr) |
| --- | --- | --- | --- |
| Banks / accounts per bank | 2 / 2 | Unlimited | Unlimited |
| Currencies per account | 2 | 5 | Unlimited |
| Transaction history | 90 days | Full | Full |
| AI questions | 3 lifetime | 5 per day | 25 per day |
| AI market digest | — | Short | Full, 5 regenerations a day |
| Stocks in portfolio | 5 | 20 | 1000 |
| Currency widget, benchmark, export | — | ✓ | ✓ |
| Stock price alerts, priority support | — | — | ✓ |

---

## 10. US taxes (`main`)

An estimate of how much federal and state income tax you'll owe for the year, and what to pay each quarter. It's for US users. The page says the numbers are an **estimate, not tax advice**.

**Tax profile (one per tax year, 2025 or 2026)**
- Filing status:
  - single;
  - married filing jointly;
  - married filing separately;
  - head of household;
  - qualifying surviving spouse.
- State. A state with progressive rates needs you to enter your own effective rate.
- Age 65+ and blindness for you and your spouse, the number of qualifying children, and other dependents.
- Income: wages (W-2), self-employment (1099), interest, ordinary and qualified dividends, short- and long-term capital gains, other income.
- Deductions: pre-tax contributions, IRA, HSA, student loan interest, tips and overtime (the deductions added by the 2025 law).
- Federal and state tax withheld so far this year, plus last year's tax and AGI, which feed the safe-harbor rule.
- You can let Woolet fill in income from your transactions.

**What the estimate covers**
- Standard deduction, the extra deduction for people 65 and over, and the tips and overtime deductions, with their phase-outs.
- Federal brackets, the rates for qualified dividends and long-term gains, self-employment tax, Additional Medicare Tax and the net investment income tax.
- Child Tax Credit and the credit for other dependents, with phase-outs and the refundable part.
- State tax for each state type:
  - no income tax: AK, FL, NV, NH, SD, TN, TX, WA, WY;
  - flat rate;
  - progressive, using the effective rate you entered.
- Total tax, effective and marginal rates, and the amount you still owe or should get back.

**Quarterly estimated payments**
- Due dates for each quarter, with a recommended amount based on the safe-harbor rule: 90% of this year's tax, or 100% of last year's (110% if last year's income was high).
- Log federal and state payments you've made. The next payment includes anything missed in earlier quarters, and the page shows state tax that is still due.

**In the app:** a `/tax` page with a breakdown, the quarterly payments, and sheets for editing the profile and logging payments.

**Data sources:** the 2026 federal figures come from IRS Rev. Proc. 2025-32 and Form 1040-ES (2026). The 2025 figures still need to be checked against their sources.

---

## 11. Family mode (`main`)

A household where each family member has their own Woolet account. Members share some wallets, children get their own wallets, and spending limits are set per wallet.

**Household and members**
- Up to **6 members**. One user can belong to only one active household.
- **Roles:** `owner`, `adult` (who can also be a **guardian**) and `child`.
- **Invitations by email:**
  - the link is secured with a token and expires;
  - the owner can revoke it;
  - the person accepting must have the same verified email.
- The owner can rename the household, change members' roles, remove members, or let a member leave.

**Wallets**
- **Shared wallets** are the family's common money. Adults see them, and children don't unless the owner allows it.
- **Child wallets** belong to one child and can be seen by that child, the owner and guardians.
- Members can choose whether children see their own balance (`showBalanceToChildren`).
- Wallets record income, expenses and transfers between wallets. Children can only record expenses.
- Guardians manage child wallets: they top them up, adjust them and set limits.

**Budget limits**
- Weekly or monthly limits for a whole wallet or for one category.
- Expenses that would go over a limit are flagged. Transfers count only toward the whole-wallet limit.

**Built so far**
- Database tables and migration.
- Access rules and limit calculations, with tests.
- Per-user rate limiting.
- Email lookup through Clerk.
- The household API: members and invitations.

**Available in main**
- Wallet listing, transaction history, income, expenses, transfers and reversals.
- Child limits and privacy controls, enforced by the API.
- Family creation, member management, invite joining, shared wallets and the child view in the web app.

Family mode is free for now.

---

## Apps and tech

- **Web:** React, Vite, TanStack Router and Query, tRPC, Tailwind with shadcn/ui, Recharts.
- **API:** Bun, Hono, tRPC, PostgreSQL with Drizzle, Redis, Clerk.
- **Other apps:**
  - a mobile app with Home, Spending, Accounts, Investing and More tabs;
  - a second version of the mobile app on the `feature/mobile-v2` branch;
  - an Astro landing page;
  - the Chrome extension.
- **Shared code:** Zod schemas, types and plan settings in `packages/shared`, and icons in `packages/woolet-icons`.
