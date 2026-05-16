# Current Status

Last updated: 2026-05-16

## Phase 1 Complete: Core Workflow Reliability

The donor -> NGO -> delivery workflow has been stabilized without renaming, redesigning, reseeding, adding uploads, or adding new client-facing features.

## What Changed

- Added server-side API role checks:
  - Donors can create donations.
  - NGOs can accept or reject donations.
  - Delivery users can view and update delivery jobs.
- Normalized `ngo_profiles.supported_food_types` in the Supabase mapper so matching works whether the database returns an array or stringified JSON.
- Replaced the hard-coded delivery partner id with a lookup for the seeded delivery user, falling back to the first delivery profile if needed.
- Prevented duplicate delivery jobs by checking for an existing job for the donation before creating a new one.
- Kept donation and delivery statuses synchronized:
  - Accepted NGO donation assignment sets donation status to `pickup_assigned`.
  - Delivery statuses continue syncing donation status through `picked_up`, `in_transit`, and `delivered`.
- Included `pickup_assigned` in the NGO in-progress/current donation list.

## Verification

- `npm run build` passed.
- Programmatic local API workflow test passed against `http://localhost:3000`.
- Test donation: `4aa4acf8-f595-4241-ab49-025eb3e6194c`.
- Test delivery job: `5d7d24d1-7a09-4c1b-a99b-36e04a0f3c08`.

Verified scenarios:

- Donor created a fresh donation.
- Donation appeared in the donor view as `open`.
- Donation appeared in the NGO marketplace.
- NGO accepted the donation.
- Donation moved to `pickup_assigned`.
- Delivery job was created and visible to the delivery user.
- Duplicate NGO accept was blocked with `409`.
- NGO attempting donor create was blocked with `403`.
- Donor attempting delivery update was blocked with `403`.
- Delivery user updated the job through `accepted`, `picked_up`, `in_transit`, and `delivered`.
- Donor and NGO donation views reflected final status `delivered`.

## Phase 2 Complete: Sharebite Rename And Simpler Copy

Visible app branding has been renamed to Sharebite without changing database table names, seed data, login behavior, upload behavior, donation zones, or status controls.

Phase 2 changes:

- Renamed app metadata and visible app branding to Sharebite.
- Updated login, sidebar/mobile header, chatbot labels, README, deployment docs, setup docs, and design docs.
- Simplified donor, NGO, delivery, analytics, and chatbot wording while keeping the current Stitch UI style.
- Replaced the requested phrases:
  - "Efficient Altruism Starts Here" -> "Share Extra Food Easily"
  - "Plant-Based Registry" -> "Vegetarian Food"
  - "Deployment Parameters" -> "Pickup Details"
  - "Priority Protocol" -> "Pickup Urgency"
  - "Operational Directives" -> "Notes"
  - "Strategic Advisor" -> "AI Suggestion"
  - "Impact Intelligence" -> "Donation Insights"
  - "Mission Segment" -> "Donation"
  - "Route Intelligence" -> "Route Suggestion"
  - "Intelligence Node" -> "Sharebite AI"

Phase 2 verification:

- `npm run build` passed.

## Phase 3 Complete: Bangalore Demo Data And Safe Reseed

Demo data has been localized to Bangalore without adding dropdowns, uploads, donation zones, login changes, or UI redesign work.

Phase 3 changes:

- Updated Supabase demo seed data to use Bangalore areas, organizations, addresses, and analytics summaries.
- Added a safe demo reseed command: `npm run seed:demo`.
- Kept the current legacy demo login emails in place until Phase 9.
- Seeded useful examples for `open`, `accepted`, `pickup_assigned`, `in_transit`, `delivered`, and `cancelled` statuses.
- Added Bangalore delivery jobs and match suggestions so donor, NGO, delivery, and analytics views have meaningful demo data.
- Updated demo workflow and seeding docs.

Phase 3 verification:

