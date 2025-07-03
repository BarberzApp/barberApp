import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { PortfolioEditor } from './portfolio-editor';
import type { PortfolioItem } from './portfolio-editor';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Play, Instagram, Twitter, Facebook, Edit3 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/components/ui/use-toast';
import { EnhancedBarberProfileSettings } from './enhanced-barber-profile-settings';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
}

interface BarberProfile {
  id: string;
  user_id: string;
  bio?: string;
  business_name?: string;
  specialties?: string[];
  instagram?: string;
  twitter?: string;
  facebook?: string;
  portfolio?: string[];
}

export default function ProfilePortfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barberProfile, setBarberProfile] = useState<BarberProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [videoModal, setVideoModal] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch profile and barber data in parallel
        const [profileResult, barberResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
          supabase
            .from('barbers')
            .select('*')
            .eq('user_id', user.id)
            .single()
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
        }

        if (barberResult.data) {
          setBarberProfile(barberResult.data);
          
          // Convert portfolio URLs to PortfolioItem format
          if (barberResult.data.portfolio) {
            const portfolioItems: PortfolioItem[] = barberResult.data.portfolio.map((url: string, index: number) => ({
              id: `item-${index}`,
              type: url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? 'video' : 'image',
              url
            }));
            setPortfolio(portfolioItems);
          }
        } else {
          // User is not a barber yet, create a barber profile
          const { data: newBarber, error: createError } = await supabase
            .from('barbers')
            .insert({
              user_id: user.id,
              bio: '',
              specialties: [],
              portfolio: []
            })
            .select()
            .single();
          
          if (newBarber && !createError) {
            setBarberProfile(newBarber);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, toast]);

  // Stats and socials based on real data
  const stats = [
    { label: 'Posts', value: portfolio.length },
  ];

  const socials = [
    { icon: Instagram, href: barberProfile?.instagram, color: 'text-[#E1306C]' },
    { icon: Twitter, href: barberProfile?.twitter, color: 'text-[#1DA1F2]' },
    { icon: Facebook, href: barberProfile?.facebook, color: 'text-[#1877F3]' },
  ].filter(social => social.href); // Only show socials that have URLs

  const handleEditProfile = () => {
    setProfileEditorOpen(true);
  };

  const handleProfileUpdate = async (updatedData: any) => {
    try {
      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updatedData.name,
          bio: updatedData.bio,
          location: updatedData.location,
          phone: updatedData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update barber profile data
      if (barberProfile) {
        const { error: barberError } = await supabase
          .from('barbers')
          .update({
            bio: updatedData.bio,
            instagram: updatedData.instagram,
            twitter: updatedData.twitter,
            facebook: updatedData.facebook,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);

        if (barberError) throw barberError;
      }

      // Refresh profile data
      const [profileResult, barberResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single(),
        supabase
          .from('barbers')
          .select('*')
          .eq('user_id', user?.id)
          .single()
      ]);

      if (profileResult.data) setProfile(profileResult.data);
      if (barberResult.data) setBarberProfile(barberResult.data);

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 pb-32 relative">
        <div className="bg-white/90 shadow-xl rounded-2xl p-6 sm:p-8 mb-6 mt-6 flex flex-col items-center">
          <div className="h-28 w-28 mb-3 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-32 mb-2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 mb-3 bg-muted animate-pulse rounded" />
          <div className="h-16 w-64 mb-4 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 pb-32 relative">
      {/* Profile Card */}
              <div className="bg-white/90 shadow-xl rounded-2xl p-6 sm:p-8 mb-6 mt-6 flex flex-col items-center">
        {/* Avatar */}
        <Avatar className="h-28 w-28 mb-3 shadow-lg border-4 border-[#7C3AED]">
          <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
          <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            {profile?.name?.charAt(0) || user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        {/* Name & Username */}
        <h2 className="text-2xl sm:text-3xl font-bold text-[#7C3AED]">
          {profile?.name || user?.name || 'Your Name'}
        </h2>
        <span className="text-muted-foreground text-sm mb-2">
          @{profile?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
        </span>
        
        {/* Bio */}
        <p className="text-center text-base text-muted-foreground mb-3 max-w-md line-clamp-3">
          {barberProfile?.bio || profile?.bio || 'No bio yet. Click "Edit Profile" to add one.'}
        </p>
        
        {/* Socials */}
        {socials.length > 0 && (
          <div className="flex gap-4 mb-4">
            {socials.map(({ icon: Icon, href, color }) => (
              <a 
                key={href} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={color + ' hover:scale-110 transition-transform'}
              >
                <Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        )}
        
        {/* Edit Profile Button */}
        <Button 
          className="rounded-full px-8 font-semibold bg-[#7C3AED] text-white hover:bg-[#6a2fc9] shadow"
          onClick={handleEditProfile}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        
        {/* Stats Row */}
        <div className="flex justify-center gap-8 mt-6 w-full">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-bold text-lg sm:text-xl text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
        {portfolio.map((item, idx) => (
          <div
            key={item.id}
            className="aspect-square rounded-lg overflow-hidden bg-muted card-hover cursor-pointer flex items-center justify-center relative group"
            onClick={() => {
              if (item.type === 'video') setVideoModal({ open: true, url: item.url });
            }}
          >
            {item.type === 'image' ? (
              <img src={item.url} alt="Portfolio item" className="object-cover w-full h-full" />
            ) : (
              <>
                <video src={item.url} className="object-cover w-full h-full" controls={false} />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-10 w-10 text-white drop-shadow-lg" />
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Floating Edit Portfolio Button */}
      <Button
        className="fixed bottom-8 right-8 z-50 rounded-full bg-[#7C3AED] text-white shadow-lg hover:bg-[#6a2fc9] px-6 py-3 text-base font-semibold"
        onClick={() => setEditorOpen(true)}
        style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.18)' }}
      >
        Edit Portfolio
      </Button>

      {/* Video Modal */}
      <Dialog open={videoModal.open} onOpenChange={open => setVideoModal(v => ({ ...v, open }))}>
        <DialogContent className="max-w-lg w-full flex flex-col items-center">
          {videoModal.url && (
            <video src={videoModal.url} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: 400 }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Portfolio Editor Modal */}
      <PortfolioEditor
        initialItems={portfolio}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={async (items) => {
          setPortfolio(items);
          // Refresh profile data to get updated portfolio
          if (user) {
            try {
              const { data: barberResult } = await supabase
                .from('barbers')
                .select('portfolio')
                .eq('user_id', user.id)
                .single();
              
              if (barberResult?.portfolio) {
                const portfolioItems: PortfolioItem[] = barberResult.portfolio.map((url: string, index: number) => ({
                  id: `item-${index}`,
                  type: url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? 'video' : 'image',
                  url
                }));
                setPortfolio(portfolioItems);
              }
            } catch (error) {
              console.error('Error refreshing portfolio:', error);
            }
          }
        }}
      />

      {/* Profile Editor Modal */}
      <ProfileEditorModal
        open={profileEditorOpen}
        onClose={() => setProfileEditorOpen(false)}
        onProfileUpdated={async () => {
          // Refresh profile data after save
          if (user) {
            try {
              setLoading(true);
              const [profileResult, barberResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single(),
                supabase
                  .from('barbers')
                  .select('*')
                  .eq('user_id', user.id)
                  .single()
              ]);
              if (profileResult.data) setProfile(profileResult.data);
              if (barberResult.data) setBarberProfile(barberResult.data);
            } catch (error) {
              console.error('Error refreshing profile:', error);
            } finally {
              setLoading(false);
            }
          }
        }}
      />
    </div>
  );
}

function ProfileEditorModal({ open, onClose, onProfileUpdated }: { open: boolean; onClose: () => void; onProfileUpdated: () => void }) {
  // We'll use a key to force remount the form when opened, so it always loads fresh data
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <EnhancedBarberProfileSettings
            key={formKey}
            onSave={() => {
              onProfileUpdated();
              onClose();
            }}
            showPreview={false}
            showIntegrationGuide={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 