import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  TouchableOpacityProps,
  TextStyle,
  ViewStyle 
} from 'react-native';
import tw from 'twrnc';

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
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  size = 'default',
  variant = 'default',
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 rounded-md',
    default: 'h-10 px-4 py-2 rounded-md',
    lg: 'h-11 px-8 rounded-full', // slightly shorter
    icon: 'h-10 w-10 rounded-md'
  };

  const variantStyles: Record<ButtonVariant, string> = {
    default: 'bg-[#262b2e]',
    destructive: 'bg-[#ff4d4f]',
    outline: 'border border-[#e5e7eb] bg-transparent',
    secondary: 'bg-[#c98f42]',
    ghost: 'bg-transparent',
    link: 'bg-transparent'
  };

  const textSizeStyles: Record<ButtonSize, string> = {
    sm: 'text-sm',
    default: 'text-sm',
    lg: 'text-base', // fontSize 18 for lg
    icon: 'text-sm'
  };

  const textVariantStyles: Record<ButtonVariant, string> = {
    default: 'text-white',
    destructive: 'text-white',
    outline: 'text-[#262b2e]',
    secondary: 'text-[#262b2e]',
    ghost: 'text-[#262b2e]',
    link: 'text-[#262b2e] underline'
  };

  return (
    <TouchableOpacity
      style={[
        tw`${sizeStyles[size]} ${variantStyles[variant]} flex-row items-center justify-center`,
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
          tw`${textSizeStyles[size]} ${textVariantStyles[variant]} font-bold text-center`,
          { fontFamily: 'BebasNeue', fontSize: size === 'lg' ? 18 : undefined },
          textStyle
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;