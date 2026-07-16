import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

export default function LoginScreen() {
  const { connect, connected, connectionError } = useRabahSocket();
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const lastIp = await AsyncStorage.getItem("rabahdj_last_ip");
      const lastName = await AsyncStorage.getItem("rabahdj_last_name");
      if (lastIp) setIp(lastIp);
      if (lastName) setName(lastName);
    })();
  }, []);

  useEffect(() => {
    if (connected) setLoading(false);
  }, [connected]);

  useEffect(() => {
    if (connectionError) setLoading(false);
  }, [connectionError]);

  const handleConnect = () => {
    if (!name.trim() || !ip.trim()) return;
    setLoading(true);
    connect(ip.trim(), name.trim());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.brandBlock}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.brand}>RabahDj</Text>
          <Text style={styles.tagline}>شبكتك الاجتماعية المحلية — بدون إنترنت</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>اسمك</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: رابح"
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <Text style={styles.label}>عنوان IP الخاص بالسيرفر المحلي</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 192.168.1.10"
            placeholderTextColor={colors.subtext}
            value={ip}
            onChangeText={setIp}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            textAlign="right"
          />
          <Text style={styles.hint}>
            يظهر هذا العنوان في الطرفية عند تشغيل السيرفر على الجهاز المضيف، ويجب أن تكون كل الأجهزة على نفس شبكة الواي فاي.
          </Text>

          {connectionError ? <Text style={styles.error}>{connectionError}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (!name.trim() || !ip.trim()) && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={!name.trim() || !ip.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>اتصال</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  brandBlock: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: { fontSize: 40, fontWeight: "bold", color: colors.primary },
  brand: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  tagline: { fontSize: 14, color: "#E8F0FE", marginTop: 6 },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    textAlign: "right",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "#F7F8FA",
  },
  hint: { fontSize: 11, color: colors.subtext, textAlign: "right", marginTop: 6 },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "right",
    marginTop: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
