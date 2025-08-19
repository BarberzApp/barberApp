import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Circle } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface RadioGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioGroupOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onValueChange,
  disabled = false,
  className = '',
}) => {
  return (
    <View style={tw`w-full`}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            tw`flex-row items-center py-2`,
            { opacity: (disabled || option.disabled) ? 0.5 : 1 },
          ]}
          onPress={() => {
            if (!disabled && !option.disabled && onValueChange) {
              onValueChange(option.value);
            }
          }}
          disabled={disabled || option.disabled}
        >
          <View style={tw`mr-3`}>
            {value === option.value ? (
              <View
                style={[
                  tw`w-4 h-4 rounded-full items-center justify-center`,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Circle
                  size={8}
                  color={theme.colors.primaryForeground}
                  fill={theme.colors.primaryForeground}
                />
              </View>
            ) : (
              <View
                style={[
                  tw`w-4 h-4 rounded-full border-2`,
                  { borderColor: theme.colors.border },
                ]}
              />
            )}
          </View>
          <Text
            style={[
              tw`text-base`,
              { color: theme.colors.foreground },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default RadioGroup; 