import React from 'react';
import { View } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View
      style={[
        tw`w-full h-2 rounded-full overflow-hidden`,
        { backgroundColor: theme.colors.muted },
      ]}
    >
      <View
        style={[
          tw`h-full rounded-full`,
          { 
            backgroundColor: theme.colors.primary,
            width: `${percentage}%`,
          },
        ]}
      />
    </View>
  );
};

export default Progress; 