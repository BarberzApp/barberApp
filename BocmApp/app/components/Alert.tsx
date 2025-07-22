import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import tw from 'twrnc';

type AlertVariant = 'default' | 'destructive';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  style?: ViewStyle | ViewStyle[];
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const Alert: React.FC<AlertProps> = ({ children, variant = 'default', style }) => {
  const variantStyles: Record<AlertVariant, string> = {
    default: 'border-[#e5e7eb] bg-white text-[#262b2e]',
    destructive: 'border-[#ff4d4f] bg-[#ff4d4f]/10 text-[#ff4d4f]'
  };

  return (
    <View
      style={[
        tw`relative w-full rounded-lg border p-4 ${variantStyles[variant]}`,
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
        style
      ]}
    >
      {children}
    </Text>
  );
};

export { Alert, AlertTitle, AlertDescription }; 