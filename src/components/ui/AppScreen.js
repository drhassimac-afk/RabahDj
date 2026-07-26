import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { V2_COLORS, V2_SPACING } from '../../theme/v2Theme';

export default function AppScreen({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  ...scrollProps
}) {
  return (
    <SafeAreaView
      style={[styles.safeArea, style]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style="light" />

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
          ]}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: V2_COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: V2_SPACING.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: V2_SPACING.lg,
    paddingBottom: V2_SPACING.huge,
  },
});
