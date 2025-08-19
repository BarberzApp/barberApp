import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  style?: any;
  isSelected?: boolean;
  onPress?: () => void;
}

export function ToggleGroup({ 
  value, 
  onValueChange, 
  children, 
  className,
  style 
}: ToggleGroupProps) {
  return (
    <View style={[
      tw`flex-row rounded-lg border border-gray-200`,
      { backgroundColor: theme.colors.background },
      style
    ]}>
      {children}
    </View>
  );
}

export function ToggleGroupItem({ 
  value, 
  children, 
  isSelected = false, 
  onPress,
  className,
  style 
}: ToggleGroupItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`flex-1 px-3 py-2 rounded-md`,
        isSelected 
          ? { backgroundColor: theme.colors.primary }
          : { backgroundColor: 'transparent' },
        style
      ]}
    >
      <Text style={[
        tw`text-sm font-medium text-center`,
        isSelected 
          ? { color: theme.colors.primaryForeground }
          : { color: theme.colors.foreground }
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
} 