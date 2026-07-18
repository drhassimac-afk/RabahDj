mport EntertainmentScreen from '../screens/EntertainmentScreen';
import React from 'react';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import { createStackNavigator } from '@react-navigation/stack';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import { Ionicons } from '@expo/vector-icons';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import { View, StyleSheet } from 'react-native';
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
// استيراد الشاشات الأساسية
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import LoginScreen from '../screens/LoginScreen';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import FeedScreen from '../screens/FeedScreen';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import EntertainmentScreen from '../screens/EntertainmentScreen';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
import AdminScreen from '../screens/AdminScreen';
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
const Tab = createBottomTabNavigator();
mport EntertainmentScreen from '../screens/EntertainmentScreen';
const Stack = createStackNavigator();
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
// 1️⃣ ملاحة التبويبات السفلية (Bottom Tabs) بتصميم عصري عائم
mport EntertainmentScreen from '../screens/EntertainmentScreen';
function TabNavigator() {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
  return (
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    <Tab.Navigator
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      initialRouteName="الحائط"
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      screenOptions={({ route }) => ({
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        headerShown: false,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        tabBarShowLabel: true,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        tabBarActiveTintColor: '#3b82f6',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        tabBarInactiveTintColor: '#64748b',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        tabBarLabelStyle: {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          fontFamily: 'System',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          fontSize: 11,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          fontWeight: 'bold',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          marginBottom: 5,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        },
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        tabBarStyle: {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          backgroundColor: '#0f172a',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          borderTopWidth: 1,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          borderTopColor: '#1e293b',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          height: 65,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          paddingBottom: 8,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          paddingTop: 8,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          position: 'absolute',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          bottom: 0,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          left: 0,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          right: 0,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          elevation: 10,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          shadowColor: '#000',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          shadowOffset: { width: 0, height: -4 },
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          shadowOpacity: 0.2,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          shadowRadius: 10,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        },
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        tabBarIcon: ({ focused, color, size }) => {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          let iconName = 'alert-circle-outline';
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
          if (route.name === 'الحائط') {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
            iconName = focused ? 'home' : 'home-outline';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          } else if (route.name === 'الترفيه') {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
            iconName = focused ? 'game-controller' : 'game-controller-outline';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          } else if (route.name === 'حسابي') {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
            iconName = focused ? 'person' : 'person-outline';
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          }
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
          return (
mport EntertainmentScreen from '../screens/EntertainmentScreen';
            <View style={focused ? styles.activeIconWrapper : null}>
mport EntertainmentScreen from '../screens/EntertainmentScreen';
              <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
mport EntertainmentScreen from '../screens/EntertainmentScreen';
            </View>
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          );
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        },
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      })}
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    >
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      <Tab.Screen name="الحائط" component={FeedScreen} />
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      <Tab.Screen name="الترفيه" component={EntertainmentScreen} />
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      <Tab.Screen name="حسابي" component={ProfileScreen} />
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    </Tab.Navigator>
mport EntertainmentScreen from '../screens/EntertainmentScreen';
  );
mport EntertainmentScreen from '../screens/EntertainmentScreen';
}
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
// 2️⃣ الملاحة الرئيسية (StackNavigator) تبدأ بشاشة الدخول أولاً كبوابة حماية
mport EntertainmentScreen from '../screens/EntertainmentScreen';
export default function AppNavigator() {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
  return (
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      {/* شاشة الدخول الذكية هي أول ما يراه المستخدم */}
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      <Stack.Screen name="Login" component={LoginScreen} />
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
      {/* التبويبات الأساسية يتم الانتقال إليها بعد نجاح الاتصال */}
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      <Stack.Screen name="MainTabs" component={TabNavigator} />
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      {/* شاشة الأدمن السرية */}
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      <Stack.Screen
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        name="AdminScreen"
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        component={AdminScreen}
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        options={{
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          presentation: 'modal',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
          animationEnabled: true,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
        }}
mport EntertainmentScreen from '../screens/EntertainmentScreen';
      />
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    </Stack.Navigator>
mport EntertainmentScreen from '../screens/EntertainmentScreen';
  );
mport EntertainmentScreen from '../screens/EntertainmentScreen';
}
mport EntertainmentScreen from '../screens/EntertainmentScreen';

mport EntertainmentScreen from '../screens/EntertainmentScreen';
const styles = StyleSheet.create({
mport EntertainmentScreen from '../screens/EntertainmentScreen';
  activeIconWrapper: {
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    padding: 4,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    borderRadius: 12,
mport EntertainmentScreen from '../screens/EntertainmentScreen';
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
mport EntertainmentScreen from '../screens/EntertainmentScreen';
  }
mport EntertainmentScreen from '../screens/EntertainmentScreen';
});
