import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native';
import tw from 'twrnc';

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  color?: string;
  style?: ViewStyle | ViewStyle[];
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default', 
  color = '#262b2e',
  style 
}) => {
  const sizeMap = {
    sm: 'small',
    default: 'small',
    lg: 'large'
  } as const;

  return (
    <View style={[tw`flex items-center justify-center`, style]}>
      <ActivityIndicator 
        size={sizeMap[size]} 
        color={color}
      />
    </View>
  );
};

export default LoadingSpinner; 