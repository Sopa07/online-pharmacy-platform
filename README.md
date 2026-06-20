# Shazzar Pharmacy Frontend

Modern, responsive frontend-only online pharmacy and telehealth platform tailored for Nigeria, built with React + Vite + Tailwind CSS.

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
- `GET /api/products?search=panadol&page=1&limit=24`
- `GET /api/products/:id`
- `POST /api/orders`
- `POST /api/prescriptions`

The backend currently uses the imported JSON product catalog as its data source. It is structured so a database can replace that file later without changing the public API shape.

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
