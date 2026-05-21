# CitySettle

Find your perfect neighbourhood in Bengaluru or Mumbai.

## Stack

Expo SDK 55 · Expo Router · Supabase · NativeWind v4 · Zustand · TanStack Query · Reanimated v3 · Moti

## Setup

### 1. Install dependencies

```bash
npm install
```

If you hit peer dependency warnings on Expo-owned packages, let Expo resolve them:

```bash
npx expo install --fix
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Supabase project setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/migrations/0001_init.sql`
3. Copy **Project URL** and **anon key** from Settings → API → Project API keys into `.env.local`
4. Enable Google OAuth: Authentication → Providers → Google (paste your Google OAuth client ID & secret)
5. Add redirect URL: Authentication → URL Configuration → add `citysettle://`

### 4. Run the app

```bash
# Expo Go (fastest — scan QR with the Expo Go app)
npx expo start

# iOS Simulator (requires Xcode)
npx expo run:ios

# Android Emulator (requires Android Studio)
npx expo run:android
```

## Features

| Feature | Status |
|---------|--------|
| Auth (email/password + Google OAuth) | ✅ Phase 1 |
| Design system (Warm Local Friend aesthetic) | ✅ Phase 1 |
| 5-tab navigation shell with animations | ✅ Phase 1 |
| Onboarding — office location, salary, preferences | 🔜 Phase 2 |
| Neighbourhood matching & scoring (AI-powered) | 🔜 Phase 2 |
| Interactive map with commute overlays | 🔜 Phase 3 |
| AI chat assistant (Claude) | 🔜 Phase 4 |
| Personalised moving checklist | 🔜 Phase 5 |

## Design system

Palette tokens, typography, spacing, and motion principles live in `tailwind.config.js` and `components/ui/`. All components accept a `delay` prop to stagger entrance animations.

| Token | Value |
|-------|-------|
| `background` | `#FAF7F2` warm cream |
| `accent` | `#C65D3A` terracotta |
| `sage` | `#7A9B7E` positive metrics |
| `rose` | `#D4856F` warnings |
| Display font | Instrument Serif |
| UI font | Inter |
| Data font | JetBrains Mono |

## Project structure

```
app/
  _layout.tsx          Root layout — fonts, providers, auth guard
  index.tsx            Auth-based redirect
  (auth)/
    sign-in.tsx        Email + Google sign-in
    sign-up.tsx        Email + Google sign-up
  (tabs)/
    index.tsx          Home
    match.tsx          Neighbourhood match scores
    map.tsx            Interactive map
    chat.tsx           AI guide chat
    profile.tsx        User profile & preferences
components/ui/         Text, Button, Card, Input, Chip, Skeleton, PageHeader
lib/
  supabase.ts          Supabase client
  database.types.ts    Hand-written DB types
store/
  authStore.ts         Zustand auth state
types/index.ts         Shared app types
supabase/
  migrations/
    0001_init.sql      Full schema + RLS policies
```

## What to verify manually (Phase 1 checklist)

- [ ] Sign up with a real email address — confirmation email arrives
- [ ] Click the confirmation link — redirected into the app
- [ ] Sign in with email/password — lands on Home tab
- [ ] All 5 tabs are reachable; tab switches trigger haptic feedback
- [ ] Sign out via the icon on the Home tab — returns to sign-in screen
- [ ] Sign-in and sign-up screens show staggered input animations
- [ ] Fonts (Instrument Serif headers, Inter body, JetBrains Mono tags) load correctly
- [ ] Skeleton shimmer visible on Home and Match tabs
