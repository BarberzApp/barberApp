import React from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle, TextStyle } from 'react-native';
import tw from 'twrnc';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle | ViewStyle[];
  inputStyle?: TextStyle | TextStyle[];
  focusBorderColor?: string; // Add prop for custom focus color
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholder,
  focusBorderColor = '#FFD180', // Saffron as default focus color
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <View style={[tw`space-y-2`, containerStyle]}>
      {label && (
        <Text style={tw`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white`}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          tw`flex h-11 w-full rounded-md px-3 text-base`,
          {
            backgroundColor: 'rgba(255,255,255,0.10)', // glassy background
            borderColor: isFocused ? focusBorderColor : 'rgba(255,255,255,0.20)', // white border, saffron on focus
            color: '#fff',
            borderWidth: 1,
          },
          error && { borderColor: '#ff4d4f' },
          inputStyle
        ]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.40)"
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
        <Text style={tw`text-sm text-[#ff4d4f]`}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input; 