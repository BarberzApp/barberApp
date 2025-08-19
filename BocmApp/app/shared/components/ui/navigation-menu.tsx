import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface NavigationMenuProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface NavigationMenuListProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface NavigationMenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  style?: any;
}

interface NavigationMenuTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: any;
}

interface NavigationMenuContentProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function NavigationMenu({ 
  children, 
  className,
  style 
}: NavigationMenuProps) {
  return (
    <View style={[tw`relative`, style]}>
      {children}
    </View>
  );
}

export function NavigationMenuList({ 
  children, 
  className,
  style 
}: NavigationMenuListProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[tw`flex-row`, style]}
      contentContainerStyle={tw`px-2`}
    >
      {children}
    </ScrollView>
  );
}

export function NavigationMenuItem({ 
  children, 
  onPress,
  active = false,
  disabled = false,
  className,
  style 
}: NavigationMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        tw`px-3 py-2 rounded-md`,
        active 
          ? { backgroundColor: theme.colors.primary }
          : { backgroundColor: 'transparent' },
        disabled && { opacity: 0.5 },
        style
      ]}
    >
      <Text style={[
        tw`text-sm font-medium`,
        active 
          ? { color: theme.colors.primaryForeground }
          : { color: theme.colors.foreground }
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function NavigationMenuTrigger({ 
  children, 
  onPress,
  className,
  style 
}: NavigationMenuTriggerProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`px-3 py-2 rounded-md flex-row items-center`,
        { backgroundColor: 'transparent' },
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

export function NavigationMenuContent({ 
  children, 
  className,
  style 
}: NavigationMenuContentProps) {
  return (
    <View style={[
      tw`absolute top-full left-0 mt-1 p-2 rounded-md border`,
      { 
        backgroundColor: theme.colors.popover,
        borderColor: theme.colors.border 
      },
      style
    ]}>
      {children}
    </View>
  );
} 