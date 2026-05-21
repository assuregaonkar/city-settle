import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { MapPin, Navigation } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';

export default function MapTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Explore Map" subtitle="Neighbourhoods near you" />

        <Card delay={100} style={styles.card}>
          <View style={styles.iconRow}>
            <MapPin color="#C65D3A" size={18} strokeWidth={1.75} />
            <Text variant="label" size="sm" color="accent" style={styles.phaseTag}>
              Phase 3
            </Text>
          </View>
          <Text variant="body" size="base" style={styles.body}>
            An interactive map of Bengaluru and Mumbai neighbourhoods. Tap any pin to see rent, commute time from your office, AQI, and vibe tags.
          </Text>
        </Card>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 180 }}
          style={styles.mapPlaceholder}
        >
          <View style={styles.mapInner}>
            <Navigation color="#E8E2DA" size={48} strokeWidth={1} />
            <Text variant="body" size="sm" color="muted" style={styles.mapLabel}>
              Map coming in Phase 3
            </Text>
          </View>

          {[0, 1, 2, 3].map((i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 260 + i * 70 }}
              style={[styles.pin, PIN_POSITIONS[i]]}
            >
              <MapPin color="#C65D3A" size={20} strokeWidth={1.75} />
            </MotiView>
          ))}
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 320 }}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Commute legend preview
          </Text>
        </MotiView>

        <View style={styles.legendRow}>
          {['< 20 min', '20–40 min', '> 40 min'].map((label, i) => (
            <MotiView
              key={label}
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 350, delay: 360 + i * 60 }}
              style={styles.legendItem}
            >
              <View style={[styles.dot, { backgroundColor: LEGEND_COLORS[i] }]} />
              <Text variant="body" size="xs" color="muted">
                {label}
              </Text>
            </MotiView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PIN_POSITIONS = [
  { top: 60, left: 80 },
  { top: 100, right: 80 },
  { bottom: 80, left: 120 },
  { bottom: 60, right: 60 },
] as const;

const LEGEND_COLORS = ['#7A9B7E', '#C65D3A', '#D4856F'];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { marginBottom: 24 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseTag: { letterSpacing: 0.2 },
  body: { lineHeight: 22, color: '#5C5650' },
  mapPlaceholder: {
    height: 260,
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    marginBottom: 24,
    overflow: 'hidden',
  },
  mapInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapLabel: { marginTop: 4 },
  pin: { position: 'absolute' },
  sectionLabel: { marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  legendRow: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
