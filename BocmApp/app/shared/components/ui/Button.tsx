import React from 'react';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  TextStyle,
  ViewStyle
} from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';
type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  onPress?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  size = 'default',
  variant = 'default',
  disabled = false,
  style,
  textStyle,
  className,
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3',
    default: 'h-10 px-4',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10'
  };

  const variantStyles: Record<ButtonVariant, any> = {
    default: { backgroundColor: theme.colors.primary },
    destructive: { backgroundColor: theme.colors.destructive },
    outline: { 
      borderWidth: 1, 
      borderColor: theme.colors.input, 
      backgroundColor: theme.colors.background 
    },
    secondary: { backgroundColor: theme.colors.secondary },
    ghost: { backgroundColor: 'transparent' },
    link: { backgroundColor: 'transparent' }
  };

  const textSizeStyles: Record<ButtonSize, number> = {
    sm: 14,
    default: 16,
    lg: 18,
    icon: 14
  };

  const textVariantStyles: Record<ButtonVariant, any> = {
    default: { color: theme.colors.primaryForeground },
    destructive: { color: theme.colors.destructiveForeground },
    outline: { color: theme.colors.foreground },
    secondary: { color: theme.colors.secondaryForeground },
    ghost: { color: theme.colors.foreground },
    link: { color: theme.colors.primary, textDecorationLine: 'underline' }
  };

  return (
    <TouchableOpacity
      style={[
        tw`${sizeStyles[size]} rounded-md flex-row items-center justify-center`,
        variantStyles[variant],
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            tw`font-medium text-center`,
            textVariantStyles[variant],
            { fontSize: textSizeStyles[size] },
            textStyle
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

export default Button;