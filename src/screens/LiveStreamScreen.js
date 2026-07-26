import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveStreamScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Ionicons name="videocam-off" size={80} color="#64748b" />
      <Text style={styles.title}>البث المباشر</Text>
      <Text style={styles.sub}>ميزة WebRTC لا تعمل في Expo Go وهذا طبيعي.</Text>
      <Text style={[styles.sub, {marginTop:8}]}>
        يمكنك الآن تكملة تطوير RabahDj V2 بدون مشكل.
        سنبني Dev Client لاحقا لتفعيل الكاميرا والبث.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={()=> navigation.goBack()}>
        <Text style={styles.btnText}>رجوع</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#080D18', justifyContent:'center', alignItems:'center', padding:24},
  title:{color:'#fff', fontSize:22, fontWeight:'bold', marginTop:16},
  sub:{color:'#94A3B8', fontSize:13, textAlign:'center', marginTop:6, lineHeight:20},
  btn:{marginTop:24, backgroundColor:'#3B82F6', paddingHorizontal:22, paddingVertical:12, borderRadius:12},
  btnText:{color:'#000', fontWeight:'bold'}
});
