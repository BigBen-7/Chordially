import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

// ── Param lists ──────────────────────────────────────────────────────────────

export type AuthStackParams = {
  Login: undefined;
  Register: undefined;
};

export type FanTabParams = {
  Feed: undefined;
  Discover: undefined;
  Tipping: { artistId: string };
  ArtistProfile: { slug: string };
};

export type ArtistTabParams = {
  Dashboard: undefined;
  Sessions: undefined;
  Earnings: undefined;
};

export type SettingsStackParams = {
  Settings: undefined;
  EditProfile: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Fan: undefined;
  Artist: undefined;
  Settings: undefined;
};

// ── Navigators ───────────────────────────────────────────────────────────────

const Root = createNativeStackNavigator<RootStackParams>();
const AuthStack = createNativeStackNavigator<AuthStackParams>();
const FanTab = createBottomTabNavigator<FanTabParams>();
const ArtistTab = createBottomTabNavigator<ArtistTabParams>();

import { LoginScreen } from "./auth/LoginScreen";
import { RegisterScreen } from "./auth/RegisterScreen";

// Placeholder screens — replace with real screen imports.
const Screen = () => null;

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function FanNavigator() {
  return (
    <FanTab.Navigator>
      <FanTab.Screen name="Feed" component={Screen} />
      <FanTab.Screen name="Discover" component={Screen} />
      <FanTab.Screen name="Tipping" component={Screen} />
      <FanTab.Screen name="ArtistProfile" component={Screen} />
    </FanTab.Navigator>
  );
}

function ArtistNavigator() {
  return (
    <ArtistTab.Navigator>
      <ArtistTab.Screen name="Dashboard" component={Screen} />
      <ArtistTab.Screen name="Sessions" component={Screen} />
      <ArtistTab.Screen name="Earnings" component={Screen} />
    </ArtistTab.Navigator>
  );
}

export function AppNavigator({ isAuthed = false, role = "fan" }: { isAuthed?: boolean; role?: "fan" | "artist" }) {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthed ? (
          <Root.Screen name="Auth" component={AuthNavigator} />
        ) : role === "artist" ? (
          <Root.Screen name="Artist" component={ArtistNavigator} />
        ) : (
          <Root.Screen name="Fan" component={FanNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
