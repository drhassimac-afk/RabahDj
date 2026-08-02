import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getSocket,
  setAdminToken,
} from '../../api/socket';

const { width } = Dimensions.get('window');

const C = {
  bg: '#0B1120',
  surface: '#161F2E',
  border: '#243044',
  primary: '#3B82F6',
  text: '#FFFFFF',
  sub: '#94A3B8',
  danger: '#EF4444',
  gold: '#FACC15',
};

const KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'del', '0', 'ok',
];

const PIN_LENGTH = 4;

const KEY_SIZE = Math.min(
  82,
  Math.max(66, Math.floor((width - 105) / 3))
);

export default function V2AdminLoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockLeft, setLockLeft] = useState(0);

  const shake = useRef(
    new Animated.Value(0)
  ).current;

  const socketRef = useRef(getSocket());
  const timerRef = useRef(null);

  const doShake = () => {
    Vibration.vibrate(120);

    Animated.sequence([
      Animated.timing(shake, {
        toValue: 12,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -12,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showError = (message) => {
    clearTimer();
    setBusy(false);
    setPin('');
    setError(message);
    doShake();
  };

  useEffect(() => {
    const socket = socketRef.current;

    const onResult = (result) => {
      clearTimer();
      setBusy(false);

      if (result && result.ok) {
        setAdminToken(result.token);
        Vibration.vibrate(40);
        navigation.replace('V2AdminPanelScreen');
        return;
      }

      if (result && result.locked) {
        setLockLeft(result.wait || 300);
        setError('محاولات كثيرة، انتظر قليلاً');
        setPin('');
        doShake();
        return;
      }

      setError('الرمز غير صحيح');
      setPin('');
      doShake();
    };

    socket.on('admin_login_result', onResult);

    return () => {
      clearTimer();
      socket.off('admin_login_result', onResult);
    };
  }, [navigation]);

  useEffect(() => {
    if (lockLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setLockLeft((value) => {
        if (value <= 1) {
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockLeft]);

  const submit = (code) => {
    if (busy || lockLeft > 0) {
      return;
    }

    if (!code || code.length !== PIN_LENGTH) {
      setError('أدخل الرمز المكوّن من 4 أرقام');
      doShake();
      return;
    }

    const socket = socketRef.current;

    setBusy(true);
    setError('');

    const sendLogin = () => {
      clearTimer();

      socket.emit('admin_login', {
        pin: code,
      });

      timerRef.current = setTimeout(() => {
        showError(
          'لا توجد استجابة من السيرفر. تأكد من اتصال السيرفر.'
        );
      }, 7000);
    };

    if (socket.connected) {
      sendLogin();
      return;
    }

    setError('جاري الاتصال بالسيرفر...');

    const onConnect = () => {
      socket.off('connect_error', onConnectError);
      sendLogin();
    };

    const onConnectError = () => {
      socket.off('connect', onConnect);
      showError(
        'تعذر الاتصال بالسيرفر المحلي'
      );
    };

    socket.once('connect', onConnect);
    socket.once('connect_error', onConnectError);

    timerRef.current = setTimeout(() => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);

      showError(
        'انتهت مهلة الاتصال بالسيرفر'
      );
    }, 7000);

    try {
      socket.connect();
    } catch (error) {
      showError(
        'تعذر تشغيل الاتصال بالسيرفر'
      );
    }
  };

  const pressKey = (key) => {
    if (busy || lockLeft > 0) {
      return;
    }

    if (key === 'del') {
      setPin((value) => value.slice(0, -1));
      setError('');
      return;
    }

    if (key === 'ok') {
      submit(pin);
      return;
    }

    if (pin.length >= PIN_LENGTH) {
      return;
    }

    setPin((value) => value + key);
    setError('');
  };

  const timeText =
    String(Math.floor(lockLeft / 60)).padStart(2, '0') +
    ':' +
    String(lockLeft % 60).padStart(2, '0');

  return (
    <View style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 5,
            paddingBottom: insets.bottom + 35,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.back}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('V2WelcomeScreen');
            }
          }}
        >
          <Ionicons
            name="arrow-forward"
            size={32}
            color={C.sub}
          />
        </TouchableOpacity>

        <View style={styles.top}>
          <View style={styles.shield}>
            <Ionicons
              name="shield-checkmark"
              size={52}
              color={C.gold}
            />
          </View>

          <Text style={styles.title}>
            لوحة الإدارة
          </Text>

          <Text style={styles.sub}>
            أدخل رمز الدخول المكوّن من 4 أرقام
          </Text>

          <Animated.View
            style={[
              styles.dots,
              {
                transform: [
                  {
                    translateX: shake,
                  },
                ],
              },
            ]}
          >
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index < pin.length &&
                    styles.activeDot,
                  error &&
                    styles.errorDot,
                ]}
              />
            ))}
          </Animated.View>

          <Text
            style={[
              styles.message,
              lockLeft > 0 && styles.lockMessage,
            ]}
          >
            {lockLeft > 0
              ? `🔒 محظور — ${timeText}`
              : error || ' '}
          </Text>
        </View>

        <View style={styles.pad}>
          {KEYS.map((key) => {
            const isAction =
              key === 'ok' || key === 'del';

            const ready =
              key === 'ok' &&
              pin.length === PIN_LENGTH &&
              !busy;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                disabled={busy || lockLeft > 0}
                onPress={() => pressKey(key)}
                style={[
                  styles.key,
                  isAction && styles.actionKey,
                  ready && styles.readyKey,
                ]}
              >
                {key === 'del' ? (
                  <Ionicons
                    name="backspace-outline"
                    size={32}
                    color={C.sub}
                  />
                ) : key === 'ok' ? (
                  <Ionicons
                    name="checkmark"
                    size={38}
                    color={
                      ready ? '#FFFFFF' : C.border
                    }
                  />
                ) : (
                  <Text style={styles.keyText}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>
          الرمز الافتراضي 1234 — غيّره فور الدخول
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  back: {
    alignSelf: 'flex-end',
    padding: 8,
  },

  top: {
    alignItems: 'center',
    marginTop: 8,
  },

  shield: {
    width: 105,
    height: 105,
    borderRadius: 30,
    backgroundColor: '#2A2410',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  sub: {
    color: C.sub,
    fontSize: 15,
    marginTop: 7,
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row',
    marginTop: 28,
  },

  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.border,
    marginHorizontal: 9,
  },

  activeDot: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },

  errorDot: {
    borderColor: C.danger,
  },

  message: {
    color: C.danger,
    fontSize: 13,
    marginTop: 14,
    height: 22,
    fontWeight: '600',
    textAlign: 'center',
  },

  lockMessage: {
    color: C.gold,
  },

  pad: {
    width: '100%',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 18,
  },

  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    margin: 7,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },

  readyKey: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },

  keyText: {
    color: C.text,
    fontSize: 29,
    fontWeight: '700',
  },

  hint: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
