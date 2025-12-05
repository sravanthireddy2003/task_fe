**Project Overview**

- **Stack**: Vite + React 18, Redux Toolkit, RTK Query (light usage), Axios, Tailwind CSS.
- **Purpose**: Frontend for Task Manager; communicates with a backend API under `VITE_SERVERURL` and uses `x-tenant-id` for multi-tenant requests.

**Where to look first**

- `src/main.jsx`: app bootstrap, tenant default persistence, and dev seeding (`src/dev/dev_token.js`).
- `src/App/apiClient.js`: centralized axios client with refresh-token logic and tenant header.
- `src/App/httpHandler.js`: wrapper helpers (`httpGetService`, `httpPostService`, etc.) — use these in thunks and UI code.
- `src/utils/tokenService.js`: canonical token keys and helpers (`getAccessToken`, `setTokens`, `clearTokens`).
- `src/redux/store.js` and `src/redux/slices/*`: data model and thunk patterns. Add new slices under `src/redux/slices` and register in `store.js`.

**Key patterns & conventions (do these exactly)**

- API calls: prefer `httpGetService/httpPostService/httpPatchService/httpPutService/httpDeleteService` from `src/App/httpHandler.js`. These ensure `x-tenant-id` and `Authorization` are set consistently and format errors uniformly.
- Token management: use `src/utils/tokenService.js`. Tokens are persisted under legacy keys (`tm_access_token`, `tm_refresh_token`) and duplicated to `accessToken`/`refreshToken` for backward compatibility — maintain both when setting tokens.
- Tenant id: read from `localStorage.tenantId` or `import.meta.env.VITE_TENANT_ID`. Many helpers fall back to `src/main.jsx`-seeded value; prefer using `localStorage` for runtime overrides.
- Dev convenience: `src/dev/dev_token.js` may seed tokens at startup; treat it as optional and only present in development.
- Redux: slices are placed in `src/redux/slices`. Use `createAsyncThunk` + `http*Service` for side-effects (see `authSlice.js` for examples). If adding a new slice, export reducer and add to `store.js` (follow `apiSlice.reducerPath` pattern if adding RTK Query endpoints).
- Routing: React Router v6 is used. Protect routes with `src/components/ProtectedRoute.jsx` and role-routing via `src/components/RoleRedirect.jsx`.

**Files to update when adding features**

- New API endpoints: prefer adding calls to `httpHandler` from thunks in `src/redux/slices/*` or call `fetchWithTenant.js` for fetch-based flows.
- New Redux slice: create under `src/redux/slices`, implement thunks using `http*Service`, then register in `src/redux/store.js`.
- New pages/components: add UI components under `src/components` and pages under `src/pages`. Follow existing naming and default-export patterns.

**Build / test / dev commands**

Run locally (cmd.exe):

```
npm install
npm run dev        # start Vite dev server (port 3000 by default)
npm run build      # build for production
npm test           # runs tests using Vitest
npm run lint       # run ESLint
```

Notes: `vite.config.js` proxies `/api` to `VITE_SERVERURL` during dev.

**Testing & linting**

- Tests: `vitest` is configured; unit tests live in `src/__tests__` alongside `*.test.jsx` files. Use `npm test` to run.
- Lint: `npm run lint` uses project ESLint settings; avoid large auto-fixes that change formatting outside the affected scope.

**Integration points & gotchas**

- Interceptors & refresh flow: `src/App/apiClient.js` contains the axios token-refresh queue logic. Changes here can affect all API calls — test 401/refresh flows carefully.
- Multiple token keys: code expects both `tm_access_token` and `accessToken` in various places; preserve backwards-compatible keys when writing helpers.
- Tenant discovery: `httpHandler` attempts to infer tenant from `localStorage.tenantId` then `userInfo` fields like `tenantId`, `tenant_id`, `public_id`, `company` — maintain that tolerant logic if you refactor.
- Dev seed side-effects: `src/main.jsx` will write `userInfo` and token keys when `src/dev/dev_token.js` is present; avoid committing dev seeds to production branches.

**What to avoid**

- Don’t bypass `http*Service` helpers to call `axios` directly from components — that duplicates header/token logic.
- Don’t change token storage keys without updating `tokenService.js`, `apiClient.js`, and any slice that reads legacy keys.

**Examples**

- Making a POST inside a thunk:

```js
// inside src/redux/slices/mySlice.js
const resp = await httpPostService('api/tasks', payload);
return resp;
```

- Safe token set (follow `tokenService`):

```js
import { setTokens } from 'src/utils/tokenService';
setTokens(access, refresh, 'local');
```

**If any behavior is unclear**

- Ask for the backend Postman collection (there's `postman_environment.json` in repo) or a sample API response. Point to `src/App/httpHandler.js` / `src/App/apiClient.js` when requesting clarification about headers, refresh logic, or expected response shapes.

If you'd like, I can: run tests, add a short CONTRIBUTING section, or wire an example slice+page. What should I do next?
