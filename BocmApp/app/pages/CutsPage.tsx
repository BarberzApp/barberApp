import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Modal, TextInput, Share, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, User, Calendar } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

const { height } = Dimensions.get('window');
const SPECIALTIES = [
  { id: 'all', label: 'For You' },
  { id: 'fades', label: 'Fades' },
  { id: 'beard', label: 'Beard' },
  { id: 'kids', label: 'Kids' },
  // ...add more specialties as needed
];

const CutsPage = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchCuts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('cuts')
        .select(`*, barbers:barber_id(user_id, profiles:user_id(username, name))`)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      // Map barber_name to the joined profile username or name
      const cutsWithBarber = (data || []).map((cut: any) => ({
        ...cut,
        barber_name: cut.barbers?.profiles?.username || cut.barbers?.profiles?.name || 'Barber',
      }));
      setCuts(cutsWithBarber);
      setLoading(false);
    };
    fetchCuts();
  }, []);

  // Filter cuts by category
  const filteredCuts = category === 'all'
    ? cuts
    : cuts.filter(cut =>
        (cut.specialties || [])
          .map((s: string) => s.toLowerCase())
          .includes(category)
      );

  // Like handler (local + minimal Supabase update)
  const handleLike = async (cut: any) => {
    setLikeState(prev => ({ ...prev, [cut.id]: !prev[cut.id] }));
    // Optionally update Supabase here
    await supabase
      .from('cuts')
      .update({ likes: (cut.likes || 0) + (likeState[cut.id] ? -1 : 1) })
      .eq('id', cut.id);
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
          <Heart color={likeState[item.id] ? theme.colors.saffron : '#fff'} size={28} />
          <Text style={styles.sideText}>{(item.likes || 0) + (likeState[item.id] ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideButton} onPress={() => openComments(item)}>
          <MessageCircle color="#fff" size={28} />
          <Text style={styles.sideText}>{item.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideButton} onPress={() => handleShare(item)}>
          <Share2 color="#fff" size={28} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideButton} onPress={() => handleBook(item)}>
          <Calendar color={theme.colors.secondary} size={28} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.profileRow}>
          <User color={theme.colors.secondary} size={24} />
          <Text style={styles.barberName}>{item.barber_name}</Text>
        </View>
        <Text style={styles.cutTitle}>{item.title}</Text>
        <Text style={styles.specialtyBadge}>{(item.specialties && item.specialties[0]) || 'General'}</Text>
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
        <Text style={styles.noCuts}>No cuts found. Be the first to upload!</Text>
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
        data={filteredCuts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: height }}
      />
      {/* Comments Modal */}
      <Modal visible={commentModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comments</Text>
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Text style={styles.commentText}>{item.comment}</Text>
              )}
              ListEmptyComponent={<Text style={styles.commentText}>No comments yet.</Text>}
            />
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.commentButton}>
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCommentModal(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cutContainer: { height: height - 64, justifyContent: 'flex-end', backgroundColor: theme.colors.background },
  video: { ...StyleSheet.absoluteFillObject },
  sideActions: { position: 'absolute', right: 16, top: 100, zIndex: 20, alignItems: 'center' },
  sideButton: { marginBottom: 24, alignItems: 'center' },
  sideText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  infoContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 5,
    maxWidth: '70%',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  barberName: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },
  cutTitle: { color: '#fff', fontSize: 16, marginBottom: 4 },
  specialtyBadge: { color: theme.colors.saffron, fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { color: '#fff', marginLeft: 6, fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.secondary, fontSize: 18 },
  noCuts: { color: '#888', fontSize: 18, textAlign: 'center', padding: 24 },
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
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, alignItems: 'center', width: '80%' },
  modalTitle: { color: theme.colors.secondary, fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
  commentText: { color: '#fff', fontSize: 15, marginBottom: 6 },
  commentInput: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 8, width: '100%', marginBottom: 8 },
  commentButton: { backgroundColor: theme.colors.secondary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24, marginBottom: 8 },
  commentButtonText: { color: theme.colors.primary, fontWeight: 'bold' },
  closeButton: { color: theme.colors.secondary, marginTop: 16, fontWeight: 'bold', fontSize: 16 },
});

export default CutsPage; 