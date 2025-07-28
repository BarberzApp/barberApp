import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ViewStyle, Pressable } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface PopoverContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ 
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
          if (child.type === PopoverTrigger) {
            return React.cloneElement(child as any, { 
              onPress: () => handleOpenChange(!isOpen) 
            });
          }
          if (child.type === PopoverContent) {
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

const PopoverTrigger: React.FC<PopoverTriggerProps & { onPress?: () => void }> = ({ 
  children, 
  style,
  className,
  onPress
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
};

const PopoverContent: React.FC<PopoverContentProps & { isOpen?: boolean; onOpenChange?: (open: boolean) => void }> = ({ 
  children, 
  align = 'center',
  side = 'bottom',
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
              tw`rounded-md border bg-popover p-4 text-popover-foreground shadow-md`,
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

export { Popover, PopoverTrigger, PopoverContent }; 