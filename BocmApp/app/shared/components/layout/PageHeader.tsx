import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, MoreVertical, Share2, Settings } from 'lucide-react-native';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { theme } from '../../lib/theme';
import tw from 'twrnc';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showShare?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  showMenu = false,
  showShare = false,
  showSettings = false,
  onBack,
  onMenu,
  onShare,
  onSettings,
  rightComponent,
  transparent = false,
}: PageHeaderProps) {
  const { back } = useSafeNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      back();
    }
  };

  return (
    <View
      style={[
        tw`flex-row items-center justify-between px-4 py-3 border-b`,
        {
          backgroundColor: transparent ? 'transparent' : theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Left side */}
      <View style={tw`flex-row items-center flex-1`}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={tw`mr-3 p-1 rounded-full`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        )}
        
        <View style={tw`flex-1`}>
          <Text
            style={[
              tw`text-lg font-semibold`,
              { color: theme.colors.foreground },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                tw`text-sm mt-1`,
                { color: theme.colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right side */}
      <View style={tw`flex-row items-center`}>
        {rightComponent}
        
        {showShare && (
          <TouchableOpacity
            onPress={onShare}
            style={tw`ml-2 p-2 rounded-full`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
        )}
        
        {showSettings && (
          <TouchableOpacity
            onPress={onSettings}
            style={tw`ml-2 p-2 rounded-full`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
        )}
        
        {showMenu && (
          <TouchableOpacity
            onPress={onMenu}
            style={tw`ml-2 p-2 rounded-full`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Specialized header components
export function ProfileHeader({ title, subtitle, onBack, onSettings }: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
}) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      showBack={true}
      showSettings={true}
      onBack={onBack}
      onSettings={onSettings}
    />
  );
}

export function BrowseHeader({ title, onBack, onShare }: {
  title: string;
  onBack?: () => void;
  onShare?: () => void;
}) {
  return (
    <PageHeader
      title={title}
      showBack={true}
      showShare={true}
      onBack={onBack}
      onShare={onShare}
    />
  );
}

export function BookingHeader({ title, onBack }: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <PageHeader
      title={title}
      showBack={true}
      onBack={onBack}
    />
  );
} 