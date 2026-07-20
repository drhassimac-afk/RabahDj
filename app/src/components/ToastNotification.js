import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ToastNotification({ message, icon = "notifications-outline", visible, onDismiss }) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
        bounciness: 8,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onDismiss) onDismiss();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible && translateY._value === -100) return null;

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <Ionicons name={icon} size={20} color="#00ffcc" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#00ffcc',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
});
