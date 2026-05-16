# Client Changes Tracker

Date created: 2026-05-03

Status key:

- `[ ]` Not started
- `[~]` Partly exists or needs cleanup
- `[x]` Completed

## Requested Changes

- [x] Food cooked/prepared date safety validation
  - Donor create/edit flows now require cooked/prepared date and time.
  - Backend validation blocks food prepared more than 24 hours ago or in the future.
  - Donor Sharebite AI donation wizard now asks when food was cooked/prepared before creating a donation.

- [x] 1. Simplify language
  - Replaced dense operational wording with clear demo-friendly labels.
  - Completed examples:
    - "Efficient Altruism Starts Here" to "Share Extra Food Easily"
    - "Plant-Based Registry" to "Vegetarian Food"
    - "Deployment Parameters" to "Pickup Details"
    - "Priority Protocol" to "Pickup Urgency"
    - "Operational Directives" to "Notes"
    - "Strategic Advisor" to "AI Suggestion"
    - "Impact Intelligence" to "Donation Insights"
    - "Mission Segment" to "Donation"
    - "Route Intelligence" to "Route Suggestion"
    - "Intelligence Node" to "Sharebite AI"

- [~] 2. Minor UI polish
  - The app already has a polished dashboard UI.
  - Needs final spacing, copy clarity, dropdown/upload styling, and consistency pass after functional phases.

- [x] 3. Localize places to India/Bangalore
  - Demo seed scripts, Supabase demo rows, docs, and map addresses now use Bangalore data.
  - Bangalore areas include Koramangala, Indiranagar, Jayanagar, Whitefield, HSR Layout, MG Road, Electronic City, JP Nagar, Malleshwaram, Marathahalli, and Hebbal.

- [x] 4. Status update dropdown
  - Delivery dashboard now uses a dropdown for delivery job status updates.
  - Dropdown statuses:
    - Assigned
    - Accepted
    - Picked Up
    - In Transit
    - Delivered
    - Cancelled
  - Delivery status updates sync the related donation status across donor and NGO views.

- [x] 5. Donation zones + map/prediction insights
  - NGO Analytics now shows Donation Zones & Predictions.
  - Groups live Supabase `donations` rows by supported Bangalore areas.
  - Visible UI labels now explain the data source, fields used, and last update time.
  - Manual refresh plus timed revalidation keep the zone queue updated after new donations.
  - Shows zone cards with donation count, total quantity, common food type, active/open donations, completed donations, predicted peak window, and recommendation.
  - Quantity now directly affects the 0-100 source-zone prediction score, so large donations can move an area upward.
  - Added a separate High-Need Community Zones view for demo-level suitable-zone prediction using seeded community need indicators plus current donation availability.
  - Includes a Bangalore map context panel and ranked zone list.
  - Labeled honestly as rule-based: "AI-assisted prediction based on recent donation patterns."

- [x] 6. Food photo upload
  - Added `photoUrl` support for donations and `photo_url` Supabase mapping.
  - Donor create and edit flows support image upload/replace with preview.
  - Donation photos display on donor cards, NGO marketplace/details, and delivery job details/API data.
  - Preferred Storage bucket is `donation-photos`.
  - Current anon key cannot create the bucket because of Supabase RLS, so small demo images fall back to persisted data URLs if Storage upload is unavailable.

- [x] 7. Role-specific chatbot
  - Chat panel now has role-specific greetings, suggested prompt chips, loading state, and duplicate-send protection.
  - Donors can use a structured chat wizard to create a donation through the existing donation API after confirmation.
  - NGOs get deterministic live-data answers for open donations, accept-first priority, donation zones, match score, and analytics.
  - Delivery users get deterministic live-data answers for next pickup, urgent jobs, routes, status dropdowns, and after-pickup steps.
  - Gemini is optional and only rewrites completed deterministic answers when available.

- [x] 8. Rename website to Sharebite
  - Visible app branding, metadata, chatbot labels, README, and setup/deployment docs now use Sharebite.
  - Database table names should not be renamed unless necessary.

- [x] 9. Role-based login/access control
  - Dashboard pages redirect users based on `profiles.role`.
  - Phase 1 added API role checks for donor donation creation, NGO accept/reject, and delivery job updates.
  - Login now requires selecting a role and entering email/password.
  - `/api/auth` verifies the selected role against `profiles.role` before setting the session cookie.
  - Wrong role selection is blocked with a clear role mismatch error.
  - Active demo accounts:
    - `donor@sharebite.demo` / `demo123`
    - `ngo@sharebite.demo` / `demo123`
    - `delivery@sharebite.demo` / `demo123`

