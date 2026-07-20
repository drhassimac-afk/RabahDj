import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <View style={styles.content}>
        <Text style={styles.title}>RabahDj</Text>
        <Text style={styles.subtitle}>تطبيق التواصل والدردشة المحلي</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.buttonText}>بدء الاتصال</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#00ffcc', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
