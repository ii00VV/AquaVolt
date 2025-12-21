import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ForgotPasswordSentScreen from "./src/screens/ForgotPasswordSentScreen";


const Stack = createNativeStackNavigator();
const STORAGE_KEY = "aquavolt_has_seen_onboarding";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted) setHasSeenOnboarding(value === "true");
      } catch (e) {
        if (isMounted) setHasSeenOnboarding(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: "#0B1220" }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasSeenOnboarding ? "Login" : "Onboarding"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ForgotPasswordSent" component={ForgotPasswordSentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
