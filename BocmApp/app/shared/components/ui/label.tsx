import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({ 
  children, 
  htmlFor, 
  className = '',
  required = false 
}) => {
  return (
    <View style={tw`mb-2`}>
      <Text
        style={[
          tw`text-sm font-medium`,
          { color: theme.colors.foreground },
        ]}
      >
        {children}
        {required && (
          <Text style={{ color: theme.colors.destructive }}> *</Text>
        )}
      </Text>
    </View>
  );
};

export default Label; 