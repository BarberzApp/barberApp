import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  TouchableOpacityProps,
  TextStyle,
  ViewStyle 
} from 'react-native';
import tw from 'twrnc';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  onPress?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  size = 'md',
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4'
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-purple-600',
    secondary: 'bg-gray-700',
    outline: 'border-2 border-purple-600 bg-transparent'
  };

  const textSizeStyles: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const textVariantStyles: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-purple-600'
  };

  return (
    <TouchableOpacity
      style={[
        tw`${sizeStyles[size]} ${variantStyles[variant]} rounded-lg`,
        disabled && tw`opacity-50`,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Text
        style={[
          tw`${textSizeStyles[size]} ${textVariantStyles[variant]} font-semibold text-center`,
          textStyle
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;