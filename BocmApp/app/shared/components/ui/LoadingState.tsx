import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Loader2, RefreshCw } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  variant?: 'default' | 'minimal' | 'fullscreen';
  showIcon?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  size = 'large',
  variant = 'default',
  showIcon = true,
}: LoadingStateProps) {
  const renderContent = () => (
    <View style={tw`items-center justify-center`}>
      {showIcon && (
        <View style={tw`mb-4`}>
          <ActivityIndicator size={size} color={theme.colors.primary} />
        </View>
      )}
      <Text
        style={[
          tw`text-center`,
          { color: theme.colors.mutedForeground },
        ]}
      >
        {message}
      </Text>
    </View>
  );

  switch (variant) {
    case 'minimal':
      return (
        <View style={tw`p-4`}>
          {renderContent()}
        </View>
      );
    
    case 'fullscreen':
      return (
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {renderContent()}
        </View>
      );
    
    default:
      return (
        <View
          style={[
            tw`flex-1 justify-center items-center p-8`,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {renderContent()}
        </View>
      );
  }
}

// Specialized loading states
export function PageLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState
      message={message || 'Loading page...'}
      variant="fullscreen"
    />
  );
}

export function ContentLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState
      message={message || 'Loading content...'}
      variant="default"
    />
  );
}

export function MinimalLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState
      message={message || 'Loading...'}
      variant="minimal"
      size="small"
    />
  );
}

export function RefreshLoadingState({ message }: { message?: string }) {
  return (
    <View style={tw`flex-row items-center justify-center p-4`}>
      <RefreshCw
        size={16}
        color={theme.colors.mutedForeground}
        style={tw`mr-2 animate-spin`}
      />
      <Text
        style={[
          tw`text-sm`,
          { color: theme.colors.mutedForeground },
        ]}
      >
        {message || 'Refreshing...'}
      </Text>
    </View>
  );
} 