- `npm run seed:demo` passed and recreated 14 profiles, 5 NGO profiles, 9 donations, 8 match suggestions, 4 delivery jobs, and 14 analytics snapshots.
- Supabase verification confirmed Bangalore donor, NGO, delivery, donation, delivery job, and analytics rows.
- `npm run build` passed after the reseed/doc updates.

## Phase 4 Complete: Delivery Status Dropdown

Delivery partners can now update each active delivery job from a status dropdown instead of using click-to-advance buttons.

Phase 4 changes:

- Added delivery status option `cancelled`.
- Replaced the delivery dashboard action button with a dropdown containing:
  - `Assigned`
  - `Accepted`
  - `Picked Up`
  - `In Transit`
  - `Delivered`
  - `Cancelled`
- Kept the existing delivery API role check intact.
- Synced delivery job statuses to donation statuses:
  - `assigned` and `accepted` -> `pickup_assigned`
  - `picked_up` -> `picked_up`
  - `in_transit` -> `in_transit`
  - `delivered` -> `delivered`
  - `cancelled` -> `cancelled`
- Kept the delivery journey timeline driven by the selected status.
- Treats delivered and cancelled jobs as completed so they leave the active queue after refresh.

Phase 4 verification:

- Programmatic local API test passed against `http://localhost:3000`.
- Delivery user changed `30 Mixed Veg Sandwiches` through `accepted`, `picked_up`, `in_transit`, and `delivered`.
- Donor and NGO API views both reflected `delivered` for the synced donation.
- Delivered job left the active delivery list.
- `cancelled` status update was accepted and removed the job from active delivery jobs.
- Test job was restored to `assigned`; related donation is back to `pickup_assigned`.
- `npm run build` passed.

## Phase 5 Complete: Donor Edit And Delete Before Pickup

Donors can now edit or delete their own donations only before pickup starts.

Phase 5 changes:

- Added donor card actions for eligible donations.
- Added an edit dialog for:
  - title
  - category
  - food type
  - quantity
  - unit
  - urgency
  - pickup location
  - pickup window
  - notes
  - vegetarian flag
- Added delete confirmation dialog.
- Added donor-only PATCH and DELETE checks in `/api/donations`.
- Enforced ownership checks so donors cannot edit or delete another donor's donation.
- Allowed edit/delete statuses: `open`, `accepted`, `pickup_assigned`.
- Blocked edit/delete statuses: `picked_up`, `in_transit`, `delivered`, `cancelled`.
- Synced edited donation title and pickup address to any related delivery job.
- Deleted related match suggestions and delivery jobs before deleting a donation.

Phase 5 verification:

- Donor created, edited, and deleted a fresh open donation.
- Wrong donor edit attempt was blocked with `403`.
- `picked_up`, `in_transit`, `delivered`, and `cancelled` edit/delete attempts were blocked with `409`.
- Edited a `pickup_assigned` donation and confirmed NGO and delivery API views reflected the new title/location.
- Restored the edited seeded donation, then ran `npm run seed:demo` to return Supabase to the Bangalore demo baseline.
- `npm run build` passed.

## Phase 6 Complete: Food Photo Upload

Donors can now attach food photos when creating a donation and replace the photo from the donor edit dialog.

Phase 6 changes:

- Added `Donation.photoUrl` and Supabase `donations.photo_url` mapping.
- Added photo upload and preview to the donor create form.
- Added photo replace and preview to the donor edit dialog.
- Stores uploaded image URLs in `donations.photo_url`.
- Displays food images in:
  - donor donation cards
  - NGO marketplace cards
  - NGO donation detail dialog
  - delivery job details
- Enriches delivery API/page job data with the related donation photo.
- Added `npm run storage:setup` for the `donation-photos` bucket.
- Added a safe upload fallback: if Supabase Storage is unavailable, small demo images are stored as data URLs in `photo_url`; if that also is not safe, the donation still saves without a photo and shows an error toast.

Phase 6 verification:

