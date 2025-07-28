import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface ToggleProps {
  children: React.ReactNode;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline';
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({ 
  children, 
  pressed = false,
  onPressedChange,
  disabled = false,
  size = 'default',
  variant = 'default',
  style,
  className 
}) => {
  const sizeStyles: Record<string, any> = {
    sm: { height: 36, paddingHorizontal: 10 },
    default: { height: 40, paddingHorizontal: 12 },
    lg: { height: 44, paddingHorizontal: 32 }
  };

  const variantStyles = {
    default: {
      backgroundColor: pressed ? theme.colors.accent : 'transparent',
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
      borderWidth: 1,
    }
  };

  return (
    <TouchableOpacity
      style={[
        tw`inline-flex items-center justify-center rounded-md text-sm font-medium`,
        sizeStyles[size],
        variantStyles[variant],
        pressed && { backgroundColor: theme.colors.accent },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={() => onPressedChange?.(!pressed)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

export { Toggle }; 