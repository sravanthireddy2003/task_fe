# UI & Icon Guidelines

## Icon System

- **Library**: `lucide-react` is the single source of truth for all icons.
- **Imports**: Prefer named imports from `lucide-react` and group related icons together.
- **Usage**:
  - Use semantic icons (e.g. `ShieldCheck` for security, `ListChecks` for task counts, `Bell` for notifications).
  - Keep icon size consistent via Tailwind classes (e.g. `w-4 h-4`, `w-5 h-5`).
  - Align icons and text with flex utilities (e.g. `inline-flex items-center gap-2`).
- **Color**:
  - Default icons inherit text color (`text-gray-500/600` for neutrals).
  - Use state colors for emphasis only: `text-indigo-600` (primary), `text-emerald-600` (success), `text-amber-500` (warning), `text-rose-500` (error).

## Layout & Components

- **Buttons**:
  - Use the shared Button component where possible.
  - Place icons to the left of the label; keep spacing with `gap-2`.
- **Inputs**:
  - Reuse the shared input/Textbox patterns; pair field labels with small icons only when they add clarity.
- **Cards & Panels**:
  - Use consistent card styling (rounded corners, subtle shadow, light border).
  - Section headers can include a single leading icon for quick visual scanning.

## When Adding New UI

- Prefer existing icons already used elsewhere before introducing new ones.
- Match existing patterns from pages like:
  - Admin dashboard (analytics and control cards).
  - Client analytics (cards with header icons and metrics).
  - Profile/Settings (security and 2FA flows).
- If unsure which icon to pick, choose clarity over novelty and keep the semantic mapping obvious from the name.
