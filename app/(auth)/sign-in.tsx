import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    const redirectUrl = Linking.createURL('/(tabs)');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type !== 'success') {
        setGoogleLoading(false);
      }
    }
    setGoogleLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.header}
          >
            <Text variant="display" size="3xl">
              Welcome back
            </Text>
            <Text variant="body" size="base" color="muted" style={styles.subhead}>
              Find your perfect neighbourhood in Bengaluru or Mumbai.
            </Text>
          </MotiView>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              delay={100}
            />

            <View style={styles.gap} />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              delay={160}
            />

            {error ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.errorBox}
              >
                <Text variant="body" size="sm" color="error">
                  {error}
                </Text>
              </MotiView>
            ) : null}

            <View style={styles.gapLg} />

            <Button
              variant="primary"
              size="lg"
              onPress={handleSignIn}
              loading={loading}
              delay={220}
            >
              Sign in
            </Button>

            <View style={styles.gapSm} />

            <Button
              variant="secondary"
              size="lg"
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              delay={280}
            >
              Continue with Google
            </Button>
          </View>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 360 }}
            style={styles.footer}
          >
            <Text variant="body" size="sm" color="muted">
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text variant="label" size="sm" color="accent">
                  Sign up
                </Text>
              </Pressable>
            </Link>
          </MotiView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  header: { marginBottom: 40 },
  subhead: { marginTop: 6 },
  form: { gap: 0 },
  gap: { height: 16 },
  gapSm: { height: 12 },
  gapLg: { height: 24 },
  errorBox: { marginTop: 12, padding: 12, backgroundColor: '#F5F1EA', borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 32 },
});