- [x] 10. Donor edit/delete before pickup
  - Donor dashboard now shows edit/delete controls on eligible donations.
  - Editable fields:
    - title
    - food type/category
    - quantity
    - unit
    - urgency
    - pickup address
    - pickup window/time
    - notes
    - vegetarian flag
  - Server checks allow donor edit/delete only when status is `open`, `accepted`, or `pickup_assigned`.
  - Server checks block edit/delete when status is `picked_up`, `in_transit`, `delivered`, or `cancelled`.

## Phase Progress

- [x] Phase 0 - Inspect repo and Supabase database.
- [x] Phase 0 - Create `IMPLEMENTATION_AUDIT.md`.
- [x] Phase 0 - Create `CLIENT_CHANGES_TRACKER.md`.
- [x] Phase 1 - Stabilize cross-role donation workflow.
- [x] Phase 2 - Rename app to Sharebite and simplify copy.
- [x] Phase 3 - Localize demo data for Bangalore.
- [x] Phase 4 - Add status dropdown.
- [x] Phase 5 - Add donor edit and delete controls.
- [x] Phase 6 - Add food photo upload.
- [x] Phase 7 - Add donation zones and predictive insights.
- [x] Phase 8 - Improve role-specific Sharebite AI assistant.
- [x] Phase 9 - Add role-verified demo login.
- [ ] Phase 10 - Final UI polish and deployment readiness.

## Current Phase 0 Notes

- `npm run build` passed during inspection.
- `npm run lint` failed with pre-existing lint issues.
- One inconsistent live demo row was found where an NGO user appears as the donor. Per user confirmation, Phase 1 should quarantine/document this and prevent repeats rather than deleting data now.
- Supabase Storage currently has no buckets.
- The database already has a `photo_url` column, which can support Phase 6 after app types and upload flow are added.

## Current Phase 1 Notes

- Added API role checks so only donors can create donations, only NGOs can accept/reject donations, and only delivery users can update delivery jobs.
- Normalized `ngo_profiles.supported_food_types` so matching works when Supabase returns an array or stringified JSON.
- NGO acceptance now uses a delivery user lookup instead of a hard-coded delivery partner id.
- Duplicate delivery jobs are prevented by reusing/updating an existing job for the donation if one exists.
- Donation status is set to `pickup_assigned` when a delivery job is assigned, then delivery updates sync it through `picked_up`, `in_transit`, and `delivered`.
- NGO current/in-progress view now includes `pickup_assigned`.
- Phase 1 workflow test passed with donation `4aa4acf8-f595-4241-ab49-025eb3e6194c` and delivery job `5d7d24d1-7a09-4c1b-a99b-36e04a0f3c08`.

## Current Phase 2 Notes

- Renamed visible app branding to Sharebite across login, sidebar/mobile header, metadata, chatbot labels, README, deployment docs, and setup/design docs.
- Simplified high-friction copy across donor, NGO, delivery, analytics, and chatbot surfaces while preserving the current Stitch UI structure.
- Updated chatbot fallback and Gemini system prompt to use Sharebite naming.
- No database table names, seed data, uploads, donation zones, dropdown status controls, or login behavior were changed.
- `npm run build` passed after the Phase 2 copy changes.

## Current Phase 3 Notes

- Localized demo seed data to Bangalore areas, donor names, NGO names, pickup addresses, drop-off addresses, analytics summaries, and design reference data.
- Added `npm run seed:demo` as the safe Supabase demo reseed command.
- The reseed deletes only known demo rows before recreating profiles, NGO profiles, donations, match suggestions, delivery jobs, and analytics snapshots.
- Seeded examples now cover `open`, `accepted`, `pickup_assigned`, `in_transit`, `delivered`, and `cancelled`.
- Phase 9 now replaces the legacy auto-login behavior with role-verified Sharebite demo login.
- `npm run seed:demo` passed and `npm run build` passed after the Phase 3 changes.

## Current Phase 4 Notes

- Replaced the delivery dashboard click-to-advance action button with a dropdown.
- Added `cancelled` as a delivery job status and mapped it to donation status `cancelled`.
- Completed and cancelled jobs are excluded from active delivery jobs after refresh.
- Phase 1 role checks remain in place: only delivery users can update delivery jobs.
- API workflow test passed for `accepted`, `picked_up`, `in_transit`, `delivered`, `cancelled`, and restore to `assigned`.
- Donor and NGO API views reflected the synced `delivered` donation status during testing.
- `npm run build` passed after the Phase 4 changes.

