import React from 'react';
import { Text as RNText, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { MotiView } from 'moti';

type Variant = 'display' | 'body' | 'label' | 'mono';
type Size = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '5xl';
type Color = 'default' | 'muted' | 'accent' | 'sage' | 'rose' | 'error' | 'white';

interface TextProps extends RNTextProps {
  variant?: Variant;
  size?: Size;
  color?: Color;
  delay?: number;
  children: React.ReactNode;
}

const fontFamilies: Record<Variant, string> = {
  display: 'InstrumentSerif_400Regular',
  body: 'Inter_400Regular',
  label: 'Inter_500Medium',
  mono: 'JetBrainsMono_400Regular',
};

const fontSizes: Record<Size, number> = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '5xl': 48,
};

const textColors: Record<Color, string> = {
  default: '#1A1A1A',
  muted: '#8B8378',
  accent: '#C65D3A',
  sage: '#7A9B7E',
  rose: '#D4856F',
  error: '#D4856F',
  white: '#FAF7F2',
};

export function Text({
  variant = 'body',
  size = 'base',
  color = 'default',
  delay,
  style,
  children,
  ...props
}: TextProps) {
  const textStyle = [
    styles.base,
    { fontFamily: fontFamilies[variant], fontSize: fontSizes[size], color: textColors[color] },
    variant === 'display' && styles.displayTracking,
    style,
  ];

  const content = (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );

  if (delay !== undefined) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 4 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay }}
      >
        {content}
      </MotiView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  displayTracking: {
    letterSpacing: -0.5,
  },
});
