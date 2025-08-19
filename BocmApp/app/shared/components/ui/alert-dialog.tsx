import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ViewStyle, TextStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';
import { AlertTriangle, X } from 'lucide-react-native';

interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertDialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  className?: string;
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  className?: string;
}

interface AlertDialogActionProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AlertDialogCancelProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ 
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
          if (child.type === AlertDialogTrigger) {
            return React.cloneElement(child as any, { 
              onPress: () => handleOpenChange(true) 
            });
          }
          if (child.type === AlertDialogContent) {
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

const AlertDialogTrigger: React.FC<AlertDialogTriggerProps & { onPress?: () => void }> = ({ 
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

const AlertDialogContent: React.FC<AlertDialogContentProps & { isOpen?: boolean; onOpenChange?: (open: boolean) => void }> = ({ 
  children, 
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
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View 
          style={[
            tw`bg-white rounded-lg p-6 m-4 w-80 max-w-sm`,
            { backgroundColor: theme.colors.background },
            style
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
};

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <View style={[tw`flex flex-col space-y-2 text-center sm:text-left`, style]}>
      {children}
    </View>
  );
};

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <View style={[tw`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`, style]}>
      {children}
    </View>
  );
};

const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <Text
      style={[
        tw`text-lg font-semibold`,
        { color: theme.colors.foreground },
        style
      ]}
    >
      {children}
    </Text>
  );
};

const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <Text
      style={[
        tw`text-sm`,
        { color: theme.colors.mutedForeground },
        style
      ]}
    >
      {children}
    </Text>
  );
};

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ 
  children, 
  onPress,
  style,
  className 
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`,
        { backgroundColor: theme.colors.primary },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[tw`font-semibold`, { color: theme.colors.primaryForeground }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ 
  children, 
  onPress,
  style,
  className 
}) => {
  return (
    <TouchableOpacity
      style={[
        tw`inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`,
        { 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.input 
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[tw`font-semibold`, { color: theme.colors.foreground }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogFooter, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogAction, 
  AlertDialogCancel 
}; 