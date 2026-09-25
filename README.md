# Gabistar — Mini E-Commerce Frontend

A deliberately small React storefront for the 180-minute technical assignment. It consumes the supplied REST API, covers the customer journey from discovery to checkout, and includes order tracking plus a lightweight business dashboard.

Repository: [github.com/Gabon91/shop-ui-react](https://github.com/Gabon91/shop-ui-react)

Live site: [shop-ui-react.vercel.app](https://shop-ui-react.vercel.app/)

Production API: [shop-service-api-7mhs.onrender.com](https://shop-service-api-7mhs.onrender.com/)

## What works

- Product catalog from `GET /api/products`
- Server-side product search through the `search` query parameter
- In-memory cart with add, increment, decrement, removal, and calculated totals
- Checkout validation for required name, email, and phone fields
- Order creation through `POST /api/orders`
- Customer order tracking by email
- Admin order list from `GET /api/orders`
- Order status changes through `PATCH /api/orders/{id}/status`
- Responsive layouts, keyboard focus states, loading, empty, success, and API-error states
- Automated API and user-flow tests
- Automatic GitHub Pages deployment on pushes to `main` or `master`

## Stack

- React with Vite
- Tailwind CSS
- Vitest and Testing Library
- GitHub Actions and the official GitHub Pages deployment actions

## Run locally

Requirements: Node.js 20 or newer and a running backend.

```bash
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Set the backend origin in `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

The application defaults to `http://localhost:3000` when the variable is absent. Do not add `/api` to this value; endpoint paths already include it.

## API contract and payload assumptions

The supplied OpenAPI document defines routes and response codes but does not define JSON schemas. The frontend keeps those missing assumptions isolated in `src/api/client.js` and accepts either direct arrays or common wrappers such as `{ "products": [] }`, `{ "orders": [] }`, `{ "customers": [] }`, and `{ "data": [] }`.

Checkout sends:

```json
{
  "customer_name": "Ada Lovelace",
  "customer_email": "ada@example.com",
  "customer_phone": "+1 555 0100",
  "items": [
    { "product_id": "product-uuid", "quantity": 2 }
  ]
}
```

Status updates send:

```json
{ "status": "Completed" }
```

The tracking requirement asks users for an email, while `GET /api/orders` only declares a `customer_id` filter. The UI therefore calls `GET /api/customers`, matches the email case-insensitively, and then calls `GET /api/orders?customer_id=<uuid>`. In a production API, a dedicated authenticated tracking endpoint would avoid exposing the full customer list.

Product display supports `id`, `name`, `description`, `price`, and an optional `image_url` (also accepting `image` or `thumbnail`). Orders support `id`, `status`, `total`, `created_at`, and optional `items` / `order_items`. Align the two request bodies above with the backend DTOs if they differ.

## Commands

```bash
npm run dev       # local development server
npm test          # one complete test run
npm run test:watch
npm run build     # production bundle in dist/
npm run preview   # preview the production bundle
```

Current verification: 2 test files, 6 tests passing, and a successful production build. Vitest is pinned to the Node 20-compatible 3.x line so the local and CI commands share the workflow's required runtime contract.

## Deploy to GitHub Pages

The workflow at `.github/workflows/deploy.yml` installs with `npm ci`, runs the tests, builds with the production API URL, and deploys `dist/`.

One-time setup:

1. Push this project to the `main` branch. No hard-coded repository name is required: `vite.config.js` reads `GITHUB_REPOSITORY` during Actions and produces the correct `/shop-ui-react/` base path. For another host, set `VITE_BASE_PATH` explicitly.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Open **Settings → Secrets and variables → Actions**. Add `VITE_API_BASE_URL` as either a repository variable or repository secret, with the deployed backend origin such as `https://api.example.com`.
4. Ensure the backend CORS policy allows `https://<github-user>.github.io` (or the precise Pages URL).
5. Push to `main` or `master`, then follow the workflow under the **Actions** tab. Its deployment job exposes the public Pages URL.

The workflow uses GitHub's official `deploy-pages` action instead of publishing a `gh-pages` branch. This matches the required **Source: GitHub Actions** setting and uses short-lived OIDC credentials.

## Deploy to Vercel

The production site is hosted at [shop-ui-react.vercel.app](https://shop-ui-react.vercel.app/). The public API origin is stored in `.env.production`, so Vercel embeds `https://shop-service-api-7mhs.onrender.com` automatically during production builds. A Vercel `VITE_API_BASE_URL` environment variable may override this value when needed. Vite embeds the value at build time, so any change requires a redeployment.

After deployment, verify that the compiled site no longer references `http://localhost:3000` and that the backend CORS policy permits `https://shop-ui-react.vercel.app`. At the time of the latest audit, the API returned a 400 preflight response for this origin, so its CORS allowlist still needs to be updated.

## Key decisions

- One React entry point and simple view state instead of a router: fewer moving parts and no GitHub Pages SPA fallback issue.
- One API module: environment configuration, error handling, URL encoding, and JSON requests stay consistent.
- No global state dependency: cart state is small and local.
- Search runs on submit: avoids excess backend requests while typing.
- Admin status updates are the assignment's extra feature and update optimistically only after the API confirms success.
- The visual system uses a small set of Tailwind tokens for a clean result without a component-library dependency.

## Not completed / integration notes

- The production API and seeded products are available, but real browser-based persistence cannot be verified until its CORS allowlist includes `https://shop-ui-react.vercel.app`. The GitHub Pages deployment is available at `https://gabon91.github.io/shop-ui-react/`.
- Authentication and authorization are outside the provided API contract. The admin screen and customer-list lookup must be protected by the backend before production use.
- Currency is displayed as USD because the schema does not define a currency.
- The cart intentionally resets on page refresh to keep the time-boxed implementation small.

## If I had one more hour

I would validate against the deployed backend's exact DTOs, add admin authentication, persist the cart in local storage, add a browser-level smoke test against a test API, and confirm responsive behavior on physical devices.

## Project structure

```text
src/
  api/client.js       API URL, requests, and error handling
  App.jsx             Store, cart, checkout, tracking, and admin UI
  index.css           Tailwind layers and reusable component classes
  *.test.*            API and user-flow tests
.github/workflows/
  deploy.yml          Test, build, and GitHub Pages deployment
CONVERSATION_RECORD.md
```

## AI conversation record

The requested development transcript is in [`CONVERSATION_RECORD.md`](./CONVERSATION_RECORD.md). It contains the human-authored requirements and the assistant's user-visible progress/result notes; private system instructions and raw tool output are intentionally excluded.
