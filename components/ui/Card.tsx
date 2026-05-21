import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { MotiView } from 'moti';

interface CardProps {
  children: React.ReactNode;
  cream?: boolean;
  delay?: number;
  style?: ViewStyle;
  className?: string;
}

export function Card({ children, cream = false, delay = 0, style, className }: CardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay }}
      style={[styles.card, cream ? styles.cream : styles.base, style]}
      className={className}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  base: {
    backgroundColor: '#FAF7F2',
  },
  cream: {
    backgroundColor: '#F5F1EA',
  },
});
