import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 20, radius = 8, style }: SkeletonProps) {
  return (
    <View style={[styles.container, { width, height, borderRadius: radius }, style]}>
      <MotiView
        from={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 900,
          loop: true,
          repeatReverse: true,
          easing: Easing.inOut(Easing.ease),
        }}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#E8E2DA', borderRadius: radius }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F1EA',
    overflow: 'hidden',
  },
});
