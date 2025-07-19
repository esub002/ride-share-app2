import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

export default function Button({
  title,
  onPress,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  style = {},
  textStyle = {},
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled ? styles.disabled : {},
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {icon && !iconRight && (
        <Ionicons name={icon} size={22} color={Colors.background} style={styles.iconLeft} />
      )}
      {loading ? (
        <ActivityIndicator color={Colors.background} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={[styles.text, textStyle]}>{title}</Text>
      {icon && iconRight && (
        <Ionicons name={icon} size={22} color={Colors.background} style={styles.iconRight} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a74e5', // Accessible primary
    borderRadius: Spacing.borderRadius,
    height: Spacing.buttonHeight,
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    shadowColor: '#3a74e5',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    color: '#aeb4cf', // Accessible text
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: 'Poppins_700Bold',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    backgroundColor: '#5c6680', // Accessible disabled
  },
}); 