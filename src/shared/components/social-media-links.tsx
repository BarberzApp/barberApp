'use client'

import { Instagram, Twitter, Facebook, Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useState } from 'react'
import { useCustomToast } from '@/shared/hooks/use-custom-toast'

interface SocialMediaLinksProps {
  instagram?: string
  twitter?: string
  tiktok?: string
  facebook?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showShare?: boolean
  shareUrl?: string
  shareTitle?: string
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

export function SocialMediaLinks({
  instagram,
  twitter,
  tiktok,
  facebook,
  className,
  size = 'md',
  variant = 'ghost',
  showShare = false,
  shareUrl,
  shareTitle = 'Check out this barber!'
}: SocialMediaLinksProps) {
  const [copied, setCopied] = useState(false)
  const toast = useCustomToast()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // TikTok icon (custom since lucide doesn't have it)
  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Link copied!', 'The booking link has been copied to your clipboard.')
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error('Failed to copy', 'Please copy the link manually.')
      }
    }
  }

  const handleShare = async () => {
    if (shareUrl && typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        handleCopyLink()
      }
    } else {
      // Fall back to copy for browsers that don't support native sharing
      handleCopyLink()
    }
  }

  const socialLinks = [
    {
      platform: 'instagram',
      url: getSocialMediaUrl(instagram || '', 'instagram'),
      icon: Instagram,
      color: 'hover:text-social-instagram',
      label: 'Instagram'
    },
    {
      platform: 'twitter',
      url: getSocialMediaUrl(twitter || '', 'twitter'),
      icon: Twitter,
      color: 'hover:text-social-twitter',
      label: 'Twitter'
    },
    {
      platform: 'facebook',
      url: getSocialMediaUrl(facebook || '', 'facebook'),
      icon: Facebook,
      color: 'hover:text-social-facebook',
      label: 'Facebook'
    }
  ].filter(link => link.url)

  if (tiktok) {
    socialLinks.push({
      platform: 'tiktok',
      url: getSocialMediaUrl(tiktok, 'tiktok'),
      icon: TikTokIcon as any, // Type assertion to avoid interface mismatch
      color: 'hover:text-social-tiktok',
      label: 'TikTok'
    })
  }

  // Add share button if enabled
  if (showShare && shareUrl) {
    socialLinks.push({
      platform: 'share',
      url: shareUrl,
      icon: copied ? Check : Copy,
      color: 'hover:text-primary',
      label: copied ? 'Copied!' : 'Copy Link'
    })
  }

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {socialLinks.map(({ platform, url, icon: Icon, color, label }) => (
        <Button
          key={platform}
          variant={variant}
          size="icon"
          className={cn(
            sizeClasses[size],
            color,
            'transition-all duration-200 hover:scale-105'
          )}
          onClick={() => {
            if (platform === 'share') {
              handleCopyLink()
            } else {
              window.open(url, '_blank', 'noopener,noreferrer')
            }
          }}
          aria-label={`Visit ${label}`}
        >
          <Icon className={iconSizes[size]} />
        </Button>
      ))}
      
      {/* Native share button for mobile */}
      {showShare && shareUrl && typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button
          variant={variant}
          size="icon"
          className={cn(
            sizeClasses[size],
            'hover:text-primary transition-all duration-200 hover:scale-105'
          )}
          onClick={handleShare}
          aria-label="Share"
        >
          <Share2 className={iconSizes[size]} />
        </Button>
      )}
    </div>
  )
} 