import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import tw from 'twrnc';
import { Instagram, Twitter, Facebook, Share2, Copy, Check } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SocialMediaLinksProps {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
  onUpdate?: (data: {
    instagram: string;
    twitter: string;
    tiktok: string;
    facebook: string;
  }) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showShare?: boolean;
  shareUrl?: string;
  shareTitle?: string;
}

// Utility function to convert handles to proper social media URLs
function getSocialMediaUrl(handle: string, platform: string): string {
  if (!handle) return '';
  
  // Remove @ if present and trim whitespace
  const cleanHandle = handle.replace(/^@/, '').trim();
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'twitter':
      return `https://twitter.com/${cleanHandle}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanHandle}`;
    case 'facebook':
      // Facebook can be either a page name or username
      return `https://facebook.com/${cleanHandle}`;
    default:
      return handle; // Return as-is if unknown platform
  }
}

// Utility function to extract handle from URL or return as-is if already a handle
function extractHandle(input: string): string {
  if (!input) return '';
  input = input.trim();
  try {
    const url = new URL(input);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      let handle = pathParts[pathParts.length - 1];
      if (handle.startsWith('@')) handle = handle.slice(1);
      return '@' + handle;
    }
  } catch {
    // Not a URL
  }
  if (input.startsWith('@')) return input;
  return '@' + input;
}

export function SocialMediaLinks({
  instagram = '',
  twitter = '',
  tiktok = '',
  facebook = '',
  onUpdate,
  size = 'md',
  variant = 'ghost',
  showShare = false,
  shareUrl,
  shareTitle = 'Check out this barber!'
}: SocialMediaLinksProps) {
  const [copied, setCopied] = useState(false);
  const [socialData, setSocialData] = useState({
    instagram,
    twitter,
    tiktok,
    facebook,
  });
  const { user } = useAuth();

  const sizeClasses = {
    sm: tw`h-8 w-8`,
    md: tw`h-10 w-10`,
    lg: tw`h-12 w-12`
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleInputChange = (platform: string, value: string) => {
    const newData = { ...socialData, [platform]: value };
    setSocialData(newData);
    
    if (onUpdate) {
      onUpdate(newData);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        // For React Native, we'll use Share API as fallback
        await Share.share({
          message: shareUrl,
          title: shareTitle,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        Alert.alert('Error', 'Failed to copy link');
      }
    }
  };

  const handleShare = async () => {
    if (shareUrl) {
      try {
        await Share.share({
          message: shareUrl,
          title: shareTitle,
        });
      } catch (err) {
        Alert.alert('Error', 'Failed to share');
      }
    }
  };

  const renderSocialInput = (platform: string, icon: React.ReactNode, placeholder: string) => {
    const value = socialData[platform as keyof typeof socialData];
    
    return (
      <View style={tw`mb-4`}>
        <View style={tw`flex-row items-center mb-2`}>
          {icon}
          <Text style={[tw`ml-2 text-sm font-medium`, { color: theme.colors.foreground }]}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Text>
        </View>
        <TextInput
          style={[
            tw`p-3 rounded-xl border`,
            { 
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: theme.colors.foreground
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={value}
          onChangeText={(text) => handleInputChange(platform, extractHandle(text))}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  };

  return (
    <View style={tw`space-y-4`}>
      {renderSocialInput(
        'instagram',
        <Instagram size={iconSizes[size]} color={theme.colors.foreground} />,
        '@username or Instagram URL'
      )}
      
      {renderSocialInput(
        'twitter',
        <Twitter size={iconSizes[size]} color={theme.colors.foreground} />,
        '@username or Twitter URL'
      )}
      
      {renderSocialInput(
        'tiktok',
        <View style={[tw`items-center justify-center`, sizeClasses[size]]}>
          <Text style={[tw`text-xs font-bold`, { color: theme.colors.foreground }]}>
            TT
          </Text>
        </View>,
        '@username or TikTok URL'
      )}
      
      {renderSocialInput(
        'facebook',
        <Facebook size={iconSizes[size]} color={theme.colors.foreground} />,
        'Page name or Facebook URL'
      )}

      {showShare && shareUrl && (
        <View style={tw`mt-4`}>
          <Text style={[tw`text-sm font-medium mb-2`, { color: theme.colors.foreground }]}>
            Share your profile
          </Text>
          <View style={tw`flex-row space-x-2`}>
            <TouchableOpacity
              style={[
                tw`flex-1 flex-row items-center justify-center py-2 px-4 rounded-xl`,
                { backgroundColor: theme.colors.secondary }
              ]}
              onPress={handleShare}
            >
              <Share2 size={16} color={theme.colors.primaryForeground} style={tw`mr-2`} />
              <Text style={[tw`font-medium`, { color: theme.colors.primaryForeground }]}>
                Share
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                tw`flex-row items-center justify-center py-2 px-4 rounded-xl`,
                { backgroundColor: 'rgba(255,255,255,0.1)' }
              ]}
              onPress={handleCopyLink}
            >
              {copied ? (
                <Check size={16} color={theme.colors.secondary} />
              ) : (
                <Copy size={16} color={theme.colors.foreground} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
} 