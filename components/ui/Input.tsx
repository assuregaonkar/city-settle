import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  delay?: number;
}

export function Input({ label, error, delay = 0, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = useSharedValue('#E8E2DA');

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    borderColor.value = withTiming('#C65D3A', { duration: 200 });
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    borderColor.value = withTiming(error ? '#D4856F' : '#E8E2DA', { duration: 200 });
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
    >
      {label ? (
        <Text variant="label" size="sm" color={focused ? 'accent' : 'muted'} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Animated.View style={[styles.container, animatedBorderStyle, error ? styles.error : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#8B8378"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? (
        <Text variant="body" size="xs" color="error" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  container: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    borderColor: '#D4856F',
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
    margin: 0,
  },
  errorText: {
    marginTop: 4,
  },
});
