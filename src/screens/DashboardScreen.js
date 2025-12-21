import React from "react";
import { View, Text } from "react-native";
import { auth } from "../services/firebase";

export default function DashboardScreen() {
  const user = auth.currentUser;

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No user logged in.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome, {user.displayName || user.email}</Text>
    </View>
  );
}
