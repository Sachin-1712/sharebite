# Demo Test Workflows

Last updated: 2026-05-16

## Phase 1 Workflow Test

Purpose: verify the core donor -> NGO -> delivery workflow with Supabase persistence and API role checks.

### Automated API Test Result

Status: Passed

Local app URL used: `http://localhost:3000`

Test data:

- Donation title: `Phase 1 Workflow Test 2026-05-03T21-04-37-013Z`
- Donation id: `4aa4acf8-f595-4241-ab49-025eb3e6194c`
- Delivery job id: `5d7d24d1-7a09-4c1b-a99b-36e04a0f3c08`
- Generated match suggestions: 2

Validated checks:

- NGO was blocked from creating a donor donation: `403`.
- Donor created a fresh donation.
- Donor donation view showed the donation as `open`.
- NGO marketplace showed the fresh donation.
- NGO accepted the donation.
- Accepted donation moved to `pickup_assigned`.
- Duplicate NGO accept was blocked: `409`.
- NGO current view showed the accepted donation.
- Delivery user saw the assigned job.
- Donor was blocked from updating delivery status: `403`.
- Delivery user updated status through:
  - `accepted`
  - `picked_up`
  - `in_transit`
  - `delivered`
- Donor view reflected `delivered`.
- NGO view reflected `delivered`.

## Manual Demo Steps For Phase 1

Use the current Phase 9 role-verified demo accounts:

- Donor: `donor@sharebite.demo` / `demo123`
- NGO: `ngo@sharebite.demo` / `demo123`
- Delivery Partner: `delivery@sharebite.demo` / `demo123`

Steps:

1. Log in as donor.
2. Create a new donation from the donor dashboard.
3. Confirm it appears in the donor dashboard as `Open`.
4. Log out and log in as NGO.
5. Confirm the donation appears in the NGO marketplace.
6. Open the donation and accept it.
7. Confirm it appears in the NGO in-progress/current view as `Pickup Assigned`.
8. Log out and log in as delivery.
9. Confirm the delivery job appears in the dispatch queue.
10. Advance the delivery status.
11. Return to donor and NGO dashboards.
12. Confirm the updated status appears after refresh.

## Phase 1 Build Check

Command:

```bash
npm run build
```

Result: Passed.

## Phase 3 Bangalore Demo Reseed Test

Purpose: verify that the demo dataset is localized to Bangalore and still supports the existing donor, NGO, delivery, and analytics views.

### Reseed Command

```bash
npm run seed:demo
```

Expected result:

- Demo-only rows are reset.
- Bangalore profiles, NGO profiles, donations, match suggestions, delivery jobs, and analytics snapshots are recreated.
- Phase 9 demo login emails are available and role-verified.

Actual result: Passed on 2026-05-05.

Seeded rows:

- Profiles: 18
- NGO profiles: 5
- Donations: 15
- Match suggestions: 14
- Delivery jobs: 6
- Analytics snapshots: 42

### Dashboard Checks

Use the current role-verified demo accounts:

- Donor: `donor@sharebite.demo` / `demo123`
- NGO: `ngo@sharebite.demo` / `demo123`
- Delivery Partner: `delivery@sharebite.demo` / `demo123`

Donor dashboard:

1. Log in as donor.
2. Confirm Koramangala Kitchen data appears.
3. Confirm `35 Veg Biryani Meal Boxes` appears as `Open`.
4. Confirm cancelled demo data is present only as historical/status data.

NGO marketplace:

1. Log in as NGO.
2. Confirm open donations include Bangalore areas:
   - Koramangala
   - Indiranagar
   - HSR Layout
   - Malleshwaram
3. Confirm match suggestions reference Bangalore NGOs.

Delivery dashboard:

1. Log in as delivery.
2. Confirm active jobs include:
   - `40 Corporate Lunch Packs`
   - `12 Juice Bottles`
   - `30 Mixed Veg Sandwiches`
3. Confirm completed jobs include:
   - `25 Paneer Butter Masala Portions`
4. Confirm pickup and drop-off map links are built from Bangalore addresses.

Analytics:

1. Log in as NGO.
2. Open analytics.
3. Confirm Bangalore-focused activity data appears.

### Build Check

Command:

```bash
npm run build
```

Result: Passed on 2026-05-03.

## Phase 4 Delivery Status Dropdown Test

Purpose: verify that delivery status dropdown updates sync to Supabase and are visible to donor and NGO views after refresh.

Local app URL used: `http://localhost:3000`

Test job:

- Donation: `30 Mixed Veg Sandwiches`
- Delivery job id: `88888888-8888-8888-8888-888888888888`
- Donation id: `cccc3333-4444-5555-6666-777777777777`

Validated checks:

