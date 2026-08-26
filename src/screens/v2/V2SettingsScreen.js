import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SERVER_URL, discoverServer } from '../../api/config';
import { initNotifications, setOsNotificationsEnabled, getOsNotificationsEnabled, checkNotificationPermission } from '../../api/notifications';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', gold:'#FACC15', success:'#22C55E', danger:'#EF4444' };

function PressableScale({ style, onPress, disabled, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} onPress={onPress} disabled={disabled} activeOpacity={0.8} onPressIn={onIn} onPressOut={onOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function V2SettingsScreen({ navigation }) {
  const [serverAddr, setServerAddr] = useState(SERVER_URL.replace('http://', ''));
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // null | 'success' | 'fail'
  const [notifOn, setNotifOn] = useState(getOsNotificationsEnabled());
  const [notifGranted, setNotifGranted] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
    checkNotificationPermission().then((granted) => {
      setNotifGranted(granted);
      if (!granted) setNotifOn(false);
    });
  }, []);

  const rescan = async () => {
    setScanning(true);
    setScanResult(null);
    const { ip } = await discoverServer();
    setScanning(false);
    if (ip) {
      setServerAddr(SERVER_URL.replace('http://', ''));
      setScanResult('success');
    } else {
      setScanResult('fail');
    }
    setTimeout(() => setScanResult(null), 3000);
  };

  const toggleNotif = async (value) => {
    if (value) {
      const granted = await initNotifications();
      setNotifGranted(granted);
      if (!granted) {
        setNotifOn(false);
        setOsNotificationsEnabled(false);
        return;
      }
    }
    setNotifOn(value);
    setOsNotificationsEnabled(value);
  };

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.header}>الإعدادات</Text>

      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], width: '100%' }}>
        <View style={s.card}>
          <Ionicons name="server-outline" size={22} color={C.primary} />
          <View style={{ marginRight: 12, flex: 1 }}>
            <Text style={s.label}>عنوان السيرفر</Text>
            <Text style={s.value}>{serverAddr}</Text>
          </View>
        </View>

        <PressableScale style={s.card} onPress={rescan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Ionicons
              name={scanResult === 'success' ? 'checkmark-circle' : scanResult === 'fail' ? 'close-circle' : 'refresh-outline'}
              size={22}
              color={scanResult === 'success' ? C.success : scanResult === 'fail' ? C.danger : C.primary}
            />
          )}
          <Text style={[s.label, { marginRight: 12, flex: 1, color: C.text, fontWeight: '600' }]}>
            {scanning ? 'جاري البحث عن السيرفر...' : scanResult === 'success' ? 'تم العثور على السيرفر ✓' : scanResult === 'fail' ? 'لم يتم العثور على السيرفر' : 'إعادة البحث عن السيرفر'}
          </Text>
        </PressableScale>

        <View style={s.card}>
          <Ionicons name="notifications-outline" size={22} color={notifOn ? C.primary : C.sub} />
          <View style={{ marginRight: 12, flex: 1 }}>
            <Text style={[s.label, { color: C.text, fontWeight: '600' }]}>إشعارات الهاتف</Text>
            {!notifGranted && (
              <TouchableOpacity onPress={() => Linking.openSettings()}>
                <Text style={[s.label, { color: C.danger, marginTop: 2 }]}>
                  الإذن مرفوض — افتح إعدادات الهاتف لتفعيله
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Switch
            value={notifOn}
            onValueChange={toggleNotif}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <PressableScale style={s.card} onPress={() => navigation.navigate('V2AdminLoginScreen')}>
          <Ionicons name="shield-checkmark-outline" size={22} color={C.gold} />
          <Text style={[s.label, { marginRight: 12, flex: 1, color: C.text, fontWeight: '600' }]}>لوحة الإدارة</Text>
          <Ionicons name="chevron-back" size={18} color={C.sub} />
        </PressableScale>
      </Animated.View>

      <Text style={s.ver}>RabahDj — الإصدار 2.0.0</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, padding: 20 },
  header: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'right' },
  card: {
    flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12,
  },
  label: { color: C.sub, fontSize: 13, textAlign: 'right' },
  value: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 4, textAlign: 'right' },
  ver: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 'auto', marginBottom: 10 },
});