- `npm run storage:setup` attempted to create `donation-photos`, but Supabase rejected bucket creation with RLS because this environment only has the anon key.
- Created a donation with a persisted photo URL fallback and confirmed it appeared after donor refresh.
- Confirmed NGO marketplace API returned the same photo.
- Edited/replaced the donation photo and confirmed the new photo persisted.
- Confirmed delivery API returned `donationPhotoUrl` for a photo-enabled assigned job.
- Cleaned up the test donation and ran `npm run seed:demo` to restore the Bangalore demo baseline.
- `npm run build` passed.

## Phase 7 Complete: Donation Zones And Predictive Insights

NGO Analytics now includes a demo-friendly Donation Zones & Predictions section for Bangalore.

Phase 7 changes:

- Added city-wide zone analysis using current Supabase donation rows.
- Supported Bangalore zones:
  - Koramangala
  - Indiranagar
  - Jayanagar
  - Whitefield
  - HSR Layout
  - MG Road
  - Electronic City
  - JP Nagar
  - Malleshwaram
  - Marathahalli
  - Hebbal
- Added zone cards showing:
  - donation count
  - total quantity/meals
  - common food type
  - active/open donations
  - completed donations
  - predicted peak window
  - recommendation
- Added a polished Bangalore map-style panel with top zone markers.
- Added a top insight card summarizing the highest activity zone.
- Labeled the feature honestly as: "AI-assisted prediction based on recent donation patterns."

Prediction logic:

- Highest donation count = highest activity zone.
- Open/active urgent donations = needs immediate NGO attention.
- Most common food type = likely upcoming food type.
- Active donations = likely next pickup zone.
- Pickup/prepared/created time buckets produce Morning, Afternoon, and Evening labels; weak overnight data falls back to Evening for the demo.
- No trained ML model is used.

Phase 7 verification:

- `npm run seed:demo` passed.
- Supabase seed data produced 8 Bangalore donation zones.
- Local NGO Analytics page returned HTTP 200 and included the prediction label plus seeded zones.
- Empty-data handling is present with a no-zone-data state.
- `npm run build` passed.

Phase 7 UI refinement:

- Replaced the earlier fake zone panel with a Bangalore-centered map-style panel.
- Added clear labelled marker chips for top zones.
- Moved all zone items into one fixed-height scrollable list.
- Made zone cards compact while preserving area, count, common food, active count, peak window, and recommendation.
- Added a hydration-safe typewriter animation for the top insight with reduced-motion support.

Donation Zones layout cleanup:

- Replaced artificial overlaid marker chips with a cleaner Bangalore map context panel and an "Open in Google Maps" action.
- Added a transparent 0-100 rule-based prediction score for each zone:
  - recent donation count: 40%
  - active/open donations: 25%
  - urgent donations: 15%
  - repeated/common food category pattern: 10%
  - peak time consistency: 10%
- Added High, Medium, and Low predicted activity labels using the requested score bands.
- Added a "How prediction works" note that states the feature uses recent Bangalore donation patterns, not a trained ML model.
- Moved Top Partnerships, Impact Mix, Response Trends, and compact impact stats into the right analytics column.
- Kept the compact Top Insight typewriter animation inside the Donation Zones section.

## Phase 8 Complete: Role-Specific Sharebite AI Assistant

Sharebite AI now behaves differently for donors, NGOs, and delivery partners while keeping core actions deterministic.

Phase 8 changes:

- Added role-specific chatbot prompt chips:
  - Donor: create donation, edit rules, photo guidance, required details
  - NGO: today's donation update, accept-first priority, donation zones, match score
  - Delivery: next action, route help, status dropdown, urgent pickup
