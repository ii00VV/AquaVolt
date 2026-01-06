import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ForgotPasswordSentScreen from "./src/screens/ForgotPasswordSentScreen";
import MainTabs from "./src/navigation/MainTabs";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import AddDeviceFlowStack from "./src/navigation/AddDeviceFlowStack";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import EditNameScreen from "./src/screens/EditNameScreen";
import EditEmailScreen from "./src/screens/EditEmailScreen";
import EditPasswordScreen from "./src/screens/EditPasswordScreen";


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
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ForgotPasswordSent" component={ForgotPasswordSentScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="AddDeviceFlow" component={AddDeviceFlowStack} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditName" component={EditNameScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditEmail" component={EditEmailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditPassword" component={EditPasswordScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
