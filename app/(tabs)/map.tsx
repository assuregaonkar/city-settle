import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MotiView } from 'moti';
import { Clock, Home, Wind, Shield, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Text } from '../../components/ui/Text';
import { Skeleton } from '../../components/ui/Skeleton';
import type { Neighborhood, Recommendation } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type NbWithCommute = Neighborhood & { commute_minutes: number | null; score: number | null };

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_H = Dimensions.get('window').height;
const fmt = new Intl.NumberFormat('en-IN');

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
};

const LEGEND = [
  { label: '< 30 min', color: '#7A9B7E' },
  { label: '30–60 min', color: '#E8B84B' },
  { label: '60–90 min', color: '#C65D3A' },
  { label: '> 90 min', color: '#8B3A2A' },
];

function commuteColor(minutes: number | null): string {
  if (minutes === null) return '#B0A99F';
  if (minutes < 30) return '#7A9B7E';
  if (minutes < 60) return '#E8B84B';
  if (minutes < 90) return '#C65D3A';
  return '#8B3A2A';
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function MapTab() {
  const router = useRouter();
  const { session } = useAuthStore();
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<NbWithCommute | null>(null);
  const [peakHour, setPeakHour] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['map-data', session?.user.id],
    queryFn: async () => {
      const profileRes = await supabase
        .from('profiles')
        .select('office_lat, office_lng, office_city, name')
        .eq('id', session!.user.id)
        .single();

      const city = profileRes.data?.office_city ?? 'bengaluru';

      const [nbRes, recRes] = await Promise.all([
        supabase
          .from('neighborhoods')
          .select('*')
          .eq('city', city),
        supabase
          .from('recommendations')
          .select('neighborhood_id, commute_minutes, score')
          .eq('user_id', session!.user.id),
      ]);

      const recMap = new Map<string, Pick<Recommendation, 'commute_minutes' | 'score'>>();
      for (const r of recRes.data ?? []) {
        recMap.set(r.neighborhood_id, r);
      }

      const neighborhoods: NbWithCommute[] = (nbRes.data ?? []).map((nb) => ({
        ...nb,
        commute_minutes: recMap.get(nb.id)?.commute_minutes ?? null,
        score: recMap.get(nb.id)?.score ?? null,
      }));

      const center = profileRes.data?.office_lat
        ? { lat: profileRes.data.office_lat, lng: profileRes.data.office_lng! }
        : CITY_CENTERS[city];

      return { neighborhoods, center, city, officeName: profileRes.data?.name };
    },
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 10,
  });

  function onMarkerPress(nb: NbWithCommute) {
    setSelected(nb);
    sheetRef.current?.snapToIndex(0);
  }

  function onMapPress() {
    sheetRef.current?.close();
  }

  const center = data?.center ?? CITY_CENTERS.bengaluru;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <Skeleton width={200} height={200} radius={100} />
          <Text variant="body" size="sm" style={styles.loadingText}>
            Loading map…
          </Text>
        </View>
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}
          onPress={onMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {(data?.neighborhoods ?? []).map((nb, i) => {
            if (!nb.lat || !nb.lng) return null;
            const color = commuteColor(nb.commute_minutes);
            return (
              <Marker
                key={nb.id}
                coordinate={{ latitude: nb.lat, longitude: nb.lng }}
                onPress={() => onMarkerPress(nb)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <MotiView
                  from={{ opacity: 0, translateY: -12, scale: 0.7 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    delay: Math.min(i, 15) * 80,
                    damping: 14,
                    stiffness: 120,
                  }}
                >
                  <View style={[styles.pin, { backgroundColor: color }]}>
                    <View style={[styles.pinTail, { borderTopColor: color }]} />
                  </View>
                </MotiView>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Peak/off-peak toggle */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: 200 }}
        style={styles.toggleWrap}
      >
        <View style={styles.togglePill}>
          <Pressable
            style={[styles.toggleOption, peakHour && styles.toggleActive]}
            onPress={() => setPeakHour(true)}
          >
            <Text
              variant="label"
              size="xs"
              style={[styles.toggleText, peakHour && styles.toggleTextActive]}
            >
              Peak (9 am)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, !peakHour && styles.toggleActive]}
            onPress={() => setPeakHour(false)}
          >
            <Text
              variant="label"
              size="xs"
              style={[styles.toggleText, !peakHour && styles.toggleTextActive]}
            >
              Off-peak
            </Text>
          </Pressable>
        </View>
      </MotiView>

      {/* Legend */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 350, delay: 300 }}
        style={styles.legendCard}
      >
        {LEGEND.map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text variant="body" size="xs" style={styles.legendText}>
              {l.label}
            </Text>
          </View>
        ))}
      </MotiView>

      {/* Bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        {selected && (
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <Text variant="display" size="lg" style={styles.sheetName}>
              {selected.name}
            </Text>

            {selected.score !== null && (
              <View style={styles.scorePill}>
                <Text variant="label" size="sm" style={styles.scorePillText}>
                  Match score {Math.round(selected.score * 100)}
                </Text>
              </View>
            )}

            <View style={styles.sheetMeta}>
              <View style={styles.sheetMetaItem}>
                <Clock size={15} color="#8B8378" strokeWidth={1.75} />
                <Text variant="body" size="sm" style={styles.sheetMetaText}>
                  {selected.commute_minutes !== null
                    ? `${selected.commute_minutes} min commute`
                    : 'Commute unknown'}
                </Text>
              </View>
              <View style={styles.sheetMetaItem}>
                <Home size={15} color="#8B8378" strokeWidth={1.75} />
                <Text variant="body" size="sm" style={styles.sheetMetaText}>
                  ₹{fmt.format(selected.avg_rent_1bhk ?? 0)}/mo
                </Text>
              </View>
              <View style={styles.sheetMetaItem}>
                <Wind size={15} color="#8B8378" strokeWidth={1.75} />
                <Text variant="body" size="sm" style={styles.sheetMetaText}>
                  AQI {selected.aqi ?? '—'}
                </Text>
              </View>
              <View style={styles.sheetMetaItem}>
                <Shield size={15} color="#8B8378" strokeWidth={1.75} />
                <Text variant="body" size="sm" style={styles.sheetMetaText}>
                  Safety {selected.safety_score ?? '—'}/10
                </Text>
              </View>
            </View>

            {(selected.vibe_tags ?? []).length > 0 && (
              <View style={styles.vibeRow}>
                {(selected.vibe_tags ?? []).map((v) => (
                  <View key={v} style={styles.vibeChip}>
                    <Text variant="label" size="xs" style={styles.vibeText}>
                      {v}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={styles.sheetCta}
              onPress={() => router.push(`/cost/${selected.id}` as never)}
            >
              <Text variant="label" size="sm" style={styles.sheetCtaText}>
                View cost breakdown
              </Text>
              <ChevronRight size={14} color="#C65D3A" strokeWidth={2} />
            </Pressable>
          </BottomSheetScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  map: { flex: 1 },

  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#FAF7F2',
  },
  loadingText: { color: '#8B8378' },

  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinTail: {
    position: 'absolute',
    bottom: -6,
    left: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  toggleWrap: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 17,
  },
  toggleActive: { backgroundColor: '#C65D3A' },
  toggleText: { color: '#8B8378' },
  toggleTextActive: { color: '#FFFFFF' },

  legendCard: {
    position: 'absolute',
    bottom: SCREEN_H * 0.04 + 20,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 10,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#5C5650' },

  sheetBg: { backgroundColor: '#FAF7F2', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { backgroundColor: '#D9D3CA', width: 40 },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },

  sheetName: { color: '#1A1A1A', marginTop: 4 },
  scorePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF3EE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F5C9BA',
  },
  scorePillText: { color: '#C65D3A' },

  sheetMeta: { gap: 8, marginTop: 4 },
  sheetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetMetaText: { color: '#5C5650' },

  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vibeChip: {
    backgroundColor: '#F5F1EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  vibeText: { color: '#5C5650' },

  sheetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E2DA',
  },
  sheetCtaText: { color: '#C65D3A' },
});
