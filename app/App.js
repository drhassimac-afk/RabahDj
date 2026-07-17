import 'react-native-gesture-handler'; // 👈 يجب أن يكون في السطر الأول تماماً
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SocketProvider } from "./src/context/SocketContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SocketProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SocketProvider>
  );
}

