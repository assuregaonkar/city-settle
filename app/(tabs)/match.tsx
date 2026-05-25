import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  withDelay,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ChevronRight, Clock, Home } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Text } from '../../components/ui/Text';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import type { Recommendation, Neighborhood } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecRow = Recommendation & {
  neighborhood: Pick<Neighborhood, 'id' | 'name' | 'avg_rent_1bhk' | 'vibe_tags' | 'amenities'> | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get('window').width;
const BAR_MAX = SCREEN_W - 40 - 32 - 80; // screen - hPad - cardPad - label col

const SUB_SCORES: { key: keyof Recommendation; label: string; color: string }[] = [
  { key: 'affordability_score', label: 'Budget', color: '#7A9B7E' },
  { key: 'commute_score', label: 'Commute', color: '#C65D3A' },
  { key: 'safety_score', label: 'Safety', color: '#4A7C8E' },
  { key: 'aqi_score', label: 'Air', color: '#8BA888' },
  { key: 'vibe_score', label: 'Vibe', color: '#B8956A' },
];

const fmt = new Intl.NumberFormat('en-IN');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, delay: number, enabled: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let start: number | null = null;
    let rafId: number;
    const tick = (ts: number) => {
      if (start === null) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { rafId = requestAnimationFrame(tick); return; }
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, delay, enabled]);
  return val;
}

async function fetchRecs(userId: string): Promise<RecRow[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*, neighborhood:neighborhoods(id, name, avg_rent_1bhk, vibe_tags, amenities)')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    const { error: edgeErr } = await supabase.functions.invoke('score-neighborhoods', {
      body: { userId },
    });
    if (edgeErr) throw edgeErr;

    const { data: fresh, error: freshErr } = await supabase
      .from('recommendations')
      .select('*, neighborhood:neighborhoods(id, name, avg_rent_1bhk, vibe_tags, amenities)')
      .eq('user_id', userId)
      .order('score', { ascending: false });
    if (freshErr) throw freshErr;
    return (fresh ?? []) as RecRow[];
  }

  return data as RecRow[];
}

// ─── Sub-score bar ────────────────────────────────────────────────────────────

function ScoreBar({
  score,
  color,
  delay,
  visible,
}: {
  score: number;
  color: string;
  delay: number;
  visible: boolean;
}) {
  const w = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    w.value = withDelay(delay, withTiming((score ?? 0) * BAR_MAX, { duration: 400 }));
  }, [score, delay, visible]);

  const animStyle = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { backgroundColor: color }, animStyle]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 5,
    backgroundColor: '#E8E2DA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: 5, borderRadius: 3 },
});

// ─── Large score card (top 3) ────────────────────────────────────────────────

