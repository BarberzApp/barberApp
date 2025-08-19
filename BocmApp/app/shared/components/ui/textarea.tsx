import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  placeholder,
  value,
  onChangeText,
  disabled = false,
  className = '',
  rows = 4,
  maxLength,
  error,
}) => {
  const minHeight = rows * 20; // Approximate height per row

  return (
    <View style={tw`w-full`}>
      <TextInput
        style={[
          tw`w-full px-3 py-2 rounded-md border text-base`,
          {
            backgroundColor: theme.colors.background,
            color: theme.colors.foreground,
            borderColor: error ? theme.colors.destructive : theme.colors.border,
            minHeight,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
      />
      {error && (
        <Text
          style={[
            tw`text-sm mt-1`,
            { color: theme.colors.destructive },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Textarea; 