- Added a visible loading state: "Sharebite AI is thinking..." with animated dots.
- Disabled sends while waiting and added duplicate-send protection.
- Added a donor guided donation wizard in the chat panel.
- The donor wizard collects structured fields, shows a summary, and creates the donation only after confirmation.
- The wizard uses the existing `/api/donations` creation path, so Phase 1 role checks and match generation still apply.
- Added role-aware `/api/chat` behavior backed by the current session role.
- NGO answers use live Supabase data for open donations, match suggestions, donation zones, and analytics.
- Delivery answers use live delivery jobs plus related donation urgency to recommend the next pickup and route/status guidance.
- Gemini is optional and only rewrites deterministic answers. If Gemini is unavailable, rate-limited, or fails, deterministic fallback responses are returned.
- Expanded Bangalore seed data with more donors, a backup delivery user, more open/active/completed/cancelled donations, sample photo URLs, more match suggestions, more delivery jobs, and analytics snapshots for multiple NGOs.

Phase 8 verification:

- `npm run seed:demo` passed and recreated 18 profiles, 5 NGO profiles, 15 donations, 14 match suggestions, 6 delivery jobs, and 42 analytics snapshots.
- Programmatic donor creation through the same API path used by the chat wizard created a test donation and generated 5 matches.
- NGO chatbot "Give me today's donation update" returned live open donation counts and examples.
- NGO chatbot "Explain donation zones" returned a Bangalore zone summary from current donation rows.
- Delivery chatbot "What should I do next?" returned the next active pickup from current delivery jobs.
- Donor -> NGO -> delivery workflow test passed: donor created, NGO accepted, delivery job appeared, delivery set `in_transit`, and donor/NGO views reflected `in_transit`.
- `npm run seed:demo` was run after workflow testing to restore the Bangalore baseline.
- `npm run build` passed.

## Focused Cleanup Before Phase 9

Cleanup changes:

- Removed the large donor dashboard "AI Suggestion" panel for a cleaner demo layout.
- Fixed donor "Donation Activity" so it derives chart data from the donor's actual Supabase donation rows when no analytics prop is provided.
- Donor activity now counts open, accepted, pickup assigned, picked up, in transit, delivered, and cancelled rows where present.
- Added a useful donor activity fallback instead of a blank chart area when there are no donation rows.
- Improved NGO marketplace card wrapping so long titles, notes, and pickup locations are not clipped awkwardly.
- Improved NGO donation detail modal:
  - capped the modal height to the viewport
  - added internal scrolling
  - allowed long title, food type, pickup location, notes, and match suggestion text to wrap
  - kept image content contained with a safe max height

Cleanup verification:

- `npm run build` passed.
- Donor API returned real donation rows for the seeded donor, including `open`, `pickup_assigned`, `delivered`, and `cancelled`.
- Donor, NGO, and delivery chatbot endpoints each returned 200.
- Donor -> NGO -> delivery workflow smoke test passed and synced the test donation to `in_transit`.
- `npm run seed:demo` was run after testing to restore the Bangalore demo baseline.

## Phase 9 Complete: Role-Verified Demo Login

Sharebite now uses selected-role verification during demo login.

Phase 9 changes:

- Replaced auto-login role cards with a role selection plus email/password form.
- Login page includes Sharebite branding and three roles:
  - Donor
  - NGO
  - Delivery Partner
- `/api/auth` now requires `selectedRole` and checks it against the Supabase `profiles.role` value before creating a session.
- Wrong-role login attempts are blocked with a clear error such as: `This account is not registered as an NGO.`
- Successful login routes to the dashboard for the verified profile role.
- Dashboard user badges now show:
  - Verified Donor
  - Verified NGO
  - Verified Delivery Partner
- Demo seed data now uses the Phase 9 accounts:
  - `donor@sharebite.demo` / `demo123`
  - `ngo@sharebite.demo` / `demo123`
  - `delivery@sharebite.demo` / `demo123`
- Delivery partner assignment lookup now prefers `delivery@sharebite.demo`.

Phase 9 verification:

