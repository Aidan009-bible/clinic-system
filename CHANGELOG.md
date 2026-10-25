# Change Log

This file tracks project changes from the UI/UX redesign phase onward.

## 2026-10-26

### Live Supabase and Vercel setup

- Resumed the existing Clinic-DEMO Supabase Free project and applied the clinic_state schema with row level security enabled.
- Stored the existing server key locally in ignored configuration and generated the session signing secret.
- Configured the Vercel production branch as MKKT and used Vercel's environment API for non-interactive Production and Preview secret configuration.

### MKKT responsive portals and deployment setup

- Added shared mobile navigation, desktop sidebar scrolling, accessible collapsed labels, phone input sizing, and reduced-motion handling.
- Fixed inventory grid and patient-summary overflow, contained wide tables, and simplified patient selection on phones.
- Prioritized the sign-in form on mobile and checked Admin, Doctor, and Reception at phone/tablet/laptop/desktop widths.
- Added signed expiring sessions, atomic revision checks for hosted saves, repeat-billing protection, and preservation of empty collections.
- Added five automated hosting/data-integrity tests, Singapore Vercel region configuration, upload exclusions, and a deployment script that verifies Supabase before publishing.

Changed files: `src/components/dashboard-shell.tsx`, `src/app/globals.css`, `src/app/admin/admin.css`, `src/components/admin-actions.tsx`, `src/components/medicine-stock-table.tsx`, `src/components/reception-actions.tsx`, `src/app/reception/reception.css`, `src/app/login/page.tsx`, `src/app/layout.tsx`, `src/components/reception-queue-actions.tsx`, `src/lib/auth.ts`, `src/app/api/auth/login/route.ts`, `src/lib/clinic-server.ts`, `src/lib/supabase-server.ts`, `supabase/schema.sql`, `tests/hosting.test.cjs`, `scripts/deploy-vercel.mjs`, `vercel.json`, `.vercelignore`, `package.json`, `.env.example`, `README.md`, `CHANGELOG.md`.

## 2026-10-25

### Reception queue actions and Supabase persistence

- Added Edit and Delete actions for active queue visits. Reception can update optional symptoms or remove an incorrect check-in, with an explicit warning before cancelling an in-progress consultation.
- Added authorized queue update/delete API behavior and revalidation for affected role dashboards.
- Added responsive queue action layout and an accessible focused edit dialog.
- Switched hosted persistence to a server-only Supabase PostgreSQL state table while retaining local JSON as the development fallback.
- Replaced the obsolete schema and seed setup with an RLS-protected `clinic_state` table and documented Vercel environment setup.
- Verified with TypeScript, ESLint, and a successful production build.

Changed files:

- `.env.example`
- `README.md`
- `src/app/api/visits/[id]/route.ts`
- `src/app/reception/queue/page.tsx`
- `src/app/reception/reception.css`
- `src/components/reception-queue-actions.tsx` (new)
- `src/lib/clinic-server.ts`
- `src/lib/supabase-server.ts`
- `supabase/schema.sql`
- `supabase/seed.sql` (removed)
- `CHANGELOG.md`

## 2026-10-20

### Login desktop UI/UX polish

- Simplified the two-column entry screen with a smaller headline, shorter introduction, lighter shadows, and a prominent sign-in panel.
- Replaced decorative sample counts and unsupported trust/percentage claims with a factual check-in / consultation / billing workflow preview.
- Kept demo credentials in a compact labeled reference panel and reduced repeated feature cards to a quiet supporting row.
- Updated input placeholders, matched the sign-in button radius to dashboard actions, and added accessible error announcements.
- Verified the existing session and sign-in logic and event handlers are unchanged. TypeScript and ESLint passed. Browser checks covered 1440×900 and 1280×800, password visibility, and successful Admin sign-in/redirect. The final preview is signed out.

Changed files:

- `src/app/login/page.tsx`
- `src/components/login-form.tsx`
- `CHANGELOG.md`

### Admin desktop UI/UX polish

