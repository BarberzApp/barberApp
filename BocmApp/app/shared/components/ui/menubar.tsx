import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface MenubarProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface MenubarItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  style?: any;
}

export function Menubar({ 
  children, 
  className,
  style 
}: MenubarProps) {
  return (
    <View style={[
      tw`flex-row items-center px-2 py-1 rounded-md`,
      { backgroundColor: theme.colors.muted },
      style
    ]}>
      {children}
    </View>
  );
}

export function MenubarItem({ 
  children, 
  onPress,
  disabled = false,
  className,
  style 
}: MenubarItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        tw`px-3 py-2 rounded-sm`,
        disabled 
          ? { opacity: 0.5 }
          : { backgroundColor: 'transparent' },
        style
      ]}
    >
      <Text style={[
        tw`text-sm font-medium`,
        { color: theme.colors.foreground }
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

interface MenubarSeparatorProps {
  className?: string;
  style?: any;
}

export function MenubarSeparator({ 
  className,
  style 
}: MenubarSeparatorProps) {
  return (
    <View style={[
      tw`w-px h-4 mx-1`,
      { backgroundColor: theme.colors.border },
      style
    ]} />
  );
} 