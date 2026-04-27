# Frontend

## Pages

Main pages live in `src/app`:

- `/`: entry page.
- `/login`: authentication page.
- `/dashboard`: reading dashboard.
- `/dashboard/students`: student management.
- `/dashboard/students/[id]`: student history/detail page.
- `/dashboard/classes`: class management.
- `/dashboard/schools`: school management.
- `/dashboard/admin`: admin overview.
- `/dashboard/admin/logs`: audit log view.
- `/dashboard/admin/sessions`: session view.

## Dashboard Layout

`src/app/dashboard/layout.tsx` owns:

- auth guard using `localStorage` token and teacher data,
- sidebar navigation,
- language switcher,
- logout,
- heartbeat calls,
- school selector,
- `selectedSchool` persistence,
- `schoolChanged` browser event dispatch.

## Client Data Fetching

Dashboard pages are client components. They fetch API data using the bearer token from `localStorage`.

When adding or changing dashboard data:

- keep loading states explicit,
- use existing skeleton components where possible,
- handle unauthorized state by returning to `/login`,
- update Vitest or Playwright coverage for behavior changes.

## Components

- `src/components/ui`: reusable UI primitives.
- `src/components/skeletons`: loading placeholders for dashboard, schools, and students.
- `src/components/LanguageSwitcher.tsx`: locale switch control.

## Styling

The project uses Tailwind CSS and local component classes. Prefer existing visual patterns over introducing a new design system.

## Import Alias

Use `@/*` for imports under `src`:

```ts
import { prisma } from '@/lib/db'
```