- Stock entry: permanent field labels, compact desktop layout with the optional photo beside medicine details, unit examples, and error feedback beside the create action.
- Inventory summary: distinct medicine, stock, warning, and photo icons; amber low-stock emphasis; quieter missing-photo styling.
- Inventory table: aligned quantities/prices, consistent row and action spacing, pale blue selected editing row and editor panel, and contained medicine photos. Shared component changes are presentation hooks scoped to Admin CSS.
- Overview: preserved blue/green/amber activity cards, simplified inner metrics, MMK currency decoration, calmer summary-card hover treatment, consistent consultation blue, and amber warnings with green healthy-state action text.
- Patients: simpler search presentation, quieter tags, and clearer Total patients / Tagged patients / Visited in last 30 days labels.
- Admin-only headers and focus styling match Doctor and Reception. Desktop review covered 1440px and 1280px widths, search and empty results, low-stock filtering, and opening/cancelling the editor. No create, save, or delete was submitted.
- Source comparison verified existing event handlers and business statements unchanged. TypeScript passed; ESLint reported no errors and three existing image-element warnings.

Changed files:

- `src/app/admin/layout.tsx` (new)
- `src/app/admin/admin.css` (new)
- `src/app/admin/overview/page.tsx`
- `src/components/admin-actions.tsx`
- `src/components/medicine-stock-table.tsx`
- `src/components/patient-directory.tsx`
- `CHANGELOG.md`

### Reception desktop UI/UX polish

- Patients: refined Existing/New patient selection, pale blue selected rows, persistent labels for registration and visit reason, calmer table styling, and a clear Add to queue action.
- Queue: aligned position, patient, check-in date, and status columns; blue With doctor and amber Waiting pills; improved empty-state copy; clarified that active visits include all check-in dates.
- Billing: consistent patient / prescription / billing-summary columns, aligned money values, the existing medicine and visit totals, green billing-ready badges, clearer Issue bill slip wording, and supporting text explaining stock updates.
- Overview: current workflow appears before historical activity; billing-ready totals receive subtle emphasis; Daily/Weekly/Monthly retain blue/green/amber colors; lighter surfaces match Doctor.
- Medicine Stock: reception-only table spacing, numeric alignment, and read-only reference presentation.
- Refined desktop page headers and keyboard focus through reception-scoped CSS. Doctor and Admin styles remain unchanged.
- Verified unchanged event handlers and business statements against a source snapshot (allowing the intended overview detail-copy update). No API, auth, filtering, calculation, visit-transition, or stock-mutation behavior changed.
- Desktop browser review covered overview, existing-patient search/selection, new-patient fields, queue, billing, and stock. No check-ins or bill issuance were submitted during verification.

Changed files:

- `src/app/reception/layout.tsx` (new)
- `src/app/reception/reception.css` (new)
- `src/app/reception/patients/page.tsx`
- `src/app/reception/queue/page.tsx`
- `src/app/reception/billing/page.tsx`
- `src/components/reception-actions.tsx`
- `src/components/portal-overview.tsx`
- `CHANGELOG.md`

### Admin activity card colors

- Updated `src/app/admin/overview/page.tsx` so Daily, Weekly, and Monthly use the same soft blue, green, and amber backgrounds and borders as Doctor Clinic Activity. Existing content, calculations, and behavior are unchanged.
- Updated `CHANGELOG.md` to record this styling adjustment.

### Doctor workspace polish

- Patient History uses compact clinical record rows with aligned details, billing, and action columns; shows the existing stored total; separates diagnosis and symptoms; uses one quiet completed pill; and refers to Queue in the empty state.
- Consultation uses a clearer patient/symptoms header, quieter clinical sections, compact previous visits, and a unified review-and-finish area.
- Prescription fields have persistent accessible labels, aligned controls, a quieter remove action, and Add medicine below the rows.
- Queue uses clearer section titles, lighter rows, wrapping patient names, consistent status tones, and one overall empty state when there are no active visits.
- Doctor Overview places current workflow before period reports, clarifies date scopes, and reduces decorative weight.
- Restored the original soft blue Daily, green Weekly, and amber Monthly card backgrounds and borders in Clinic Activity (`src/app/doctor/doctor.css`); retained the polished layout and existing report data.
- Doctor Medicine Stock has aligned numeric columns, comfortable table spacing, and simpler reference copy. Search labels and filter accessibility were improved.
- Doctor-only styles refine page headings, keyboard focus, reduced motion, and compact mobile navigation. Admin and reception retain their visual styling.
- Existing routes, authorization, handlers, validation, billing calculations, stock mutations, and visit transitions are unchanged.

