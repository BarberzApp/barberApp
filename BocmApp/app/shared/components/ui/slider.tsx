import React, { useState } from 'react';
import { View, Text, ViewStyle, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface SliderTrackProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface SliderRangeProps {
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

interface SliderThumbProps {
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const Slider: React.FC<SliderProps> = ({ 
  value,
  defaultValue = [0],
  onValueChange,
  max = 100,
  min = 0,
  step = 1,
  disabled = false,
  style,
  className 
}) => {
  const [currentValue, setCurrentValue] = useState(value || defaultValue);

  const handlePress = (event: any) => {
    if (disabled) return;
    
    // Simple implementation - can be enhanced with proper gesture handling
    const newValue = Math.max(min, Math.min(max, currentValue[0] + step));
    const newValues = [newValue];
    setCurrentValue(newValues);
    onValueChange?.(newValues);
  };

  const percentage = ((currentValue[0] - min) / (max - min)) * 100;

  return (
    <View style={[tw`w-full`, style]}>
      <TouchableOpacity 
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={tw`relative w-full h-5`}>
          <View 
            style={[
              tw`w-full h-2 rounded-full`,
              { backgroundColor: theme.colors.muted }
            ]}
          >
            <View 
              style={[
                tw`h-full rounded-full`,
                { 
                  backgroundColor: theme.colors.primary,
                  width: `${percentage}%`
                }
              ]}
            />
          </View>
          <View 
            style={[
              tw`absolute top-1/2 w-4 h-4 rounded-full border-2`,
              { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.primary,
                left: `${percentage}%`,
                marginLeft: -8,
                marginTop: -8
              }
            ]}
          />
        </View>
      </TouchableOpacity>
      {disabled && <View style={tw`absolute inset-0 bg-gray-200 opacity-50 rounded-full`} />}
    </View>
  );
};

const SliderTrack: React.FC<SliderTrackProps> = ({ 
  children, 
  style,
  className 
}) => {
  return (
    <View 
      style={[
        tw`relative w-full h-2 rounded-full`,
        { backgroundColor: theme.colors.muted },
        style
      ]}
    >
      {children}
    </View>
  );
};

const SliderRange: React.FC<SliderRangeProps> = ({ 
  style,
  className 
}) => {
  return (
    <View 
      style={[
        tw`absolute h-full rounded-full`,
        { backgroundColor: theme.colors.primary },
        style
      ]}
    />
  );
};

const SliderThumb: React.FC<SliderThumbProps> = ({ 
  style,
  className 
}) => {
  return (
    <View 
      style={[
        tw`block w-4 h-4 rounded-full border-2`,
        { 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.primary
        },
        style
      ]}
    />
  );
};

export { Slider, SliderTrack, SliderRange, SliderThumb }; 