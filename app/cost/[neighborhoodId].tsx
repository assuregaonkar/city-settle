import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  withDelay,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { ChevronLeft, TrendingDown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Text } from '../../components/ui/Text';
import { Skeleton } from '../../components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostBreakdown {
  rent: number;
  food: number;
  transport: number;
  utilities: number;
  misc: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get('window').width;
const BAR_H = 32;
const BAR_TOTAL_W = SCREEN_W - 40; // full width minus horizontal padding
const fmt = new Intl.NumberFormat('en-IN');

const SEGMENT_COLORS = ['#C65D3A', '#7A9B7E', '#4A7C8E', '#B8956A', '#8BA888'];
const SEGMENT_LABELS = ['Rent', 'Food', 'Transport', 'Utilities', 'Misc'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estimateBreakdown(rent: number, commuteMinutes: number): CostBreakdown {
  const transport = commuteMinutes <= 30 ? 2200 : commuteMinutes <= 60 ? 3500 : 5500;
  return {
    rent,
    food: 9500,
    transport,
    utilities: 3000,
    misc: 4000,
  };
}

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

// ─── Animated SVG bar segment ─────────────────────────────────────────────────

function AnimatedRect2({
  x,
  width,
  color,
  delay,
  visible,
}: {
  x: number;
  width: number;
  color: string;
  delay: number;
  visible: boolean;
}) {
  const w = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    w.value = withDelay(delay, withTiming(width, { duration: 500 }));
  }, [width, delay, visible]);

  const AnimatedRectComp = Animated.createAnimatedComponent(Rect);
  const animProps = useAnimatedStyle(() => ({}));
  // Reanimated doesn't support SVG animatedProps without createAnimatedComponent at module level
  // Use a JS-driven width via state instead for SVG segments
  return null; // placeholder replaced below
}

