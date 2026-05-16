# Demo Seeding

Last updated: 2026-05-05

## Purpose

Phase 3 added a safe Supabase reseed flow for Sharebite demo data localized to Bangalore. Phase 8 expands that dataset so the role-specific chatbot has enough live data to summarize.

The reseed script resets only known demo rows and then creates useful data for donor, NGO, delivery, and analytics demos. It does not read, write, print, or store secrets. Supabase credentials continue to come from `.env.local`.

## Command

```bash
npm run seed:demo
```

This runs:

```bash
node scripts/supabase-seed.js
```

Verified on 2026-05-04: passed.

## What The Script Resets

The script deletes demo-only rows connected to known demo profile ids, seeded donation ids, seeded NGO ids, seeded delivery ids, or Phase 1 workflow test donations. It resets these tables in dependency order:

- `match_suggestions`
- `delivery_jobs`
- `analytics_snapshots`
- `donations`
- `ngo_profiles`
- `profiles`

It does not intentionally delete unrelated production or manually-created rows.

## Demo Login Accounts

Phase 9 uses role-verified Sharebite demo login. Select the matching role before submitting the email/password:

- Donor: `donor@sharebite.demo` / `demo123`
- NGO: `ngo@sharebite.demo` / `demo123`
- Delivery Partner: `delivery@sharebite.demo` / `demo123`

Wrong role selection is intentionally blocked. For example, selecting NGO while using the donor account returns: `This account is not registered as an NGO.`

## Bangalore Demo Organizations

Donors:

- Koramangala Kitchen
- Indiranagar Bakery House
- Jayanagar Event Caterers
- Whitefield Tech Park Canteen
- HSR Fresh Foods
- MG Road Cafe
- Electronic City Corporate Kitchen
- Malleshwaram Tiffin Centre
- JP Nagar Community Kitchen
- Marathahalli Office Pantry
- Hebbal Hostel Mess

NGOs:

- Bengaluru Food Relief Trust
- Helping Hands Bangalore
- Community Meals Foundation
- Hope Shelter Network
- Annadaan Bengaluru

## Exact Demo NGO User Location

The role-verified NGO demo user is:

- Email: `ngo@sharebite.demo`
- Profile name: Priya Menon
- Organization: Bengaluru Food Relief Trust
- Area: JP Nagar, Bangalore
- Latitude/longitude: `12.9063, 77.5857`
- Seeded daily capacity: 240 meals

This is the location shown in NGO Analytics for the demo NGO context.

## Seeded Donations

All seeded `prepared_at` values are kept within the 24-hour food safety window so demo rows remain valid under Feature 1 validation.

Feature 2 adds migration SQL for `donations.donor_type` and `donations.food_source_name`. If those columns are not applied yet in Supabase, the app keeps source details in Supabase notes metadata and maps them back for the demo UI.

- `35 Veg Biryani Meal Boxes` from Koramangala Kitchen: `open`, urgent
- `18 Assorted Pastries` from Indiranagar Bakery House: `open`, medium
- `22 Fruit Salad Cups` from HSR Fresh Foods: `open`, low
- `40 Corporate Lunch Packs` from Whitefield Tech Park Canteen: `accepted`
- `12 Juice Bottles` from MG Road Cafe: `in_transit`
- `25 Paneer Butter Masala Portions` from Jayanagar Event Caterers: `delivered`
- `30 Mixed Veg Sandwiches` from Electronic City Corporate Kitchen: `pickup_assigned`
- `15 Idli Vada Breakfast Packs` from Malleshwaram Tiffin Centre: `open`
- `10 Lemon Rice Packs` from Koramangala Kitchen: `cancelled`
- `28 Temple Lunch Servings` from JP Nagar Community Kitchen: `open`, urgent
- `36 Office Snack Boxes` from Marathahalli Office Pantry: `open`, medium
- `32 Hostel Dinner Trays` from Hebbal Hostel Mess: `pickup_assigned`, urgent
- `24 Whole Wheat Bread Loaves` from Koramangala Kitchen: `open`, low
- `45 Dosa Breakfast Packs` from Whitefield Tech Park Canteen: `delivered`
- `8 Filter Coffee Flasks` from Indiranagar Bakery House: `cancelled`

Several seeded donations include safe sample `photo_url` values so the donor, NGO, and delivery cards can demonstrate photo rendering even when Supabase Storage bucket creation is unavailable in the current anon-key environment.

## Expected Dashboard Data

Donor dashboard:

- The current donor demo account shows Koramangala Kitchen data, including an open urgent biryani donation and a cancelled lemon rice donation.
- Additional donor rows keep the NGO marketplace and donation zones active across JP Nagar, Marathahalli, Hebbal, Whitefield, and Koramangala.

NGO marketplace:

- Open Bangalore donations appear from Koramangala, Indiranagar, HSR Layout, Malleshwaram, JP Nagar, and Marathahalli.
- Match suggestions point to Bangalore NGOs.

Delivery dashboard:

- Active delivery jobs include Whitefield, MG Road, Electronic City, and Hebbal pickups.
- Completed jobs include delivered Jayanagar and Whitefield donations.
- Pickup and drop-off addresses are Bangalore addresses suitable for Google Maps links.

Analytics:

- The NGO analytics data uses Bangalore activity summaries and realistic meal-rescue counts.
- Analytics snapshots are seeded for multiple NGOs so the chatbot can summarize live NGO data.
- Donation Source Zones on NGO Analytics are calculated from live Supabase `donations` rows, not from `analytics_snapshots`.
- Source-zone scoring uses pickup area, quantity, urgency, status, pickup time, and common food pattern.
- High-Need Community Zones are demo-level predictions from seeded Bangalore community need indicators plus current donation availability.
- Impact Mix uses live donation rows to show Cooked Meals, Bakery, Beverages, Fresh Produce, and Event Leftovers.
- Top Partnerships uses seeded donor profiles and live donation rows, so it shows real Bangalore donors ranked by donation count and meal units.
- Estimated CO2 and water impact use delivered meal units from seeded donations.

High-Need Community Zones used for the demo:

- Ejipura
- KR Market / City Market
- Shivajinagar
- Cottonpet
- Yeshwanthpur
- Hebbal Kempapura
- Bommanahalli
- Peenya
- DJ Halli

## Current Seed Counts

After the Phase 8 reseed, the script creates:

- 18 profiles
- 5 NGO profiles
- 15 donations
- 14 match suggestions
- 6 delivery jobs
- 42 analytics snapshots