- Delivery user changed status through:
  - `accepted`
  - `picked_up`
  - `in_transit`
  - `delivered`
- Delivery job status updated in Supabase after each API call.
- Related donation status synced to `delivered`.
- Donor view for `donor-electronic-city@sharebite.demo` reflected `delivered`.
- NGO view for `ngo2@sharebite.demo` reflected `delivered`.
- Delivered job left the active delivery list.
- Delivery user changed status to `cancelled`; job left active delivery list.
- Test job was restored to `assigned`; donation returned to `pickup_assigned` for the demo baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-03.

## Phase 5 Donor Edit/Delete Test

Purpose: verify donors can edit or delete only their own pre-pickup donations, and that protected statuses are blocked.

Local app URL used: `http://localhost:3000`

Validated checks:

- Donor created a fresh open donation:
  - `Phase 5 Editable Test`
- Donor edited the open donation:
  - Title changed to `Phase 5 Edited Test`
  - Quantity changed to `11`
  - Pickup location changed to a Bangalore address
- Donor deleted the edited open donation.
- Deleted donation no longer appeared in donor API view.
- Wrong donor edit attempt returned `403`.
- Locked status attempts returned `409`:
  - `picked_up`
  - `in_transit`
  - `delivered`
  - `cancelled`
- Pickup-assigned edit propagation was tested on `30 Mixed Veg Sandwiches`:
  - NGO API view reflected the edited title and quantity.
  - Delivery API view reflected the edited title and pickup address.
  - Seeded donation was restored afterward.
- `npm run seed:demo` was run after tests to restore the Bangalore demo baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-04.

## Phase 6 Food Photo Upload Test

Purpose: verify donation photos persist and appear across donor, NGO, and delivery views.

Storage setup:

```bash
npm run storage:setup
```

Result: bucket creation was attempted, but Supabase returned an RLS error with the current anon-only environment. The app fallback stores small demo images in `donations.photo_url`.

Validated checks:

- Donor created `Phase 6 Photo Test` with a photo URL fallback.
- Donor API view returned the saved `photoUrl` after refresh.
- NGO marketplace API view returned the same `photoUrl`.
- Donor edited the donation and replaced the photo.
- Donor API view returned the replacement `photoUrl`.
- Delivery API returned `donationPhotoUrl` for a photo-enabled assigned job.
- Test donation was deleted.
- `npm run seed:demo` was run after tests to restore the Bangalore demo baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-04.

## Phase 7 Donation Zones Test

Purpose: verify NGO Analytics shows Bangalore donation zones and rule-based predictions from current Supabase donation rows.

Setup:

```bash
npm run seed:demo
```

Result: Passed. Bangalore seed data produced 8 zones with donation rows.

Validated checks:

- Zone calculation used current `donations` rows from Supabase.
- Grouping used Bangalore area names from `location_name`.
- At least 3 zones appeared; seed data produced:
  - Koramangala
  - Indiranagar
  - Jayanagar
  - Whitefield
  - HSR Layout
  - MG Road
  - Electronic City
  - Malleshwaram
- Top zone was based on highest donation count.
- Active/open and urgent rows influenced attention recommendations.
- Common food type and predicted peak window were derived from donation rows.
- NGO Analytics page returned HTTP 200 locally.
- Page included the label: `AI-assisted prediction based on recent donation patterns.`
- Empty-data handling exists through a no-zone-data state.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-04.

## Phase 8 Role-Specific Sharebite AI Test

Purpose: verify that Sharebite AI changes behavior by role, keeps core actions deterministic, and still preserves the donor -> NGO -> delivery workflow.

Setup:

```bash
npm run seed:demo
```

Result: Passed. The reseed created 18 profiles, 15 donations, 14 match suggestions, 6 delivery jobs, and 42 analytics snapshots.

Validated chatbot checks:

- Donor chat creation path:
  - The chat panel now collects donation details step by step and calls the existing donation creation API only after confirmation.
  - Programmatic API validation created `Phase 8 Chat Wizard Test Meals` through the same API path.
  - The created donation generated 5 match suggestions.
  - The test donation was deleted after validation.
- NGO chat:
  - `Give me today's donation update` returned current open donation counts and live examples.
  - `Explain donation zones` returned a Bangalore zone summary based on current donation rows.
- Delivery chat:
  - `What should I do next?` returned the next active pickup from current delivery jobs.
- Loading UX:
  - Chat input disables while waiting.
  - Send button shows loading state.
  - Assistant bubble shows `Sharebite AI is thinking...` with animated dots.
  - Duplicate sends are guarded while a request is in flight.

Validated workflow regression:

