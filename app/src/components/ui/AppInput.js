import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import {
  V2_COLORS,
  V2_RADIUS,
  V2_SPACING,
} from '../../theme/v2Theme';

export default function AppInput({
  label,
  error,
  style,
  inputStyle,
  ...props
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        placeholderTextColor={V2_COLORS.textDim}
        style={[
          styles.input,
          error && styles.inputError,
          inputStyle,
        ]}
        textAlign="right"
        {...props}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    color: V2_COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: V2_SPACING.sm,
  },
  input: {
    minHeight: 52,
    backgroundColor: V2_COLORS.surfaceDark,
    borderColor: V2_COLORS.border,
    borderWidth: 1,
    borderRadius: V2_RADIUS.lg,
    color: V2_COLORS.text,
    paddingHorizontal: V2_SPACING.lg,
    fontSize: 15,
  },
  inputError: {
    borderColor: V2_COLORS.danger,
  },
  error: {
    color: V2_COLORS.danger,
    textAlign: 'right',
    marginTop: V2_SPACING.xs,
    fontSize: 12,
  },
});
