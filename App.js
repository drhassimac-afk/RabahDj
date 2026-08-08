import React, { useEffect, useState } from 'react';

import {
  Platform,
  StatusBar,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import * as NavigationBar from 'expo-navigation-bar';

import {
  NavigationContainer,
  DarkTheme,
} from '@react-navigation/native';

import {
  createStackNavigator,
} from '@react-navigation/stack';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { discoverServer } from './src/api/config';

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
import V2XOGameScreen from './src/screens/v2/V2XOGameScreen';
import FileShareScreen from './src/screens/v2/FileShareScreen';
import V2NotificationsScreen from './src/screens/v2/V2NotificationsScreen';
import V2NearbyScreen from './src/screens/v2/V2NearbyScreen';

const Stack = createStackNavigator();

async function configureAndroidNavigationBar() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await NavigationBar.setVisibilityAsync('visible');
    await NavigationBar.setBackgroundColorAsync('#0B1120');
    await NavigationBar.setButtonStyleAsync('light');

    if (
      typeof NavigationBar.setBehaviorAsync === 'function'
    ) {
      await NavigationBar.setBehaviorAsync('inset-touch');
    }

    if (
      typeof NavigationBar.setPositionAsync === 'function'
    ) {
      await NavigationBar.setPositionAsync('relative');
    }

    if (
      typeof NavigationBar.setBorderColorAsync === 'function'
    ) {
      await NavigationBar.setBorderColorAsync('#0B1120');
    }

    if (
      typeof NavigationBar.setContrastEnforcedAsync === 'function'
    ) {
      await NavigationBar.setContrastEnforcedAsync(false);
    }
  } catch (error) {
    console.log('Navigation bar error:', error);
  }
}

function ServerSearchScreen() {
  return (
    <View style={loadingStyles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={loadingStyles.text}>جاري البحث عن السيرفر...</Text>
      <Text style={loadingStyles.hint}>تأكد إنك متصل بنفس شبكة الواي فاي</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
  },
  hint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
});

export default function App() {
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    configureAndroidNavigationBar();
    discoverServer().finally(() => setServerReady(true));
  }, []);

  if (!serverReady) {
    return <ServerSearchScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B1120"
        hidden={false}
      />

      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          initialRouteName="V2WelcomeScreen"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="V2WelcomeScreen"
            component={V2WelcomeScreen}
          />

          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
          />

          <Stack.Screen
            name="V2LoginScreen"
            component={V2LoginScreen}
          />

          <Stack.Screen
            name="V2AdminLoginScreen"
            component={V2AdminLoginScreen}
          />

          <Stack.Screen
            name="V2AdminPanelScreen"
            component={V2AdminPanelScreen}
          />

          {/* مسار قديم، نربطه بشاشة الدخول الجديدة */}
          <Stack.Screen
            name="AdminScreen"
            component={V2AdminLoginScreen}
          />

          <Stack.Screen
            name="Walkie"
            component={V2WalkieScreen}
          />

          <Stack.Screen
            name="Wall"
            component={V2WallScreen}
          />

          <Stack.Screen
            name="LiveStream"
            component={V2LiveStreamScreen}
          />

          <Stack.Screen
            name="Cinema"
            component={V2CinemaScreen}
          />

          <Stack.Screen
            name="Games"
            component={V2GamesScreen}
          />

          <Stack.Screen
            name="XOGame"
            component={V2XOGameScreen}
          />

          <Stack.Screen
            name="Files"
            component={FileShareScreen}
          />

          <Stack.Screen
            name="Notifications"
            component={V2NotificationsScreen}
          />

          <Stack.Screen
            name="Nearby"
            component={V2NearbyScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
