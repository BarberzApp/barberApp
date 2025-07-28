import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { User } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  onPress?: () => void;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  onPress,
  className = '',
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return tw`w-8 h-8`;
      case 'lg':
        return tw`w-12 h-12`;
      case 'xl':
        return tw`w-16 h-16`;
      default:
        return tw`w-10 h-10`;
    }
  };

  const getFallbackSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      case 'xl':
        return 32;
      default:
        return 20;
    }
  };

  const getFallbackTextSize = () => {
    switch (size) {
      case 'sm':
        return tw`text-xs`;
      case 'lg':
        return tw`text-base`;
      case 'xl':
        return tw`text-lg`;
      default:
        return tw`text-sm`;
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        tw`rounded-full overflow-hidden items-center justify-center`,
        getSizeStyles(),
        { backgroundColor: theme.colors.muted },
      ]}
      onPress={onPress}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={[tw`w-full h-full`, getSizeStyles()]}
          resizeMode="cover"
        />
      ) : fallback ? (
        <Text
          style={[
            tw`font-medium`,
            getFallbackTextSize(),
            { color: theme.colors.mutedForeground },
          ]}
        >
          {fallback.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <User
          size={getFallbackSize()}
          color={theme.colors.mutedForeground}
        />
      )}
    </Container>
  );
};

export default Avatar; 