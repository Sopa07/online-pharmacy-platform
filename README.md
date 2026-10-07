# Shazzar Pharmacy Platform

Modern online pharmacy and telehealth platform tailored for Nigeria, built with React + Vite + Tailwind CSS and a Netlify Function backend.

## Run locally

```bash
npm install
npm run dev
```

Local backend API:

```bash
npm run dev:api
```

Production build:

```bash
npm run build
```

Backend smoke test:

```bash
npm run api:smoke
```

## Deployment

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

The frontend is configured as a single-page app with `/api/*` routed to the Netlify Function at `netlify/functions/api.mjs`.

Current API endpoints:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products?search=panadol&page=1&limit=24`
- `GET /api/products/:id`
- `POST /api/orders`
- `POST /api/consultations`
- `POST /api/health-profile`
- `POST /api/prescriptions`
- `GET /api/admin/summary`, `GET /api/admin/orders`, `GET /api/admin/prescriptions`, `GET /api/admin/consultations` (admin only)

The backend is backed by Supabase: users authenticate with Supabase Auth, the product catalog is served from the `products` table, and orders, prescriptions, consultations, and health profiles are persisted in their own tables.

Required Netlify environment variables:

- `SUPABASE_URL`: the Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: the service-role key, used server-side only. Never expose it in frontend code.
- `ADMIN_EMAILS`: optional comma-separated allowlist of admin accounts. A Supabase `app_metadata.role` of `admin` also grants admin access; `user_metadata` is never trusted for roles.
- `API_ALLOWED_ORIGIN`: optional for same-origin Netlify deploys. For external frontends, set a comma-separated allowlist such as `https://example.com,https://deploy-preview-1--site.netlify.app`.
- `VITE_API_BASE_URL`: leave unset or set to `/api` for Netlify same-origin routing.

Deployment notes:

- The API validates JSON payloads, handles Netlify base64-encoded request bodies, and prices orders from the product catalog server-side (client-supplied amounts are ignored).
- If the Supabase environment variables are missing, `/api/health` reports `authConfigured: false` and data/auth endpoints return 503.
- On Supabase projects with email confirmation enabled, registration does not return a session token until the user clicks the emailed link; the app asks them to log in afterwards.
- Run `npm run api:smoke` against a configured environment to exercise the API end to end (expects email confirmation disabled on the Supabase project, or the test user already confirmed).

## Included pages

- Home
- Product browsing with filters, sorting, search autocomplete, and product detail modal
- Upload Prescription (drag-and-drop with preview)
- Personalized Healthcare dashboard
- Consultation booking
- Checkout and Payment
- Weekly Health Bulletin

## Reusable components

- Navbar
- Footer
- ProductCard
- CategoryCard
- FormInput
- Modal
- Toast notifications (`ToastContainer`)
- SearchBar (with autocomplete)
- CartDrawer (slide-out cart panel)
- LoadingSkeleton

## Data source

Dummy JSON data lives in `src/data/`:

- `products.json`
- `categories.json`
- `specialists.json`
- `articles.json`

## Project structure

```text
src/
  components/
  pages/
  data/
  hooks/
  styles/
```
