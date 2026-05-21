import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Text } from './Text';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  delay?: number;
}

export function PageHeader({ title, subtitle, delay = 0 }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: -6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay }}
      >
        <Text variant="display" size="3xl">
          {title}
        </Text>
      </MotiView>
      {subtitle ? (
        <MotiView
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: delay + 80 }}
        >
          <Text variant="body" size="base" color="muted" style={styles.subtitle}>
            {subtitle}
          </Text>
        </MotiView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  subtitle: {
    marginTop: 4,
  },
});
