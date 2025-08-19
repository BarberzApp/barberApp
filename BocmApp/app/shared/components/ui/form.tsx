import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface FormProps {
  children: React.ReactNode;
  className?: string;
}

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FormMessageProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

const Form: React.FC<FormProps> = ({ children, className = '' }) => {
  return (
    <View style={tw`w-full space-y-4`}>
      {children}
    </View>
  );
};

const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  error,
  required = false,
  className = '',
}) => {
  return (
    <View style={tw`w-full space-y-2`}>
      {label && (
        <Text
          style={[
            tw`text-sm font-medium`,
            { color: theme.colors.foreground },
          ]}
        >
          {label}
          {required && (
            <Text style={{ color: theme.colors.destructive }}> *</Text>
          )}
        </Text>
      )}
      {children}
      {error && (
        <Text
          style={[
            tw`text-sm`,
            { color: theme.colors.destructive },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const FormMessage: React.FC<FormMessageProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const getMessageColor = () => {
    switch (variant) {
      case 'destructive':
        return theme.colors.destructive;
      default:
        return theme.colors.mutedForeground;
    }
  };

  return (
    <Text
      style={[
        tw`text-sm`,
        { color: getMessageColor() },
      ]}
    >
      {children}
    </Text>
  );
};

export { Form, FormField, FormMessage }; 