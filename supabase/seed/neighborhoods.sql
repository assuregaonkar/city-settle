/*
 * Data sources:
 *   Rent       — MagicBricks, NoBroker (researched May 2026)
 *   AQI        — CPCB National Air Quality Index annual averages 2024-25
 *   Safety     — composite of local police beat data + community-perception surveys (estimated)
 *   Amenities  — Google Maps density search, counts approximate
 *
 * Date: 2026-05-22
 *
 * -- TODO: metro field for Bengaluru areas near but not at a station
 *          (Koramangala, Bellandur, Marathahalli, Sarjapur Road — ORR metro extension not yet confirmed operational)
 * -- TODO: refresh rent figures at launch — Bengaluru/Mumbai markets move ~8-10% per year
 * -- TODO: Navi Mumbai Metro Phase 1 (Belapur–Pendhar) operational status uncertain as of May 2026;
 *          marking Vashi and Kharghar metro: false until confirmed
 */

insert into public.neighborhoods
  (city, name, lat, lng, avg_rent_1bhk, avg_rent_2bhk, safety_score, aqi, amenities, vibe_tags)
values

  -- ─── Bengaluru ───────────────────────────────────────────────────────────────

  ('bengaluru', 'Whitefield',
   12.9698, 77.7499, 22000, 36000, 7.0, 72,
   '{"metro": true,  "hospitals": 4, "malls": 3, "parks": 6,  "gyms": 10}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green']),

  ('bengaluru', 'HSR Layout',
   12.9116, 77.6470, 24000, 40000, 8.0, 65,
   '{"metro": false, "hospitals": 3, "malls": 1, "parks": 7,  "gyms": 16}'::jsonb,
   ARRAY['walkable', 'quiet', 'family-friendly', 'green']),

  ('bengaluru', 'Koramangala',
   12.9352, 77.6245, 25000, 42000, 7.5, 68,
   '{"metro": false, "hospitals": 3, "malls": 2, "parks": 5,  "gyms": 14}'::jsonb,
   ARRAY['vibrant', 'foodie', 'nightlife', 'walkable']),

  ('bengaluru', 'Indiranagar',
   12.9784, 77.6408, 28000, 48000, 7.5, 70,
   '{"metro": true,  "hospitals": 3, "malls": 1, "parks": 4,  "gyms": 18}'::jsonb,
   ARRAY['vibrant', 'foodie', 'nightlife', 'walkable', 'metro-connected']),

  ('bengaluru', 'Electronic City',
   12.8451, 77.6602, 14000, 22000, 6.5, 58,
   '{"metro": false, "hospitals": 2, "malls": 2, "parks": 4,  "gyms": 6}'::jsonb,
   ARRAY['affordable', 'quiet']),

  ('bengaluru', 'Marathahalli',
   12.9591, 77.7007, 18000, 30000, 6.5, 78,
   '{"metro": false, "hospitals": 3, "malls": 3, "parks": 3,  "gyms": 9}'::jsonb,
   ARRAY['affordable', 'vibrant']),

  ('bengaluru', 'BTM Layout',
   12.9166, 77.6101, 18000, 30000, 7.0, 70,
   '{"metro": false, "hospitals": 2, "malls": 1, "parks": 4,  "gyms": 10}'::jsonb,
   ARRAY['affordable', 'vibrant', 'foodie']),

  ('bengaluru', 'Jayanagar',
   12.9299, 77.5836, 20000, 34000, 8.5, 60,
   '{"metro": false, "hospitals": 4, "malls": 2, "parks": 10, "gyms": 8}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green', 'walkable']),

  ('bengaluru', 'JP Nagar',
   12.9063, 77.5857, 18000, 30000, 8.0, 58,
   '{"metro": false, "hospitals": 3, "malls": 2, "parks": 8,  "gyms": 7}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green', 'affordable']),

  ('bengaluru', 'Bellandur',
   12.9256, 77.6781, 22000, 36000, 6.5, 75,
   '{"metro": false, "hospitals": 2, "malls": 1, "parks": 3,  "gyms": 12}'::jsonb,
   ARRAY['quiet', 'walkable']),

  ('bengaluru', 'Sarjapur Road',
   12.9082, 77.6953, 20000, 34000, 7.0, 72,
   '{"metro": false, "hospitals": 2, "malls": 2, "parks": 4,  "gyms": 11}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'affordable']),

  ('bengaluru', 'Hebbal',
   13.0353, 77.5972, 22000, 38000, 7.5, 68,
   '{"metro": false, "hospitals": 4, "malls": 2, "parks": 5,  "gyms": 8}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green']),

  ('bengaluru', 'Yelahanka',
   13.1004, 77.5963, 14000, 22000, 7.5, 52,
   '{"metro": false, "hospitals": 2, "malls": 1, "parks": 6,  "gyms": 5}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green', 'affordable']),

  ('bengaluru', 'Banashankari',
   12.9244, 77.5465, 16000, 26000, 8.0, 62,
   '{"metro": false, "hospitals": 3, "malls": 1, "parks": 7,  "gyms": 6}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green', 'affordable']),

  ('bengaluru', 'Rajajinagar',
   12.9916, 77.5502, 18000, 30000, 7.5, 68,
   '{"metro": true,  "hospitals": 3, "malls": 2, "parks": 5,  "gyms": 8}'::jsonb,
   ARRAY['family-friendly', 'walkable', 'metro-connected']),

  ('bengaluru', 'Malleshwaram',
   13.0034, 77.5711, 22000, 38000, 8.5, 62,
   '{"metro": true,  "hospitals": 4, "malls": 1, "parks": 8,  "gyms": 7}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'walkable', 'metro-connected']),

  ('bengaluru', 'Frazer Town',
   12.9891, 77.6141, 22000, 38000, 7.0, 72,
   '{"metro": false, "hospitals": 3, "malls": 1, "parks": 3,  "gyms": 9}'::jsonb,
   ARRAY['vibrant', 'foodie', 'walkable']),

  ('bengaluru', 'MG Road area',
   12.9757, 77.6095, 30000, 52000, 7.0, 78,
   '{"metro": true,  "hospitals": 2, "malls": 4, "parks": 2,  "gyms": 12}'::jsonb,
   ARRAY['vibrant', 'nightlife', 'metro-connected', 'walkable']),

  ('bengaluru', 'Bommanahalli',
   12.8887, 77.6176, 14000, 22000, 6.5, 75,
   '{"metro": false, "hospitals": 2, "malls": 1, "parks": 3,  "gyms": 5}'::jsonb,
   ARRAY['affordable', 'quiet']),

  ('bengaluru', 'Kengeri',
   12.9076, 77.4824, 12000, 18000, 7.0, 55,
   '{"metro": true,  "hospitals": 2, "malls": 1, "parks": 5,  "gyms": 4}'::jsonb,
   ARRAY['affordable', 'quiet', 'green', 'metro-connected']),

  -- ─── Mumbai ──────────────────────────────────────────────────────────────────

  ('mumbai', 'Bandra West',
   19.0596, 72.8295, 55000, 92000, 8.0, 105,
   '{"metro": true,  "hospitals": 4, "malls": 2, "parks": 3,  "gyms": 18}'::jsonb,
   ARRAY['vibrant', 'nightlife', 'foodie', 'walkable', 'metro-connected']),

  ('mumbai', 'Andheri West',
   19.1197, 72.8464, 35000, 58000, 7.0, 110,
   '{"metro": true,  "hospitals": 5, "malls": 3, "parks": 2,  "gyms": 14}'::jsonb,
   ARRAY['vibrant', 'metro-connected', 'nightlife', 'walkable']),

  ('mumbai', 'Powai',
   19.1196, 72.9051, 38000, 65000, 8.5, 95,
   '{"metro": false, "hospitals": 3, "malls": 2, "parks": 5,  "gyms": 16}'::jsonb,
   ARRAY['quiet', 'family-friendly', 'green', 'walkable']),

  ('mumbai', 'Thane West',
   19.2183, 72.9781, 22000, 36000, 7.5, 98,
   '{"metro": true,  "hospitals": 6, "malls": 4, "parks": 8,  "gyms": 12}'::jsonb,
   ARRAY['family-friendly', 'green', 'affordable', 'walkable']),

  ('mumbai', 'Lower Parel',
   18.9999, 72.8321, 55000, 95000, 7.5, 115,
   '{"metro": false, "hospitals": 3, "malls": 5, "parks": 1,  "gyms": 20}'::jsonb,
   ARRAY['vibrant', 'nightlife', 'walkable']),

  ('mumbai', 'Worli',
   19.0094, 72.8195, 65000, 115000, 8.0, 108,
   '{"metro": true,  "hospitals": 3, "malls": 2, "parks": 2,  "gyms": 14}'::jsonb,
   ARRAY['vibrant', 'walkable', 'nightlife']),

  ('mumbai', 'Juhu',
   19.1075, 72.8263, 60000, 100000, 8.0, 105,
   '{"metro": false, "hospitals": 2, "malls": 1, "parks": 2,  "gyms": 12}'::jsonb,
   ARRAY['vibrant', 'walkable', 'nightlife']),

  ('mumbai', 'Versova',
   19.1285, 72.8157, 38000, 62000, 7.0, 108,
   '{"metro": true,  "hospitals": 2, "malls": 1, "parks": 2,  "gyms": 8}'::jsonb,
   ARRAY['walkable', 'vibrant', 'metro-connected']),

  ('mumbai', 'Goregaon East',
   19.1662, 72.8545, 28000, 46000, 7.0, 112,
   '{"metro": false, "hospitals": 3, "malls": 3, "parks": 3,  "gyms": 10}'::jsonb,
   ARRAY['affordable', 'vibrant', 'family-friendly']),

  ('mumbai', 'Malad West',
   19.1875, 72.8484, 26000, 42000, 6.5, 114,
   '{"metro": false, "hospitals": 3, "malls": 4, "parks": 2,  "gyms": 9}'::jsonb,
   ARRAY['affordable', 'vibrant', 'walkable']),

  ('mumbai', 'Borivali West',
   19.2280, 72.8556, 22000, 36000, 7.5, 100,
   '{"metro": false, "hospitals": 4, "malls": 3, "parks": 8,  "gyms": 10}'::jsonb,
   ARRAY['family-friendly', 'green', 'affordable', 'walkable']),

  ('mumbai', 'Chembur',
   19.0605, 72.8995, 32000, 54000, 7.5, 118,
   '{"metro": true,  "hospitals": 4, "malls": 2, "parks": 4,  "gyms": 10}'::jsonb,
   ARRAY['family-friendly', 'metro-connected', 'walkable']),

  ('mumbai', 'Wadala',
   19.0200, 72.8545, 28000, 46000, 7.0, 120,
   '{"metro": true,  "hospitals": 3, "malls": 2, "parks": 3,  "gyms": 8}'::jsonb,
   ARRAY['metro-connected', 'affordable', 'family-friendly']),

  ('mumbai', 'Vikhroli',
   19.1058, 72.9260, 28000, 46000, 7.0, 116,
   '{"metro": false, "hospitals": 3, "malls": 1, "parks": 5,  "gyms": 7}'::jsonb,
   ARRAY['quiet', 'affordable', 'family-friendly', 'green']),

  ('mumbai', 'Ghatkopar East',
   19.0860, 72.9081, 26000, 42000, 7.5, 115,
   '{"metro": true,  "hospitals": 4, "malls": 3, "parks": 3,  "gyms": 10}'::jsonb,
   ARRAY['metro-connected', 'vibrant', 'walkable', 'affordable']),

  ('mumbai', 'Mulund West',
   19.1726, 72.9544, 24000, 40000, 8.0, 98,
   '{"metro": false, "hospitals": 4, "malls": 2, "parks": 6,  "gyms": 9}'::jsonb,
   ARRAY['family-friendly', 'green', 'quiet', 'affordable']),

  ('mumbai', 'Navi Mumbai Vashi',
   19.0762, 73.0072, 18000, 28000, 8.5, 78,
   '{"metro": false, "hospitals": 5, "malls": 4, "parks": 8,  "gyms": 8}'::jsonb,
   ARRAY['family-friendly', 'green', 'affordable', 'walkable', 'quiet']),

  ('mumbai', 'Navi Mumbai Kharghar',
   19.0476, 73.0713, 15000, 24000, 8.5, 72,
   '{"metro": false, "hospitals": 3, "malls": 2, "parks": 12, "gyms": 6}'::jsonb,
   ARRAY['family-friendly', 'green', 'affordable', 'quiet']),

  ('mumbai', 'Dadar West',
   19.0178, 72.8478, 42000, 70000, 7.5, 118,
   '{"metro": false, "hospitals": 4, "malls": 1, "parks": 3,  "gyms": 10}'::jsonb,
   ARRAY['vibrant', 'foodie', 'walkable']),

  ('mumbai', 'Khar West',
   19.0724, 72.8347, 50000, 85000, 8.0, 104,
   '{"metro": false, "hospitals": 2, "malls": 1, "parks": 2,  "gyms": 14}'::jsonb,
   ARRAY['vibrant', 'foodie', 'walkable', 'quiet'])

on conflict (city, name) do nothing;
