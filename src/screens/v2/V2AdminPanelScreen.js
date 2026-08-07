import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Vibration, Modal, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket, getAdminToken, clearAdmin } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', elevated:'#1E2A3D', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444', success:'#22C55E', gold:'#FACC15' };

export default function V2AdminPanelScreen({ navigation }) {
  const sock = useRef(getSocket());
  const [users, setUsers] = useState([]);
  const [walkie, setWalkie] = useState({ enabled:true, mutedUsers:[] });
  const [postsCount, setPosts] = useState(0);
  const [connected, setConn] = useState(false);
  const [serverStats, setServerStats] = useState({ connected: 0, posts: 0, streams: 0, cpu: 0, ram: 0 });
  const [toast, setToast] = useState('');
  const toastT = useRef(null);
  const [pinModal, setPinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const flash = (t) => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(()=>setToast(''), 1900); };

  useEffect(() => {
    const s = sock.current;
    s.emit('join', { name:'👑 الأدمن', avatarColor:C.gold });
    const onInit = (d) => { setUsers(d.onlineUsers||[]); setPosts((d.posts||[]).length); if (d.walkieSettings) setWalkie(d.walkieSettings); };
    const onUsers = (u) => setUsers(u||[]);
    const onWalkie = (w) => setWalkie(w||{enabled:true,mutedUsers:[]});
    const onPostAdd = () => setPosts(p => p+1);
    const onPostDel = () => setPosts(p => Math.max(0,p-1));
    const onConn = () => { setConn(true); flash('🟢 متصل بالسيرفر'); };
    const onDisc = () => { setConn(false); flash('🔴 انقطع الاتصال'); };
    const onErr = (e) => { if (e && e.message) { flash('⚠️ ' + e.message); Vibration.vibrate(80); } };
    const onPinRes = (r) => {
      if (r && r.ok) { flash('✅ تم تغيير الرمز'); setPinModal(false); setOldPin(''); setNewPin(''); setPinMsg(''); }
      else setPinMsg(r && r.reason === 'old' ? 'الرمز القديم غير صحيح' : r && r.reason === 'format' ? 'الرمز الجديد 4-8 أرقام' : 'فشل التغيير');
    };
    const onStats = (s) => { if (s) setServerStats(s); };
    s.on('init', onInit); s.on('onlineUsers', onUsers); s.on('walkie_settings_update', onWalkie);
    s.on('postAdded', onPostAdd); s.on('postDeleted', onPostDel);
    s.on('connect', onConn); s.on('disconnect', onDisc); s.on('error', onErr);
    s.on('admin_change_pin_result', onPinRes);
    s.on('admin_stats', onStats);
    setConn(s.connected);
    return () => { ['init','onlineUsers','walkie_settings_update','postAdded','postDeleted','connect','disconnect','error','admin_change_pin_result','admin_stats'].forEach(ev => s.off(ev)); };
  }, []);

  const token = getAdminToken();

  const toggleWalkie = (val) => {
    if (!token) { flash('⚠️ لا يوجد توكن'); return; }
    setWalkie(w => ({ ...w, enabled: val }));          // تحديث فوري
    sock.current.emit('admin_toggle_walkie', { token, enabled: val });
    Vibration.vibrate(20);
    flash(val ? '️ تم تفعيل التخاطب' : '🔇 تم إيقاف التخاطب');
    console.log('ADMIN -> admin_toggle_walkie', val);
  };

  const toggleMute = (username, muted) => {
    if (!token) return;
    sock.current.emit('admin_mute_user', { token, username, muted });
    Vibration.vibrate(20);
    flash(muted ? '🔇 تم كتم ' + username : '🔊 فُك كتم ' + username);
  };

  const submitPin = () => {
    if (!token) return;
    setPinMsg('');
    sock.current.emit('admin_change_pin', { token, oldPin, newPin });
  };

  const logout = () => { clearAdmin(); navigation.replace('V2WelcomeScreen'); };

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={logout}><Ionicons name="log-out-outline" size={24} color={C.sub} /></TouchableOpacity>
        <View style={{alignItems:'center'}}>
          <Text style={st.hTitle}>لوحة الإدارة</Text>
          <View style={st.dotRow}><View style={[st.dot,{backgroundColor: connected?C.success:C.danger}]} /><Text style={st.hSub}>{connected?'متصل بالسيرفر':'غير متصل'}</Text></View>
        </View>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <View style={st.statsRow}>
          <Stat icon="people" label="متصلون" value={users.length} color={C.primary} />
          <Stat icon="document-text" label="منشورات" value={postsCount} color={C.gold} />
          <Stat icon="mic" label="مكتومون" value={(walkie.mutedUsers||[]).length} color={C.danger} />
        </View>

        <Card title="حالة الخادم" icon="server-outline">
          <View style={st.row}>
            <Text style={st.rowTxt}>حالة السيرفر</Text>
            <View style={st.statusPill}><Text style={st.statusPillTxt}>{connected ? 'يعمل' : 'متوقف'}</Text></View>
          </View>
          <View style={{marginTop:14}}>
            <View style={st.barRow}><Text style={st.barLabel}>المعالج CPU</Text><Text style={st.barValue}>{serverStats.cpu}%</Text></View>
            <View style={st.barTrack}><View style={[st.barFill,{width:`${Math.min(100,serverStats.cpu)}%`,backgroundColor:C.success}]} /></View>
          </View>
          <View style={{marginTop:12}}>
            <View style={st.barRow}><Text style={st.barLabel}>ذاكرة RAM</Text><Text style={st.barValue}>{serverStats.ram}%</Text></View>
            <View style={st.barTrack}><View style={[st.barFill,{width:`${Math.min(100,serverStats.ram)}%`,backgroundColor:C.primary}]} /></View>
          </View>
          <View style={st.miniStatsRow}>
            <Text style={st.miniStat}>📡 بثوث نشطة: {serverStats.streams}</Text>
          </View>
        </Card>

        <Card title="التخاطب اللاسلكي" icon="walkie-talkie">
          <View style={st.row}><Text style={st.rowTxt}>تفعيل الميزة للجميع</Text>
            <Switch value={!!walkie.enabled} onValueChange={toggleWalkie} trackColor={{false:C.border,true:C.primary}} thumbColor="#fff" /></View>
        </Card>

        <Card title={'الأجهزة المتصلة (' + users.length + ')'} icon="people-outline">
          {users.length===0 ? <Text style={st.empty}>لا يوجد متصلون حاليًا</Text>
            : users.map(u => {
                const muted = (walkie.mutedUsers||[]).includes(u.name);
                const isAdmin = u.name === '👑 الأدمن';
                return (
                  <View key={(u.id||u.name)} style={st.userRow}>
                    <View style={[st.avatar,{backgroundColor:u.avatarColor||C.primary}]}><Text style={st.avatarTxt}>{(u.name||'?').trim().charAt(0)}</Text></View>
                    <Text style={st.userName} numberOfLines={1}>{u.name}</Text>
                    {isAdmin ? <Text style={st.badge}>أنت</Text>
                      : <TouchableOpacity style={[st.muteBtn, muted && {backgroundColor:C.danger}]} onPress={()=>toggleMute(u.name, !muted)}>
                          <Ionicons name={muted?'volume-off':'volume-high'} size={18} color={muted?'#fff':C.sub} /></TouchableOpacity>}
                  </View>
                );
              })}
          <Text style={st.hint}>💡 الكتم يظهر تأثيره عند وجود جهاز ثانٍ متصل.</Text>
        </Card>

        <Card title="الأمان" icon="lock-closed-outline">
          <TouchableOpacity style={st.linkBtn} onPress={()=>{ setPinMsg(''); setOldPin(''); setNewPin(''); setPinModal(true); }}>
            <Ionicons name="key-outline" size={20} color={C.gold} />
            <Text style={st.linkTxt}>تغيير رمز الأدمن</Text>
            <Ionicons name="chevron-back" size={18} color={C.muted} />
          </TouchableOpacity>
          <Text style={st.note}>الرمز مجزّأ ومخزّن بأمان. الكتم والإيقاف محميّان بتوكن الأدمن.</Text>
        </Card>

        <TouchableOpacity style={st.logoutBtn} onPress={logout}><Ionicons name="log-out-outline" size={18} color={C.danger} /><Text style={st.logoutTxt}>خروج من لوحة الإدارة</Text></TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      {!!toast && <View style={st.toast}><Text style={st.toastTxt}>{toast}</Text></View>}

      {/* Modal تغيير الرمز */}
      <Modal visible={pinModal} transparent animationType="fade" onRequestClose={()=>setPinModal(false)}>
        <View style={st.modalBg}>
          <View style={st.modal}>
            <Text style={st.modalTitle}>تغيير رمز الأدمن</Text>
            <TextInput style={st.modalInput} placeholder="الرمز الحالي" placeholderTextColor={C.muted} value={oldPin} onChangeText={setOldPin} keyboardType="number-pad" secureTextEntry maxLength={8} />
            <TextInput style={st.modalInput} placeholder="الرمز الجديد (4-8 أرقام)" placeholderTextColor={C.muted} value={newPin} onChangeText={setNewPin} keyboardType="number-pad" secureTextEntry maxLength={8} />
            {!!pinMsg && <Text style={st.modalErr}>{pinMsg}</Text>}
            <View style={st.modalRow}>
              <TouchableOpacity style={[st.modalBtn,{backgroundColor:C.elevated}]} onPress={()=>setPinModal(false)}><Text style={{color:C.text,fontWeight:'700'}}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity style={[st.modalBtn,{backgroundColor:C.primary}]} onPress={submitPin}><Text style={{color:'#fff',fontWeight:'700'}}>حفظ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({icon,label,value,color}) {
  return (<View style={st.stat}><View style={[st.statIcon,{backgroundColor:color+'22'}]}><Ionicons name={icon} size={20} color={color} /></View><Text style={st.statVal}>{value}</Text><Text style={st.statLbl}>{label}</Text></View>);
}
function Card({title,icon,children}) {
  return (<View style={st.card}><View style={st.cardHead}><Ionicons name={icon} size={18} color={C.primary} /><Text style={st.cardTitle}>{title}</Text></View>{children}</View>);
}

const st = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:14},
  hTitle:{color:C.text,fontSize:18,fontWeight:'800'}, hSub:{color:C.sub,fontSize:12,marginRight:6},
  dotRow:{flexDirection:'row',alignItems:'center',marginTop:4}, dot:{width:8,height:8,borderRadius:4},
  scroll:{padding:16,paddingBottom:40},
  statsRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:16},
  stat:{flex:1,backgroundColor:C.surface,borderRadius:16,padding:14,alignItems:'center',marginHorizontal:4,borderWidth:1,borderColor:C.border},
  statIcon:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center',marginBottom:8},
  statVal:{color:C.text,fontSize:22,fontWeight:'800'}, statLbl:{color:C.sub,fontSize:12,marginTop:2},
  card:{backgroundColor:C.surface,borderRadius:18,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border},
  statusPill:{backgroundColor:C.success+'22',borderRadius:10,paddingHorizontal:10,paddingVertical:4},
  statusPillTxt:{color:C.success,fontSize:12,fontWeight:'700'},
  barRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},
  barLabel:{color:C.sub,fontSize:12,fontWeight:'600'},
  barValue:{color:C.text,fontSize:12,fontWeight:'700'},
  barTrack:{height:8,borderRadius:4,backgroundColor:C.elevated,overflow:'hidden'},
  barFill:{height:8,borderRadius:4},
  miniStatsRow:{marginTop:14,borderTopWidth:1,borderTopColor:C.border,paddingTop:10},
  miniStat:{color:C.sub,fontSize:12,fontWeight:'600'},
  cardHead:{flexDirection:'row',alignItems:'center',marginBottom:12}, cardTitle:{color:C.text,fontSize:15,fontWeight:'700',marginRight:8},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, rowTxt:{color:C.text,fontSize:15},
  empty:{color:C.muted,fontSize:13,textAlign:'center',paddingVertical:10},
  hint:{color:C.muted,fontSize:11,marginTop:10},
  userRow:{flexDirection:'row',alignItems:'center',paddingVertical:9,borderTopWidth:1,borderTopColor:C.border},
  avatar:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'}, avatarTxt:{color:'#fff',fontWeight:'700',fontSize:16},
  userName:{color:C.text,fontSize:14,flex:1,marginHorizontal:10},
  badge:{color:C.gold,fontSize:11,fontWeight:'700',backgroundColor:C.gold+'22',paddingHorizontal:8,paddingVertical:3,borderRadius:8},
  muteBtn:{width:38,height:38,borderRadius:12,backgroundColor:C.elevated,alignItems:'center',justifyContent:'center'},
  linkBtn:{flexDirection:'row',alignItems:'center',paddingVertical:8,backgroundColor:C.elevated,borderRadius:12,paddingHorizontal:12},
  linkTxt:{color:C.text,fontSize:14,flex:1,marginRight:10},
  note:{color:C.muted,fontSize:12,marginTop:12,lineHeight:18},
  logoutBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:12,marginTop:6},
  logoutTxt:{color:C.danger,fontSize:14,fontWeight:'700',marginRight:8},
  toast:{position:'absolute',bottom:30,alignSelf:'center',backgroundColor:C.elevated,borderWidth:1,borderColor:C.primary,borderRadius:14,paddingHorizontal:18,paddingVertical:12},
  toastTxt:{color:C.text,fontSize:14,fontWeight:'600'},
  modalBg:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:24},
  modal:{backgroundColor:C.surface,borderRadius:20,padding:20,borderWidth:1,borderColor:C.border},
  modalTitle:{color:C.text,fontSize:18,fontWeight:'800',textAlign:'center',marginBottom:16},
  modalInput:{backgroundColor:C.elevated,borderRadius:12,paddingHorizontal:14,paddingVertical:14,color:C.text,fontSize:16,marginBottom:12,textAlign:'center',letterSpacing:2},
  modalErr:{color:C.danger,fontSize:13,textAlign:'center',marginBottom:8},
  modalRow:{flexDirection:'row',justifyContent:'space-between',marginTop:6},
  modalBtn:{flex:1,marginHorizontal:6,borderRadius:12,height:48,alignItems:'center',justifyContent:'center'},
});
