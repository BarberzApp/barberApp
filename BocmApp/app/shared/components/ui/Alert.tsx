import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

type AlertVariant = 'default' | 'destructive';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

const Alert: React.FC<AlertProps> = ({ children, variant = 'default', style, className }) => {
  const variantStyles: Record<AlertVariant, any> = {
    default: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
    },
    destructive: {
      backgroundColor: theme.colors.destructive,
      borderColor: theme.colors.destructive,
    }
  };

  return (
    <View
      style={[
        tw`relative w-full rounded-lg border p-4`,
        variantStyles[variant],
        style
      ]}
    >
      {children}
    </View>
  );
};

const AlertTitle: React.FC<AlertTitleProps> = ({ children, style }) => {
  return (
    <Text
      style={[
        tw`mb-1 font-medium leading-none tracking-tight`,
        { color: theme.colors.foreground },
        style
      ]}
    >
      {children}
    </Text>
  );
};

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, style }) => {
  return (
    <Text
      style={[
        tw`text-sm leading-relaxed`,
        { color: theme.colors.mutedForeground },
        style
      ]}
    >
      {children}
    </Text>
  );
};

export { Alert, AlertTitle, AlertDescription }; 