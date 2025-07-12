import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  name: string;
  username?: string;
  avatarUrl?: string;
  coverUrl?: string;
  stats?: { label: string; value: number | string }[];
  isOwner?: boolean;
  onEdit?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  username,
  avatarUrl,
  coverUrl,
  stats = [],
  isOwner = false,
  onEdit,
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8">
      {/* Cover Photo */}
      <div className="h-40 sm:h-56 w-full bg-gradient-to-br from-darkpurple to-saffron/30 flex items-end justify-center relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-darkpurple/80 z-0" />
        )}
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md z-10" />
        {/* Avatar */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20">
          <Avatar className="w-28 h-28 border-4 border-saffron/80 shadow-xl bg-white/10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="bg-saffron text-primary font-bold text-3xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      {/* Name, Username, Edit Button */}
      <div className="pt-20 pb-4 flex flex-col items-center relative z-30">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{name}</h1>
        {username && (
          <div className="text-saffron text-lg font-mono mb-2">@{username}</div>
        )}
        {isOwner && (
          <Button
            className="mt-2 bg-saffron text-primary font-semibold px-6 py-2 rounded-full shadow-lg hover:bg-saffron/90"
            onClick={onEdit}
          >
            Edit Profile
          </Button>
        )}
      </div>
      {/* Stats Bar */}
      <div className="flex justify-center gap-8 py-4 bg-darkpurple/60 backdrop-blur-xl rounded-b-2xl border-t border-white/10">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center min-w-[60px]">
            <span className="text-xl font-bold text-saffron">{stat.value}</span>
            <span className="text-xs text-white/80 uppercase tracking-wide">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 