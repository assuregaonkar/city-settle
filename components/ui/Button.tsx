import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet, View, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  delay?: number;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const bgColors: Record<Variant, string> = {
  primary: '#C65D3A',
  secondary: 'transparent',
  ghost: 'transparent',
};

const borderColors: Record<Variant, string> = {
  primary: 'transparent',
  secondary: '#C65D3A',
  ghost: 'transparent',
};

const labelColors: Record<Variant, 'white' | 'accent'> = {
  primary: 'white',
  secondary: 'accent',
  ghost: 'accent',
};

const paddingV: Record<Size, number> = { sm: 8, md: 12, lg: 16 };
const paddingH: Record<Size, number> = { sm: 16, md: 20, lg: 24 };
const fontSize: Record<Size, 'sm' | 'base' | 'lg'> = { sm: 'sm', md: 'base', lg: 'base' };

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  delay = 0,
  onPress,
  children,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withTiming(0.97, { duration: 80 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handlePressOut() {
    scale.value = withTiming(1, { duration: 150 });
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
    >
      <AnimatedPressable
        style={[
          styles.base,
          {
            backgroundColor: bgColors[variant],
            borderColor: borderColors[variant],
            paddingVertical: paddingV[size],
            paddingHorizontal: paddingH[size],
            opacity: disabled || loading ? 0.5 : 1,
          },
          animStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={disabled || loading ? undefined : onPress}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#FAF7F2' : '#C65D3A'}
          />
        ) : (
          <View style={styles.content}>
            <Text
              variant="label"
              size={fontSize[size]}
              color={labelColors[variant]}
              style={styles.label}
            >
              {children}
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    textAlign: 'center',
  },
});
