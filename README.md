# Tuktuki Dashboard

A React 19 dashboard for monitoring Tuktuki app metrics including downloads, episode views, AdMob stats, and Razorpay payment data.

## Tech Stack

- React 19
- Vite 6
- Node.js 18+ (22 LTS recommended)
- Express (Proxy Server)
- Sass
- Yarn

## Project Structure

```
tuktuki/
├── src/
│   ├── constants/
│   │   ├── api.js            # API keys and endpoints
│   │   ├── metrics.js        # Metric types, labels, and sources
│   │   └── tabs.js           # Tab constants and labels
│   ├── utils/
│   │   ├── formatters.js     # Currency and number formatters
│   │   ├── http.js           # HTTP helpers (GET, POST, auth headers)
│   │   ├── razorpay.js       # Razorpay calculation utilities
│   │   └── payments.js       # Payment transformation utilities
│   ├── services/
│   │   ├── razorpay.service.js     # Razorpay subscriptions & payments
│   │   ├── payments.service.js     # Payment data fetching
│   │   ├── admob.service.js        # AdMob metrics (disabled)
│   │   ├── appstore.service.js     # App Store downloads (disabled)
│   │   ├── googleplay.service.js   # Google Play downloads (disabled)
│   │   ├── database.service.js     # Episode views (disabled)
│   │   └── metrics.service.js      # Aggregates all metrics
│   ├── components/
│   │   ├── layout/                 # Layout/Container components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.scss
│   │   │   ├── Tabs.jsx
│   │   │   └── Tabs.scss
│   │   ├── tabs/                   # Tab content components
│   │   │   ├── RazorpayTab.jsx
│   │   │   ├── RazorpayTab.scss
│   │   │   ├── OverviewTab.jsx
│   │   │   ├── OverviewTab.scss
│   │   │   ├── ComingSoonTab.jsx
│   │   │   └── ComingSoonTab.scss
│   │   └── shared/                 # Reusable components
│   │       ├── MetricsTable.jsx
│   │       ├── MetricsTable.scss
│   │       ├── StatsSummary.jsx
│   │       └── StatsSummary.scss
│   ├── App.jsx
│   ├── App.scss
│   └── main.jsx
├── server.js                 # Express proxy server
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

## Getting Started

### Install Dependencies

```bash
yarn install
```

### Run Development Server

This starts both frontend and backend concurrently:

```bash
yarn dev
```

- Frontend: http://localhost:5174
- Backend Proxy: http://localhost:8888

### Individual Commands

```bash
yarn client   # Frontend only
yarn server   # Backend only
yarn build    # Production build
yarn preview  # Preview production build
```

## Features

### Tabbed Interface

5 tabs with clear separation of concerns:

1. **Razorpay** (Default) - Live data

   - Subscription statistics cards
   - Revenue by date table
   - Recent subscriptions list

2. **Google AdMob** - Coming soon
3. **App Downloads** - Coming soon
4. **Episode Views** - Coming soon
5. **Overview** - All metrics summary table

### Live Metrics - Razorpay

**Subscription Statistics:**

- Total subscriptions
- Active/Created/Completed counts
- Total paid cycles
- Total revenue

**Revenue by Date:**

- Daily breakdown of payments
- Payment count per day
- Revenue per day
- Sorted by most recent first

**Recent Subscriptions:**

- Top 10 recent subscription records
- Status, payment counts, remaining cycles
- Creation dates

### Mock Metrics (Disabled APIs)

- Downloads (Play Store + App Store): 3,182
- Episode Views: 9,739
- AdMob Impressions: 3,300
- AdMob Revenue: Rs1,200

## API Integration

### Currently Active - Razorpay

**Subscriptions API** (`/v1/subscriptions`):

- Fetches all subscription plans
- Shows subscription status and lifecycle
- Tracks created, active, completed subscriptions
- Pagination: Fetches 100 at a time until all retrieved

**Payments API** (`/v1/payments`):

- Fetches all payment transactions
- Shows actual money received
- Groups payments by date for revenue tracking
- Pagination: Fetches 100 at a time until all retrieved

**Invoices API** (`/v1/invoices`):

- Available for subscription-specific invoicing
- Pagination implemented

### To Be Integrated

- Google Play Console API
- App Store Connect API
- Google AdMob API
- Database API for episode views

## Subscriptions vs Payments

### Subscriptions API

**What it shows:**

- Subscription plans users signed up for
- Many will have `paid_count: 0` (signed up but never paid)
- Tracks subscription lifecycle (created → active → completed)

**Not good for:**

- Revenue calculation (unreliable)
- Many users subscribe but abandon before payment

### Payments API (Used for Revenue) ✅

**What it shows:**

- Actual completed payment transactions
- `status: "captured"` = real money in your account
- Exact amount, date, and payment method

**Good for:**

- Accurate revenue tracking
- Date-wise revenue breakdown
- Understanding actual cash flow

## Revenue Calculation

The dashboard uses **Payments API** for accurate revenue:

```javascript
// Only counts successful payments
if (payment.status === "captured" || payment.status === "authorized") {
  revenue += payment.amount / 100; // Convert paise to rupees
}

// Groups by date
groupedByDate[date].revenue += amount;
```

## Proxy Server

The Express server (`server.js`) handles:

- CORS issues with external APIs
- Authentication for Razorpay API (Basic Auth)
- Pagination for all endpoints
- Running on port 8888

### Available Endpoints:

- `GET /api/razorpay/subscriptions` - All subscriptions (paginated)
- `GET /api/razorpay/payments` - All payments (paginated)
- `GET /api/razorpay/invoices` - All invoices (paginated)
- `GET /api/razorpay/plans/:planId` - Plan details

## Architecture

### Component Organization:

- **`layout/`** - Main structure (Dashboard container, Tabs navigation)
- **`tabs/`** - Tab-specific content (Razorpay, AdMob, Overview, etc.)
- **`shared/`** - Reusable presentational components (Tables, Cards)

### Service Layer:

- Each API has its own service file
- `metrics.service.js` orchestrates all data fetching
- Services only handle data fetching, not transformation

### Utility Layer:

- `formatters.js` - Display formatting (currency, numbers, dates)
- `http.js` - HTTP request helpers
- `razorpay.js` - Razorpay-specific calculations (subscription stats)
- `payments.js` - Payment transformations (grouping by date, revenue calc)

### Data Flow:

```
API → Server (Proxy) → Service → Utils (Transform) → Component (Display)
```

## Configuration

API keys are stored in `src/constants/api.js`:

```javascript
RAZORPAY_KEY_ID: "rzp_live_...";
RAZORPAY_KEY_SECRET: "...";
```

## Design Decisions

- **No comments in code** - Self-documenting code
- **Clean separation of concerns** - Each layer has single responsibility
- **Container/Presentational pattern** - Logic vs UI separation
- **Utility functions** - All transformations in utils layer
- **Mock data for disabled APIs** - Shows UI structure while APIs pending
- **Full-width layout** - No max-width constraints
- **Pagination everywhere** - Fetches all data, not just first 100

## Notes

- Razorpay API returns amounts in **paise** (1 rupee = 100 paise)
- Payments with `status: "captured"` are successful transactions
- Subscriptions with `status: "created"` may never convert to payments
- The dashboard fetches all historical data on load (can be slow with large datasets)
