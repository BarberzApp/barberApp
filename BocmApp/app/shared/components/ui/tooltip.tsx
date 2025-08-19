import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  style?: any;
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top',
  className,
  style 
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const showTooltip = () => {
    setVisible(true);
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  const getTooltipStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: theme.colors.popover,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 1000,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: tooltipPosition.y + 10,
          left: tooltipPosition.x,
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: tooltipPosition.y + 10,
          left: tooltipPosition.x,
        };
      case 'left':
        return {
          ...baseStyle,
          right: tooltipPosition.x + 10,
          top: tooltipPosition.y,
        };
      case 'right':
        return {
          ...baseStyle,
          left: tooltipPosition.x + 10,
          top: tooltipPosition.y,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[tw`relative`, style]}>
      <TouchableOpacity
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          setTooltipPosition({ 
            x: x + width / 2, 
            y: y + height / 2 
          });
        }}
      >
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideTooltip}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          <View style={getTooltipStyle()}>
            <Text style={[
              tw`text-sm`,
              { color: theme.colors.popoverForeground }
            ]}>
              {content}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Simple tooltip provider for managing multiple tooltips
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <View style={tw`flex-1`}>{children}</View>;
} 