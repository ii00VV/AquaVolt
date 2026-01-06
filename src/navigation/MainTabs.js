import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import SensorsScreen from "../screens/SensorsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DeviceStack from "./DeviceStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2F5FE8",
        tabBarInactiveTintColor: "#A0A7B5",
        tabBarStyle: {
          height: 72,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ focused, color }) => {
          let name = "home-outline";
          if (route.name === "Home") name = focused ? "home" : "home-outline";
          if (route.name === "Sensors") name = focused ? "speedometer" : "speedometer-outline";
          if (route.name === "Device") name = focused ? "hardware-chip" : "hardware-chip-outline";
          if (route.name === "Profile") name = focused ? "person" : "person-outline";
          return <Ionicons name={name} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sensors" component={SensorsScreen} />
      <Tab.Screen name="Device" component={DeviceStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
