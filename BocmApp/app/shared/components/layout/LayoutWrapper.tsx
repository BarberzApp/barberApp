import React from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface LayoutWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showTabBar?: boolean;
}

export function LayoutWrapper({ children, showHeader = true, showTabBar = true }: LayoutWrapperProps) {
  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <View style={tw`flex-1`}>
        {children}
      </View>
    </SafeAreaView>
  );
} 