import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket } from '../../api/socket';
import { SERVER_URL } from '../../api/config';

const C = { bg:'#0B1120', surface:'#161F2E', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', success:'#22C55E', danger:'#EF4444', gold:'#FACC15', live:'#A855F7', elevated:'#1E2A3D' };

export default function V2LoginScreen({ navigation }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const [initData, setInitData] = useState({});
  const sock = useRef(getSocket());

  const join = () => {
    const n = name.trim();
    if (!n) { setMsg('أدخل اسمك أولاً'); Vibration.vibrate(60); return; }
    setStatus('connecting'); setMsg('');
    const s = sock.current;
    const onUsersList = (data) => { setStatus('connected'); setInitData(data || {}); s.off('init', onUsersList); s.off('error', onErr); };
    const onErr = (e) => { setStatus('error'); setMsg((e && e.message) || 'فشل الاتصال'); s.off('init', onUsersList); s.off('error', onErr); };
    s.off('init'); s.off('error');
    s.on('init', onUsersList); s.on('error', onErr);
    const doJoin = () => s.emit('join', { name: n, avatarColor: C.primary });
    if (!s.connected) { s.once('connect', doJoin); s.once('connect_error', () => { setStatus('error'); setMsg('تعذّر الوصول للسيرفر المحلي'); }); }
    else doJoin();
  };

  if (status === 'connected') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <View style={s.okIcon}><Ionicons name="checkmark-circle" size={60} color={C.success} /></View>
          <Text style={s.title}>تم الدخول</Text>
          <Text style={s.sub}>مرحبًا {name} 👋</Text>
          <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Wall', { name, initialPosts: initData.posts })}><Ionicons name="newspaper" size={20} color="#fff" style={{ marginLeft:8 }} /><Text style={s.btnTxt}>الحائط</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor:'#2A1B3D', marginTop:12 }]} onPress={() => navigation.navigate('Files', { name })}><Ionicons name="paper-plane" size={20} color={C.live} style={{ marginLeft:8 }} /><Text style={[s.btnTxt, { color:C.live }]}>مشاركة الملفات</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor:C.elevated, marginTop:12 }]} onPress={() => navigation.navigate('V2AdminLoginScreen')}><Ionicons name="shield-checkmark" size={20} color={C.gold} style={{ marginLeft:8 }} /><Text style={[s.btnTxt, { color:C.gold }]}>لوحة الإدارة</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-forward" size={24} color={C.sub} /></TouchableOpacity>
      <View style={s.top}>
        <View style={s.logo}><Ionicons name="person-circle" size={52} color={C.primary} /></View>
        <Text style={s.title}>انضم للشبكة</Text>
        <Text style={s.sub}>أدخل اسمك للاتصال بالسيرفر المحلي</Text>
      </View>
      <View style={s.field}><TextInput style={s.input} placeholder="اسمك" placeholderTextColor={C.muted} value={name} onChangeText={setName} autoCapitalize="none" returnKeyType="done" /></View>
      {!!msg && <Text style={s.err}>{msg}</Text>}
      <TouchableOpacity style={s.btn} onPress={join} disabled={status==='connecting'} activeOpacity={0.85}>{status==='connecting' ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>دخول</Text>}</TouchableOpacity>
      <Text style={s.note2}>السيرفر: {SERVER_URL.replace('http://', '')}</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg,paddingHorizontal:24},
  back:{alignSelf:'flex-end',padding:8,marginTop:4},
  top:{alignItems:'center',marginTop:30},
  logo:{width:96,height:96,borderRadius:28,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center',marginBottom:18},
  title:{color:C.text,fontSize:24,fontWeight:'800'},
  sub:{color:C.sub,fontSize:14,marginTop:6,textAlign:'center'},
  field:{marginTop:36,backgroundColor:C.surface,borderRadius:16,borderWidth:1,borderColor:C.border},
  input:{color:C.text,fontSize:17,paddingHorizontal:18,paddingVertical:16,textAlign:'right'},
  err:{color:C.danger,fontSize:13,textAlign:'center',marginTop:12},
  btn:{marginTop:0,backgroundColor:C.primary,borderRadius:28,height:54,alignItems:'center',justifyContent:'center',flexDirection:'row'},
  btnTxt:{color:'#fff',fontSize:16,fontWeight:'700'},
  note2:{color:C.muted,fontSize:11,textAlign:'center',marginTop:'auto',marginBottom:16},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  okIcon:{marginBottom:18},
});
