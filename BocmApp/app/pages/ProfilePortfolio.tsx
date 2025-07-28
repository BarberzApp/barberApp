import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../shared/hooks/useAuth';
import { theme } from '../shared/lib/theme';
import tw from 'twrnc';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Avatar,
  Dialog,
  DialogContent,
} from '../shared/components/ui';
import {
  Heart,
  Users,
  History,
  Play,
  Camera,
  Loader2,
  Eye,
  Calendar,
  Clock,
  Share2,
} from 'lucide-react-native';
import { supabase } from '../shared/lib/supabase';
import VideoPreview from '../shared/components/VideoPreview';

const { width, height } = Dimensions.get('window');

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
  coverphoto?: string;
  role?: 'client' | 'barber';
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
  featured_portfolio?: string;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: string;
    description: string;
  }>;
  reviews?: Array<{
    id: string;
    user: string;
    avatar: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

interface Cut {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  views: number;
  likes: number;
  shares: number;
  created_at: string;
  is_public: boolean;
  is_featured: boolean;
  barber: {
    id: string;
    name: string;
    image: string;
  };
}

interface Booking {
  id: string;
  date: string;
  time: string;
  service: string;
  barber: {
    id: string;
    name: string;
    image: string;
  };
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

export default function ProfilePortfolio() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barberProfile, setBarberProfile] = useState<BarberProfile | null>(null);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [likedCuts, setLikedCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openDialog, setOpenDialog] = useState<null | 'video'>(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedVideo, setSelectedVideo] = useState<Cut | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);

  // Fetch profile data
  const fetchProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch barber profile if user is a barber
      if (user.role === 'barber') {
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (barberError) {
          console.error('Error fetching barber profile:', barberError);
        } else {
          setBarberProfile(barberData);
        }

        // Fetch barber's cuts
        const { data: cutsData, error: cutsError } = await supabase
          .from('cuts')
          .select(`
            *,
            barbers:barber_id(
              id,
              user_id,
              profiles:user_id(name, avatar_url)
            )
          `)
          .eq('barber_id', user.id)
          .order('created_at', { ascending: false });

        if (cutsError) {
          console.error('Error fetching cuts:', cutsError);
        } else {
          const formattedCuts = (cutsData || []).map((cut: any) => ({
            ...cut,
            barber: {
              id: cut.barbers?.id,
              name: cut.barbers?.profiles?.name || 'Unknown',
              image: cut.barbers?.profiles?.avatar_url
            }
          }));
          setCuts(formattedCuts);
        }
      } else {
        // Fetch client's liked cuts
        const { data: likedData, error: likedError } = await supabase
          .from('cut_analytics')
          .select(`
            cut_id,
            cuts (
              id,
              title,
              description,
              url,
              thumbnail,
              views,
              likes,
              shares,
              created_at,
              is_public,
              is_featured,
              barber_id,
              barbers:barber_id(
                id,
                user_id,
                profiles:user_id(name, avatar_url)
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('action_type', 'like');

        if (likedError) {
          console.error('Error fetching liked cuts:', likedError);
        } else {
          const formattedLikedCuts = (likedData || []).map((item: any) => {
            const cutData = item.cuts;
            return {
              ...cutData,
              barber: {
                id: cutData.barbers?.id,
                name: cutData.barbers?.profiles?.name || 'Unknown',
                image: cutData.barbers?.profiles?.avatar_url
              }
            };
          });
          setLikedCuts(formattedLikedCuts);
        }

        // Fetch client bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            barbers:barber_id(
              id,
              user_id,
              profiles:user_id(name, avatar_url)
            )
          `)
          .eq('client_id', user.id)
          .order('date', { ascending: false });

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        } else {
          const formattedBookings = (bookingsData || []).map((booking: any) => ({
            ...booking,
            barber: {
              id: booking.barbers?.id,
              name: booking.barbers?.profiles?.name || 'Unknown',
              image: booking.barbers?.profiles?.avatar_url
            }
          }));
          setBookings(formattedBookings);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleAvatarUpload = async () => {
    Alert.alert('Coming Soon', 'Avatar upload functionality will be implemented soon.');
  };

  const handleCoverUpload = async () => {
    Alert.alert('Coming Soon', 'Cover photo upload functionality will be implemented soon.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[tw`flex-1 justify-center items-center`, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={[tw`mt-4 text-lg`, { color: theme.colors.foreground }]}>
          Loading your profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!user || !profile) {
    return (
      <SafeAreaView style={[tw`flex-1 justify-center items-center`, { backgroundColor: theme.colors.background }]}>
        <Text style={[tw`text-lg`, { color: theme.colors.foreground }]}>
          Profile not found
        </Text>
        <Button onPress={() => navigation.goBack()} style={tw`mt-4`}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const isBarber = user.role === 'barber';
  const displayCuts = isBarber ? cuts : likedCuts;
  const pastBarbers = [...new Set(bookings.map(b => b.barber.id))].map(barberId => {
    const booking = bookings.find(b => b.barber.id === barberId);
    return booking?.barber;
  }).filter(Boolean);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return (
          <View style={tw`flex-1 px-4`}>
            {displayCuts.length === 0 ? (
              <View style={tw`flex-1 justify-center items-center py-8`}>
                <Heart size={48} style={[tw`mb-4`, { color: 'rgba(255,255,255,0.4)' }]} />
                <Text style={[tw`font-bold text-xl mb-2 text-center`, { color: theme.colors.foreground }]}>
                  No {isBarber ? 'cuts' : 'liked cuts'} yet
                </Text>
                <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                  {isBarber ? 'Start uploading your cuts to build your portfolio' : 'Start exploring and liking cuts from your favorite stylists'}
                </Text>
              </View>
            ) : (
              <View style={tw`py-4`}>
                {/* Grid Layout for Cuts */}
                <View style={tw`flex-row flex-wrap justify-between`}>
                  {displayCuts.map((cut, index) => {
                    // Debug logging
                    console.log('Cut data:', {
                      id: cut.id,
                      title: cut.title,
                      thumbnail: cut.thumbnail,
                      url: cut.url,
                      barber: cut.barber
                    });
                    
                    return (
                      <VideoPreview
                        key={cut.id}
                        videoUrl={cut.url}
                        title={cut.title}
                        barberName={cut.barber.name}
                        barberAvatar={cut.barber.image}
                        views={cut.views}
                        likes={cut.likes}
                        onPress={() => {
                          // Navigate to cuts page for this specific video
                          // @ts-ignore - Navigation type issue
                          navigation.navigate('Cuts', { cutId: cut.id });
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );

      case 'cuts':
        return (
          <View style={tw`flex-1 px-4`}>
            {isBarber ? (
              <View style={tw`flex-1 justify-center items-center py-8`}>
                <Users size={48} style={[tw`mb-4`, { color: theme.colors.mutedForeground }]} />
                <Text style={[tw`font-bold text-xl mb-2 text-center`, { color: theme.colors.foreground }]}>
                  Barber cuts management
                </Text>
                <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                  Manage your cuts and portfolio here
                </Text>
              </View>
            ) : (
              <View style={tw`flex-1 justify-center items-center py-8`}>
                <Users size={48} style={[tw`mb-4`, { color: theme.colors.mutedForeground }]} />
                <Text style={[tw`font-bold text-xl mb-2 text-center`, { color: theme.colors.foreground }]}>
                  No past stylists
                </Text>
                <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                  Book appointments to see your stylists here
                </Text>
              </View>
            )}
          </View>
        );

      case 'services':
        return (
          <View style={tw`flex-1 px-4`}>
            {isBarber ? (
              <View style={tw`flex-1 justify-center items-center py-8`}>
                <History size={48} style={[tw`mb-4`, { color: theme.colors.mutedForeground }]} />
                <Text style={[tw`font-bold text-xl mb-2 text-center`, { color: theme.colors.foreground }]}>
                  Barber services management
                </Text>
                <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                  Manage your services and pricing here
                </Text>
              </View>
            ) : (
              <View style={tw`space-y-4`}>
                {bookings.length === 0 ? (
                  <View style={tw`flex-1 justify-center items-center py-8`}>
                    <Calendar size={48} style={[tw`mb-4`, { color: 'rgba(255,255,255,0.4)' }]} />
                    <Text style={[tw`font-bold text-xl mb-2 text-center`, { color: theme.colors.foreground }]}>
                      No bookings yet
                    </Text>
                    <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                      Start booking appointments with stylists
                    </Text>
                  </View>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} style={[tw`bg-white/5 border`, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                      <CardContent style={tw`p-4`}>
                        <View style={tw`flex-row items-center gap-3`}>
                          <Avatar size="md" src={booking.barber.image} fallback={booking.barber.name?.charAt(0)} />
                          <View style={tw`flex-1`}>
                            <Text style={[tw`font-semibold`, { color: theme.colors.foreground }]}>
                              {booking.barber.name}
                            </Text>
                            <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                              {booking.service}
                            </Text>
                            <View style={tw`flex-row items-center gap-4 mt-1`}>
                              <View style={tw`flex-row items-center gap-1`}>
                                <Calendar size={12} color={theme.colors.mutedForeground} />
                                <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                                  {formatDate(booking.date)}
                                </Text>
                              </View>
                              <View style={tw`flex-row items-center gap-1`}>
                                <Clock size={12} color={theme.colors.mutedForeground} />
                                <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                                  {formatTime(booking.time)}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Badge 
                            style={[
                              booking.status === 'completed' 
                                ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.3)' }
                                : { backgroundColor: 'rgba(180, 138, 60, 0.2)', borderColor: 'rgba(180, 138, 60, 0.3)' }
                            ]}
                          >
                            <Text style={[
                              booking.status === 'completed' 
                                ? { color: '#22c55e' }
                                : { color: theme.colors.secondary }
                            ]}>
                              {booking.status}
                            </Text>
                          </Badge>
                        </View>
                      </CardContent>
                    </Card>
                  ))
                )}
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      {/* Header Section */}
      <View style={tw`relative w-full overflow-hidden`}>
        {/* Cover Photo */}
        <View style={[tw`h-32 w-full flex items-center justify-center relative`, { backgroundColor: theme.colors.muted }]}>
          {profile.coverphoto ? (
            <Image
              source={{ uri: profile.coverphoto }}
              style={tw`absolute inset-0 w-full h-full`}
              resizeMode="cover"
            />
          ) : (
            <View style={[tw`absolute inset-0 w-full h-full`, { backgroundColor: theme.colors.muted }]} />
          )}
          {/* Camera button for cover photo */}
          <TouchableOpacity
            style={tw`absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-black/40 items-center justify-center`}
            onPress={handleCoverUpload}
            disabled={coverLoading}
          >
            {coverLoading ? (
              <Loader2 size={16} color="white" />
            ) : (
              <Camera size={16} color="white" />
            )}
          </TouchableOpacity>
          {/* Glass overlay */}
          <View style={tw`absolute inset-0 bg-black/30 z-10`} />
        </View>

        {/* Avatar - Positioned exactly where cover photo ends */}
        <View style={tw`absolute left-3/8 top-20 -translate-x-1/2  z-20`}>
          <View style={[tw`w-24 h-24 rounded-full overflow-hidden border-2`, { borderColor: theme.colors.secondary }]}>
            <Image
              source={{ uri: profile.avatar_url }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
          </View>
          <TouchableOpacity
            style={[tw`absolute bottom-0 right-0 h-8 w-8 rounded-full items-center justify-center`, { backgroundColor: theme.colors.secondary }]}
            onPress={handleAvatarUpload}
            disabled={avatarLoading}
          >
            {avatarLoading ? (
              <Loader2 size={14} color={theme.colors.primary} />
            ) : (
              <Camera size={14} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Profile Info */}
        <View style={tw`px-4 pt-16 pb-4 items-center`}>
          <Text style={[tw`text-xl font-bold mb-1 text-center`, { color: theme.colors.foreground }]}>
            {profile.name}
          </Text>
          {profile.username && (
            <Text style={[tw`text-sm mb-1 text-center`, { color: theme.colors.secondary }]}>
              @{profile.username}
            </Text>
          )}
          {profile.location && (
            <Text style={[tw`text-sm text-center`, { color: theme.colors.foreground }]}>
              {profile.location}
            </Text>
          )}
        </View>

        {/* Tabs Under Avatar */}
        <View style={[tw`flex-row border-b`, { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={tw`flex-1 py-3 items-center`}
            onPress={() => setActiveTab('portfolio')}
          >
            <Heart 
              size={20} 
              color={activeTab === 'portfolio' ? theme.colors.secondary : theme.colors.mutedForeground} 
            />
            <Text style={[
              tw`text-xs mt-1`, 
              { color: activeTab === 'portfolio' ? theme.colors.secondary : theme.colors.mutedForeground }
            ]}>
              Portfolio
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw`flex-1 py-3 items-center`}
            onPress={() => setActiveTab('cuts')}
          >
            <Users 
              size={20} 
              color={activeTab === 'cuts' ? theme.colors.secondary : theme.colors.mutedForeground} 
            />
            <Text style={[
              tw`text-xs mt-1`, 
              { color: activeTab === 'cuts' ? theme.colors.secondary : theme.colors.mutedForeground }
            ]}>
              Cuts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={tw`flex-1 py-3 items-center`}
            onPress={() => setActiveTab('services')}
          >
            <History 
              size={20} 
              color={activeTab === 'services' ? theme.colors.secondary : theme.colors.mutedForeground} 
            />
            <Text style={[
              tw`text-xs mt-1`, 
              { color: activeTab === 'services' ? theme.colors.secondary : theme.colors.mutedForeground }
            ]}>
              Services
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* Video Dialog */}
      <Dialog visible={openDialog === 'video'} onClose={() => setOpenDialog(null)}>
        <DialogContent>
          {selectedVideo && (
            <>
              <View style={tw`aspect-video`}>
                <Image
                  source={{ uri: selectedVideo.url }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
              </View>
              <View style={tw`p-4`}>
                <View style={tw`flex-row items-center gap-3 mb-3`}>
                  <Avatar size="md" src={selectedVideo.barber.image} fallback={selectedVideo.barber.name?.charAt(0)} />
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-lg`, { color: theme.colors.foreground }]}>
                      {selectedVideo.title}
                    </Text>
                    <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                      {selectedVideo.barber.name}
                    </Text>
                  </View>
                </View>
                <View style={tw`flex-row items-center justify-around`}>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Eye size={16} color={theme.colors.mutedForeground} />
                    <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                      {selectedVideo.views} views
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Heart size={16} color={theme.colors.mutedForeground} />
                    <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                      {selectedVideo.likes} likes
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Share2 size={16} color={theme.colors.mutedForeground} />
                    <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                      {selectedVideo.shares} shares
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SafeAreaView>
  );
} 