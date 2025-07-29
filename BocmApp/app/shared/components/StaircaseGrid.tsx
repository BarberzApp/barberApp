import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import tw from 'twrnc';
import { theme } from '../lib/theme';


const { width: screenWidth } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const COLUMN_WIDTH = (screenWidth - 32 - (COLUMN_COUNT - 1) * 4) / COLUMN_COUNT; // 32px padding, 4px gap

interface Post {
  id: string;
  type: 'video' | 'image';
  url: string;
  thumbnail?: string;
  title?: string;
  barberName: string;
  barberAvatar?: string;
  barberId?: string; // Add barber ID for navigation
  likes: number;
  views?: number;
  duration?: number;
  aspectRatio?: number;
}

interface StaircaseGridProps {
  posts: Post[];
  onVideoPress?: (post: Post) => void;
  onImagePress?: (post: Post) => void;
}

interface GridItem {
  id: string;
  post: Post;
  columnIndex: number;
  rowIndex: number;
  height: number;
  width: number;
  isVideo: boolean;
}

export default function StaircaseGrid({
  posts,
  onVideoPress,
  onImagePress,
}: StaircaseGridProps) {
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // Calculate grid layout
  useEffect(() => {
    const items: GridItem[] = [];
    const columnHeights = [0, 0, 0]; // Track height of each column

    posts.forEach((post, index) => {
      const isVideo = post.type === 'video';
      
      // Calculate item dimensions
      const itemWidth = COLUMN_WIDTH;
      const itemHeight = itemWidth; // Square items for images
      
      // For videos, they take up exactly 2 square spaces
      const videoHeight = itemHeight * 2;
      
      // Find the shortest column
      let targetColumn = 0;
      let minHeight = columnHeights[0];
      
      for (let i = 1; i < COLUMN_COUNT; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          targetColumn = i;
        }
      }
      
      // Create grid item
      const gridItem: GridItem = {
        id: post.id,
        post,
        columnIndex: targetColumn,
        rowIndex: Math.floor(columnHeights[targetColumn] / itemHeight),
        height: isVideo ? videoHeight : itemHeight,
        width: itemWidth,
        isVideo,
      };
      
      items.push(gridItem);
      
      // Update column height
      columnHeights[targetColumn] += isVideo ? videoHeight : itemHeight;
    });
    
    setGridItems(items);
  }, [posts]);

  const handleVideoPress = (postId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handlePostPress = (item: GridItem) => {
    if (item.isVideo) {
      // For videos, toggle play/pause first, then navigate
      handleVideoPress(item.post.id);
      if (onVideoPress) {
        onVideoPress(item.post);
      }
    } else if (onImagePress) {
      onImagePress(item.post);
    }
  };

    const renderGridItem = ({ item }: { item: GridItem }) => {
    const { post, height, width, isVideo } = item;
    const isPlaying = playingVideos.has(post.id);

    return (
      <TouchableOpacity
        style={[
          tw`mb-1 rounded-lg overflow-hidden`,
          {
            width,
            height,
            backgroundColor: theme.colors.muted,
          },
        ]}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.9}
      >
        <View style={tw`w-full h-full relative`}>
          {/* Video or Image Content */}
          {isVideo ? (
            <Video
              source={{ uri: post.url }}
              style={tw`w-full h-full`}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying}
              isMuted={true}
              isLooping={true}
            />
          ) : (
            <Image
              source={{ uri: post.url }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    return null;
  };

  const handleEndReached = () => {
    // Handle end reached if needed
  };

  return (
    <View style={tw`flex-1`}>
      <FlatList
        ref={flatListRef}
        data={gridItems}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={tw`justify-between`}
        contentContainerStyle={tw`px-4`}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={12}
      />
    </View>
  );
} 