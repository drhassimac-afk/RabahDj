import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SocketProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SocketProvider>
  );
}
