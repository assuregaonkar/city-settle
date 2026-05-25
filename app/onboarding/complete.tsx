import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';

export default function OnboardingComplete() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)/match');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.pulseWrapper}>
          {[0, 350, 700].map((delay) => (
            <MotiView
              key={delay}
              from={{ scale: 1, opacity: 0.55 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ type: 'timing', duration: 1400, delay, loop: true }}
              style={styles.ring}
            />
          ))}
          <View style={styles.circle} />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
        >
          <Text variant="display" size="xl" style={styles.text}>
            Setting up your city profile...
          </Text>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  pulseWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C65D3A',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C65D3A',
    zIndex: 1,
  },
  text: {
    textAlign: 'center',
    color: '#1A1A1A',
    paddingHorizontal: 32,
  },
});
