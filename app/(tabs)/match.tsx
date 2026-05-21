import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Sparkles } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Chip } from '../../components/ui/Chip';

const PREVIEW_TAGS = ['Quiet', 'Walkable', 'Green', 'Foodie', 'Family-friendly'];

export default function MatchTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Your Match" subtitle="Personalised neighbourhood scores" />

        <Card delay={100} style={styles.card}>
          <View style={styles.iconRow}>
            <Sparkles color="#C65D3A" size={18} strokeWidth={1.75} />
            <Text variant="label" size="sm" color="accent" style={styles.phaseTag}>
              Phase 2
            </Text>
          </View>
          <Text variant="body" size="base" style={styles.body}>
            Complete onboarding with your office location, salary range, and lifestyle preferences. We'll score every neighbourhood across affordability, commute, safety, air quality, and vibe.
          </Text>
        </Card>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 180 }}
          style={styles.section}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Vibe preview
          </Text>
          <View style={styles.chips}>
            {PREVIEW_TAGS.map((tag, i) => (
              <Chip key={tag} label={tag} selected={i === 0} delay={200 + i * 60} />
            ))}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 260 }}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Score card preview
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 300 }}
          style={styles.scoreCard}
        >
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Skeleton width={40} height={32} radius={6} />
              <Skeleton width={60} height={12} radius={4} style={styles.mt8} />
            </View>
            <View style={styles.scoreItem}>
              <Skeleton width={40} height={32} radius={6} />
              <Skeleton width={60} height={12} radius={4} style={styles.mt8} />
            </View>
            <View style={styles.scoreItem}>
              <Skeleton width={40} height={32} radius={6} />
              <Skeleton width={60} height={12} radius={4} style={styles.mt8} />
            </View>
            <View style={styles.scoreItem}>
              <Skeleton width={40} height={32} radius={6} />
              <Skeleton width={60} height={12} radius={4} style={styles.mt8} />
            </View>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { marginBottom: 24 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseTag: { letterSpacing: 0.2 },
  body: { lineHeight: 22, color: '#5C5650' },
  section: { marginBottom: 16 },
  sectionLabel: { marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scoreCard: {
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreItem: { alignItems: 'center' },
  mt8: { marginTop: 8 },
});
