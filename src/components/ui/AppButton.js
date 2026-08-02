import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  V2_COLORS,
  V2_RADIUS,
  V2_SPACING,
} from '../../theme/v2Theme';

export default function AppButton({ ...props }) {
  const isDisabled = props.disabled || props.loading;

  const handlePress = () => {
    console.log("تم النقر على الزر! الحالة:", { 
        disabled: props.disabled, 
        loading: props.loading 
    });
    
    if (props.onPress) {
        props.onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={isDisabled}
      onPress={handlePress} // استبدلنا onPress بـ handlePress
      style={[...]}
    >
      ...
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: V2_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: V2_SPACING.xl,
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: V2_SPACING.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
  },
  primary: {
    backgroundColor: V2_COLORS.primary,
  },
  secondary: {
    backgroundColor: V2_COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: V2_COLORS.border,
  },
  success: {
    backgroundColor: V2_COLORS.accent,
  },
  danger: {
    backgroundColor: V2_COLORS.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  primaryText: {
    color: V2_COLORS.background,
  },
  secondaryText: {
    color: V2_COLORS.text,
  },
  ghostText: {
    color: V2_COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
