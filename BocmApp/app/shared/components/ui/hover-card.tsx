import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface HoverCardProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
  style?: any;
}

export function HoverCard({ 
  children, 
  trigger, 
  className,
  style 
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openCard = () => setIsOpen(true);
  const closeCard = () => setIsOpen(false);

  return (
    <View style={[tw`relative`, style]}>
      <TouchableOpacity onPress={openCard}>
        {trigger}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={closeCard}
      >
        <TouchableOpacity 
          style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}
          onPress={closeCard}
          activeOpacity={1}
        >
          <View 
            style={[
              tw`bg-white rounded-lg p-4 m-4 max-w-sm`,
              { backgroundColor: theme.colors.card }
            ]}
            onStartShouldSetResponder={() => true}
          >
            {children}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

interface HoverCardTriggerProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function HoverCardTrigger({ 
  children, 
  className,
  style 
}: HoverCardTriggerProps) {
  return (
    <View style={[tw`cursor-pointer`, style]}>
      {children}
    </View>
  );
}

interface HoverCardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function HoverCardContent({ 
  children, 
  className,
  style 
}: HoverCardContentProps) {
  return (
    <View style={[tw`p-4`, style]}>
      {children}
    </View>
  );
} 