- `npm run seed:demo` passed and recreated 18 profiles, 5 NGO profiles, 15 donations, 14 match suggestions, 6 delivery jobs, and 42 analytics snapshots.
- Donor login with donor role passed.
- NGO login with NGO role passed.
- Delivery login with delivery role passed.
- Wrong role selection was blocked with the expected NGO error.
- Donor, NGO, and delivery dashboard requests returned 200.
- Donor, NGO, and delivery chatbot endpoint checks returned 200.
- Donor -> NGO -> delivery workflow smoke test passed and synced the test donation to `in_transit`.
- `npm run seed:demo` was run again after workflow testing to restore the Bangalore baseline.
- `npm run build` passed.

## Donation Zones Client Feedback Pass

Donation Zones now explains and uses its data source more clearly.

Changes:

- Confirmed NGO Analytics derives Donation Source Zones from live Supabase `donations` rows, not `analytics_snapshots` or static data.
- The analytics page is marked dynamic and now refreshes zone data every 10 seconds while open.
- Added a manual `Refresh zone data` button that revalidates the NGO Analytics page.
- Added visible data-source labels:
  - `Data source: Live Supabase donations table`
  - `Uses: pickup area, quantity, urgency, status, pickup time`
  - `Last updated: [time] IST`
- Improved pickup-area detection so source zones use `locationName`, donation title, and notes.
- Updated source-zone scoring to make large donations matter:
  - recent donation count: 25%
  - total quantity/meals donated: 25%
  - active/open donations: 20%
  - urgent donations: 15%
  - pickup-time pattern consistency: 10%
  - common food pattern: 5%
- Added a separate `High-Need Community Zones` view for demo-level suitable-zone prediction.
- High-need predictions are kept separate from donor source zones and are labelled as seeded community need indicators plus current donation availability, not trained ML.
- Added a suitable-zone recommendation that can connect a large active donation to the highest-need community zone.
- Confirmed the demo NGO account location:
  - Email: `ngo@sharebite.demo`
  - Profile: Priya Menon
  - Organization: Bengaluru Food Relief Trust
  - Area: JP Nagar, Bangalore
  - Coordinates: `12.9063, 77.5857`

Verification:

- `npm run seed:demo` passed.
- Created a test `220 HSR Layout Demo Meal Packs` donation through the donor API.
- HSR Layout source-zone quantity increased from 22 to 242, confirming new large donations influence zone scoring from live donation rows.
- NGO Analytics returned HTTP 200 and included the live source labels and high-need zone tab.
- `npm run seed:demo` was run again after testing to restore the Bangalore baseline.
- `npm run build` passed.

## NGO Analytics Polish Pass

NGO Analytics now has more realistic impact and partner cards without changing Donation Zones logic.

Changes:

- Impact Mix now uses live Supabase donation rows and shows:
  - Cooked Meals
  - Bakery
  - Beverages
  - Fresh Produce
  - Event Leftovers
- Impact Mix shows meal-unit totals plus percentages instead of a sparse/empty chart.
- Estimated CO2 Offset and Estimated Water now use delivered meal units from current donation rows.
- Added simple code comments for the demo assumptions:
  - 2.5kg CO2e avoided per rescued meal
  - 150L water footprint per rescued meal
- Top Partnerships now ranks real Bangalore seeded donors by donation count, then total meal units.
- Removed generic partner names from the visible Top Partnerships card.
- `View All Partners` now opens a side drawer with donor name, area, donation count, meal units, and latest status.

Verification:

- `npm run seed:demo` passed.
- In-app browser check confirmed all five Impact Mix categories are visible.
- In-app browser check confirmed estimated CO2/water values are non-zero.
- In-app browser check confirmed `View All Partners` opens and lists real donors including Koramangala Kitchen, Indiranagar Bakery House, Whitefield Tech Park Canteen, HSR Fresh Foods, Jayanagar Event Caterers, and Malleshwaram Tiffin Centre.
- `npm run build` passed.

## Feature 1 Complete: Prepared-Time Food Safety Validation

Donors must now enter when food was cooked/prepared before creating or editing a donation.

Changes:

