import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotifications, subscribe } from '../../api/notifications';

const C = {
  bg:'#0B1120', primary:'#3B82F6', primarySoft:'#1E3A5F',
  text:'#FFFFFF', sub:'#94A3B8', muted:'#64748B',
  live:'#A855F7', liveBg:'#2A1B3D',
  walkie:'#14B8A6', walkieBg:'#0F3B36',
  chat:'#3B82F6', chatBg:'#152A47',
  games:'#F59E0B', gamesBg:'#3D2E14',
};

export default function V2WelcomeScreen({ navigation }) {
  const [notifCount, setNotifCount] = React.useState(getNotifications().length);
  React.useEffect(() => { const unsub = subscribe((items) => setNotifCount(items.length)); return unsub; }, []);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1,duration:1800,easing:Easing.out(Easing.ease),useNativeDriver:true}),
      Animated.timing(pulse,{toValue:0,duration:1800,easing:Easing.in(Easing.ease),useNativeDriver:true}),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  const scale = pulse.interpolate({inputRange:[0,1],outputRange:[1,1.08]});
  const op = pulse.interpolate({inputRange:[0,1],outputRange:[0.35,0.08]});

  const soon = (label) => { Vibration.vibrate(40); Alert.alert(label, 'هذه الميزة قيد التطوير وستفعّل قريبًا 🔧'); };

  const FEATURES = [
    { icon:'videocam',        label:'بث مباشر',     color:C.live,   bg:C.liveBg,   onPress:()=>navigation.navigate('LiveStream') },
    { icon:'film',            label:'سينما وتلفاز', color:'#E11D48', bg:'#4C0519', onPress:()=>navigation.navigate('Cinema') },
    { icon:'mic',             label:'تخاطب لاسلكي', color:C.walkie, bg:C.walkieBg, onPress:()=>navigation.navigate('Walkie') },
    { icon:'chatbubbles',     label:'محادثات فورية',color:C.chat,   bg:C.chatBg,   onPress:()=>navigation.navigate('V2LoginScreen') },
    { icon:'game-controller', label:'ألعاب محلية',  color:C.games,  bg:C.gamesBg,  onPress:()=>navigation.navigate('Games') },
    { icon:'notifications',  label:'الإشعارات',    color:'#FACC15', bg:'#3D2E0A',  onPress:()=>navigation.navigate('Notifications'), badge: notifCount },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.body}>
        <View style={s.logoBox}>
          <Animated.View style={[s.ring,{transform:[{scale}],opacity:op}]} />
          <View style={s.outer}><View style={s.inner}><Ionicons name="radio" size={64} color={C.primary} /></View></View>
        </View>
        <Text style={s.title}>RabahDj</Text>
        <Text style={s.subtitle}>شبكتك الاجتماعية المحلية</Text>
        <View style={s.divider} />
        <Text style={s.desc}>تواصل، شارك، وابثّ صوتاً وفيديو مع أصدقائك{'\n'}عبر شبكتك المحلية بدون إنترنت</Text>

        <View style={s.grid}>
          {FEATURES.map(f => (
            <TouchableOpacity key={f.label} style={s.cell} activeOpacity={0.7} onPress={f.onPress}>
              <View style={[s.tile,{backgroundColor:f.bg}]}>
                <Ionicons name={f.icon} size={30} color={f.color} />
                {!!f.badge && (
                  <View style={s.badge}><Text style={s.badgeTxt}>{f.badge > 9 ? '9+' : f.badge}</Text></View>
                )}
              </View>
              <Text style={s.cellLbl}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={()=>navigation.navigate('V2LoginScreen')}>
          <Text style={s.btnTxt}>ابدأ الآن</Text>
          <Ionicons name="arrow-back" size={20} color="#fff" style={{marginRight:8}} />
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>navigation.navigate('V2AdminLoginScreen')} style={{marginTop:12}}>
          <Text style={s.adminLink}>🛡️ دخول المسؤول</Text>
        </TouchableOpacity>
        <Text style={s.ver}>الإصدار 2.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  body:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:20},
  logoBox:{width:170,height:170,alignItems:'center',justifyContent:'center'},
  ring:{position:'absolute',width:170,height:170,borderRadius:85,backgroundColor:C.primary},
  outer:{width:150,height:150,borderRadius:75,backgroundColor:C.primarySoft,alignItems:'center',justifyContent:'center'},
  inner:{width:120,height:120,borderRadius:60,borderWidth:2,borderColor:C.primary,alignItems:'center',justifyContent:'center'},
  title:{color:C.text,fontSize:40,fontWeight:'800',marginTop:22},
  subtitle:{color:C.primary,fontSize:17,fontWeight:'700',marginTop:6},
  divider:{width:90,height:3,borderRadius:2,backgroundColor:C.primary,marginVertical:16},
  desc:{color:C.sub,fontSize:15,lineHeight:26,textAlign:'center'},
  grid:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'center',marginTop:28,width:'100%'},
  cell:{width:'42%',alignItems:'center',marginBottom:20},
  tile:{width:64,height:64,borderRadius:18,alignItems:'center',justifyContent:'center'},
  cellLbl:{color:C.sub,fontSize:13,marginTop:8,fontWeight:'600'},
  footer:{paddingHorizontal:20,paddingBottom:18},
  btn:{backgroundColor:C.primary,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',flexDirection:'row-reverse'},
  btnTxt:{color:'#fff',fontSize:17,fontWeight:'700',marginLeft:8},
  adminLink:{color:C.muted,fontSize:12,textAlign:'center'},
  ver:{color:C.muted,fontSize:12,textAlign:'center',marginTop:10},
  badge:{position:'absolute',top:-4,right:-4,backgroundColor:'#EF4444',borderRadius:10,minWidth:20,height:20,alignItems:'center',justifyContent:'center',paddingHorizontal:4},
  badgeTxt:{color:'#fff',fontSize:11,fontWeight:'800'},
});
