import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react-native';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { theme } from '../../lib/theme';
import tw from 'twrnc';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  variant?: 'default' | 'minimal' | 'fullscreen';
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  variant = 'default',
  showRetry = true,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
}: ErrorStateProps) {
  const { back, push } = useSafeNavigation();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      push('MainTabs');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      back();
    }
  };

  const renderContent = () => (
    <View style={tw`items-center justify-center`}>
      <View style={tw`items-center mb-6`}>
        <AlertTriangle size={48} color={theme.colors.destructive} />
        <Text
          style={[
            tw`text-lg font-semibold mt-4 text-center`,
            { color: theme.colors.foreground },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            tw`text-sm text-center mt-2 px-4`,
            { color: theme.colors.mutedForeground },
          ]}
        >
          {message}
        </Text>
      </View>

      <View style={tw`space-y-3 w-full max-w-xs`}>
        {showRetry && (
          <Button onPress={handleRetry} style={tw`w-full`}>
            <RefreshCw size={16} style={tw`mr-2`} />
            Try Again
          </Button>
        )}
        
        {showHome && (
          <Button variant="outline" onPress={handleHome} style={tw`w-full`}>
            <Home size={16} style={tw`mr-2`} />
            Go Home
          </Button>
        )}
        
        {showBack && (
          <Button variant="outline" onPress={handleBack} style={tw`w-full`}>
            <ArrowLeft size={16} style={tw`mr-2`} />
            Go Back
          </Button>
        )}
      </View>
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

// Specialized error states
export function PageErrorState({
  title,
  message,
  onRetry,
  onHome,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onHome?: () => void;
}) {
  return (
    <ErrorState
      title={title || 'Page Error'}
      message={message || 'Failed to load this page. Please try again.'}
      variant="fullscreen"
      showRetry={true}
      showHome={true}
      onRetry={onRetry}
      onHome={onHome}
    />
  );
}

export function ContentErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <ErrorState
      title={title || 'Content Error'}
      message={message || 'Failed to load content. Please try again.'}
      variant="default"
      showRetry={true}
      onRetry={onRetry}
    />
  );
}

export function NetworkErrorState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <ErrorState
      title="Network Error"
      message="Please check your internet connection and try again."
      variant="default"
      showRetry={true}
      onRetry={onRetry}
    />
  );
}

export function NotFoundErrorState({
  onHome,
  onBack,
}: {
  onHome?: () => void;
  onBack?: () => void;
}) {
  return (
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist."
      variant="default"
      showHome={true}
      showBack={true}
      onHome={onHome}
      onBack={onBack}
    />
  );
} 