function ScoreCard({ rec, rank }: { rec: RecRow; rank: number }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const score = rec.score ?? 0;
  const displayed = useCountUp(Math.round(score * 100), 600, rank * 80, visible);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), rank * 100 + 200);
    return () => clearTimeout(t);
  }, [rank]);

  const name = rec.neighborhood?.name ?? '—';
  const rent = rec.neighborhood?.avg_rent_1bhk ?? 0;
  const vibes = rec.neighborhood?.vibe_tags?.slice(0, 3) ?? [];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay: rank * 100 }}
      style={styles.card}
    >
      {/* Header: name + score badge */}
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text variant="label" size="xs" style={styles.rankText}>
            #{rank + 1}
          </Text>
        </View>
        <Text variant="display" size="lg" style={styles.cardName} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.scoreBadge}>
          <Text variant="label" size="xl" style={styles.scoreNum}>
            {displayed}
          </Text>
        </View>
      </View>

      {/* Sub-score bars */}
      <View style={styles.barsSection}>
        {SUB_SCORES.map((s, i) => (
          <View key={s.key} style={styles.barRow}>
            <Text variant="label" size="xs" style={styles.barLabel}>
              {s.label}
            </Text>
            <ScoreBar
              score={(rec[s.key] as number) ?? 0}
              color={s.color}
              delay={rank * 100 + i * 80}
              visible={visible}
            />
            <Text variant="label" size="xs" style={styles.barPct}>
              {Math.round(((rec[s.key] as number) ?? 0) * 100)}
            </Text>
          </View>
        ))}
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={13} color="#8B8378" strokeWidth={1.75} />
          <Text variant="body" size="sm" style={styles.metaText}>
            {rec.commute_minutes ?? '—'} min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Home size={13} color="#8B8378" strokeWidth={1.75} />
          <Text variant="body" size="sm" style={styles.metaText}>
            ₹{fmt.format(rent)}/mo
          </Text>
        </View>
        {vibes.length > 0 && (
          <View style={styles.vibeRow}>
            {vibes.map((v) => (
              <View key={v} style={styles.vibeChip}>
                <Text variant="label" size="xs" style={styles.vibeText}>
                  {v}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Rationale */}
      {rec.rationale ? (
        <Text variant="body" size="sm" style={styles.rationale}>
          {rec.rationale}
        </Text>
      ) : null}

      {/* CTA */}
      <Pressable
        style={styles.cta}
        onPress={() => router.push(`/cost/${rec.neighborhood_id}` as never)}
      >
        <Text variant="label" size="sm" style={styles.ctaText}>
          View cost breakdown
        </Text>
        <ChevronRight size={14} color="#C65D3A" strokeWidth={2} />
      </Pressable>
    </MotiView>
  );
}

// ─── Compact row (positions 4-10) ─────────────────────────────────────────────

function CompactRow({ rec, rank }: { rec: RecRow; rank: number }) {
  const router = useRouter();
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 350, delay: 400 + rank * 55 }}
    >
      <Pressable
        style={styles.compactRow}
        onPress={() => router.push(`/cost/${rec.neighborhood_id}` as never)}
      >
        <Text variant="label" size="sm" style={styles.compactRank}>
          #{rank + 1}
        </Text>
        <Text variant="body" size="base" style={styles.compactName} numberOfLines={1}>
          {rec.neighborhood?.name ?? '—'}
        </Text>
        <View style={styles.compactRight}>
          <Text variant="label" size="sm" style={styles.compactScore}>
            {Math.round((rec.score ?? 0) * 100)}
          </Text>
          <ChevronRight size={15} color="#8B8378" strokeWidth={1.75} />
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function MatchSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300, delay: i * 80 }}
          style={styles.skeletonCard}
        >
          <View style={styles.skeletonHeader}>
            <Skeleton width={110} height={20} radius={6} />
            <Skeleton width={44} height={44} radius={22} />
          </View>
          {[0, 1, 2, 3, 4].map((j) => (
            <View key={j} style={styles.skeletonBar}>
              <Skeleton width={46} height={10} radius={4} />
              <Skeleton width={SCREEN_W - 40 - 32 - 80} height={5} radius={3} />
            </View>
          ))}
          <Skeleton width="80%" height={12} radius={4} style={{ marginTop: 8 }} />
        </MotiView>
      ))}
    </>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function MatchTab() {
  const { session } = useAuthStore();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations', session?.user.id],
    queryFn: () => fetchRecs(session!.user.id),
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 10,
  });

  async function onRefresh() {
    if (!session?.user.id) return;
    setRefreshing(true);
    try {
      await supabase.functions.invoke('score-neighborhoods', {
        body: { userId: session.user.id },
      });
      await qc.invalidateQueries({ queryKey: ['recommendations', session.user.id] });
    } finally {
      setRefreshing(false);
    }
  }

  const top3 = data?.slice(0, 3) ?? [];
  const rest = data?.slice(3) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C65D3A"
            colors={['#C65D3A']}
          />
        }
      >
        <PageHeader title="Your Match" subtitle="Pull to refresh scores" />

        {isLoading && <MatchSkeleton />}

        {error && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.errorCard}
          >
            <Text variant="body" size="base" style={styles.errorText}>
              Could not load recommendations. Pull to retry.
            </Text>
          </MotiView>
        )}

        {!isLoading && !error && data?.length === 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.emptyCard}
          >
            <Text variant="display" size="lg" style={styles.emptyTitle}>
              No matches yet
            </Text>
            <Text variant="body" size="base" style={styles.emptyBody}>
              Complete onboarding to score neighbourhoods.
            </Text>
          </MotiView>
        )}

        {top3.map((rec, i) => (
          <ScoreCard key={rec.id} rec={rec} rank={i} />
        ))}

        {rest.length > 0 && (
          <>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 380 }}
              style={styles.dividerRow}
            >
              <Text variant="label" size="xs" style={styles.dividerLabel}>
                MORE MATCHES
              </Text>
            </MotiView>
            <View style={styles.compactList}>
              {rest.map((rec, i) => (
                <CompactRow key={rec.id} rec={rec} rank={i + 3} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  rankText: { color: '#8B8378' },
  cardName: { flex: 1, color: '#1A1A1A' },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDF3EE',
    borderWidth: 2,
    borderColor: '#C65D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { color: '#C65D3A' },

  barsSection: { gap: 8, marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 46, color: '#8B8378', textAlign: 'right' },
  barPct: { width: 24, color: '#5C5650', textAlign: 'right' },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#5C5650' },
  vibeRow: { flexDirection: 'row', gap: 6 },
  vibeChip: {
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  vibeText: { color: '#5C5650' },

  rationale: { color: '#5C5650', lineHeight: 20, marginBottom: 14 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F1EA',
  },
  ctaText: { color: '#C65D3A' },

  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    gap: 10,
  },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  skeletonBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  errorCard: {
    backgroundColor: '#FFF0EC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C9BA',
  },
  errorText: { color: '#C65D3A', textAlign: 'center' },

  emptyCard: {
    backgroundColor: '#F5F1EA',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  emptyTitle: { color: '#1A1A1A' },
  emptyBody: { color: '#8B8378', textAlign: 'center', lineHeight: 22 },

  dividerRow: { paddingVertical: 12, alignItems: 'center' },
  dividerLabel: { color: '#8B8378', letterSpacing: 1 },

  compactList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    overflow: 'hidden',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1EA',
    gap: 12,
  },
  compactRank: { color: '#8B8378', width: 24 },
  compactName: { flex: 1, color: '#1A1A1A' },
  compactRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compactScore: { color: '#C65D3A' },
});
