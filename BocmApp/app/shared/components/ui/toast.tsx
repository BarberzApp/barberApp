import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Check, X, AlertCircle, Info } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  action,
  variant = 'default',
  onClose,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          container: { backgroundColor: theme.colors.destructive },
          text: { color: theme.colors.destructiveForeground },
        };
      case 'success':
        return {
          container: { backgroundColor: '#10b981' },
          text: { color: '#ffffff' },
        };
      case 'warning':
        return {
          container: { backgroundColor: '#f59e0b' },
          text: { color: '#ffffff' },
        };
      default:
        return {
          container: { backgroundColor: theme.colors.background },
          text: { color: theme.colors.foreground },
        };
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <X size={16} color={theme.colors.destructiveForeground} />;
      case 'success':
        return <Check size={16} color="#ffffff" />;
      case 'warning':
        return <AlertCircle size={16} color="#ffffff" />;
      default:
        return <Info size={16} color={theme.colors.foreground} />;
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        tw`flex-row items-center p-4 rounded-lg shadow-lg border`,
        variantStyles.container,
        { borderColor: theme.colors.border },
      ]}
    >
      <View style={tw`mr-3`}>
        {getIcon()}
      </View>
      
      <View style={tw`flex-1`}>
        {title && (
          <Text
            style={[
              tw`font-semibold text-sm mb-1`,
              variantStyles.text,
            ]}
          >
            {title}
          </Text>
        )}
        {description && (
          <Text
            style={[
              tw`text-sm`,
              variantStyles.text,
              { opacity: 0.8 },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={tw`ml-3`}
        >
          <Text
            style={[
              tw`text-sm font-medium`,
              variantStyles.text,
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}

      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={tw`ml-3`}
        >
          <X size={16} color={variantStyles.text.color} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Toast; 