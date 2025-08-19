import React from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle, TextStyle } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle | ViewStyle[];
  inputStyle?: TextStyle | TextStyle[];
  focusBorderColor?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholder,
  focusBorderColor,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[tw`w-full`, containerStyle]}>
      {label && (
        <Text style={[tw`text-sm font-medium mb-1.5`, { color: theme.colors.foreground }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          tw`flex h-10 w-full rounded-md border px-3 py-2 text-base`,
          {
            backgroundColor: theme.colors.background,
            borderColor: error ? theme.colors.destructive : theme.colors.input,
            color: theme.colors.foreground,
            borderWidth: 1,
          },
          isFocused && {
            borderColor: theme.colors.ring,
            borderWidth: 2,
          },
          inputStyle
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus && props.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur && props.onBlur(e);
        }}
        {...props}
      />
      {error && (
        <Text style={[tw`text-sm mt-1`, { color: theme.colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;