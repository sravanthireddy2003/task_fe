# Demo Walkthrough

Quick steps to run the frontend and test the OTP authentication flow with the backend Postman collection.

1. Install dependencies

```powershell
npm install
```

2. Create `.env` (copy from `.env.example`) and set `VITE_SERVERURL` and `VITE_TENANT_ID`.

3. Start the dev server

```powershell
npm run dev
```

4. Test login (OTP)

- Open the app at `http://localhost:5173` (Vite default)
- Use the Login page and enter `email` + `password`.
- The frontend will call `POST /api/auth/login` with `x-tenant-id` header; the backend should return a `tempToken` and send an OTP to the configured channel.
- After receiving the OTP, enter it on the `Verify OTP` page. The frontend will call `POST /api/auth/verify-otp` with `{ tempToken, otp }`.
- On success the backend should return `accessToken`, `refreshToken`, and `user`. The app stores tokens and navigates to `/dashboard`.

Notes:
- Token persistence uses `localStorage` by default (`src/utils/tokenService.js`). For production, migrate to httpOnly cookies and server-driven refresh flows.
- All API calls include `x-tenant-id` and `Authorization: Bearer <accessToken>` via `src/App/apiClient.js`.

If the backend exposes a `/api/auth/refresh` endpoint, the client will call it automatically on 401 responses to refresh tokens.
