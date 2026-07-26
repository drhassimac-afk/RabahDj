import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  V2_COLORS,
  V2_RADIUS,
  V2_SPACING,
  V2_SHADOWS,
} from '../../theme/v2Theme';

export default function AppCard({
  children,
  style,
  onPress,
  disabled = false,
  ...props
}) {
  const cardStyle = [
    styles.card,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        disabled={disabled}
        onPress={onPress}
        style={cardStyle}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: V2_COLORS.surface,
    borderWidth: 1,
    borderColor: V2_COLORS.borderSoft,
    borderRadius: V2_RADIUS.xl,
    padding: V2_SPACING.lg,
    ...V2_SHADOWS.card,
  },
  disabled: {
    opacity: 0.55,
  },
});
