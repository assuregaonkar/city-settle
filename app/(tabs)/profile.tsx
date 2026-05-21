import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { User, Building2, Heart, CheckSquare } from 'lucide-react-native';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuthStore } from '../../store/authStore';

const PROFILE_SECTIONS = [
  {
    icon: Building2,
    title: 'Office & commute',
    description: 'Location, typical hours, transport mode',
    phase: 'Phase 2',
    delay: 120,
  },
  {
    icon: Heart,
    title: 'Lifestyle preferences',
    description: 'Budget, vibe tags, family setup',
    phase: 'Phase 2',
    delay: 200,
  },
  {
    icon: CheckSquare,
    title: 'Moving checklist',
    description: 'Personalised to-do list for your chosen neighbourhood',
    phase: 'Phase 5',
    delay: 280,
  },
];

export default function ProfileTab() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Profile" subtitle="Your preferences & account" />

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 60 }}
          style={styles.avatarCard}
        >
          <View style={styles.avatar}>
            <User color="#8B8378" size={28} strokeWidth={1.5} />
          </View>
          <View style={styles.avatarInfo}>
            <Text variant="label" size="base">
              {user?.email ?? 'Your account'}
            </Text>
            <Text variant="body" size="sm" color="muted" style={styles.mt4}>
              Onboarding in Phase 2
            </Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Coming soon
          </Text>
        </MotiView>

        {PROFILE_SECTIONS.map(({ icon: Icon, title, description, phase, delay }) => (
          <MotiView
            key={title}
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 400, delay }}
            style={styles.sectionRow}
          >
            <View style={styles.sectionIcon}>
              <Icon color="#8B8378" size={18} strokeWidth={1.75} />
            </View>
            <View style={styles.sectionText}>
              <Text variant="label" size="sm">
                {title}
              </Text>
              <Text variant="body" size="xs" color="muted" style={styles.mt4}>
                {description}
              </Text>
            </View>
            <Text variant="mono" size="xs" color="muted" style={styles.phaseTag}>
              {phase}
            </Text>
          </MotiView>
        ))}

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 360 }}
          style={styles.skeletonSection}
        >
          <Text variant="label" size="sm" color="muted" style={styles.sectionLabel}>
            Saved neighbourhoods preview
          </Text>
          <View style={styles.skeletonRow}>
            <Skeleton width={100} height={100} radius={12} />
            <Skeleton width={100} height={100} radius={12} />
            <Skeleton width={100} height={100} radius={12} />
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
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    marginBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8E2DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInfo: { flex: 1 },
  mt4: { marginTop: 4 },
  sectionLabel: { marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1EA',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: { flex: 1 },
  phaseTag: { opacity: 0.6 },
  skeletonSection: { marginTop: 24 },
  skeletonRow: { flexDirection: 'row', gap: 12 },
});
