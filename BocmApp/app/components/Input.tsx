import React from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle, TextStyle } from 'react-native';
import tw from 'twrnc';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle | ViewStyle[];
  inputStyle?: TextStyle | TextStyle[];
  focusBorderColor?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholder,
  focusBorderColor = '#FFD180',
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[tw`w-full`, containerStyle]}>
      {label && (
        <Text style={tw`text-sm font-medium text-white mb-1.5`}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          tw`w-full rounded-xl px-4 py-3 text-base`,
          {
            backgroundColor: 'rgba(255,255,255,0.10)',
            borderColor: isFocused ? focusBorderColor : 'rgba(255,255,255,0.20)',
            color: '#fff',
            borderWidth: 1,
            height: 48,
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
        <Text style={tw`text-sm text-[#ff4d4f] mt-1`}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;