Changed files:

- `src/app/doctor/layout.tsx` (new)
- `src/app/doctor/doctor.css` (new)
- `src/app/doctor/history/page.tsx`
- `src/app/doctor/stock/page.tsx`
- `src/components/doctor-actions.tsx`
- `src/components/dashboard-shell.tsx` (presentation hooks only)
- `src/components/portal-overview.tsx`
- `src/components/medicine-stock-table.tsx`
- `CHANGELOG.md`

## 2026-10-12

### Documentation

- Updated `README.md` with current local run instructions and UI/UX direction.
- Added `PROJECT_SPEC.md` for the project scope, design direction, and redesign plan.
- Added this `CHANGELOG.md` to track changed files from now on.
- Updated `README.md` and `PROJECT_SPEC.md` again with the latest completed admin and doctor UI/UX work, current visual system, remaining reception/responsive QA work, and lint status.
- Updated `README.md`, `PROJECT_SPEC.md`, and `CHANGELOG.md` with the latest Doctor Queue workbench and doctor visit page consultation polish.

### UI/UX

Login page first-pass redesign. Functionality was not changed.

Changed files:

- `src/app/login/page.tsx`
- `src/components/login-form.tsx`

Design notes:

- Replaced the previous broad demo card layout with a calmer clinic staff portal layout.
- Introduced a teal/slate/white clinical visual direction.
- Improved login form field, button, focus, and error styling.
- Reworked demo account presentation for clearer role scanning.

Follow-up login direction update:

- Shifted the login page toward a premium medical landing-page-inspired staff portal.
- Added warmer off-white, olive, deep green, and yellow-green accents.
- Reworked the hero section with workflow chips, role cards, and a soft medical visual panel.
- Updated login form colors to match the warmer clinic brand direction.
- Added floating clinic-value capsules for `Expertise`, `Wellness`, and `Care` inside the login visual panel.

Second login direction update:

- Pivoted away from the warm olive wellness style.
- Switched to a LabPro-inspired clinical SaaS direction using deep navy, soft gray, white, and pale lab blue.
- Reworked the login hero copy, visual panel, operational badges, role cards, and form states to better fit a clinic management system.
- Fixed overlapping text/badge inside the login visual card.
- Renamed `Demo portal` to `Welcome`.
- Replaced the bottom role cards with operational cards for `Trusted workflow`, `Stock control`, and `Fast check-in`.
- Moved demo account credentials into the sign-in panel.
- Removed duplicate left-side operational cards after the same items were kept in the sign-in panel.
- Aligned the sign-in card to the top of the right column to remove excess upper whitespace.

Admin overview and navigation refresh:

- Updated `src/components/dashboard-shell.tsx` to match the LabPro-inspired clinical SaaS theme.
- Updated `src/app/admin/overview/page.tsx` with cleaner KPI cards, activity cards, workflow status, and low-stock table styling.
- Kept admin overview data, links, navigation items, and clinic functionality unchanged.
- Reworked the dashboard sidebar from dark block styling to a cleaner light clinical navigation.
- Added a page-level back button in the dashboard header.
- Updated `src/components/logout-button.tsx` to match the light sidebar style.

Admin patients refresh:

- Updated `src/components/patient-directory.tsx` with a cleaner patient registry design.
- Added visual summary cards, a polished search panel, table row hover styling, and soft patient tag chips.
- Kept patient search/filter behavior and displayed data unchanged.

Admin stock refresh:

- Updated `src/components/admin-actions.tsx` with inventory summary cards and a cleaner create-medicine tools panel.
- Updated `src/components/medicine-stock-table.tsx` with polished search/filter controls, edit panel styling, table styling, and action button states.
- Kept medicine creation, image upload, search, low-stock filter, edit, and delete behavior unchanged.
- Updated Admin Overview revenue cards to use a softer money-green treatment and more compact sizing.

