# TMS Split Structure

This project is now separated into two apps:

- `frontend/` - Next.js UI application
- `backend/` - Next.js API application

Run both from the root:

- `npm run dev`

Or run them separately:

- `npm run dev:frontend`
- `npm run dev:backend`

The frontend proxies `/api/*` requests to the backend with `BACKEND_URL`.
