import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';
import { ChevronDown } from 'lucide-react-native';

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({ 
  children, 
  type = 'single', 
  collapsible = false,
  style,
  className 
}) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (value: string) => {
    if (type === 'single') {
      if (openItems.includes(value)) {
        if (collapsible) {
          setOpenItems([]);
        }
      } else {
        setOpenItems([value]);
      }
    } else {
      if (openItems.includes(value)) {
        setOpenItems(openItems.filter(item => item !== value));
      } else {
        setOpenItems([...openItems, value]);
      }
    }
  };

  const isOpen = (value: string) => openItems.includes(value);

  return (
    <View style={[tw`w-full`, style]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          return React.cloneElement(child as any, {
            isOpen: isOpen((child.props as any).value),
            onToggle: () => toggleItem((child.props as any).value),
          });
        }
        return child;
      })}
    </View>
  );
};

const AccordionItem: React.FC<AccordionItemProps & { isOpen?: boolean; onToggle?: () => void }> = ({ 
  children, 
  style,
  className,
  isOpen = false,
  onToggle
}) => {
  return (
    <View style={[tw`border-b`, { borderColor: theme.colors.border }, style]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === AccordionTrigger) {
            return React.cloneElement(child as any, { isOpen, onToggle });
          }
          if (child.type === AccordionContent) {
            return React.cloneElement(child as any, { isOpen });
          }
        }
        return child;
      })}
    </View>
  );
};

const AccordionTrigger: React.FC<AccordionTriggerProps & { isOpen?: boolean; onToggle?: () => void }> = ({ 
  children, 
  style,
  className,
  isOpen = false,
  onToggle
}) => {
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      style={[
        tw`flex flex-row items-center justify-between py-4 px-6`,
        { backgroundColor: theme.colors.background },
        style
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={tw`flex-1`}>
        {children}
      </View>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <ChevronDown size={16} color={theme.colors.mutedForeground} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const AccordionContent: React.FC<AccordionContentProps & { isOpen?: boolean }> = ({ 
  children, 
  style,
  className,
  isOpen = false 
}) => {
  const heightAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  return (
    <Animated.View
      style={[
        tw`overflow-hidden`,
        {
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
        },
        style
      ]}
    >
      <View style={tw`px-6 pb-4`}>
        {children}
      </View>
    </Animated.View>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }; 