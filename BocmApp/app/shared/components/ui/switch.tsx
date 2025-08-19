import React from 'react';
import { Switch as RNSwitch, View } from 'react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
}) => {
  return (
    <View style={tw`w-full`}>
      <RNSwitch
        value={checked}
        onValueChange={onCheckedChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.muted,
          true: theme.colors.primary,
        }}
        thumbColor={
          checked ? theme.colors.primaryForeground : theme.colors.foreground
        }
        ios_backgroundColor={theme.colors.muted}
        style={tw`w-12 h-6`}
      />
    </View>
  );
};

export default Switch; 