- Donor created `Phase 8 Workflow Test Lunch Packs`.
- Donor dashboard API saw the donation.
- NGO marketplace API saw the donation.
- NGO accepted the donation.
- Delivery dashboard API saw the created delivery job.
- Delivery updated the job to `in_transit`.
- Donor and NGO API views both reflected donation status `in_transit`.
- `npm run seed:demo` was run again after the workflow test to restore the Bangalore demo baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-04.

## Pre-Phase 9 Cleanup Smoke Test

Purpose: verify the donor dashboard cleanup, NGO marketplace wrapping, chatbot availability, and core workflow before starting login changes.

Validated checks:

- Donor dashboard data API returned seeded donor donations with real statuses:
  - `open`
  - `pickup_assigned`
  - `delivered`
  - `cancelled`
- Donor activity chart now derives from donation rows when donor analytics are not passed.
- Donor dashboard no longer includes the large standalone `AI Suggestion` panel.
- NGO marketplace card/detail layout now wraps long title, food type, pickup location, notes, and match suggestion content instead of clipping it.
- Donor chatbot, NGO chatbot, and delivery chatbot endpoint checks each returned 200.
- Donor -> NGO -> delivery smoke test:
  - donor created `Cleanup Workflow Test Packs`
  - NGO accepted it
  - delivery job appeared
  - delivery status updated to `in_transit`
  - donor view reflected `in_transit`
- `npm run seed:demo` was run after the smoke test to restore the Bangalore baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-05.

## Donation Zones Client Feedback Test

Purpose: verify Donation Source Zones update from live donation rows, quantity influences scoring, and High-Need Community Zones appear separately.

Setup:

```bash
npm run seed:demo
```

Result: Passed. The reseed restored the Bangalore demo baseline before testing.

Validated checks:

- NGO Analytics uses live Supabase `donations` rows for Donation Source Zones.
- The visible data-source note says `Data source: Live Supabase donations table`.
- The visible field note says source zones use pickup area, quantity, urgency, status, and pickup time.
- Created `220 HSR Layout Demo Meal Packs` through the donor donation API.
- HSR Layout source-zone quantity increased from 22 to 242, confirming a new large donation affects the zone queue.
- NGO Analytics page returned HTTP 200 after the donation was created.
- The page included `Donation Source Zones` and `High-Need Community Zones` as separate views.
- In-app browser verification confirmed the High-Need Community Zones tab shows the suitable-zone recommendation, high-need queue, seeded areas, and demo NGO location.
- The High-Need Community Zones view is labelled as demo-level and based on seeded community need indicators plus current donation availability.
- Demo NGO location was verified from Supabase:
  - Priya Menon
  - Bengaluru Food Relief Trust
  - JP Nagar, Bangalore
  - `12.9063, 77.5857`
- `npm run seed:demo` was run again after the live-update test to restore the Bangalore baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-05.

Live zone update demo script:

1. Open NGO Analytics and note the current HSR Layout quantity/score in Donation Source Zones.
2. Create a large donor donation from HSR Layout, such as 200+ cooked meal packs.
3. Return to NGO Analytics and click `Refresh zone data`, or wait for the page refresh interval.
4. Confirm HSR Layout quantity and prediction score increase in the Zone Queue.
5. Run `npm run seed:demo` after testing to restore the clean Bangalore baseline.

## NGO Analytics Impact And Partners Polish Test

Purpose: verify the right-side analytics cards look populated and use current Bangalore demo data.

Setup:

```bash
npm run seed:demo
```

Result: Passed. The reseed restored the Bangalore demo baseline.

Validated checks:

- Impact Mix shows multiple categories:
  - Cooked Meals
  - Bakery
  - Beverages
  - Fresh Produce
  - Event Leftovers
- Estimated impact values are non-zero when delivered donations exist.
- `View All Partners` opens a side drawer.
- The partner drawer shows real seeded Bangalore donors:
  - Koramangala Kitchen
  - Indiranagar Bakery House
  - Whitefield Tech Park Canteen
  - HSR Fresh Foods
  - Jayanagar Event Caterers
  - Malleshwaram Tiffin Centre
- Partner rows include area, donation count, total meal units, and latest status.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-05.

## Feature 1 Food Safety Prepared-Time Test

Purpose: verify donors cannot create or edit donations when food was cooked/prepared more than 24 hours ago or in the future.

Setup:

```bash
npm run seed:demo
```

Validated checks:

- Supabase was reachable after project resume.
- Donor create API with `preparedAt` 2 days ago returned `400`.
- Error message returned: `For safety, food cooked more than 24 hours ago cannot be donated.`
- Donor create API with a future `preparedAt` returned `400`.
- Donor create API with a valid same-day `preparedAt` returned `200`.
- Donor edit API rejected changing a valid donation to a 2-day-old `preparedAt`.
- Chat-wizard-equivalent donation creation with a valid prepared time returned `200`.
- `npm run seed:demo` was run again after testing to remove temporary safety-test rows.
- Seed sanity check confirmed all seeded demo donations are within the 24-hour prepared-time window.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-16.

