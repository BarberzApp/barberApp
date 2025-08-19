import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import tw from 'twrnc';
import { Check, X, ChevronDown } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { BARBER_SPECIALTIES } from '../../utils/settings.utils';

interface SpecialtyAutocompleteProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  disabled?: boolean;
}

export function SpecialtyAutocomplete({
  value = [],
  onChange,
  placeholder = "Search specialties...",
  maxSelections = 10,
  disabled = false
}: SpecialtyAutocompleteProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase();
    return BARBER_SPECIALTIES.filter(specialty => 
      specialty.toLowerCase().includes(lowercaseQuery)
    );
  }, [searchQuery]);

  const handleSelect = (specialty: string) => {
    if (value.includes(specialty)) {
      onChange(value.filter(item => item !== specialty));
    } else if (value.length < maxSelections) {
      onChange([...value, specialty]);
    }
    setSearchQuery('');
  };

  const handleRemove = (specialtyToRemove: string) => {
    onChange(value.filter(item => item !== specialtyToRemove));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const renderSpecialtyItem = ({ item }: { item: string }) => {
    const isSelected = value.includes(item);
    
    return (
      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between p-3 border-b`,
          { borderBottomColor: 'rgba(255,255,255,0.1)' }
        ]}
        onPress={() => handleSelect(item)}
      >
        <Text style={[tw`text-base`, { color: theme.colors.foreground }]}>
          {item}
        </Text>
        {isSelected && (
          <Check size={20} color={theme.colors.secondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`space-y-2`}>
      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between p-3 rounded-xl border`,
          { 
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.2)',
            opacity: disabled ? 0.5 : 1
          }
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={tw`flex-1 flex-row flex-wrap gap-1`}>
          {value.length === 0 ? (
            <Text style={[tw`text-sm`, { color: 'rgba(255,255,255,0.6)' }]}>
              {placeholder}
            </Text>
          ) : (
            value.map((specialty) => (
              <View
                key={specialty}
                style={[
                  tw`flex-row items-center px-2 py-1 rounded-lg mr-1 mb-1`,
                  { backgroundColor: 'rgba(255,255,255,0.2)' }
                ]}
              >
                <Text style={[tw`text-xs`, { color: theme.colors.foreground }]}>
                  {specialty}
                </Text>
                <TouchableOpacity
                  style={tw`ml-1`}
                  onPress={() => handleRemove(specialty)}
                >
                  <X size={12} color={theme.colors.foreground} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <ChevronDown size={16} color={theme.colors.mutedForeground} />
      </TouchableOpacity>

      {value.length > 0 && (
        <TouchableOpacity
          style={tw`self-start`}
          onPress={handleClearAll}
        >
          <Text style={[tw`text-sm`, { color: theme.colors.secondary }]}>
            Clear all
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between p-4 border-b`}>
            <Text style={[tw`text-lg font-semibold`, { color: theme.colors.foreground }]}>
              Select Specialties
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[tw`text-base`, { color: theme.colors.secondary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={tw`p-4`}>
            <TextInput
              style={[
                tw`p-3 rounded-xl border`,
                { 
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: theme.colors.foreground
                }
              ]}
              placeholder="Search specialties..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Specialties List */}
          <FlatList
            data={filteredSpecialties}
            renderItem={renderSpecialtyItem}
            keyExtractor={(item) => item}
            style={tw`flex-1`}
            contentContainerStyle={tw`pb-4`}
          />
        </View>
      </Modal>
    </View>
  );
} 