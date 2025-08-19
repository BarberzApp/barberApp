import React from 'react';
import { ScrollView, View, ViewStyle, RefreshControl, RefreshControlProps } from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: ViewStyle;
  horizontal?: boolean;
  pagingEnabled?: boolean;
  snapToInterval?: number;
  decelerationRate?: 'fast' | 'normal' | number;
  onScroll?: (event: any) => void;
  scrollEventThrottle?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ScrollArea({
  children,
  className,
  style,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  horizontal = false,
  pagingEnabled = false,
  snapToInterval,
  decelerationRate = 'normal',
  onScroll,
  scrollEventThrottle = 16,
  refreshControl,
  onRefresh,
  refreshing = false,
}: ScrollAreaProps) {
  return (
    <ScrollView
      style={[
        tw`flex-1`,
        { backgroundColor: theme.colors.background },
        style,
      ]}
      contentContainerStyle={[
        tw`flex-grow`,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      horizontal={horizontal}
      pagingEnabled={pagingEnabled}
      snapToInterval={snapToInterval}
      decelerationRate={decelerationRate}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

// Horizontal scroll area
export function ScrollAreaHorizontal({
  children,
  className,
  style,
  contentContainerStyle,
  showsHorizontalScrollIndicator = false,
  pagingEnabled = false,
  snapToInterval,
  decelerationRate = 'normal',
  onScroll,
  scrollEventThrottle = 16,
}: ScrollAreaProps) {
  return (
    <ScrollArea
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      pagingEnabled={pagingEnabled}
      snapToInterval={snapToInterval}
      decelerationRate={decelerationRate}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      style={style}
    >
      {children}
    </ScrollArea>
  );
}

// Vertical scroll area
export function ScrollAreaVertical({
  children,
  className,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  onScroll,
  scrollEventThrottle = 16,
  refreshControl,
  onRefresh,
  refreshing = false,
}: ScrollAreaProps) {
  return (
    <ScrollArea
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      refreshControl={refreshControl}
      style={style}
    >
      {children}
    </ScrollArea>
  );
} 