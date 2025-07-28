import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, TextInput, Share, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, User, Calendar } from 'lucide-react-native';
import { supabase } from '../shared/lib/supabase';
import { useAuth } from '../shared/hooks/useAuth';
import { theme } from '../shared/lib/theme';

const { height } = Dimensions.get('window');
const SPECIALTIES = [
  { id: 'all', label: 'For You' },
  { id: 'barber', label: 'Barber' },
  { id: 'braider', label: 'Braider' },
  { id: 'stylist', label: 'Stylist' },
  { id: 'nails', label: 'Nails' },
  { id: 'lash', label: 'Lash' },
  { id: 'brow', label: 'Brow' },
  { id: 'tattoo', label: 'Tattoo' },
  { id: 'piercings', label: 'Piercings' },
  { id: 'dyeing', label: 'Dyeing' },
];

const CutsPage = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [cuts, setCuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [likeState, setLikeState] = useState<{ [id: string]: boolean }>({});
  const [commentModal, setCommentModal] = useState(false);
  const [selectedCut, setSelectedCut] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [shareModal, setShareModal] = useState(false);
  const videoRefs = useRef<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchCuts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('cuts')
        .select(`*, barbers:barber_id(user_id, profiles:user_id(username, name, location, avatar_url))`)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      // Map barber_name, location, and avatar to the joined profile data
      const cutsWithBarber = (data || []).map((cut: any) => ({
        ...cut,
        barber_name: cut.barbers?.profiles?.username || cut.barbers?.profiles?.name || 'Barber',
        location: cut.barbers?.profiles?.location || 'Location',
        avatar_url: cut.barbers?.profiles?.avatar_url || null,
      }));
      setCuts(cutsWithBarber);
      
      // Load initial like states for the current user
      if (user) {
        const { data: likeData } = await supabase
          .from('cut_analytics')
          .select('cut_id')
          .eq('user_id', user.id)
          .eq('action_type', 'like');
        
        const initialLikeState: { [id: string]: boolean } = {};
        likeData?.forEach(like => {
          initialLikeState[like.cut_id] = true;
        });
        setLikeState(initialLikeState);
      }
      
      setLoading(false);
    };
    fetchCuts();
  }, [user]);

  // Handle navigation to specific video
  useEffect(() => {
    // Check for selectedCutId from global state (set by BrowsePage)
    const globalSelectedCutId = (global as any).selectedCutId;
    const params = route.params as any;
    const selectedCutId = params?.selectedCutId || globalSelectedCutId;
    
    if (selectedCutId && cuts.length > 0) {
      const selectedIndex = cuts.findIndex(cut => cut.id === selectedCutId);
      if (selectedIndex !== -1 && flatListRef.current) {
        // Scroll to the selected video after a short delay to ensure the list is rendered
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
        
        // Clear the global variable after using it
        if (globalSelectedCutId) {
          (global as any).selectedCutId = undefined;
        }
      }
    }
  }, [cuts, route.params]);

  // Filter cuts by category
  const filteredCuts = category === 'all'
    ? cuts
    : cuts.filter(cut =>
        (cut.specialties || [])
          .map((s: string) => s.toLowerCase())
          .includes(category)
      );

  // Like handler with proper analytics tracking
  const handleLike = async (cut: any) => {
    if (!user) return;
    
    const isLiked = likeState[cut.id];
    setLikeState(prev => ({ ...prev, [cut.id]: !prev[cut.id] }));
    
    if (isLiked) {
      // Unlike: remove from analytics
      await supabase
        .from('cut_analytics')
        .delete()
        .eq('cut_id', cut.id)
        .eq('user_id', user.id)
        .eq('action_type', 'like');
      
      // Decrease like count
      await supabase
        .from('cuts')
        .update({ likes: Math.max(0, (cut.likes || 0) - 1) })
        .eq('id', cut.id);
    } else {
      // Like: add to analytics
      await supabase
        .from('cut_analytics')
        .insert({ 
          cut_id: cut.id, 
          user_id: user.id, 
          action_type: 'like' 
        });
      
      // Increase like count
      await supabase
        .from('cuts')
        .update({ likes: (cut.likes || 0) + 1 })
        .eq('id', cut.id);
    }
  };

  // Comment modal logic
  const openComments = async (cut: any) => {
    setSelectedCut(cut);
    setCommentModal(true);
    // Fetch comments (minimal)
    const { data } = await supabase
      .from('cut_comments')
      .select('*')
      .eq('cut_id', cut.id)
      .order('created_at', { ascending: false });
    setComments(data || []);
  };
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedCut) return;
    await supabase
      .from('cut_comments')
      .insert({ cut_id: selectedCut.id, user_id: user?.id, comment: newComment.trim() });
    setComments([{ comment: newComment, id: Date.now().toString() }, ...comments]);
    setNewComment('');
  };

  // Share handler
  const handleShare = async (cut: any) => {
    try {
      await Share.share({ message: `Check out this cut: ${cut.title}` });
    } catch (e) {
      Alert.alert('Error', 'Could not share');
    }
  };

  // Book handler (placeholder)
  const handleBook = (cut: any) => {
    Alert.alert('Book', 'Booking feature coming soon!');
  };

  // Navigate to For You page
  const handleGoToForYou = () => {
    setCategory('all');
  };

  // Navigate to barber profile
  const handleBarberPress = (cut: any) => {
    // Get the barber's user_id from the cut data
    const barberUserId = cut.barbers?.user_id;
    if (barberUserId) {
      // Navigate to ProfilePreview
      (navigation as any).navigate('ProfilePreview', { barberId: barberUserId });
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.cutContainer}>
      <Video
        ref={ref => { videoRefs.current[index] = ref; }}
        source={{ uri: item.url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        useNativeControls={false}
        shouldPlay={index === 0}
        isLooping
        isMuted
      />
      {/* Side Action Buttons Overlay */}
      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.sideButton} onPress={() => handleLike(item)}>
          <Heart color={likeState[item.id] ? '#ff4444' : '#fff'} size={28} />
          <Text style={styles.sideText}>{(item.likes || 0) + (likeState[item.id] ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideButton} onPress={() => openComments(item)}>
          <MessageCircle color="#fff" size={28} />
          <Text style={styles.sideText}>{item.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideButton} onPress={() => handleShare(item)}>
          <Share2 color="#fff" size={28} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={() => handleBook(item)}>
          <View style={styles.bookButtonBackground}>
            <Calendar color="#000" size={24} />
          </View>
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <TouchableOpacity 
          style={[
            styles.profileRow,
            { backgroundColor: 'rgba(255,255,255,0.1)' }
          ]}
          onPress={() => handleBarberPress(item)}
          activeOpacity={0.5}
        >
          {item.avatar_url ? (
            <Image 
              source={{ uri: item.avatar_url }} 
              style={styles.avatarImage}
            />
          ) : (
            <User color="#fff" size={24} />
          )}
          <Text style={styles.barberName}>{item.barber_name}</Text>
        </TouchableOpacity>
        <Text style={styles.cutTitle}>{item.title}</Text>
        <Text style={styles.specialtyBadge}>{item.location || 'Location'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading cuts...</Text>
      </View>
    );
  }

  if (filteredCuts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noCuts}>No cuts with this tag.</Text>
        <TouchableOpacity 
          style={styles.forYouButton} 
          onPress={handleGoToForYou}
        >
          <Text style={styles.forYouButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Overlay Filter Bar */}
      <View style={styles.filterBarOverlay}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterBar, { backgroundColor: 'transparent' }]} contentContainerStyle={{ alignItems: 'center' }}>
          {SPECIALTIES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.filterButton,
                category === s.id && styles.filterButtonActive
              ]}
              onPress={() => setCategory(s.id)}
            >
              <Text style={[
                styles.filterText,
                category === s.id && styles.filterTextActive
              ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        ref={flatListRef}
        data={filteredCuts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: height }}
      />
      {/* Comments Modal */}
      <Modal visible={commentModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comments</Text>
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              style={styles.commentsList}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commenterName}>
                    {item.user_name && item.user_name.length > 20 
                      ? `${item.user_name.substring(0, 20)}...` 
                      : item.user_name || 'Anonymous'}
                  </Text>
                <Text style={styles.commentText}>{item.comment}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet.</Text>}
            />
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.commentButton}>
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCommentModal(false)} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cutContainer: { height: height - 80, justifyContent: 'flex-end', backgroundColor: theme.colors.background },
  video: { ...StyleSheet.absoluteFillObject },
  sideActions: { position: 'absolute', right: 16, top: 400, zIndex: 20, alignItems: 'center' },
  sideButton: { marginBottom: 24, alignItems: 'center' },
  sideText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  bookButton: { marginBottom: 24, alignItems: 'center' },
  bookButtonBackground: { 
    backgroundColor: theme.colors.secondary, 
    borderRadius: 20, 
    padding: 12, 
    paddingVertical: 52,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 5,
    maxWidth: '70%',
  },
  profileRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  avatarImage: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  barberName: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },
  cutTitle: { color: '#fff', fontSize: 16, marginBottom: 4 },
  specialtyBadge: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { color: '#fff', marginLeft: 6, fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.secondary, fontSize: 18 },
  noCuts: { color: '#888', fontSize: 18, textAlign: 'center', padding: 24 },
  forYouButton: { 
    backgroundColor: theme.colors.secondary, 
    borderRadius: 20, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    marginTop: 16,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  forYouButtonText: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 16, 
    textAlign: 'center',
  },
  filterBar: { paddingVertical: 12, paddingHorizontal: 8, backgroundColor: 'transparent' },
  filterBarOverlay: {
    position: 'absolute',
    top: 45,
    left: 45,
    right: 0,
    zIndex: 10,
    paddingTop: 0,
  },
  filterButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', marginRight: 8 },
  filterButtonActive: { backgroundColor: theme.colors.secondary },
  filterText: { color: '#fff', fontWeight: 'bold' },
  filterTextActive: { color: theme.colors.primary },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)' 
  },
  modalContent: { 
    backgroundColor: theme.colors.background, 
    borderRadius: 24, 
    padding: 32, 
    alignItems: 'center', 
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { 
    color: theme.colors.secondary, 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginBottom: 16,
    textAlign: 'center',
  },
  commentsList: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 20,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commenterName: {
    color: theme.colors.secondary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: { 
    color: '#fff', 
    fontSize: 15, 
    lineHeight: 20,
  },
  noCommentsText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentInput: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    color: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    width: '100%', 
    marginBottom: 20,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  commentButton: { 
    backgroundColor: theme.colors.secondary, 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 32, 
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  commentButtonText: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 16,
  },
  closeButtonContainer: {
    alignItems: 'center',
  },
  closeButton: { 
    color: theme.colors.secondary, 
    fontWeight: 'bold', 
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CutsPage; 