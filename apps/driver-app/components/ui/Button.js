import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius, Shadows } from '../../constants/Spacing';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.base];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.small);
        break;
      case 'large':
        baseStyle.push(styles.large);
        break;
      default:
        baseStyle.push(styles.medium);
    }
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      case 'danger':
        baseStyle.push(styles.danger);
        break;
      case 'success':
        baseStyle.push(styles.success);
        break;
      default:
        baseStyle.push(styles.primary);
    }
    
    // Disabled state
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text];
    
    // Size text styles
    switch (size) {
      case 'small':
        baseTextStyle.push(styles.textSmall);
        break;
      case 'large':
        baseTextStyle.push(styles.textLarge);
        break;
      default:
        baseTextStyle.push(styles.textMedium);
    }
    
    // Variant text styles
    switch (variant) {
      case 'outline':
        baseTextStyle.push(styles.textOutline);
        break;
      case 'ghost':
        baseTextStyle.push(styles.textGhost);
        break;
      case 'danger':
        baseTextStyle.push(styles.textDanger);
        break;
      case 'success':
        baseTextStyle.push(styles.textSuccess);
        break;
      default:
        baseTextStyle.push(styles.textPrimary);
    }
    
    // Disabled text style
    if (disabled || loading) {
      baseTextStyle.push(styles.textDisabled);
    }
    
    return baseTextStyle;
  };

  const getIconColor = () => {
    if (disabled || loading) return Colors.light.textTertiary;
    
    switch (variant) {
      case 'outline':
        return Colors.light.primary;
      case 'ghost':
        return Colors.light.primary;
      case 'danger':
        return Colors.light.error;
      case 'success':
        return Colors.light.success;
      default:
        return Colors.light.textInverse;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.contentContainer}>
          <ActivityIndicator 
            size="small" 
            color={getIconColor()} 
            style={styles.loadingIcon}
          />
          <Text style={getTextStyle()}>Loading...</Text>
        </View>
      );
    }

    if (children) {
      return children;
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && (
          <Ionicons 
            name={icon} 
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            color={getIconColor()} 
            style={styles.leftIcon}
          />
        )}
        <Text style={getTextStyle()}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <Ionicons 
            name={icon} 
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
            color={getIconColor()} 
            style={styles.rightIcon}
          />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Shadows.sm,
  },
  
  // Size variants
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    minHeight: 36,
  },
  medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 44,
  },
  large: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    minHeight: 52,
  },
  
  // Variant styles
  primary: {
    backgroundColor: '#3a74e5', // Accessible primary
  },
  secondary: {
    backgroundColor: '#0c1037', // Accessible background
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a74e5', // Accessible outline
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.light.error,
  },
  success: {
    backgroundColor: Colors.light.success,
  },
  disabled: {
    backgroundColor: '#5c6680', // Accessible disabled
    ...Shadows.none,
  },
  
  // Content container
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Icon styles
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  loadingIcon: {
    marginRight: 8,
  },
  
  // Text styles
  text: {
    color: '#aeb4cf', // Accessible text
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: Typography.fontFamily || undefined,
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  
  // Text color variants
  textPrimary: {
    color: '#aeb4cf', // Accessible text
  },
  textSecondary: {
    color: Colors.light.text,
  },
  textOutline: {
    color: '#3a74e5', // Outline text
  },
  textGhost: {
    color: '#3a74e5',
  },
  textDanger: {
    color: Colors.light.error,
  },
  textSuccess: {
    color: Colors.light.success,
  },
  textDisabled: {
    color: '#5c6680', // Accessible disabled text
  },
});

export default Button; 