Admin polish pass:

- Added a safe role-home fallback to the dashboard back button while keeping browser-history back behavior.
- Updated admin page header copy to `Admin workspace` with clearer subtitles.
- Replaced generic plus/alert text in Admin Overview KPI cards with meaningful inline icons.
- Improved empty states for patient search, medicine search/filter, and healthy low-stock reminders.

Doctor consultation refresh:

- Updated `src/components/doctor-actions.tsx` consultation form styling with a focused clinical workspace layout.
- Restyled patient context, symptoms, diagnosis/notes/fee fields, prescription builder, medicine summary, save panel, and patient history sidebar.
- Kept consultation validation, prescription item behavior, save action, and routing unchanged.

Doctor waiting queue refresh:

- Updated `src/components/doctor-actions.tsx` waiting queue styling with a cleaner queue header, count card, patient rows, symptom panels, action button, and empty/error states.
- Kept waiting queue ordering, start-consultation API call, loading behavior, and routing unchanged.

Doctor patient history refresh:

- Updated `src/app/doctor/history/page.tsx` with a cleaner clinical records layout, summary strip, patient record headers, status chips, visit cost panels, and empty state.
- Kept patient history filtering, visit ordering, status labels, and Manage links unchanged.

Doctor overview and stock polish:

- Updated `src/components/portal-overview.tsx` with a shared clinical dashboard redesign for doctor and reception overview pages, including cleaner KPI cards, activity panels, workflow status, revenue treatment, and stock reminders.
- Updated `src/app/doctor/stock/page.tsx` copy so the stock page reads as a doctor medicine reference while keeping the table behavior unchanged.
- Kept overview calculations, links, stock data, and role access behavior unchanged.
- Matched the shared overview `Paid total` revenue card to the softer admin money-green styling.

Doctor queue workbench update:

- Updated `src/app/doctor/queue/page.tsx` so Doctor Queue shows all non-completed active visits instead of only `Waiting` visits.
- Updated `src/components/doctor-actions.tsx` with grouped `Waiting`, `In consultation`, and `Ready for billing` sections, status counters, state-specific buttons, and clearer empty states.
- Refined the Doctor Queue layout with a cleaner board-style presentation, aligned row columns, fixed-width action buttons, quieter status counters, and more polished patient rows.
- Reworked the Doctor Queue visual polish again to better match the admin-side theme: admin-style KPI cards, white clinical panels, table-based rows, softer lab-blue surfaces, meaningful inline icons, and consistent pill actions.
- Updated the Doctor Queue `Start consult` action to use the deep medical navy button treatment so it matches the admin-side theme better.
- Strengthened the Doctor Queue `Review` action with an emerald filled button so ready-for-billing visits remain clearly actionable without becoming too bright.
- Replaced the Doctor Queue section tables with responsive clinical workflow rows so patient actions stay visible without horizontal scrolling.
- Changed the Doctor Queue top KPI cards into a compact connected workflow status strip so the patient queue remains the visual focus.
- Tightened Doctor Queue row responsiveness so patient details, clinical notes, and actions align at medium widths instead of falling into oversized stacked cards.
- Renamed the doctor sidebar/page label from `Waiting` to `Queue` across doctor screens so the navigation matches the active workbench behavior while preserving visit status names.
- Kept visit status transitions, start-consultation API behavior, consultation routing, and billing workflow unchanged.

Doctor visit page consultation polish:

- Updated `src/components/doctor-actions.tsx` doctor visit form with a stronger active consultation header, patient initial, status badge, and highlighted symptoms panel.
- Reworked the consultation page into clearer clinical zones for notes, prescription, billing preview, handoff action, and patient history.
- Added live billing preview totals for consultation fee, medicine total, and total charge while keeping the existing submit payload and visit workflow unchanged.
- Polished prescription rows with medicine stock/price hints, line totals, and clearer spacing.
- Restyled patient history as compact clinical record cards with status badges and fee summaries.
- Kept billing totals in the emerald handoff panel as the single visible total summary to avoid duplicated billing sections on stacked layouts.
