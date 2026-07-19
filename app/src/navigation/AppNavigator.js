import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useRabahSocket } from '../context/SocketContext';

import LoginScreen from '../screens/LoginScreen';
import FeedScreen from '../screens/FeedScreen';
import EntertainmentScreen from '../screens/EntertainmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="الحائط"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontFamily: 'System',
          fontSize: 11,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'alert-circle-outline';

          if (route.name === 'الحائط') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'الترفيه') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'حسابي') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="الحائط" component={FeedScreen} />
      <Tab.Screen name="الترفيه" component={EntertainmentScreen} />
      <Tab.Screen name="حسابي" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { connected } = useRabahSocket();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!connected ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="AdminScreen"
            component={AdminScreen}
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconWrapper: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  }
});
