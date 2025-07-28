import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { ArrowLeft, Calendar, MapPin, Star, Video as VideoIcon } from 'lucide-react-native';
import tw from 'twrnc';
import { theme } from '../shared/lib/theme';
import { supabase } from '../shared/lib/supabase';
import VideoPreview from '../shared/components/VideoPreview';

const { width } = Dimensions.get('window');

interface ProfilePreviewProps {
  route: any;
}

export default function ProfilePreview({ route }: ProfilePreviewProps) {
  const navigation = useNavigation();
  const { barberId } = route.params;
  const [activeTab, setActiveTab] = useState<'cuts' | 'services' | 'posts'>('cuts');
  const [profile, setProfile] = useState<any>(null);
  const [cuts, setCuts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [barberId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', barberId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch barber data
      const { data: barberData } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', barberId)
        .single();

      // Fetch cuts
      const { data: cutsData } = await supabase
        .from('cuts')
        .select('*')
        .eq('barber_id', barberData?.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (cutsData) {
        setCuts(cutsData);
      }

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberData?.id)
        .order('name');

      if (servicesData) {
        setServices(servicesData);
      }

      // For now, posts will be empty (could be portfolio images in the future)
      setPosts([]);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCuts = () => (
    <View style={tw`flex-1`}>
      {cuts.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center py-8`}>
          <VideoIcon size={48} style={[tw`mb-4`, { color: theme.colors.mutedForeground }]} />
          <Text style={[tw`text-lg font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
            No cuts yet
          </Text>
          <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
            Check back later for new content
          </Text>
        </View>
      ) : (
        <FlatList
          data={cuts}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VideoPreview
              videoUrl={item.url}
              title={item.title}
              barberName={profile?.name || 'Unknown'}
              barberAvatar={profile?.avatar_url}
              likes={item.likes || 0}
              width={(width - 32) / 3}
              height={(width - 32) / 3 * 1.5}
            />
          )}
          contentContainerStyle={tw`px-4`}
          columnWrapperStyle={tw`justify-between`}
        />
      )}
    </View>
  );

  const renderServices = () => (
    <View style={tw`flex-1 px-4`}>
      {services.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center py-8`}>
          <Calendar size={48} style={[tw`mb-4`, { color: theme.colors.mutedForeground }]} />
          <Text style={[tw`text-lg font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
            No services available
          </Text>
          <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
            This barber hasn't added any services yet
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {services.map((service) => (
            <View
              key={service.id}
              style={[
                tw`p-4 rounded-xl mb-3`,
                { backgroundColor: 'rgba(255,255,255,0.05)' }
              ]}
            >
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <Text style={[tw`text-lg font-bold`, { color: theme.colors.foreground }]}>
                  {service.name}
                </Text>
                <Text style={[tw`text-lg font-bold`, { color: theme.colors.secondary }]}>
                  ${service.price}
                </Text>
              </View>
              {service.description && (
                <Text style={[tw`text-sm mb-2`, { color: theme.colors.mutedForeground }]}>
                  {service.description}
                </Text>
              )}
              <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                {service.duration} minutes
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderPosts = () => (
    <View style={tw`flex-1 justify-center items-center py-8`}>
      <Image
        source={{ uri: profile?.avatar_url }}
        style={[tw`w-16 h-16 rounded-full mb-4`, { backgroundColor: theme.colors.muted }]}
      />
      <Text style={[tw`text-lg font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
        Portfolio coming soon
      </Text>
      <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
        This barber will be able to showcase their portfolio here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={[tw`mt-4 text-lg`, { color: theme.colors.foreground }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={[tw`text-lg font-bold`, { color: theme.colors.foreground }]}>
            Profile not found
          </Text>
          <TouchableOpacity
            style={[tw`mt-4 px-6 py-2 rounded-lg`, { backgroundColor: theme.colors.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[tw`font-medium`, { color: theme.colors.primary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={tw`px-4 pt-4 pb-2`}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity
            style={tw`mr-3`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={[tw`text-xl font-bold`, { color: theme.colors.foreground }]}>
            Profile
          </Text>
        </View>

        {/* Profile Info */}
        <View style={tw`items-center mb-6`}>
          <Image
            source={{ uri: profile.avatar_url }}
            style={[tw`w-20 h-20 rounded-full mb-3`, { backgroundColor: theme.colors.muted }]}
          />
          <Text style={[tw`text-xl font-bold mb-1`, { color: theme.colors.foreground }]}>
            {profile.name}
          </Text>
          {profile.location && (
            <View style={tw`flex-row items-center mb-2`}>
              <MapPin size={16} color={theme.colors.mutedForeground} />
              <Text style={[tw`ml-1 text-sm`, { color: theme.colors.mutedForeground }]}>
                {profile.location}
              </Text>
            </View>
          )}
          {profile.bio && (
            <Text style={[tw`text-sm text-center px-4`, { color: theme.colors.mutedForeground }]}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={tw`flex-row mb-4`}>
          {[
            { key: 'cuts', label: 'Cuts', count: cuts.length },
            { key: 'services', label: 'Services', count: services.length },
            { key: 'posts', label: 'Posts', count: posts.length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tw`flex-1 py-3 px-4 rounded-lg mr-2`,
                activeTab === tab.key
                  ? { backgroundColor: theme.colors.secondary }
                  : { backgroundColor: 'rgba(255,255,255,0.05)' }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                tw`text-center font-medium`,
                activeTab === tab.key
                  ? { color: theme.colors.primary }
                  : { color: theme.colors.foreground }
              ]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      <View style={tw`flex-1`}>
        {activeTab === 'cuts' && renderCuts()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'posts' && renderPosts()}
      </View>
    </SafeAreaView>
  );
} 