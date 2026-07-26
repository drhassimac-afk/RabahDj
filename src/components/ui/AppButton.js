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

export default function AppButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    success: styles.success,
    danger: styles.danger,
    ghost: styles.ghost,
  }[variant] || styles.primary;

  const labelStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    success: styles.primaryText,
    danger: styles.primaryText,
    ghost: styles.ghostText,
  }[variant] || styles.primaryText;

  const iconColor = variant === 'secondary' || variant === 'ghost'
    ? V2_COLORS.text
    : V2_COLORS.background;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        variantStyle,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={19} color={iconColor} />
          ) : null}

          <Text style={[styles.text, labelStyle, textStyle]}>
            {title}
          </Text>
        </View>
      )}
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
