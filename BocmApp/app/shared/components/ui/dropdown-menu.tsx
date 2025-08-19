import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ViewStyle, TextStyle, Pressable } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';
import { ChevronDown, Check } from 'lucide-react-native';

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuRadioItemProps {
  children: React.ReactNode;
  value: string;
  checked?: boolean;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuSeparatorProps {
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface DropdownMenuShortcutProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  open = false,
  onOpenChange,
  style,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(open);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <View style={[tw`w-full`, style]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as any, { 
              onPress: () => handleOpenChange(!isOpen) 
            });
          }
          if (child.type === DropdownMenuContent) {
            return React.cloneElement(child as any, { 
              isOpen,
              onOpenChange: handleOpenChange 
            });
          }
        }
        return child;
      })}
    </View>
  );
};

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps & { onPress?: () => void }> = ({ 
  children, 
  style,
  className,
  onPress
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        tw`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`,
        style
      ]} 
      activeOpacity={0.7}
    >
      {children}
      <ChevronDown size={16} color={theme.colors.mutedForeground} style={tw`ml-2`} />
    </TouchableOpacity>
  );
};

const DropdownMenuContent: React.FC<DropdownMenuContentProps & { isOpen?: boolean; onOpenChange?: (open: boolean) => void }> = ({ 
  children, 
  align = 'center',
  sideOffset = 4,
  style,
  className,
  isOpen = false,
  onOpenChange
}) => {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange?.(false)}
    >
      <Pressable 
        style={tw`flex-1`} 
        onPress={() => onOpenChange?.(false)}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          <View 
            style={[
              tw`rounded-md border bg-popover p-1 text-popover-foreground shadow-md`,
              { 
                backgroundColor: theme.colors.popover,
                borderColor: theme.colors.border,
              },
              style
            ]}
          >
            {children}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onPress,
  disabled = false,
  style,
  className 
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`,
        { backgroundColor: theme.colors.popover },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[tw`text-sm`, { color: theme.colors.popoverForeground }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({ 
  children, 
  checked = false,
  onCheckedChange,
  disabled = false,
  style,
  className 
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`,
        { backgroundColor: theme.colors.popover },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={tw`flex-row items-center`}>
        <View style={tw`mr-2`}>
          {checked && <Check size={16} color={theme.colors.popoverForeground} />}
        </View>
        <Text style={[tw`text-sm`, { color: theme.colors.popoverForeground }]}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({ 
  children, 
  value,
  checked = false,
  onValueChange,
  disabled = false,
  style,
  className 
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`,
        { backgroundColor: theme.colors.popover },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={() => onValueChange?.(value)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={tw`flex-row items-center`}>
        <View style={tw`mr-2`}>
          {checked && <Check size={16} color={theme.colors.popoverForeground} />}
        </View>
        <Text style={[tw`text-sm`, { color: theme.colors.popoverForeground }]}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <View style={[tw`px-2 py-1.5 text-sm font-semibold`, style]}>
      <Text style={[tw`text-sm font-semibold`, { color: theme.colors.foreground }]}>
        {children}
      </Text>
    </View>
  );
};

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  style,
  className 
}) => {
  return (
    <View 
      style={[
        tw`-mx-1 my-1 h-px`,
        { backgroundColor: theme.colors.border },
        style
      ]} 
    />
  );
};

const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <Text 
      style={[
        tw`ml-auto text-xs tracking-widest opacity-60`,
        { color: theme.colors.mutedForeground },
        style
      ]}
    >
      {children}
    </Text>
  );
};

export { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuCheckboxItem, 
  DropdownMenuRadioItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuShortcut 
}; 