## Feature 2 Donor Type And Food Source Test

Purpose: verify individual donors must provide where food was bought from, and NGOs can see that source.

Setup:

```bash
npm run seed:demo
```

Validated checks:

- Supabase was reachable after project resume.
- Live `donations` table was inspected before coding; `donor_type` and `food_source_name` were not present yet.
- Migration SQL was added at `supabase/migrations/20260516_add_donation_source_fields.sql`.
- Restaurant/business donor create without food source returned `200`.
- Individual donor create without food source returned `400`.
- Individual donor create with selected source `Meghana Foods, Koramangala` returned `200`.
- Individual donor create with custom source `Local Family Store, HSR Layout` returned `200`.
- Donor edit updated the food source to `A2B, Jayanagar`.
- NGO marketplace API returned the updated source for the donation.
- Chat-wizard-equivalent create with source `Udupi Grand, HSR Layout` returned `200`.
- `npm run seed:demo` was run again after testing to remove temporary Feature 2 rows.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-16.

## Donor Dashboard View All And Demo Metrics Test

Purpose: verify Asha Rao has realistic Supabase-backed donor metrics and the Active Donations `View All` control opens a complete donor history modal.

Setup:

```bash
npm run seed:demo
```

Result: Passed. The reseed created 18 profiles, 5 NGO profiles, 17 donations, 14 match suggestions, 6 delivery jobs, and 42 analytics snapshots.

Migration check:

- Supabase was reachable from the project environment.
- The environment had only the anon key, with no service role key, database URL, or Supabase CLI access.
- The live `donations` table still lacked `donor_type` and `food_source_name`, so the migration needs manual Supabase SQL Editor application.
- App fallback notes metadata remains in place until the physical columns are applied.

Validated checks:

- Asha Rao / Koramangala Kitchen donor metrics after reseed:
  - Active Donations: 2
  - Meals Rescued: 62
  - Impact Points: 80
  - Partnerships: 2
- The browser donor dashboard showed those same non-zero metrics.
- `View All` opened an `All Donations` dialog with 5 Asha Rao donations.
- The dialog included open, delivered, and cancelled donations with title, quantity, status, pickup area, prepared time, pickup window, and edit/delete availability.
- Delivered and cancelled rows showed `Locked`; open rows showed edit/delete actions.
- Donor API create smoke test created `View All Smoke Test Meals` and confirmed it appeared in the donor donation feed used by the modal.
- NGO marketplace API still returned open donations.
- Delivery API still returned assigned/completed jobs.
- `npm run seed:demo` was run again after the smoke test to restore the Bangalore baseline.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-16.

## NGO Donor Review System Test

Purpose: verify NGO donor review rules, donor rating surfaces, and migration behavior.

Setup:

```bash
npm run seed:demo
```

Result: Passed with migration caveat. The current Supabase environment does not yet have `public.donor_reviews`, so the seed script skipped only donor review rows and kept the rest of the demo data intact.

Migration check:

- Supabase was reachable.
- `public.donor_reviews` returned `PGRST205`.
- `exec_sql` RPC was unavailable through the anon key.
- Manual SQL from `supabase/migrations/20260516_add_donor_reviews.sql` must be run in Supabase SQL Editor before delivered reviews can persist.

Validated checks:

- NGO review API blocks non-delivered donations:
  - Donation: `12 Juice Bottles`
  - Result: `409`
  - Error: `Donor reviews are only available after delivery`
- NGO review API reaches the persistence layer for a valid delivered donation:
  - Donation: `42 Curd Rice Meal Cups`
  - Result in current environment: setup error because `donor_reviews` is not applied yet
- Donor dashboard returned HTTP 200 and showed the review summary fallback.
- NGO dashboard returned HTTP 200 and showed donor trust fallback (`New donor`) when no reviews are available.
- Duplicate-review blocking is implemented through the API and the `unique (donation_id)` migration constraint, but full duplicate persistence testing requires applying the migration first.

After applying the migration:

1. Run `npm run seed:demo`.
2. Log in as NGO `ngo@sharebite.demo / demo123`.
3. Open NGO Dashboard -> History.
4. Open a delivered donation that has not been reviewed.
5. Click `Rate Donor`, select stars/tags, and submit.
6. Confirm the same donation changes to `Reviewed`.
7. Log in as donor `donor@sharebite.demo / demo123`.
8. Confirm the donor rating summary shows the seeded Asha Rao feedback.

Build check:

```bash
npm run build
```

Result: Passed on 2026-05-16.
