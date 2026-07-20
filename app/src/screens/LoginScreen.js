<View style={styles.inputGroup}>
    <Text style={styles.label}>عنوان IP السيرفر:</Text>
    <TextInput
      style={styles.input}
      placeholder="مثال: 192.168.1.5"
      placeholderTextColor="#64748b"
      value={ip}
      onChangeText={setIp}
      keyboardType="numeric"
      autoCapitalize="none"
    />
  </View>

  <View style={styles.inputGroup}>
    <Text style={styles.label}>اسم المستخدم:</Text>
    <TextInput
      style={styles.input}
      placeholder="ادخل اسمك هنا..."
      placeholderTextColor="#64748b"
      value={name}
      onChangeText={setName}
    />
  </View>

  <TouchableOpacity
    style={[styles.btn, loading && styles.btnDisabled]}
    onPress={handleConnect}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.btnText}>دخول والتوصيل</Text>
    )}
  </TouchableOpacity>
</View>
