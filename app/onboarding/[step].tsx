import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { User, Heart, Users, Home } from 'lucide-react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { Text, Button, Chip } from '../../components/ui';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const TOTAL_STEPS = 5;

const VIBES = [
  'quiet',
  'vibrant',
  'family-friendly',
  'foodie',
  'nightlife',
  'green',
  'walkable',
  'metro-connected',
  'pet-friendly',
  'affordable',
] as const;

const FAMILY_OPTIONS = [
  { id: 'solo', label: 'Solo', Icon: User },
  { id: 'couple', label: 'Couple', Icon: Heart },
  { id: 'family-with-kids', label: 'Family with kids', Icon: Users },
  { id: 'with-parents', label: 'With parents', Icon: Home },
] as const;

const CITY_CENTERS: Record<string, string> = {
  bengaluru: '12.9716,77.5946',
  mumbai: '19.0760,72.8777',
};

function formatSalary(digits: string): string {
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (isNaN(n)) return '';
  return new Intl.NumberFormat('en-IN').format(n);
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current }: { current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <MotiView
          key={i}
          animate={{
            width: i + 1 === current ? 24 : 8,
            backgroundColor: i + 1 <= current ? '#C65D3A' : '#E8E2DA',
          }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.dot}
        />
      ))}
    </View>
  );
}

// ─── Step 1: Name + city ──────────────────────────────────────────────────────

function Step1() {
  const { name, officeCity, setName, setOfficeCity } = useOnboardingStore();
  const router = useRouter();
  const canProceed = name.trim().length > 0 && officeCity !== null;

  return (
    <View style={styles.step}>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 0 }}
      >
        <Text variant="display" size="3xl" style={styles.title}>
          Let's get you settled in.
        </Text>
        <Text variant="body" size="base" color="muted" style={styles.subtitle}>
          Tell us your name and which city you work in.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 80 }}
        style={styles.inputBlock}
      >
        <Text variant="label" size="sm" color="muted" style={styles.fieldLabel}>
          Your name
        </Text>
        <View style={styles.textBox}>
          <TextInput
            style={styles.textBoxInput}
            placeholder="e.g. Priya"
            placeholderTextColor="#8B8378"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
          />
        </View>

        <Text variant="label" size="sm" color="muted" style={[styles.fieldLabel, { marginTop: 20 }]}>
          Office city
        </Text>
        <View style={styles.chipRow}>
          {(['bengaluru', 'mumbai'] as const).map((city) => (
            <Chip
              key={city}
              label={city === 'bengaluru' ? 'Bengaluru' : 'Mumbai'}
              selected={officeCity === city}
              onPress={() => setOfficeCity(city)}
            />
          ))}
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 160 }}
      >
        <Button disabled={!canProceed} onPress={() => router.push('/onboarding/2')} size="lg">
          Continue
        </Button>
      </MotiView>
    </View>
  );
}

// ─── Step 2: Office location ──────────────────────────────────────────────────

function Step2() {
  const { officeCity, officeAddress, setOfficeLocation } = useOnboardingStore();
  const router = useRouter();
  const [selected, setSelected] = useState(!!officeAddress);

  const center = CITY_CENTERS[officeCity ?? 'bengaluru'];

  return (
    <View style={[styles.step, { flex: 1 }]}>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 0 }}
      >
        <Text variant="display" size="3xl" style={styles.title}>
          Where's your office?
        </Text>
        <Text variant="body" size="base" color="muted" style={styles.subtitle}>
          We'll calculate your commute from here.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 80 }}
        style={{ marginTop: 8, zIndex: 10 }}
      >
        <GooglePlacesAutocomplete
          placeholder="Search for your office building..."
          fetchDetails
          onPress={(data, details) => {
            const lat = details?.geometry.location.lat ?? 0;
            const lng = details?.geometry.location.lng ?? 0;
            setOfficeLocation(lat, lng, data.description);
            setSelected(true);
          }}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
            language: 'en',
            components: 'country:in',
            location: center,
            radius: '50000',
            strictbounds: true,
          }}
          styles={placesStyles}
          enablePoweredByContainer={false}
          textInputProps={{ placeholderTextColor: '#8B8378' }}
        />
        {selected && officeAddress ? (
          <MotiView
            from={{ opacity: 0, translateY: 4 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.selectedAddress}
          >
            <Text variant="body" size="sm" color="sage">
              ✓ {officeAddress}
            </Text>
          </MotiView>
        ) : null}
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 160 }}
        style={{ marginTop: 24 }}
      >
        <Button disabled={!selected} onPress={() => router.push('/onboarding/3')} size="lg">
          Continue
        </Button>
      </MotiView>
    </View>
  );
}

// ─── Step 3: Salary ───────────────────────────────────────────────────────────

