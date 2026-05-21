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

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  async function handleGoogleSignUp() {
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

  if (success) {
    return (
      <View style={styles.successContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.successCard}
        >
          <Text variant="display" size="2xl" style={styles.successTitle}>
            Check your email
          </Text>
          <Text variant="body" size="base" color="muted" style={styles.successBody}>
            We sent a confirmation link to {email}. Click it to activate your account, then sign in.
          </Text>
          <View style={styles.gapLg} />
          <Link href="/(auth)/sign-in" asChild>
            <Button variant="primary" size="lg">
              Go to sign in
            </Button>
          </Link>
        </MotiView>
      </View>
    );
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
              Create account
            </Text>
            <Text variant="body" size="base" color="muted" style={styles.subhead}>
              Start finding your ideal neighbourhood.
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              delay={160}
            />

            <View style={styles.gap} />

            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="••••••••"
              delay={220}
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
              onPress={handleSignUp}
              loading={loading}
              delay={280}
            >
              Create account
            </Button>

            <View style={styles.gapSm} />

            <Button
              variant="secondary"
              size="lg"
              onPress={handleGoogleSignUp}
              loading={googleLoading}
              delay={340}
            >
              Continue with Google
            </Button>
          </View>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            style={styles.footer}
          >
            <Text variant="body" size="sm" color="muted">
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text variant="label" size="sm" color="accent">
                  Sign in
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
  successContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  successTitle: { marginBottom: 12 },
  successBody: { lineHeight: 22 },
});
