import AdminScreen from '../screens/AdminScreen';
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useRabahSocket } from "../context/SocketContext";
import LoginScreen from "../screens/LoginScreen";
import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import colors from "../theme/colors";

const Tab = createBottomTabNavigator();

function Icon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function AppNavigator() {
  const { connected } = useRabahSocket();

  if (!connected) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: "الرئيسية",
          tabBarIcon: () => <Icon emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminScreen}
        options={{
          title: "لوحة التحكم",
          tabBarIcon: () => <Icon emoji="⚙️" />,
        }}
      />
    </Tab.Navigator>
  );
}
