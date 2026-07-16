import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useRabahSocket } from "../context/SocketContext";
import LoginScreen from "../screens/LoginScreen";
import FeedScreen from "../screens/FeedScreen";
import AdminScreen from "../screens/AdminScreen";
import ProfileScreen from "../screens/ProfileScreen";
import colors from "../theme/colors";

// مكون بسيط لعرض الأيقونات التعبيرية (Emoji) أسفل التبويبات
function Icon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
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
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "حسابي",
          tabBarIcon: () => <Icon emoji="👤" />,
        }}
      />
    </Tab.Navigator>
  );
}