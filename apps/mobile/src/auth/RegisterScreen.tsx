// CHORD-103: Mobile registration screen
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
import { apiRegister } from "./auth-api";
import { track, AnalyticsEvent } from "../analytics/analytics";
import type { AuthStackParams } from "../navigation";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, "Register">;
};

function validate(email: string, username: string, password: string): string | null {
  if (!email || !username || !password) return "All fields are required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Username may only contain letters, numbers, _ and -.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    const validationError = validate(email.trim(), username.trim(), password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    track(AnalyticsEvent.BUTTON_PRESS, { action: "register_submit" });

    try {
      const result = await apiRegister(email.trim().toLowerCase(), username.trim(), password);
      await saveAuthSession(result.token, result.sessionId);
      track(AnalyticsEvent.SESSION_START, { userId: result.user.id, role: result.user.role });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      track(AnalyticsEvent.ERROR, { action: "register", message });
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
        <Text style={styles.heading} accessibilityRole="header">Create account</Text>
        <Text style={styles.subheading}>Join Chordially as a fan.</Text>

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

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          placeholder="your_handle"
          placeholderTextColor={COLORS.secondary}
          accessibilityLabel="Username"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="••••••••"
          placeholderTextColor={COLORS.secondary}
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
          accessibilityState={{ busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          accessibilityRole="link"
          style={styles.linkRow}
        >
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
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
