import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LogOut, Map, MessageCircle, Calculator, Sparkles } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Text } from '../../components/ui/Text';
import { Skeleton } from '../../components/ui/Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('en-IN');

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Quick action grid ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Find Match', icon: Sparkles, route: '/(tabs)/match' as const, color: '#C65D3A', bg: '#FDF3EE' },
  { label: 'Explore Map', icon: Map, route: '/(tabs)/map' as const, color: '#4A7C8E', bg: '#EBF3F6' },
  { label: 'AI Chat', icon: MessageCircle, route: '/(tabs)/chat' as const, color: '#7A9B7E', bg: '#EFF6EF' },
  { label: 'Cost Calc', icon: Calculator, route: null, color: '#B8956A', bg: '#F8F0E6' },
];

// ─── Hero match card ──────────────────────────────────────────────────────────

function HeroCard({
  name,
  score,
  commuteMinutes,
  rent,
  rationale,
  neighborhoodId,
}: {
  name: string;
  score: number;
  commuteMinutes: number | null;
  rent: number | null;
  rationale: string | null;
  neighborhoodId: string;
}) {
  const router = useRouter();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay: 200 }}
      style={styles.heroCard}
    >
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <Text variant="label" size="xs" style={styles.heroLabel}>
            TOP MATCH
          </Text>
          <Text variant="display" size="xl" style={styles.heroName} numberOfLines={2}>
            {name}
          </Text>
          {rationale ? (
            <Text variant="body" size="sm" style={styles.heroRationale} numberOfLines={2}>
              {rationale}
            </Text>
          ) : null}
        </View>
        <View style={styles.heroBadge}>
          <Text variant="display" size="xl" style={styles.heroBadgeScore}>
            {Math.round(score * 100)}
          </Text>
          <Text variant="label" size="xs" style={styles.heroBadgeUnit}>
            /100
          </Text>
        </View>
      </View>

      <View style={styles.heroMeta}>
        {commuteMinutes !== null && (
          <Text variant="body" size="xs" style={styles.heroMetaText}>
            {commuteMinutes} min commute
          </Text>
        )}
        {rent !== null && (
          <Text variant="body" size="xs" style={styles.heroMetaText}>
            ₹{fmt.format(rent)}/mo
          </Text>
        )}
      </View>

      <Pressable
        style={styles.heroCta}
        onPress={() => router.push(`/cost/${neighborhoodId}` as never)}
      >
        <Text variant="label" size="sm" style={styles.heroCtaText}>
          View cost breakdown →
        </Text>
      </Pressable>
    </MotiView>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function HomeTab() {
  const router = useRouter();
  const { session } = useAuthStore();

  const userId = session?.user.id;
  const rawName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email?.split('@')[0] ??
    'there';
  const firstName = rawName.split(' ')[0];

  const { data: topRec, isLoading } = useQuery({
    queryKey: ['home-top-rec', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('recommendations')
        .select('*, neighborhood:neighborhoods(id, name, avg_rent_1bhk)')
        .eq('user_id', userId!)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as
        | (typeof data & {
            neighborhood: { id: string; name: string; avg_rent_1bhk: number | null } | null;
          })
        | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.headerRow}
        >
          <View>
            <Text variant="display" size="xl" style={styles.greetingName}>
              {greeting()}, {firstName}
            </Text>
            <Text variant="body" size="base" style={styles.greetingSub}>
              Here's your city snapshot
            </Text>
          </View>
          <Pressable onPress={handleSignOut} style={styles.signOutBtn} hitSlop={12}>
            <LogOut size={19} color="#8B8378" strokeWidth={1.75} />
          </Pressable>
        </MotiView>

        {/* Hero match card */}
        {isLoading ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.heroSkeleton}
          >
            <Skeleton width={100} height={13} radius={4} />
            <Skeleton width="65%" height={28} radius={6} style={{ marginTop: 8 }} />
            <Skeleton width="80%" height={13} radius={4} style={{ marginTop: 6 }} />
          </MotiView>
        ) : topRec ? (
          <HeroCard
            name={topRec.neighborhood?.name ?? '—'}
            score={topRec.score ?? 0}
            commuteMinutes={topRec.commute_minutes ?? null}
            rent={topRec.neighborhood?.avg_rent_1bhk ?? null}
            rationale={topRec.rationale ?? null}
            neighborhoodId={topRec.neighborhood?.id ?? topRec.neighborhood_id}
          />
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={styles.noRecCard}
          >
            <Text variant="body" size="base" style={styles.noRecText}>
              Complete onboarding to see your top neighbourhood match.
            </Text>
          </MotiView>
        )}

        {/* Quick actions */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300, delay: 300 }}
        >
          <Text variant="label" size="xs" style={styles.sectionLabel}>
            QUICK ACTIONS
          </Text>
        </MotiView>

        <View style={styles.actionGrid}>
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <MotiView
                key={a.label}
                from={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 340 + i * 60, damping: 16, stiffness: 180 }}
                style={styles.actionCellWrap}
              >
                <Pressable
                  style={[styles.actionCell, { backgroundColor: a.bg }]}
                  onPress={() => {
                    if (a.route) {
                      router.push(a.route);
                    } else if (topRec) {
                      router.push(`/cost/${topRec.neighborhood_id}` as never);
                    }
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                    <Icon size={22} color={a.color} strokeWidth={1.75} />
                  </View>
                  <Text variant="label" size="sm" style={[styles.actionLabel, { color: a.color }]}>
                    {a.label}
                  </Text>
                </Pressable>
              </MotiView>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greetingName: { color: '#1A1A1A' },
  greetingSub: { color: '#8B8378', marginTop: 2 },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  heroCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    gap: 14,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  heroLeft: { flex: 1, gap: 6 },
  heroLabel: { color: '#8B8378', letterSpacing: 1 },
  heroName: { color: '#FAF7F2' },
  heroRationale: { color: '#B0A99F', lineHeight: 19 },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: '#C65D3A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 64,
  },
  heroBadgeScore: { color: '#FFFFFF' },
  heroBadgeUnit: { color: '#F5C9BA', marginTop: 1 },
  heroMeta: { flexDirection: 'row', gap: 16 },
  heroMetaText: { color: '#8B8378' },
  heroCta: {
    borderTopWidth: 1,
    borderTopColor: '#2E2E2E',
    paddingTop: 14,
  },
  heroCtaText: { color: '#C65D3A' },

  heroSkeleton: {
    backgroundColor: '#F5F1EA',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    minHeight: 130,
    gap: 6,
  },

  noRecCard: {
    backgroundColor: '#F5F1EA',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  noRecText: { color: '#8B8378', lineHeight: 22 },

  sectionLabel: { color: '#8B8378', letterSpacing: 1, marginBottom: 12 },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCellWrap: { width: '47%' },
  actionCell: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontWeight: '600' },
});
