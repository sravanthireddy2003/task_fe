# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
# Task_Manager_FE

## Backend integration & environment

- Copy `.env.example` to `.env` or set environment variables in your system.
- Required env vars:
	- `VITE_SERVERURL` — URL of the backend API (e.g. `http://localhost:4000`).
	- `VITE_TENANT_ID` — default tenant id to include as `x-tenant-id` header (can be overridden in UI).

Example `.env` entries (Vite will read `VITE_` prefixed vars):

```
VITE_SERVERURL=http://localhost:4000
VITE_TENANT_ID=tenant_1
```

This frontend includes an axios API client at `src/App/apiClient.js` that automatically adds `x-tenant-id` and `Authorization` headers and attempts to refresh access tokens when required. Tokens are persisted in `localStorage` by default (see `src/utils/tokenService.js`).

Next steps to continue integration:
- Implement authentication pages (`Login`, `VerifyOTP`, `Forgot`, `Reset`, `Profile`) that call the thunks in `src/redux/slices/authSlice.js`.
- Wire `ProtectedRoute` and role-based guards into `src/main.jsx` / `App.jsx`.
- Implement CRUD pages and task UI, using `src/App/httpHandler.js` (axios wrappers) to call backend endpoints per the Postman collection.

