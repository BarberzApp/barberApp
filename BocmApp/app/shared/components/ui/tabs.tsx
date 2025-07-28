import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ 
  children, 
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  style,
  className 
}) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');

  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <View style={[tw`w-full`, style]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === TabsList) {
            return React.cloneElement(child as any, { 
              activeTab,
              onValueChange: handleValueChange 
            });
          }
          if (child.type === TabsContent) {
            return React.cloneElement(child as any, { 
              activeTab 
            });
          }
        }
        return child;
      })}
    </View>
  );
};

const TabsList: React.FC<TabsListProps & { activeTab?: string; onValueChange?: (value: string) => void }> = ({ 
  children, 
  style,
  className,
  activeTab,
  onValueChange
}) => {
  return (
    <View 
      style={[
        tw`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground`,
        { backgroundColor: theme.colors.muted },
        style
      ]}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          return React.cloneElement(child as any, { 
            activeTab,
            onValueChange 
          });
        }
        return child;
      })}
    </View>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps & { activeTab?: string; onValueChange?: (value: string) => void }> = ({ 
  value,
  children, 
  disabled = false,
  style,
  className,
  activeTab,
  onValueChange
}) => {
  const isActive = activeTab === value;

  return (
    <TouchableOpacity
      style={[
        tw`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`,
        isActive ? {
          backgroundColor: theme.colors.background,
          color: theme.colors.foreground,
        } : {
          backgroundColor: 'transparent',
          color: theme.colors.mutedForeground,
        },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={() => onValueChange?.(value)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          tw`text-sm font-medium`,
          { 
            color: isActive ? theme.colors.foreground : theme.colors.mutedForeground 
          }
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const TabsContent: React.FC<TabsContentProps & { activeTab?: string }> = ({ 
  value,
  children, 
  style,
  className,
  activeTab
}) => {
  const isActive = activeTab === value;

  if (!isActive) {
    return null;
  }

  return (
    <View 
      style={[
        tw`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`,
        style
      ]}
    >
      {children}
    </View>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }; 