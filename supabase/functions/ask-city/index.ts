// ask-city — Supabase Edge Function
// Streams a Claude response personalised to the user's profile + top neighbourhood match.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { z } from 'https://esm.sh/zod@3.24.1';

// ─── Constants ────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;
const HISTORY_LIMIT = 20;

// ─── Validation ───────────────────────────────────────────────────────────────

const InputSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

// ─── System prompt template ───────────────────────────────────────────────────

const SYSTEM_TEMPLATE = `You are CitySettle, a knowledgeable local friend helping {name} settle into {city}.

Their situation
• Monthly salary: ₹{salary_inr} (~₹{take_home_est} estimated take-home after tax)
• Family: {family_status}
• Top neighbourhood match: {top_neighborhood} — {commute_minutes}-min commute to their office in {office_address}
• Rent there: 1 BHK ≈ ₹{avg_rent_1bhk}/mo | 2 BHK ≈ ₹{avg_rent_2bhk}/mo
• Neighbourhood character: {vibe_tags}
• Why we matched them here: {rationale}

How to respond
- Be hyper-local: name actual streets, metro stops, markets, hospitals, and apps
- Be honest about real downsides — flooding, traffic hotspots, water supply issues, noise, safety after dark
- Quote real price ranges when you can (PG rents, auto fares, grocery costs, gym fees)
- Admit when you don't know rather than guessing
- Tie every answer specifically to {top_neighborhood} or {city} — never give generic India advice
- Keep responses under 4 short paragraphs`;

function buildSystemPrompt(
  profile: {
    name: string | null;
    salary_inr: number | null;
    family_status: string | null;
    office_address: string | null;
    office_city: string | null;
  },
  rec: {
    commute_minutes: number | null;
    rationale: string | null;
  } | null,
  nb: {
    name: string | null;
    avg_rent_1bhk: number | null;
    avg_rent_2bhk: number | null;
    vibe_tags: string[] | null;
  } | null,
): string {
  const city =
    profile.office_city
      ? profile.office_city.charAt(0).toUpperCase() + profile.office_city.slice(1)
      : 'your city';
  const salary = profile.salary_inr ?? 0;
  const takeHome = Math.round(salary * 0.75);

  return SYSTEM_TEMPLATE
    .replaceAll('{name}', profile.name ?? 'you')
    .replaceAll('{city}', city)
    .replaceAll('{salary_inr}', salary.toLocaleString('en-IN'))
    .replaceAll('{take_home_est}', takeHome.toLocaleString('en-IN'))
    .replaceAll('{family_status}', profile.family_status ?? 'not specified')
    .replaceAll('{top_neighborhood}', nb?.name ?? 'your neighbourhood')
    .replaceAll('{commute_minutes}', String(rec?.commute_minutes ?? '?'))
    .replaceAll('{office_address}', profile.office_address ?? 'their office')
    .replaceAll('{avg_rent_1bhk}', (nb?.avg_rent_1bhk ?? 0).toLocaleString('en-IN'))
    .replaceAll('{avg_rent_2bhk}', (nb?.avg_rent_2bhk ?? 0).toLocaleString('en-IN'))
    .replaceAll('{vibe_tags}', nb?.vibe_tags?.join(', ') || 'not specified')
    .replaceAll('{rationale}', rec?.rationale ?? 'good match for your profile');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const encoder = new TextEncoder();

  function sseError(message: string, status = 400): Response {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`),
        );
        controller.close();
      },
    });
    return new Response(body, {
      status,
      headers: { ...CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return sseError('Unauthorized', 401);

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const { message } = InputSchema.parse(body);

    // ── Service-role client for DB reads/writes ────────────────────────────
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── 1. Fetch profile ──────────────────────────────────────────────────────
    const { data: profile } = await db
      .from('profiles')
      .select('name, salary_inr, family_status, office_address, office_city')
      .eq('id', user.id)
      .single<{
        name: string | null;
        salary_inr: number | null;
        family_status: string | null;
        office_address: string | null;
        office_city: string | null;
      }>();

    // ── 2. Fetch top recommendation + neighbourhood ───────────────────────────
    const { data: recRow } = await db
      .from('recommendations')
      .select('commute_minutes, rationale, neighborhood_id')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(1)
      .single<{ commute_minutes: number | null; rationale: string | null; neighborhood_id: string | null }>();

    let nb: { name: string | null; avg_rent_1bhk: number | null; avg_rent_2bhk: number | null; vibe_tags: string[] | null } | null = null;
    if (recRow?.neighborhood_id) {
      const { data } = await db
        .from('neighborhoods')
        .select('name, avg_rent_1bhk, avg_rent_2bhk, vibe_tags')
        .eq('id', recRow.neighborhood_id)
        .single<{ name: string | null; avg_rent_1bhk: number | null; avg_rent_2bhk: number | null; vibe_tags: string[] | null }>();
      nb = data;
    }

    // ── 3. Load last 20 messages as context ───────────────────────────────────
    const { data: history } = await db
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);

    const contextMessages = (history ?? [])
      .reverse()
      .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // ── 4. Save user message ──────────────────────────────────────────────────
    await db.from('chat_messages').insert({ user_id: user.id, role: 'user', content: message });

    // ── 5. Build system prompt ────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(
      profile ?? { name: null, salary_inr: null, family_status: null, office_address: null, office_city: null },
      recRow ?? null,
      nb,
    );

    // ── 6. Call Anthropic streaming API ───────────────────────────────────────
    const anthropicResp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: systemPrompt,
        messages: [
          ...contextMessages,
          { role: 'user', content: message },
        ],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      return sseError(`Anthropic error ${anthropicResp.status}: ${errText}`, 502);
    }

    // ── 7. Pipe Anthropic SSE → client SSE ───────────────────────────────────
    const anthropicReader = anthropicResp.body!.getReader();
    const decoder = new TextDecoder();

    const clientStream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        let fullText = '';

        try {
          while (true) {
            const { done, value } = await anthropicReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === '[DONE]') continue;

              try {
                const event = JSON.parse(payload);

                if (
                  event.type === 'content_block_delta' &&
                  event.delta?.type === 'text_delta' &&
                  typeof event.delta.text === 'string'
                ) {
                  fullText += event.delta.text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'token', text: event.delta.text })}\n\n`,
                    ),
                  );
                } else if (event.type === 'message_stop') {
                  await db.from('chat_messages').insert({
                    user_id: user.id,
                    role: 'assistant',
                    content: fullText,
                  });
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`),
                  );
                  controller.close();
                  return;
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }

          // Stream ended without message_stop (shouldn't happen, but save anyway)
          if (fullText) {
            await db.from('chat_messages').insert({
              user_id: user.id,
              role: 'assistant',
              content: fullText,
            });
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(clientStream, {
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return sseError(message, 500);
  }
});