- Reused the existing Supabase `donations.prepared_at` field.
- Added required cooked/prepared date and 15-minute time selection to the donor create form.
- Added cooked/prepared date and 15-minute time selection to the donor edit dialog.
- Added a cooked/prepared step to the donor Sharebite AI donation wizard.
- Added shared validation that blocks:
  - prepared times more than 24 hours old
  - prepared times in the future
  - missing/invalid prepared times
- Added backend validation in `/api/donations` for create and edit so the UI cannot be bypassed.
- Updated demo seed rows so all seeded `prepared_at` values are within the 24-hour safety window.

Verification:

- Supabase connectivity after resume was confirmed by querying `donations` and `donor@sharebite.demo`.
- `npm run seed:demo` passed.
- Creating a donation cooked 2 days ago returned `400` with `For safety, food cooked more than 24 hours ago cannot be donated.`
- Creating a donation with a future prepared time returned `400`.
- Creating a donation cooked today returned `200`.
- Editing a donation to a 2-day-old prepared time returned `400`.
- Chat-wizard-equivalent donation creation with a valid prepared time returned `200`.
- Reseeded after tests to remove temporary safety-test rows.
- Verified seeded demo donations have no `prepared_at` rows older than 24 hours.
- `npm run build` passed.

## Feature 2 Complete: Donor Type And Food Source Details

Donors can now identify the source type of a donation, and individual donors must provide where the food was bought from.

Changes:

- Added app support for donation source fields:
  - `donorType`
  - `foodSourceName`
- Added migration SQL at `supabase/migrations/20260516_add_donation_source_fields.sql` for:
  - `donor_type`
  - `food_source_name`
- Current resumed Supabase environment only has the anon key, so the migration could not be applied automatically from this session.
- Until the migration is applied, the app preserves source details in Supabase `notes` metadata and maps them back into `donorType` / `foodSourceName`.
- Donor create form now includes:
  - Restaurant / Business
  - Individual
  - Event Organizer
- Individual donors must select or enter a food source.
- Added Bangalore food source options including Meghana Foods, Empire Restaurant, MTR, CTR, Rameshwaram Cafe, Vidyarthi Bhavan, Truffles, Nagarjuna, A2B, and Udupi Grand.
- Donor edit dialog can update donor type and source.
- Donor Sharebite AI wizard now asks donor type and asks food source for individual donors.
- Backend validation blocks individual donations without a food source.
- NGO marketplace cards/details can show the food source so NGOs know where the food came from.

Verification:

- Supabase was reachable; live `donations` table was inspected and did not yet include the new source columns.
- `npm run seed:demo` passed.
- Restaurant/business donor create without food source returned `200`.
- Individual donor create without food source returned `400`.
- Individual donor create with selected restaurant returned `200`.
- Individual donor create with custom source returned `200`.
- Donor edit updated source from `Meghana Foods, Koramangala` to `A2B, Jayanagar`.
- NGO open-donations API returned `foodSourceName: A2B, Jayanagar`.
- Chat-wizard-equivalent create with `Udupi Grand, HSR Layout` returned `200`.
- Browser plugin verification was unavailable in this resumed session, but the modal render path now includes `Food Source`.
- `npm run seed:demo` was run after tests to restore the Bangalore baseline.
- `npm run build` passed.

## Donor Dashboard Polish And Migration Pass

The donor dashboard now has a functional `View All` history modal, and Asha Rao's demo dashboard metrics are backed by real seeded donation history.

Migration status:

- Supabase was reachable after project resume.
- The live `donations` table still did not include `donor_type` or `food_source_name`.
- This workspace has only the anon Supabase key, with no service role key, database URL, or Supabase CLI access, so `supabase/migrations/20260516_add_donation_source_fields.sql` could not be applied automatically.
- Exact manual SQL is documented in `DEMO_SEEDING.md`.
- App-level fallback notes metadata remains active until the physical columns are applied.

Changes:

