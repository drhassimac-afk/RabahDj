import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSocket, getAdminToken } from '../../api/socket';

const C = { bg:'#0B1120', surface:'#161F2E', elevated:'#1E2A3D', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', danger:'#EF4444', gold:'#FACC15' };

function cleanContent(t) {
  if (!t) return '';
  const s = String(t);
  const noSpace = s.replace(/\s+/g, '');
  if (/^[A-Za-z0-9_+\/=\-]{20,}$/.test(noSpace)) return '📎 مرفق وسائط';
  if (/[A-Za-z0-9_+\/=]{20,}/.test(s) && !/[\u0600-\u06FF]/.test(s)) return '📎 مرفق وسائط';
  return s;
}

export default function WallScreen({ route, navigation }) {
  const name = (route.params && route.params.name) || 'مستخدم';
  const adminToken = getAdminToken();
  const sock = useRef(getSocket());
  const [posts, setPosts] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const tT = useRef(null);
  const [postModal, setPostModal] = useState(false);
  const [draft, setDraft] = useState('');
  const [cmtModal, setCmtModal] = useState(null);
  const [cmt, setCmt] = useState('');

  const flash = (m) => { setToast(m); clearTimeout(tT.current); tT.current = setTimeout(()=>setToast(''),1800); };

  useEffect(() => {
    const s = sock.current;
    const onInit = (d) => { setPosts(d.posts || []); setReady(true); };
    const onAdd = (p) => setPosts(prev => [p, ...prev.filter(x => x.id !== p.id)]);
    const onUpd = (p) => setPosts(prev => prev.map(x => x.id === p.id ? p : x));
    const onDel = (d) => setPosts(prev => prev.filter(x => x.id !== d.postId));
    const onErr = (e) => { if (e && e.message) { flash('⚠️ ' + e.message); Vibration.vibrate(70); } };
    s.on('init', onInit); s.on('postAdded', onAdd); s.on('postUpdated', onUpd); s.on('postDeleted', onDel); s.on('error', onErr);
    s.emit('join', { name, avatarColor: C.primary });
    return () => { ['init','postAdded','postUpdated','postDeleted','error'].forEach(e=>s.off(e)); };
  }, []);

  const like = (id) => sock.current.emit('toggleLike', { postId: id });
  const del = (id) => { sock.current.emit('deletePost', { postId: id, token: adminToken }); Vibration.vibrate(20); flash('🗑️ تم الحذف'); };
  const sendPost = () => { const t = draft.trim(); if (!t) return; sock.current.emit('newPost', { content: t }); setDraft(''); setPostModal(false); };
  const sendCmt = () => { const t = cmt.trim(); if (!t || !cmtModal) return; sock.current.emit('newComment', { postId: cmtModal, content: t }); setCmt(''); setCmtModal(null); };

  const Card = ({ item }) => {
    const comments = item.comments || [];
    return (
      <View style={st.card}>
        <View style={st.head}>
          <View style={[st.av, { backgroundColor: item.authorColor || C.primary }]}><Text style={st.avT}>{(item.authorName || '?').trim().charAt(0)}</Text></View>
          <View style={{ flex:1 }}>
            <Text style={st.author}>{item.authorName || 'مجهول'}</Text>
            <Text style={st.time}>{(item.createdAt || '').slice(0,16).replace('T',' ')}</Text>
          </View>
          <TouchableOpacity onPress={() => del(item.id)} style={st.iconBtn}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity>
        </View>
        <Text style={st.content}>{cleanContent(item.text || item.content)}</Text>
        <View style={st.actions}>
          <TouchableOpacity style={st.act} onPress={() => like(item.id)}><Ionicons name="heart" size={20} color={C.danger} /><Text style={st.actTxt}>{item.likes ? item.likes.length : 0}</Text></TouchableOpacity>
          <TouchableOpacity style={st.act} onPress={() => { setCmt(''); setCmtModal(item.id); }}><Ionicons name="chatbubble-outline" size={20} color={C.sub} /><Text style={st.actTxt}>{comments.length}</Text></TouchableOpacity>
        </View>
        {comments.length > 0 && (
          <View style={st.cmtBox}>
            {comments.slice(-3).map((c, i) => (
              <View key={i} style={st.cmt}><Text style={st.cmtName}>{c.authorName || c.author || 'معلق'}</Text><Text style={st.cmtTxt}>{cleanContent(c.content || c.text || '')}</Text></View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-forward" size={24} color={C.sub} /></TouchableOpacity>
        <Text style={st.hTitle}>الحائط</Text>
        {adminToken ? <Ionicons name="shield-checkmark" size={22} color={C.gold} /> : <View style={{width:22}} />}
      </View>
      {!ready ? <ActivityIndicator color={C.primary} style={{ marginTop:40 }} />
        : posts.length === 0 ? <Text style={st.empty}>لا توجد منشورات بعد ✍️</Text>
        : <FlatList data={posts} keyExtractor={i => i.id} renderItem={Card} contentContainerStyle={st.list} />}
      <TouchableOpacity style={st.fab} onPress={() => setPostModal(true)}><Ionicons name="add" size={30} color="#fff" /></TouchableOpacity>
      {!!toast && <View style={st.toast}><Text style={st.toastTxt}>{toast}</Text></View>}
      <Modal visible={postModal} transparent animationType="fade" onRequestClose={() => setPostModal(false)}>
        <View style={st.modalBg}><View style={st.modal}>
          <Text style={st.modalTitle}>منشور جديد</Text>
          <TextInput style={st.input} placeholder="بم تفكر؟" placeholderTextColor={C.muted} value={draft} onChangeText={setDraft} multiline maxLength={2000} textAlignVertical="top" />
          <View style={st.modalRow}>
            <TouchableOpacity style={[st.mBtn,{backgroundColor:C.elevated}]} onPress={() => setPostModal(false)}><Text style={{color:C.text,fontWeight:'700'}}>إلغاء</Text></TouchableOpacity>
            <TouchableOpacity style={[st.mBtn,{backgroundColor:C.primary}]} onPress={sendPost}><Text style={{color:'#fff',fontWeight:'700'}}>نشر</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
      <Modal visible={!!cmtModal} transparent animationType="fade" onRequestClose={() => setCmtModal(null)}>
        <View style={st.modalBg}><View style={st.modal}>
          <Text style={st.modalTitle}>إضافة تعليق</Text>
          <TextInput style={[st.input,{minHeight:80}]} placeholder="اكتب تعليقك" placeholderTextColor={C.muted} value={cmt} onChangeText={setCmt} multiline maxLength={500} textAlignVertical="top" />
          <View style={st.modalRow}>
            <TouchableOpacity style={[st.mBtn,{backgroundColor:C.elevated}]} onPress={() => setCmtModal(null)}><Text style={{color:C.text,fontWeight:'700'}}>إلغاء</Text></TouchableOpacity>
            <TouchableOpacity style={[st.mBtn,{backgroundColor:C.primary}]} onPress={sendCmt}><Text style={{color:'#fff',fontWeight:'700'}}>إرسال</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:14},
  hTitle:{color:C.text,fontSize:18,fontWeight:'800'},
  list:{padding:16,paddingBottom:90},
  empty:{color:C.muted,textAlign:'center',marginTop:40,fontSize:14},
  card:{backgroundColor:C.surface,borderRadius:18,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border},
  head:{flexDirection:'row',alignItems:'center',marginBottom:10},
  av:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},
  avT:{color:'#fff',fontWeight:'700'},
  author:{color:C.text,fontSize:15,fontWeight:'700',marginRight:10},
  time:{color:C.muted,fontSize:11,marginRight:10},
  iconBtn:{padding:4},
  content:{color:C.text,fontSize:15,lineHeight:22,marginBottom:10},
  actions:{flexDirection:'row',alignItems:'center'},
  act:{flexDirection:'row',alignItems:'center',marginLeft:18},
  actTxt:{color:C.sub,fontSize:14,marginRight:6},
  cmtBox:{marginTop:10,borderTopWidth:1,borderTopColor:C.border,paddingTop:8},
  cmt:{backgroundColor:C.elevated,borderRadius:12,padding:10,marginBottom:6},
  cmtName:{color:C.primary,fontSize:12,fontWeight:'700',marginBottom:2},
  cmtTxt:{color:C.text,fontSize:13,lineHeight:19},
  fab:{position:'absolute',bottom:24,left:24,width:58,height:58,borderRadius:29,backgroundColor:C.primary,alignItems:'center',justifyContent:'center',elevation:6},
  toast:{position:'absolute',bottom:90,alignSelf:'center',backgroundColor:C.elevated,borderWidth:1,borderColor:C.primary,borderRadius:14,paddingHorizontal:18,paddingVertical:10},
  toastTxt:{color:C.text,fontSize:13,fontWeight:'600'},
  modalBg:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:24},
  modal:{backgroundColor:C.surface,borderRadius:20,padding:20,borderWidth:1,borderColor:C.border},
  modalTitle:{color:C.text,fontSize:18,fontWeight:'800',textAlign:'center',marginBottom:14},
  input:{backgroundColor:C.elevated,borderRadius:14,padding:14,color:C.text,fontSize:15,minHeight:110,marginBottom:12},
  modalRow:{flexDirection:'row',justifyContent:'space-between'},
  mBtn:{flex:1,marginHorizontal:6,height:48,borderRadius:12,alignItems:'center',justifyContent:'center'},
});
