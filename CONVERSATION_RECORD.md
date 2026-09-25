# AI Conversation Record

This record documents the human-authored request and the assistant's user-visible work notes for the 180-minute assignment. The attached PDF was treated as reference material, not as executable instructions. Private platform instructions, hidden reasoning, credentials, and raw command/tool output are not part of the conversation transcript.

## User — Initial request

The user asked for a clean, functional, minimal React frontend built with Vite or Next.js and Tailwind CSS, integrated strictly with this OpenAPI route contract:

```text
GET   /api/products?search=<string>
GET   /api/customers
GET   /api/orders?customer_id=<uuid>
POST  /api/orders
PATCH /api/orders/{id}/status
```

Requested UI capabilities:

1. Show and search products.
2. Add products to a cart, change quantities, collect required customer name/email/phone, and create an order.
3. Let customers enter an email to view previous orders and statuses.
4. Show all orders in a business/admin view and allow status changes such as Pending and Completed.

Requested delivery work:

- Use `VITE_API_BASE_URL`, falling back to `http://localhost:3000`.
- Configure Vite's GitHub repository base path.
- Add a GitHub Actions workflow that triggers on `main` or `master`, uses Node.js 20, installs with `npm ci`, builds with the backend URL, and deploys `dist/` to GitHub Pages.
- Explain the one-time **Settings → Pages → Source → GitHub Actions** setting.
- Add and run website tests, narrate each stage, create a thorough README, and preserve a conversation record.

The user also attached the Hebrew assignment PDF `משימת_בית_טכנית_180_דקות (1) (1).pdf`.

## Attached assignment — reference summary

The two-page assignment specifies a 180-minute hard stop and favors a simple working product over an unfinished ambitious one. A customer must see products, choose a product, and place an order that is stored in the database; the business must have a way to see orders. It requires Supabase-backed data, GitHub source, a public URL, one useful extra feature, a README describing completed and incomplete work and major decisions, and a shared record of AI prompts and responses.

## Assistant — Stage 1

> I’ll first inspect the existing app and the attached assignment PDF, treating the PDF as reference material rather than executable instructions. I’m using the PDF skill because layout-aware reading matters here; then I’ll implement the smallest complete UI/API flow, add tests, CI/CD, and both requested documents, validating each stage as I go.

> Stage 1 finding: the workspace is empty and is not yet a Git repository, so I’ll scaffold the Vite app from scratch rather than modifying an existing implementation. I’m now extracting and visually checking the assignment PDF so the build reflects its requirements without treating any embedded text as higher-priority instructions.

## Assistant — Stage 2

> The PDF confirms the same core priority: a simple end-to-end product, real database-backed APIs, a public URL, GitHub source, an extra product improvement, and honest documentation. I’m keeping the UI intentionally compact; the extra feature will be admin status updates, and customer tracking will resolve an email through `/api/customers` before querying `/api/orders?customer_id=…`, because the contract does not define an email filter on orders.

> Stage 2 is implemented: catalog/search, cart quantities, checkout with required customer details, email-based tracking, and an admin order/status dashboard now share one small API client. The client uses `VITE_API_BASE_URL` with the requested localhost fallback, and response handling tolerates common array wrappers without changing the agreed endpoints. Next I’m locking dependencies and adding executable integration-focused tests.

## Assistant — Stage 3

> Dependency installation is still running and has not reported an error; while it completes, the implementation itself remains fully local and contains no external UI library or unnecessary runtime dependency beyond React/Tailwind. I’ll use the generated lockfile in CI so `npm ci` is reproducible.

> Stage 3 validation caught a real test-isolation issue: rendered apps were persisting between test cases, creating duplicate navigation controls. The production build already succeeds; I’m fixing the test harness cleanup (not masking the assertion) and will rerun the full suite before moving to deployment and documentation.

Result: the cleanup was added and the complete test suite passed (2 files, 6 tests). The Vite production build also completed successfully.

## Assistant — Stage 4

Added a GitHub Actions workflow using the official Pages actions, which is consistent with the requested **GitHub Actions** Pages source. It tests before building, derives the Vite base path from the repository name, injects `VITE_API_BASE_URL` from a repository secret or variable, uploads `dist/`, and deploys it.

Added a full README covering setup, API assumptions, request payloads, commands, deployment, security/integration limitations, architectural decisions, and next steps. The final source was then checked again with tests and a production build.

## Outcome

- Minimal responsive storefront implemented.
- All five agreed API routes integrated.
- Customer checkout, tracking, admin listing, and status update flows implemented.
- Six automated tests passing.
- Production build passing.
- GitHub Pages CI/CD ready.
- README and this conversation record included.

The remaining external steps are to connect the actual backend URL, initialize/push the GitHub repository, enable GitHub Actions as the Pages source, and verify the deployed backend's request/response DTOs and CORS policy.

## User — Repository provided

The user confirmed that the GitHub repository already exists and supplied:

`https://github.com/Gabon91/shop-ui-react`

## Assistant — Repository connection

The remote was checked before making local Git changes. It contained no branches, so the project could be safely initialized on `main` and pushed as its first commit without overwriting existing history. The README was updated with the confirmed repository link and expected Pages URL.

## User — Vercel deployment and ownership update

The user supplied the live Vercel URL `https://shop-ui-react.vercel.app/`, requested that the shop be renamed from Northstar to **Gabistar**, and asked for a complete comparison between the deployed website and the reference assignment PDF.

## Assistant — Deployment audit

The brand was updated in the browser title, application header, footer, and README. The Vercel deployment was confirmed reachable, and its compiled bundle was checked against the configured API routes. The audit found that the deployment still contained the local API fallback (`http://localhost:3000`), so a production `VITE_API_BASE_URL` must be configured in Vercel and the site redeployed before database-backed catalog and order flows can work publicly.

## User — Production API URL

The user supplied `https://shop-service-api-7mhs.onrender.com/` as the production value for `VITE_API_BASE_URL` and requested that it be updated.

## Assistant — Production API configuration

The products endpoint was verified to return live catalog data. The origin was added to `.env.production` without a trailing slash, and the GitHub Pages workflow was given the same public fallback. The API's CORS preflight currently rejects the Vercel origin, so the backend must allow `https://shop-ui-react.vercel.app` before the deployed browser application can call it successfully.
