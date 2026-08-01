import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import V2WelcomeScreen from './src/screens/v2/V2WelcomeScreen';
import MainTabs from './src/navigation/MainTabs';
import V2LoginScreen from './src/screens/v2/V2LoginScreen';
import V2AdminLoginScreen from './src/screens/v2/V2AdminLoginScreen';
import V2AdminPanelScreen from './src/screens/v2/V2AdminPanelScreen';
import V2WalkieScreen from './src/screens/v2/V2WalkieScreen';
import V2WallScreen from './src/screens/v2/V2WallScreen';
import V2LiveStreamScreen from './src/screens/v2/V2LiveStreamScreen';
import V2CinemaScreen from './src/screens/v2/V2CinemaScreen';
import V2GamesScreen from './src/screens/v2/V2GamesScreen';
import FileShareScreen from './src/screens/v2/FileShareScreen';
import V2NotificationsScreen from './src/screens/v2/V2NotificationsScreen';
import V2NearbyScreen from './src/screens/v2/V2NearbyScreen';
import V2NearbyScreen from './src/screens/v2/V2NearbyScreen';
import V2NearbyScreen from './src/screens/v2/V2NearbyScreen';
import V2NearbyScreen from './src/screens/v2/V2NearbyScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="V2LoginScreen" component={V2LoginScreen} />
          <Stack.Screen name="V2AdminLoginScreen" component={V2AdminLoginScreen} />
          <Stack.Screen name="V2AdminPanelScreen" component={V2AdminPanelScreen} />
          <Stack.Screen name="Walkie" component={V2WalkieScreen} />
            <Stack.Screen name="Wall" component={V2WallScreen} />
          <Stack.Screen name="LiveStream" component={V2LiveStreamScreen} />
          <Stack.Screen name="Cinema" component={V2CinemaScreen} />
          <Stack.Screen name="Games" component={V2GamesScreen} />
          <Stack.Screen name="Files" component={FileShareScreen} />
          <Stack.Screen name="Nearby" component={V2NearbyScreen} />
          <Stack.Screen name="Nearby" component={V2NearbyScreen} />
          <Stack.Screen name="Nearby" component={V2NearbyScreen} />
          <Stack.Screen name="Nearby" component={V2NearbyScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
