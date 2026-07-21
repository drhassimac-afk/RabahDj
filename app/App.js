import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SocketProvider } from './src/context/SocketContext';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import FeedScreen from './src/screens/FeedScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// تعريف التبويبات السفلية
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#141b2d', borderTopWidth: 0 },
        tabBarActiveTintColor: '#3b82f6',
      }}
    >
      <Tab.Screen name="الحائط" component={FeedScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tab.Screen name="الترفيه" component={FeedScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="game-controller" size={24} color={color} /> }} />
      <Tab.Screen name="حسابي" component={FeedScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="WelcomeScreen">
          <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SocketProvider>
  );
}
