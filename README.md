# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Backend & deployment

The app ships with its own Express + PostgreSQL API (`server/`), replacing the old Postman mock.
Tables are created and sample categories/questions are seeded automatically on first start.

**Local development**
```bash
cp .env.example .env     # fill DATABASE_URL (e.g. a Neon connection string) and JWT_SECRET
npm install
npm run server           # API on http://localhost:5000
npm run dev              # Vite on http://localhost:5173 (proxies /api to the API)
```

**Render (single Web Service: API + React build)**
- Build: `npm install && npm run build` · Start: `npm start`
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (see `render.yaml`)
- Sign up creates students; the admin account is created from `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
