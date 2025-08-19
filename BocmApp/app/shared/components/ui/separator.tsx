import React from 'react';
import { View } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  className = '',
}) => {
  return (
    <View
      style={[
        orientation === 'horizontal' ? tw`h-px w-full` : tw`w-px h-full`,
        { backgroundColor: theme.colors.border },
      ]}
    />
  );
};

export default Separator; 