import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { theme } from '../../lib/theme';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ 
  checked, 
  onCheckedChange, 
  label, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
    >
      <View style={[styles.checkbox, checked && styles.checked]}>
        {checked && (
          <Check size={16} stroke={theme.colors.primaryForeground} />
        )}
      </View>
      {label && (
        <Text style={[styles.label, disabled && styles.disabledText]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  label: {
    fontSize: 16,
    color: theme.colors.foreground,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.mutedForeground,
  },
});

export default Checkbox; 