// SVG segment uses JS-driven animation (Reanimated doesn't animate SVG props on all RN versions)
function SvgSegment({
  x,
  width,
  color,
  delay,
  visible,
}: {
  x: number;
  width: number;
  color: string;
  delay: number;
  visible: boolean;
}) {
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let start: number | null = null;
    let rafId: number;
    const tick = (ts: number) => {
      if (start === null) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { rafId = requestAnimationFrame(tick); return; }
      const p = Math.min(elapsed / 500, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setW(eased * width);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [width, delay, visible]);

  return <Rect x={x} y={0} width={w} height={BAR_H} fill={color} rx={4} />;
}

// ─── Cost breakdown bar ───────────────────────────────────────────────────────

function CostBar({
  breakdown,
  total,
  visible,
}: {
  breakdown: CostBreakdown;
  total: number;
  visible: boolean;
}) {
  const values = [
    breakdown.rent,
    breakdown.food,
    breakdown.transport,
    breakdown.utilities,
    breakdown.misc,
  ];

  let xCursor = 0;
  const segments = values.map((v, i) => {
    const w = (v / total) * BAR_TOTAL_W;
    const seg = { x: xCursor, w, color: SEGMENT_COLORS[i] };
    xCursor += w;
    return seg;
  });

  return (
    <View style={styles.barWrap}>
      <Svg width={BAR_TOTAL_W} height={BAR_H} style={styles.svg}>
        {segments.map((s, i) => (
          <SvgSegment
            key={i}
            x={s.x}
            width={s.w}
            color={s.color}
            delay={i * 120}
            visible={visible}
          />
        ))}
      </Svg>
    </View>
  );
}

// ─── Breakdown row ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  amount,
  color,
  pct,
  delay,
}: {
  label: string;
  amount: number;
  color: string;
  pct: number;
  delay: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 350, delay }}
      style={styles.breakdownRow}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="body" size="base" style={styles.breakdownLabel}>
        {label}
      </Text>
      <Text variant="label" size="sm" style={styles.breakdownPct}>
        {pct}%
      </Text>
      <Text variant="label" size="base" style={styles.breakdownAmt}>
        ₹{fmt.format(amount)}
      </Text>
    </MotiView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CostCalculator() {
  const { neighborhoodId } = useLocalSearchParams<{ neighborhoodId: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const [barsVisible, setBarsVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cost-detail', neighborhoodId, session?.user.id],
    queryFn: async () => {
      const [nbRes, recRes, profileRes] = await Promise.all([
        supabase
          .from('neighborhoods')
          .select('name, avg_rent_1bhk, avg_rent_2bhk, city, vibe_tags, aqi, safety_score, amenities')
          .eq('id', neighborhoodId)
          .single(),
        supabase
          .from('recommendations')
          .select('commute_minutes, score, rationale, affordability_score')
          .eq('user_id', session!.user.id)
          .eq('neighborhood_id', neighborhoodId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('salary_inr, name, office_city')
          .eq('id', session!.user.id)
          .single(),
      ]);

      return {
        nb: nbRes.data,
        rec: recRes.data,
        profile: profileRes.data,
      };
    },
    enabled: !!session?.user.id && !!neighborhoodId,
  });

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setBarsVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  const nb = data?.nb;
  const rec = data?.rec;
  const profile = data?.profile;

  const rent = nb?.avg_rent_1bhk ?? 0;
  const commuteMinutes = rec?.commute_minutes ?? 45;
  const salary = profile?.salary_inr ?? 0;
  const breakdown = estimateBreakdown(rent, commuteMinutes);
  const total = breakdown.rent + breakdown.food + breakdown.transport + breakdown.utilities + breakdown.misc;
  const savings = Math.max(0, salary - total);
  const displayedSavings = useCountUp(savings, 800, 400, barsVisible && !isLoading);

  const values = [breakdown.rent, breakdown.food, breakdown.transport, breakdown.utilities, breakdown.misc];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft size={22} color="#1A1A1A" strokeWidth={1.75} />
        </Pressable>
        <Text variant="display" size="lg" style={styles.headerTitle} numberOfLines={1}>
          {isLoading ? '...' : (nb?.name ?? 'Cost Breakdown')}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <Skeleton width="60%" height={24} radius={6} style={{ marginBottom: 8 }} />
            <Skeleton width={SCREEN_W - 40} height={BAR_H} radius={4} style={{ marginBottom: 24 }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="100%" height={20} radius={4} style={{ marginBottom: 12 }} />
            ))}
          </>
        ) : (
          <>
            {/* Monthly total */}
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
              style={styles.totalCard}
            >
              <Text variant="label" size="sm" style={styles.totalLabel}>
                ESTIMATED MONTHLY SPEND
              </Text>
              <Text variant="display" size="xl" style={styles.totalAmt}>
                ₹{fmt.format(total)}
              </Text>
              {salary > 0 && (
                <Text variant="body" size="sm" style={styles.salaryNote}>
                  on ₹{fmt.format(salary)}/mo take-home
                </Text>
              )}
            </MotiView>

            {/* Animated bar */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 150 }}
              style={{ marginBottom: 20 }}
            >
              <CostBar breakdown={breakdown} total={total} visible={barsVisible} />
            </MotiView>

            {/* Legend */}
            <View style={styles.legendSection}>
              {SEGMENT_LABELS.map((label, i) => (
                <BreakdownRow
                  key={label}
                  label={label}
                  amount={values[i]}
                  color={SEGMENT_COLORS[i]}
                  pct={Math.round((values[i] / total) * 100)}
                  delay={200 + i * 80}
                />
              ))}
            </View>

            {/* Savings banner */}
            {savings > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 450, delay: 650 }}
                style={styles.savingsCard}
              >
                <TrendingDown size={20} color="#7A9B7E" strokeWidth={1.75} />
                <View style={styles.savingsText}>
                  <Text variant="label" size="sm" style={styles.savingsLabel}>
                    MONTHLY SAVINGS
                  </Text>
                  <Text variant="display" size="lg" style={styles.savingsAmt}>
                    ₹{fmt.format(displayedSavings)}
                  </Text>
                </View>
              </MotiView>
            )}

            {/* Rationale / context */}
            {rec?.rationale ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 350, delay: 750 }}
                style={styles.rationaleCard}
              >
                <Text variant="body" size="sm" style={styles.rationaleText}>
                  {rec.rationale}
                </Text>
              </MotiView>
            ) : null}

            {/* Disclaimer */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 850 }}
            >
              <Text variant="body" size="xs" style={styles.disclaimer}>
                Estimates based on typical single-occupant 1BHK in {nb?.city ?? 'this area'}. Actuals vary.
              </Text>
            </MotiView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: '#1A1A1A' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    gap: 4,
  },
  totalLabel: { color: '#8B8378', letterSpacing: 0.8 },
  totalAmt: { color: '#1A1A1A' },
  salaryNote: { color: '#8B8378' },

  barWrap: { borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  svg: { borderRadius: 4 },

  legendSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1EA',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { flex: 1, color: '#1A1A1A' },
  breakdownPct: { color: '#8B8378', width: 32, textAlign: 'right' },
  breakdownAmt: { color: '#1A1A1A', width: 80, textAlign: 'right' },

  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#EFF6EF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C5DBBF',
  },
  savingsText: { gap: 2 },
  savingsLabel: { color: '#5A8057', letterSpacing: 0.6 },
  savingsAmt: { color: '#2E6B2A' },

  rationaleCard: {
    backgroundColor: '#F5F1EA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  rationaleText: { color: '#5C5650', lineHeight: 20 },

  disclaimer: { color: '#B0A99F', textAlign: 'center', lineHeight: 18 },
});