- Added an `All Donations` dialog opened from the donor dashboard `View All` button.
- The dialog lists the donor's complete Supabase-backed history, including open, delivered, cancelled, in-transit, picked-up, accepted, and pickup-assigned donations when present.
- Each row shows title, quantity, status, pickup area/address, prepared time, pickup window, food source when available, and edit/delete availability.
- Open/pre-pickup rows keep the existing edit/delete actions; delivered and cancelled rows show locked management state.
- Added two delivered Koramangala Kitchen donations to the safe demo seed for Asha Rao:
  - `42 Curd Rice Meal Cups`
  - `20 Millet Upma Breakfast Boxes`
- Asha Rao's donor metrics after reseed now derive from real delivered history:
  - Active Donations: 2
  - Meals Rescued: 62
  - Impact Points: 80
  - Partnerships: 2

Verification:

- `npm run seed:demo` passed and recreated 17 donations.
- Supabase query confirmed Asha Rao has 5 donations: 2 open, 2 delivered, and 1 cancelled.
- In-app browser check confirmed the donor dashboard shows Active Donations `2`, Meals Rescued `62`, Impact Points `80`, and Partnerships `2`.
- In-app browser check confirmed `View All` opens the `All Donations` modal with 5 rows and locked/editable states.
- API smoke test created `View All Smoke Test Meals` and confirmed it appeared in the donor feed used by the modal.
- NGO marketplace API and delivery jobs API still returned valid data.
- `npm run seed:demo` was run again after the smoke test to restore the Bangalore baseline.
- `npm run build` passed.

## NGO Donor Review System

NGOs can now rate donors after delivered donations, and donor/NGO dashboards are wired to show donor trust signals from `donor_reviews`.

Migration status:

- Added migration SQL at `supabase/migrations/20260516_add_donor_reviews.sql`.
- Supabase is reachable, but this resumed workspace only has the anon key.
- Automatic DDL could not be applied:
  - `public.donor_reviews` currently returns `PGRST205`.
  - `exec_sql` RPC is not available through the anon key.
- Manual SQL Editor application is required before reviews can persist in the live Supabase project.
- Exact SQL is documented in `DEMO_SEEDING.md`.

Changes:

- Added `DonorReview` and `DonorRatingSummary` app types.
- Added store helpers to:
  - read reviews by donation
  - read donor rating summaries
  - create donor reviews
  - gracefully return empty review data when the table is not applied yet
- Added `/api/reviews` with server-side rules:
  - only NGO users can create reviews
  - NGO can review only donations accepted by that NGO
  - only delivered donations can be reviewed
  - one review per donation
  - rating must be 1-5
- Added NGO History/detail review UI:
  - `Rate Donor`
  - 1-5 star rating
  - short comment
  - optional tags: Fresh food, Good packaging, Easy pickup, On-time, Needs improvement
  - reviewed donations show `Reviewed` and rating
- Added donor dashboard rating summary with average rating, review count, and recent NGO feedback.
- Added donor trust signal to NGO donation cards/details:
  - `4.5 star donor rating` when reviews exist
  - `New donor` when no reviews exist
- Added optional seed rows for Asha Rao / Koramangala Kitchen delivered donations once the migration exists.

Verification:

- `npm run seed:demo` passed and skipped only `donor_reviews` with a migration warning because the table is missing.
- API test as NGO against an in-transit donation returned `409`: `Donor reviews are only available after delivery`.
- API test as NGO against a delivered donation reached the persistence layer and returned the expected setup error because `donor_reviews` is not applied yet.
- Donor dashboard returned HTTP 200 with the review summary fallback.
- NGO dashboard returned HTTP 200 with the donor trust fallback.
- `npm run build` passed.

## Known Remaining Issues

- `npm run lint` still has pre-existing lint failures and was not made a Phase 1 blocker.
- One pre-existing inconsistent live demo row remains quarantined/documented instead of deleted.
- Supabase Storage bucket creation still requires service-role/admin setup; the app keeps the Phase 6 small-image fallback.
- Donor source columns still require manual Supabase SQL Editor migration unless a service role key or database URL is added locally.
- Donor reviews require manual Supabase SQL Editor migration unless a service role key or database URL is added locally.
