import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import tw from 'twrnc';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle | ViewStyle[];
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', style }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#262b2e] text-white',
    secondary: 'bg-[#f5f5f5] text-[#262b2e]',
    destructive: 'bg-[#ff4d4f] text-white',
    outline: 'border border-[#e5e7eb] text-[#262b2e]'
  };

  return (
    <View
      style={[
        tw`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles[variant]}`,
        style
      ]}
    >
      <Text
        style={[
          tw`text-xs font-semibold`,
          variant === 'default' && tw`text-white`,
          variant === 'secondary' && tw`text-[#262b2e]`,
          variant === 'destructive' && tw`text-white`,
          variant === 'outline' && tw`text-[#262b2e]`
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

export default Badge; 