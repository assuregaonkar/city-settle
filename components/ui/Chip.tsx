import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Chip({ label, selected = false, onPress, delay = 0 }: ChipProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withTiming(0.95, { duration: 80 }, () => {
      scale.value = withTiming(1, { duration: 150 });
    });
    Haptics.selectionAsync();
    onPress?.();
  }

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 350, delay }}
    >
      <AnimatedPressable
        onPress={handlePress}
        style={[styles.chip, selected ? styles.selected : styles.unselected, animStyle]}
      >
        <Text
          variant="label"
          size="sm"
          style={{ color: selected ? '#FAF7F2' : '#5C5650' }}
        >
          {label}
        </Text>
      </AnimatedPressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: '#C65D3A',
    borderColor: '#C65D3A',
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: '#E8E2DA',
  },
});