function Step3() {
  const { salaryRaw, setSalaryRaw } = useOnboardingStore();
  const router = useRouter();
  const canProceed = salaryRaw.length > 0;

  function handleChange(text: string) {
    setSalaryRaw(text.replace(/\D/g, ''));
  }

  return (
    <View style={styles.step}>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 0 }}
      >
        <Text variant="display" size="3xl" style={styles.title}>
          What's your monthly salary?
        </Text>
        <Text variant="body" size="base" color="muted" style={styles.subtitle}>
          Helps us find neighbourhoods that fit your budget.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 80 }}
        style={styles.inputBlock}
      >
        <View style={styles.salaryRow}>
          <Text variant="mono" size="2xl" color="muted" style={styles.rupee}>
            ₹
          </Text>
          <TextInput
            style={styles.salaryInput}
            placeholder="45,000"
            placeholderTextColor="#8B8378"
            value={formatSalary(salaryRaw)}
            onChangeText={handleChange}
            keyboardType="numeric"
            autoFocus
            returnKeyType="done"
          />
        </View>
        <Text variant="body" size="sm" color="muted" style={styles.privacyNote}>
          Your data is private and never shared.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 160 }}
      >
        <Button disabled={!canProceed} onPress={() => router.push('/onboarding/4')} size="lg">
          Continue
        </Button>
      </MotiView>
    </View>
  );
}

// ─── Step 4: Vibe tags ────────────────────────────────────────────────────────

function Step4() {
  const { vibes, toggleVibe } = useOnboardingStore();
  const router = useRouter();
  const canProceed = vibes.length >= 2;

  return (
    <View style={styles.step}>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 0 }}
      >
        <Text variant="display" size="3xl" style={styles.title}>
          What's your vibe?
        </Text>
        <Text variant="body" size="base" color="muted" style={styles.subtitle}>
          Choose 2–5 that match your ideal neighbourhood.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 80 }}
        style={styles.vibeGrid}
      >
        {VIBES.map((vibe, i) => (
          <Chip
            key={vibe}
            label={vibe}
            selected={vibes.includes(vibe)}
            onPress={() => toggleVibe(vibe)}
            delay={80 + i * 30}
          />
        ))}
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 160 }}
      >
        <Button disabled={!canProceed} onPress={() => router.push('/onboarding/5')} size="lg">
          Continue
        </Button>
      </MotiView>
    </View>
  );
}

// ─── Step 5: Family status ────────────────────────────────────────────────────

function Step5() {
  const store = useOnboardingStore();
  const { setProfile } = useAuthStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    if (!store.familyStatus) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('no user');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          name: store.name,
          office_city: store.officeCity,
          office_lat: store.officeLat,
          office_lng: store.officeLng,
          office_address: store.officeAddress,
          salary_inr: store.salaryRaw ? parseInt(store.salaryRaw, 10) : null,
          preferences: { vibes: store.vibes },
          family_status: store.familyStatus,
          onboarded_at: now,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ onboarded_at: now });
      store.reset();
      router.replace('/onboarding/complete');
    } catch {
      setSaving(false);
    }
  }

  return (
    <View style={styles.step}>
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 0 }}
      >
        <Text variant="display" size="3xl" style={styles.title}>
          Who are you settling with?
        </Text>
        <Text variant="body" size="base" color="muted" style={styles.subtitle}>
          Helps us prioritise the right amenities for you.
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 80 }}
        style={styles.familyGrid}
      >
        {FAMILY_OPTIONS.map(({ id, label, Icon }) => (
          <Pressable
            key={id}
            onPress={() => store.setFamilyStatus(id)}
            style={[styles.familyCard, store.familyStatus === id && styles.familyCardSelected]}
          >
            <Icon size={28} color={store.familyStatus === id ? '#FAF7F2' : '#C65D3A'} />
            <Text
              variant="label"
              size="base"
              style={{
                color: store.familyStatus === id ? '#FAF7F2' : '#1A1A1A',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 160 }}
      >
        <Button
          disabled={!store.familyStatus}
          loading={saving}
          onPress={handleComplete}
          size="lg"
        >
          Find my neighbourhoods
        </Button>
      </MotiView>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNum = parseInt(step ?? '1', 10);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.progressBar}>
          <ProgressDots current={stepNum} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {stepNum === 1 && <Step1 />}
          {stepNum === 2 && <Step2 />}
          {stepNum === 3 && <Step3 />}
          {stepNum === 4 && <Step4 />}
          {stepNum === 5 && <Step5 />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const placesStyles = {
  container: { flex: 0 },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  textInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 0,
  },
  row: {
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E2DA',
  },
  listView: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    overflow: 'hidden' as const,
  },
  poweredContainer: { display: 'none' as const },
  powered: {},
  loader: {},
  predefinedPlacesDescription: {},
} as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  progressBar: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  step: { flex: 1, paddingTop: 24, gap: 24 },
  title: { letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { lineHeight: 22 },
  inputBlock: { gap: 8 },
  fieldLabel: { marginBottom: 6 },
  textBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textBoxInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
    margin: 0,
  },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  rupee: { lineHeight: 28 },
  salaryInput: {
    flex: 1,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 20,
    color: '#1A1A1A',
    padding: 0,
    margin: 0,
  },
  privacyNote: { marginTop: 8 },
  selectedAddress: { marginTop: 8, paddingHorizontal: 4 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  familyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  familyCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E2DA',
    backgroundColor: '#FAF7F2',
  },
  familyCardSelected: {
    backgroundColor: '#C65D3A',
    borderColor: '#C65D3A',
  },
});
