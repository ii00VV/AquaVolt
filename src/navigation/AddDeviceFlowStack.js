import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ChooseConnectionMethodScreen from "../screens/addDevice/ChooseConnectionMethodScreen";
import EnableBluetoothScreen from "../screens/addDevice/EnableBluetoothScreen";
import ScanBluetoothScreen from "../screens/addDevice/ScanBluetoothScreen";
import PairBluetoothScreen from "../screens/addDevice/PairBluetoothScreen";


import ScanDevicesScreen from "../screens/addDevice/ScanDevicesScreen";
import WifiCredentialsScreen from "../screens/addDevice/WifiCredentialsScreen";
import ConnectingScreen from "../screens/addDevice/ConnectingScreen";
import DeviceAddedScreen from "../screens/addDevice/DeviceAddedScreen";

const Stack = createNativeStackNavigator();

export default function AddDeviceFlowStack() {
  return (
    <Stack.Navigator
      initialRouteName="ChooseConnectionMethod"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ChooseConnectionMethod" component={ChooseConnectionMethodScreen} />
      <Stack.Screen name="ScanDevice" component={ScanDevicesScreen} />
      <Stack.Screen name="WifiCredentials" component={WifiCredentialsScreen} />
      <Stack.Screen name="Connecting" component={ConnectingScreen} />
      <Stack.Screen name="DeviceAdded" component={DeviceAddedScreen} />
      <Stack.Screen name="EnableBluetooth" component={EnableBluetoothScreen} />
      <Stack.Screen name="ScanBluetooth" component={ScanBluetoothScreen} />
      <Stack.Screen name="PairBluetooth" component={PairBluetoothScreen} />
    </Stack.Navigator>
  );
}
