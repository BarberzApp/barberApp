import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', style, className }) => {
  const variantStyles: Record<BadgeVariant, any> = {
    default: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
    },
    destructive: {
      backgroundColor: theme.colors.destructive,
      borderColor: theme.colors.destructive,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    }
  };

  const textStyles: Record<BadgeVariant, any> = {
    default: { color: theme.colors.primaryForeground },
    secondary: { color: theme.colors.secondaryForeground },
    destructive: { color: theme.colors.destructiveForeground },
    outline: { color: theme.colors.foreground }
  };

  return (
    <View
      style={[
        tw`inline-flex items-center rounded-full border px-2.5 py-0.5`,
        variantStyles[variant],
        style
      ]}
    >
      <Text
        style={[
          tw`text-xs font-semibold`,
          textStyles[variant],
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

export default Badge; 