## Current Phase 5 Notes

- Added donor edit and delete controls for donations that are still before pickup.
- Added edit and delete API checks for donor role, donation ownership, and allowed statuses.
- Donor edits update the donation row and keep related delivery job title/pickup address in sync.
- Donor deletes cascade demo-facing related rows from match suggestions and delivery jobs before deleting the donation.
- UI locks edit/delete controls for `picked_up`, `in_transit`, `delivered`, and `cancelled`.
- API tests passed for open donation edit/delete, wrong donor blocking, locked status blocking, and pickup-assigned edit propagation to NGO/delivery views.
- `npm run seed:demo` was run after tests to restore the Bangalore demo baseline.
- `npm run build` passed after the Phase 5 changes.

## Current Phase 6 Notes

- Added food photo support to `Donation.photoUrl` and Supabase `donations.photo_url`.
- Added `npm run storage:setup` to create/use the `donation-photos` bucket when a service role key is available.
- Attempted bucket creation with the current environment; Supabase blocked it with RLS because only the anon key is present.
- Donor create/edit image upload tries Supabase Storage first, then safely falls back to storing small demo images directly in `photo_url`.
- Donor cards, NGO marketplace cards/details, and delivery job details can render saved food photos.
- API tests passed for creating a donation with a persisted photo, NGO marketplace photo visibility, replacing the photo, delivery API photo visibility, cleanup, and reseed.
- `npm run build` passed after the Phase 6 changes.

## Current Phase 7 Notes

- Added Donation Zones & Predictions to NGO Analytics.
- Uses current Supabase donation rows, grouped by Bangalore area from `donations.location_name`.
- Calculates donation count, total quantity, common food type, active/open count, completed count, urgency level, and predicted peak window.
- Prediction logic is deterministic and demo-friendly, not trained machine learning.
- Highest donation count becomes the highest activity zone.
- Urgent active donations become the immediate attention zone.
- Active recent rows influence the next pickup zone.
- Weak/overnight time data uses sensible demo labels such as Evening.
- `npm run seed:demo` passed and produced 8 zones from Bangalore seed data.
- NGO Analytics page returned HTTP 200 locally and included the prediction label plus seeded zones.
- `npm run build` passed after the Phase 7 changes.

## Current Phase 8 Notes

- Added role-specific Sharebite AI prompt chips and role labels for donor, NGO, and delivery users.
- Added a loading/typing state with "Sharebite AI is thinking..." and disabled sends while requests are in flight.
- Added deterministic donor guided donation creation inside the chat panel:
  - collects title, category/food type, quantity/unit, pickup address, pickup window, urgency, vegetarian flag, and notes
  - shows a summary before create
  - creates only after explicit confirmation through the existing donation API
- Added `/api/chat` role context and session-aware deterministic responses.
- NGO chatbot answers use live Supabase donation, match, zone, and analytics data.
- Delivery chatbot answers use live assigned delivery job data and related donation urgency.
- Gemini remains optional and only rewrites deterministic answers; fallback responses still work without Gemini.
- Expanded Bangalore demo seed data to 18 profiles, 15 donations, 14 match suggestions, 6 delivery jobs, and 42 analytics snapshots.
- `npm run seed:demo` passed, endpoint tests passed, the cross-role workflow test passed, and `npm run build` passed.

## Current Phase 9 Notes

- Replaced auto-login role cards with a role-selected email/password demo login.
- Login page shows Sharebite branding and the three roles:
  - Donor
  - NGO
  - Delivery Partner
- Auth API checks the submitted selected role against the Supabase `profiles.role` value before creating a session.
- Wrong-role attempts are blocked; tested example:
  - donor account + NGO role returned `This account is not registered as an NGO.`
- Dashboard sidebar now shows verified role labels:
  - Verified Donor
  - Verified NGO
  - Verified Delivery Partner
- Seed data now uses:
  - `donor@sharebite.demo` / `demo123`
  - `ngo@sharebite.demo` / `demo123`
  - `delivery@sharebite.demo` / `demo123`
- `npm run seed:demo` passed, role login tests passed, chatbot checks passed, donor -> NGO -> delivery workflow passed, and `npm run build` passed.
