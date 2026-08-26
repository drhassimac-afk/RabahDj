import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Vibration, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getSocket } from '../../api/socket';
import { SERVER_URL } from '../../api/config';
import { addNotification } from '../../api/notifications';

const C = { bg:'#0B1120', surface:'#161F2E', elevated:'#1E2A3D', border:'#243044', primary:'#3B82F6', text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B', success:'#22C55E', gold:'#FACC15', live:'#A855F7' };

function guessMime(name) {
  const e = (name || '').split('.').pop().toLowerCase();
  const m = { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif', webp:'image/webp', mp4:'video/mp4', mkv:'video/x-matroska', mp3:'audio/mpeg', apk:'application/vnd.android.package-archive', zip:'application/zip', pdf:'application/pdf' };
  return m[e] || 'application/octet-stream';
}
function humanSize(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}
function fileIconMeta(name) {
  const e = (name || '').split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(e)) return { icon: 'image', color: C.primary };
  if (['mp4','mkv','mov'].includes(e)) return { icon: 'film', color: C.live };
  if (['mp3','wav','m4a'].includes(e)) return { icon: 'musical-notes', color: '#EC4899' };
  if (e === 'apk') return { icon: 'phone-portrait', color: C.success };
  if (e === 'pdf') return { icon: 'document-text', color: '#EF4444' };
  if (['zip','rar','7z'].includes(e)) return { icon: 'archive', color: C.gold };
  return { icon: 'document-attach', color: C.gold };
}

function PressableScale({ style, onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.8} onPressIn={onIn} onPressOut={onOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function FileShareScreen({ route, navigation }) {
  const me = (route.params && route.params.name) || 'مستخدم';
  const sock = useRef(getSocket());
  const [files, setFiles] = useState([]);
  const [uploads, setUploads] = useState({});
  const [toast, setToast] = useState('');
  const tT = useRef(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const flash = (m) => {
    setToast(m);
    clearTimeout(tT.current);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
    tT.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(''));
    }, 1900);
  };

  useEffect(() => {
    const s = sock.current;
    const onFile = (d) => { setFiles(prev => [d, ...prev.filter(x => x.url !== d.url)]); flash('📥 ملف جديد: ' + (d.name||'')); Vibration.vibrate(30); addNotification('file', `${d.from ? d.from + ' شارك' : 'تمت مشاركة'} ملف: ${d.name || ''}`); };
    s.on('file_shared', onFile);
    fetch(SERVER_URL + '/media-list').then(r => r.json()).then(list => {
      if (Array.isArray(list)) setFiles(list.map(it => ({ name: it.name || it.filename || 'ملف', url: it.url || (SERVER_URL + it.path), size: it.size })).filter(x => x.url));
    }).catch(()=>{});
    return () => s.off('file_shared', onFile);
  }, []);

  const upload = async (uri, name, size, mime) => {
    const id = Date.now() + '_' + Math.random().toString(36).slice(2,6);
    setUploads(u => ({ ...u, [id]: { name, progress: 0 } }));
    const fd = new FormData();
    fd.append('file', { uri, name, type: mime || guessMime(name) });
    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', SERVER_URL + '/upload');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploads(u => ({ ...u, [id]: { name, progress: Math.round(e.loaded/e.total*100) } })); };
      xhr.onload = () => {
        let url = null;
        try { const j = JSON.parse(xhr.responseText); url = j.fileUrl || j.url || j.file || null; } catch {}
        if (!url) { try { url = xhr.responseText.trim(); } catch {} }
        if (url && !/^http/.test(url)) url = SERVER_URL + (url.startsWith('/') ? '' : '/') + url;
        if (url) {
          const item = { name, url, size, from: me };
          setFiles(prev => [item, ...prev]);
          sock.current.emit('file_shared', item);
          flash('✅ تم إرسال ' + name);
        } else flash('⚠️ فشل الإرسال');
        resolve();
      };
      xhr.onerror = () => { flash('⚠️ خطأ في الإرسال'); resolve(); };
      xhr.send(fd);
    });
    setTimeout(() => setUploads(u => { const n = { ...u }; delete n[id]; return n; }), 800);
  };

  const pickImage = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 1 });
      if (r.canceled || !r.assets || !r.assets[0]) return;
      const a = r.assets[0];
      const name = (a.uri.split('/').pop()) || 'media';
      upload(a.uri, decodeURIComponent(name), a.fileSize, a.mimeType);
    } catch (e) { flash('⚠️ تعذّر فتح المعرض'); }
  };

  const pickFile = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      const a = r.assets ? r.assets[0] : r;
      if (!a || r.canceled || !a.uri) return;
      upload(a.uri, a.name || 'file', a.size, a.mimeType);
    } catch (e) { flash('⚠️ تعذّر فتح الملفات'); }
  };

  const Row = ({ item }) => {
    const meta = fileIconMeta(item.name);
    return (
      <View style={st.row}>
        <View style={[st.ficon, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon} size={24} color={meta.color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={st.fname} numberOfLines={1}>{item.name}</Text>
          <Text style={st.fmeta}>{(item.from ? 'من ' + item.from + ' · ' : '') + humanSize(item.size)}</Text>
        </View>
        <PressableScale style={st.dl} onPress={() => Linking.openURL(item.url)}>
          <Ionicons name="download" size={22} color="#fff" />
        </PressableScale>
      </View>
    );
  };

  const upList = Object.values(uploads);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-forward" size={24} color={C.sub} />
        </TouchableOpacity>
        <Text style={st.hTitle}>مشاركة الملفات</Text>
        <View style={{ width:24 }} />
      </View>

      <View style={st.picks}>
        <PressableScale style={[st.pick, { backgroundColor: '#152A47', borderColor: '#2563EB55' }]} onPress={pickImage}>
          <View style={[st.pickIcon, { backgroundColor: '#3B82F633' }]}>
            <Ionicons name="images" size={24} color={C.primary} />
          </View>
          <Text style={st.pickTxt} maxFontSizeMultiplier={1.2}>صورة / فيديو</Text>
        </PressableScale>
        <PressableScale style={[st.pick, { backgroundColor: '#2A1B3D', borderColor: '#A855F755' }]} onPress={pickFile}>
          <View style={[st.pickIcon, { backgroundColor: '#A855F733' }]}>
            <Ionicons name="folder-open" size={24} color={C.live} />
          </View>
          <Text style={st.pickTxt} maxFontSizeMultiplier={1.2}>ملف / تطبيق</Text>
        </PressableScale>
      </View>

      {upList.map((u, i) => (
        <View key={i} style={st.progBox}>
          <Text style={st.progName} numberOfLines={1}>⬆️ {u.name}</Text>
          <View style={st.bar}><View style={[st.barFill, { width: u.progress + '%' }]} /></View>
          <Text style={st.progPct}>{u.progress}%</Text>
        </View>
      ))}

      <FlatList data={files} keyExtractor={(it, i) => (it.url || '') + i} renderItem={Row} contentContainerStyle={st.list}
        ListEmptyComponent={
          <View style={st.emptyBox}>
            <View style={st.emptyCircle}>
              <Ionicons name="cloud-upload-outline" size={40} color={C.primary} />
            </View>
            <Text style={st.empty} maxFontSizeMultiplier={1.2}>لا ملفات بعد</Text>
            <Text style={st.emptyHint} maxFontSizeMultiplier={1.2}>اختر صورة أو ملفًا من الأعلى لإرساله للجميع 📤</Text>
          </View>
        } />

      {!!toast && (
        <Animated.View style={[
          st.toast,
          {
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}>
          <Text style={st.toastTxt}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:14},
  hTitle:{color:C.text,fontSize:18,fontWeight:'800'},
  picks:{flexDirection:'row',paddingHorizontal:16,marginBottom:8,marginTop:4},
  pick:{flex:1,marginHorizontal:6,borderRadius:18,paddingVertical:20,alignItems:'center',borderWidth:1.5},
  pickIcon:{width:52,height:52,borderRadius:16,alignItems:'center',justifyContent:'center',marginBottom:10},
  pickTxt:{color:C.text,fontSize:13.5,fontWeight:'700'},
  progBox:{marginHorizontal:16,marginVertical:6,backgroundColor:C.surface,borderRadius:12,padding:12,borderWidth:1,borderColor:C.border},
  progName:{color:C.text,fontSize:13,marginBottom:6},
  bar:{height:6,borderRadius:3,backgroundColor:C.elevated,overflow:'hidden'},
  barFill:{height:6,backgroundColor:C.primary},
  progPct:{color:C.sub,fontSize:11,marginTop:4,textAlign:'left'},
  list:{padding:16,paddingBottom:30,flexGrow:1},
  emptyBox:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:60},
  emptyCircle:{width:84,height:84,borderRadius:42,backgroundColor:'#3B82F61A',borderWidth:1,borderColor:'#3B82F640',alignItems:'center',justifyContent:'center',marginBottom:16},
  empty:{color:C.text,textAlign:'center',fontSize:16,fontWeight:'700'},
  emptyHint:{color:C.muted,textAlign:'center',marginTop:6,fontSize:13,paddingHorizontal:30},
  row:{flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderRadius:16,padding:12,marginBottom:10,borderWidth:1,borderColor:C.border},
  ficon:{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center'},
  fname:{color:C.text,fontSize:14,fontWeight:'700',marginRight:10},
  fmeta:{color:C.muted,fontSize:11,marginRight:10,marginTop:2},
  dl:{width:44,height:44,borderRadius:22,backgroundColor:C.primary,alignItems:'center',justifyContent:'center'},
  toast:{position:'absolute',bottom:24,alignSelf:'center',backgroundColor:C.elevated,borderWidth:1,borderColor:C.primary,borderRadius:14,paddingHorizontal:18,paddingVertical:10},
  toastTxt:{color:C.text,fontSize:13,fontWeight:'600'},
});
