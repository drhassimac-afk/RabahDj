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
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRabahSocket } from "../context/SocketContext";
import colors from "../theme/colors";

export default function LoginScreen({ navigation }) {
  const { connect, connected, connectionError } = useRabahSocket();
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);

  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [storedPin, setStoredPin] = useState("");

  useEffect(() => {
    (async () => {
      const securePin = await SecureStore.getItemAsync("rabahdj_secure_pin");
      if (securePin) {
        setIsRegistered(true);
        setStoredPin(securePin);
      } else {
        setIsRegistered(false);
        setIsPinVerified(true);
      }

      const lastIp = await AsyncStorage.getItem("rabahdj_last_ip");
      const lastName = await AsyncStorage.getItem("rabahdj_last_name");
      if (lastIp) setIp(lastIp);
      if (lastName) setName(lastName);
    })();
  }, []);

  useEffect(() => {
    if (connected) {
      setLoading(false);
      if (navigation) {
        navigation.replace("MainTabs");
      }
    }
  }, [connected, navigation]);

  useEffect(() => {
    if (connectionError) setLoading(false);
  }, [connectionError]);

  const handlePinAuth = async () => {
    if (pin.length < 4) {
      Alert.alert("تنبيه", "الرجاء إدخال رمز مكون من 4 أرقام");
      return;
    }

    if (!isRegistered) {
      await SecureStore.setItemAsync("rabahdj_secure_pin", pin);
      Alert.alert("نجاح", "تم تعيين رمز الدخول بنجاح!");
      setIsRegistered(true);
      setStoredPin(pin);
      setPin("");
    } else {
      if (pin === storedPin) {
        setIsPinVerified(true);
        setPin("");
      } else {
        Alert.alert("خطأ", "الرمز السري غير صحيح");
        setPin("");
      }
    }
  };

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

        {!isPinVerified ? (
          <View style={styles.form}>
            <Text style={styles.pinTitle}>🔒 نظام الحماية المحلي</Text>
            <Text style={styles.hintText}>الرجاء إدخال الرمز السري لفتح التطبيق</Text>
            <TextInput
              style={[styles.input, styles.pinInput]}
              placeholder="X X X X"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
            <TouchableOpacity style={styles.button} onPress={handlePinAuth}>
              <Text style={styles.buttonText}>تأكيد الرمز</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            {!isRegistered && (
              <View style={styles.registerNotice}>
                <Text style={styles.registerNoticeText}>⚠️ يرجى تعيين رمز حماية أولاً لتأمين حسابك:</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center', marginBottom: 10 }]}
                  placeholder="اختر رمز PIN مكون من 4 أرقام"
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={4}
                  value={pin}
                  onChangeText={setPin}
                />
                <TouchableOpacity style={[styles.button, { marginTop: 5, backgroundColor: '#28a745' }]} onPress={handlePinAuth}>
                  <Text style={styles.buttonText}>حفظ الرمز المختار</Text>
                </TouchableOpacity>
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 15 }} />
              </View>
            )}

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
              placeholder="مثال: 192.168.100.2"
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
        )}
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
  pinTitle: { fontSize: 18, fontWeight: "bold", color: colors.text, textAlign: "center", marginBottom: 5 },
  hintText: { fontSize: 13, color: colors.subtext, textAlign: "center", marginBottom: 20 },
  pinInput: { fontSize: 22, textAlign: "center", letterSpacing: 8, paddingVertical: 10 },
  registerNotice: { backgroundColor: "#FFF3CD", padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: "#FFEBAA" },
  registerNoticeText: { color: "#856404", fontSize: 12, fontWeight: "bold", marginBottom: 8, textAlign: "right" }
});


