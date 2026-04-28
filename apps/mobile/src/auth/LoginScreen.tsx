// CHORD-103: Mobile login screen
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../design/design-primitives";
import { saveAuthSession } from "./persisted-auth";
import { apiLogin } from "./auth-api";
import { track, AnalyticsEvent } from "../analytics/analytics";
import type { AuthStackParams } from "../navigation";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, "Login">;
};

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    track(AnalyticsEvent.BUTTON_PRESS, { action: "login_submit" });

    try {
      const result = await apiLogin(email.trim().toLowerCase(), password);
      await saveAuthSession(result.token, result.sessionId);
      track(AnalyticsEvent.SESSION_START, { userId: result.user.id, role: result.user.role });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      track(AnalyticsEvent.ERROR, { action: "login", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading} accessibilityRole="header">Sign in</Text>
        <Text style={styles.subheading}>Welcome back to Chordially.</Text>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">{error}</Text>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="you@example.com"
          placeholderTextColor={COLORS.secondary}
          accessibilityLabel="Email"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          placeholder="••••••••"
          placeholderTextColor={COLORS.secondary}
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          accessibilityState={{ busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          accessibilityRole="link"
          style={styles.linkRow}
        >
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: "center"
  },
  heading: {
    ...TYPOGRAPHY.headingLg,
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  subheading: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.secondary,
    marginBottom: SPACING.xl
  },
  label: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.secondary,
    marginBottom: SPACING.xs
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...TYPOGRAPHY.bodyMd
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.text,
    fontWeight: "600",
    ...TYPOGRAPHY.bodyMd
  },
  error: {
    color: COLORS.error,
    ...TYPOGRAPHY.bodySm,
    marginBottom: SPACING.md
  },
  linkRow: { marginTop: SPACING.lg, alignItems: "center" },
  link: { ...TYPOGRAPHY.bodySm, color: COLORS.secondary },
  linkBold: { color: COLORS.primary, fontWeight: "600" }
});
