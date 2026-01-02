// src/navigation/DeviceStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DeviceScreen from "../screens/DeviceScreen";
import ConnectivitySettingsScreen from "../screens/ConnectivitySettingsScreen";

const Stack = createNativeStackNavigator();

export default function DeviceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DeviceHome" component={DeviceScreen} />
      <Stack.Screen name="ConnectivitySettings" component={ConnectivitySettingsScreen} />
    </Stack.Navigator>
  );
}
