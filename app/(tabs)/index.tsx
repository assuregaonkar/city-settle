import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { MapPin, LogOut } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';

export default function HomeTab() {
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
        <View style={styles.headerRow}>
          <PageHeader title="CitySettle" subtitle="Your neighbourhood match" />
          <Pressable onPress={handleSignOut} style={styles.signOut} hitSlop={12}>
            <LogOut color="#8B8378" size={20} strokeWidth={1.75} />
          </Pressable>
        </View>

        <Card delay={100} style={styles.phaseCard}>
          <View style={styles.phaseRow}>
            <MapPin color="#C65D3A" size={18} strokeWidth={1.75} />
            <Text variant="label" size="sm" color="accent" style={styles.phaseLabel}>
              Phase 1 complete
            </Text>
          </View>
          <Text variant="body" size="base" style={styles.phaseBody}>
            Auth is live. In Phase 2 you'll tell us about your office location, salary, and lifestyle preferences — and we'll surface your top neighbourhood matches.
          </Text>
        </Card>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Coming in Phase 2
          </Text>
        </MotiView>

        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 260 + i * 80 }}
            style={styles.skeletonCard}
          >
            <View style={styles.skeletonHeader}>
              <Skeleton width={120} height={18} radius={6} />
              <Skeleton width={48} height={18} radius={6} />
            </View>
            <View style={styles.skeletonRow}>
              <Skeleton width={56} height={14} radius={4} />
              <Skeleton width={56} height={14} radius={4} />
              <Skeleton width={56} height={14} radius={4} />
            </View>
            <Skeleton width="90%" height={14} radius={4} style={styles.skeletonLine} />
          </MotiView>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  signOut: { marginTop: 28, marginLeft: 'auto' },
  phaseCard: { marginBottom: 24 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  phaseLabel: { letterSpacing: 0.2 },
  phaseBody: { lineHeight: 22, color: '#5C5650' },
  sectionLabel: { marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  skeletonCard: {
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    marginBottom: 12,
    gap: 12,
  },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeletonRow: { flexDirection: 'row', gap: 12 },
  skeletonLine: { marginTop: 4 },
});
