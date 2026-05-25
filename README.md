# CitySettle

Find your perfect neighbourhood in Bengaluru or Mumbai.

## Stack

Expo SDK 55 · Expo Router v5 · Supabase (Postgres + Edge Functions) · NativeWind v4 · Zustand v5 · TanStack Query v5 · Reanimated v3 · Moti · react-native-maps · @gorhom/bottom-sheet · react-native-svg

## Setup

### 1. Install dependencies

```bash
npm install
```

> The `.npmrc` file already sets `legacy-peer-deps=true` so this should work without extra flags.

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Google Maps key** — enable these APIs in Google Cloud Console:
- Maps SDK for iOS
- Maps SDK for Android
- Places API

**Supabase service role key** — used only by the Edge Function (never in the client bundle).

### 3. Supabase project setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/migrations/0001_init.sql`
3. Run `supabase/seed/neighborhoods.sql` to load 40 Bengaluru + Mumbai neighbourhoods
4. Copy **Project URL** and **anon key** into `.env.local`
5. Enable Google OAuth: Authentication → Providers → Google
6. Add redirect URL: Authentication → URL Configuration → `citysettle://`

### 4. Deploy the scoring Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the server-side Google Maps key (Distance Matrix API)
supabase secrets set GOOGLE_MAPS_SERVER_KEY=your-server-only-key

# Deploy
supabase functions deploy score-neighborhoods
```

### 5. Run the app

> **Expo Go will not work** — the app uses native modules (react-native-maps, @gorhom/bottom-sheet) that require a development build.

**Android (USB — recommended for first run):**

1. Enable Developer Options on your device → turn on USB Debugging
2. Connect via USB and tap **Allow** on the device
3. Run:

```bash
npx expo run:android
```

**iOS (USB — requires Xcode + Apple ID):**

```bash
npx expo run:ios --device
```

**EAS Build (cloud, no USB needed):**

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile development   # APK download link
eas build --platform ios --profile development        # requires Apple Developer account
```

## Features

| Feature | Status |
|---------|--------|
| Auth (email/password + Google OAuth) | ✅ Phase 1 |
| Design system (Warm Local Friend aesthetic) | ✅ Phase 1 |
| 5-tab navigation shell with animations | ✅ Phase 1 |
| 5-step onboarding (city, office, salary, vibes, family) | ✅ Phase 2 |
| Neighbourhood scoring Edge Function | ✅ Phase 2 |
| 40 seed neighbourhoods (Bengaluru + Mumbai) | ✅ Phase 2 |
| Match tab — scored cards, sub-bars, pull-to-refresh | ✅ Phase 3 |
| Commute heatmap with colour-coded pins + bottom sheet | ✅ Phase 3 |
| Cost of living calculator with animated SVG bar | ✅ Phase 3 |
| Home tab — greeting, hero match card, quick actions | ✅ Phase 3 |
| AI chat assistant (Claude) | 🔜 Phase 4 |
| Personalised moving checklist | 🔜 Phase 5 |

## Scoring formula

The `score-neighborhoods` Edge Function scores every neighbourhood for a user:

| Factor | Weight | How |
|--------|--------|-----|
| Affordability | 30% | `1 − rent / (salary × 0.35)` |
| Commute | 25% | `1 − minutes / 90` (Google Distance Matrix or Haversine fallback) |
| Safety | 20% | `safety_score / 10` |
| Air quality | 15% | `1 − AQI / 300` |
| Vibe match | 10% | intersection of user vibes / total user vibes |

Commute data is cached for 7 days per origin+destination+hour_bucket.

## Design system

| Token | Value |
|-------|-------|
| `background` | `#FAF7F2` warm cream |
| `accent` | `#C65D3A` terracotta |
| `sage` | `#7A9B7E` positive metrics |
| `rose` | `#D4856F` warnings |
| Display font | Instrument Serif |
| UI font | Inter |
| Data font | JetBrains Mono |

All UI animations use Reanimated v3 or Moti — the legacy `Animated` API is not used.

## Project structure

```
app/
  _layout.tsx              Root layout — fonts, providers, auth guard, GestureHandlerRootView
  (auth)/
    sign-in.tsx            Email + Google sign-in
    sign-up.tsx            Email + Google sign-up
  (tabs)/
    index.tsx              Home — greeting, hero match card, quick actions
    match.tsx              Neighbourhood scores — cards, sub-bars, compact rows
    map.tsx                Commute heatmap — colour-coded pins, bottom sheet
    chat.tsx               AI guide chat
    profile.tsx            User profile & preferences
  onboarding/
    _layout.tsx            Stack layout (headerless)
    [step].tsx             5-step onboarding wizard (steps 1–5)
    complete.tsx           Animated completion screen → tabs
  cost/
    [neighborhoodId].tsx   Cost of living breakdown — SVG bar, count-up savings

components/ui/             Text, Button, Card, Input, Chip, Skeleton, PageHeader

store/
  authStore.ts             Zustand — session, profile, onboarded_at
  onboardingStore.ts       Zustand — in-progress onboarding form state
  compareStore.ts          Zustand — up to 3 neighbourhoods queued for comparison

lib/
  supabase.ts              Supabase client (anon key)
  database.types.ts        Generated DB types

types/index.ts             Shared app types

supabase/
  migrations/
    0001_init.sql          Full schema + RLS policies
  seed/
    neighborhoods.sql      40 neighbourhoods (20 Bengaluru + 20 Mumbai)
  functions/
    score-neighborhoods/   Deno Edge Function — scoring + commute cache

app.config.js              Dynamic Expo config (Google Maps keys, EAS project ID)
eas.json                   EAS Build profiles (development / preview / production)
```
