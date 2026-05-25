// score-neighborhoods — Supabase Edge Function
// Scores all neighborhoods in a user's city and persists top 10 recommendations.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { z } from 'https://esm.sh/zod@3.24.1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Neighborhood {
  id: string;
  name: string;
  lat: number;
  lng: number;
  avg_rent_1bhk: number;
  safety_score: number;
  aqi: number;
  amenities: { metro: boolean; hospitals: number; malls: number; parks: number; gyms: number } | null;
  vibe_tags: string[] | null;
}

interface Profile {
  salary_inr: number | null;
  office_lat: number | null;
  office_lng: number | null;
  office_city: string | null;
  preferences: { vibes?: string[] } | null;
}

interface ScoredResult {
  neighborhood_id: string;
  name: string;
  score: number;
  affordability_score: number;
  commute_score: number;
  safety_score: number;
  aqi_score: number;
  vibe_score: number;
  commute_minutes: number;
  rationale: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const HOUR_BUCKET = 9;

// ─── Validation ───────────────────────────────────────────────────────────────

const InputSchema = z.object({ userId: z.string().uuid() });

// ─── Math helpers ─────────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Rationale builder ────────────────────────────────────────────────────────

function buildRationale(
  affordability: number,
  commuteScore: number,
  commuteMinutes: number,
  aqiScore: number,
  userVibes: string[],
  neighborhoodVibes: string[],
  hasMetro: boolean,
  isEstimated: boolean,
): string {
  const budget =
    affordability >= 0.65 ? 'Affordable on your salary' :
    affordability >= 0.45 ? 'Reasonable fit for your salary' :
    'Tight fit financially';

  const commute = isEstimated
    ? `~${commuteMinutes}-min commute (est.)`
    : `${commuteMinutes}-min commute`;

  const matched = userVibes.filter((v) => neighborhoodVibes.includes(v));

  // Collect redeeming qualities beyond the bare budget + commute
  const highlights: string[] = [];
  if (commuteScore >= 0.65) highlights.push(commute);
  if (hasMetro && userVibes.includes('metro-connected')) highlights.push('metro access');
  if (aqiScore >= 0.75) highlights.push('low pollution');
  if (matched.length >= 2) highlights.push(`${matched.slice(0, 2).join(' + ')} vibe`);

  // "Affordable + short commute [+ highlight]"
  if (affordability >= 0.65 && commuteScore >= 0.6) {
    const extra = highlights.filter((h) => !h.includes('commute')).slice(0, 1);
    return `${budget}, ${commute}${extra.length ? `, ${extra[0]}` : ''}.`;
  }

  // "Tight budget but redeemed by X"
  if (affordability < 0.45 && highlights.length >= 1) {
    return `${budget}, but ${highlights.slice(0, 2).join(' and ')}.`;
  }

  // "Vibe match is the story"
  if (matched.length >= 2) {
    return `${budget}, ${commute}. Matches your ${matched.slice(0, 2).join(' + ')} vibe.`;
  }

  return `${budget}, ${commute}.`;
}

// ─── Google Distance Matrix (batched) ────────────────────────────────────────

interface CommuteResult {
  minutes: number;
  seconds: number;
  estimated: boolean;
}

async function batchFetchCommutes(
  originLat: number,
  originLng: number,
  targets: Neighborhood[],
  mapsKey: string,
): Promise<Map<string, CommuteResult>> {
  const results = new Map<string, CommuteResult>();

  if (!mapsKey || targets.length === 0) {
    for (const nb of targets) {
      const km = haversineKm(originLat, originLng, nb.lat, nb.lng);
      const minutes = Math.round(km * 2.5);
      results.set(nb.id, { minutes, seconds: minutes * 60, estimated: true });
    }
    return results;
  }

  const destinations = targets.map((nb) => `${nb.lat},${nb.lng}`).join('|');
  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', `${originLat},${originLng}`);
  url.searchParams.set('destinations', destinations);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('key', mapsKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Maps API HTTP ${res.status}`);
    const json = await res.json();
    const elements: { status: string; duration?: { value: number } }[] =
      json?.rows?.[0]?.elements ?? [];

    for (let i = 0; i < targets.length; i++) {
      const el = elements[i];
      if (el?.status === 'OK' && el.duration?.value) {
        const seconds = el.duration.value;
        results.set(targets[i].id, {
          minutes: Math.round(seconds / 60),
          seconds,
          estimated: false,
        });
      } else {
        // Individual haversine fallback for failed elements
        const km = haversineKm(originLat, originLng, targets[i].lat, targets[i].lng);
        const minutes = Math.round(km * 2.5);
        results.set(targets[i].id, { minutes, seconds: minutes * 60, estimated: true });
      }
    }
  } catch {
    // Full haversine fallback on API failure
    for (const nb of targets) {
      const km = haversineKm(originLat, originLng, nb.lat, nb.lng);
      const minutes = Math.round(km * 2.5);
      results.set(nb.id, { minutes, seconds: minutes * 60, estimated: true });
    }
  }

  return results;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  try {
    const body = await req.json();
    const { userId } = InputSchema.parse(body);

    const mapsKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('salary_inr, office_lat, office_lng, office_city, preferences')
      .eq('id', userId)
      .single<Profile>();

    if (profileErr || !profile) {
      return json({ error: 'profile not found' }, 404);
    }

    const salary = profile.salary_inr ?? 0;
    const officeLat = profile.office_lat ?? 0;
    const officeLng = profile.office_lng ?? 0;
    const userVibes: string[] = profile.preferences?.vibes ?? [];
    const originLat = round4(officeLat);
    const originLng = round4(officeLng);

    // 2. Neighborhoods for user's city
    const { data: neighborhoods, error: nbErr } = await supabase
      .from('neighborhoods')
      .select('id, name, lat, lng, avg_rent_1bhk, safety_score, aqi, amenities, vibe_tags')
      .eq('city', profile.office_city ?? '');

    if (nbErr || !neighborhoods || neighborhoods.length === 0) {
      return json({ error: 'no neighborhoods found for city' }, 404);
    }

    // 3. Load commute cache for this origin
    const { data: cachedRows } = await supabase
      .from('commute_cache')
      .select('dest_id, duration_seconds, fetched_at')
      .eq('origin_lat', originLat)
      .eq('origin_lng', originLng)
      .eq('hour_bucket', HOUR_BUCKET);

    const cacheMap = new Map<string, number>(); // dest_id → duration_seconds
    const nowMs = Date.now();
    for (const row of cachedRows ?? []) {
      const age = nowMs - new Date(row.fetched_at as string).getTime();
      if (row.duration_seconds && age < CACHE_TTL_MS) {
        cacheMap.set(row.dest_id as string, row.duration_seconds as number);
      }
    }

    // 4. Split cached vs uncached
    const nbs = neighborhoods as Neighborhood[];
    const uncached = nbs.filter((nb) => !cacheMap.has(nb.id));

    // 5. Batch-fetch commutes for uncached neighborhoods (one API call)
    const fetchedCommutes = await batchFetchCommutes(officeLat, officeLng, uncached, mapsKey);

    // 6. Upsert fresh commute cache entries (only non-estimated)
    const cacheInserts = uncached
      .filter((nb) => fetchedCommutes.get(nb.id)?.estimated === false)
      .map((nb) => ({
        origin_lat: originLat,
        origin_lng: originLng,
        dest_id: nb.id,
        hour_bucket: HOUR_BUCKET,
        duration_seconds: fetchedCommutes.get(nb.id)!.seconds,
        fetched_at: new Date().toISOString(),
      }));

    if (cacheInserts.length > 0) {
      await supabase
        .from('commute_cache')
        .upsert(cacheInserts, {
          onConflict: 'origin_lat,origin_lng,dest_id,hour_bucket',
        });
    }

    // 7. Score all neighborhoods
    const scored: ScoredResult[] = nbs.map((nb) => {
      let commuteMinutes: number;
      let isEstimated: boolean;

      if (cacheMap.has(nb.id)) {
        commuteMinutes = Math.round(cacheMap.get(nb.id)! / 60);
        isEstimated = false;
      } else {
        const f = fetchedCommutes.get(nb.id)!;
        commuteMinutes = f.minutes;
        isEstimated = f.estimated;
      }

      const affordability = salary > 0
        ? clamp(1 - (nb.avg_rent_1bhk ?? 0) / (salary * 0.35))
        : 0;
      const commuteScore = clamp(1 - commuteMinutes / 90);
      const safetyScore = clamp((nb.safety_score ?? 0) / 10);
      const aqiScore = clamp(1 - (nb.aqi ?? 0) / 300);
      const vibes = nb.vibe_tags ?? [];
      const vibeMatch =
        userVibes.length > 0
          ? vibes.filter((t) => userVibes.includes(t)).length / userVibes.length
          : 0;

      const total = round2(
        0.30 * affordability +
        0.25 * commuteScore +
        0.20 * safetyScore +
        0.15 * aqiScore +
        0.10 * vibeMatch,
      );

      const rationale = buildRationale(
        affordability,
        commuteScore,
        commuteMinutes,
        aqiScore,
        userVibes,
        vibes,
        nb.amenities?.metro === true,
        isEstimated,
      );

      return {
        neighborhood_id: nb.id,
        name: nb.name,
        score: total,
        affordability_score: round2(affordability),
        commute_score: round2(commuteScore),
        safety_score: round2(safetyScore),
        aqi_score: round2(aqiScore),
        vibe_score: round2(vibeMatch),
        commute_minutes: commuteMinutes,
        rationale,
      };
    });

    // 8. Sort descending, take top 10
    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10);

    // 9. Replace previous recommendations
    await supabase.from('recommendations').delete().eq('user_id', userId);
    await supabase.from('recommendations').insert(
      top10.map((r) => ({
        user_id: userId,
        neighborhood_id: r.neighborhood_id,
        score: r.score,
        affordability_score: r.affordability_score,
        commute_score: r.commute_score,
        safety_score: r.safety_score,
        aqi_score: r.aqi_score,
        vibe_score: r.vibe_score,
        commute_minutes: r.commute_minutes,
        rationale: r.rationale,
      })),
    );

    return json({ results: top10 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return json({ error: err.errors }, 400);
    }
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[score-neighborhoods]', msg);
    return json({ error: msg }, 500);
  }
});
