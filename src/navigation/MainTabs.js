import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import V2WelcomeScreen from '../screens/v2/V2WelcomeScreen';
import V2NotificationsScreen from '../screens/v2/V2NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import V2SettingsScreen from '../screens/v2/V2SettingsScreen';
import { getNotifications, subscribe } from '../api/notifications';

const C = { bg:'#0B1120', surface:'#0F1830', border:'#243044', primary:'#3B82F6', sub:'#94A3B8', gold:'#FACC15', danger:'#EF4444' };

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, navigation }) {
  const [count, setCount] = React.useState(getNotifications().length);
  React.useEffect(() => { const unsub = subscribe((items) => setCount(items.length)); return unsub; }, []);

  const items = [
    { key: 'Settings', icon: 'settings-outline', label: 'الإعدادات' },
    { key: 'Notifications', icon: 'notifications-outline', label: 'إشعارات', badge: count },
    { key: 'CenterWifi', icon: 'wifi', center: true },
    { key: 'Profile', icon: 'person-outline', label: 'ملفي' },
    { key: 'Home', icon: 'home', label: 'الرئيسية' },
  ];

  return (
    <View style={st.bar}>
      {items.map((it) => {
        if (it.center) {
          return (
            <View key={it.key} style={st.centerWrap}>
              <View style={st.centerBtn}><Ionicons name={it.icon} size={26} color="#0B1120" /></View>
            </View>
          );
        }
        const routeIndex = state.routes.findIndex((r) => r.name === it.key);
        const isActive = state.index === routeIndex;
        return (
          <TouchableOpacity
            key={it.key}
            style={st.item}
            onPress={() => navigation.navigate(it.key)}
            activeOpacity={0.7}
          >
            <View>
              <Ionicons name={it.icon} size={22} color={isActive ? C.primary : C.sub} />
              {!!it.badge && (
                <View style={st.badge}><Text style={st.badgeTxt}>{it.badge > 9 ? '9+' : it.badge}</Text></View>
              )}
            </View>
            <Text style={[st.label, isActive && { color: C.primary }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Settings" component={V2SettingsScreen} />
      <Tab.Screen name="Notifications" component={V2NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Home" component={V2WelcomeScreen} />
    </Tab.Navigator>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    paddingVertical: 10, paddingBottom: 16, alignItems: 'center', justifyContent: 'space-around',
  },
  item: { alignItems: 'center', flex: 1 },
  label: { color: C.sub, fontSize: 11, marginTop: 4 },
  centerWrap: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, marginTop: -26 },
  centerBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: C.bg,
  },
  badge: {
    position: 'absolute', top: -4, right: -8, backgroundColor: C.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
