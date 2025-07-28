import React from 'react';
import { View, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import tw from 'twrnc';
import { theme } from '../../lib/theme';

interface SkeletonProps {
  className?: string;
  style?: any;
  children?: React.ReactNode;
}

interface SkeletonItemProps {
  className?: string;
  style?: any;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({ className, style, children }: SkeletonProps) {
  return (
    <View style={[tw`animate-pulse`, style]}>
      {children}
    </View>
  );
}

export function SkeletonItem({ 
  className, 
  style, 
  width = '100%', 
  height = 20, 
  borderRadius = 4 
}: SkeletonItemProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Predefined skeleton components
export function SkeletonText({ lines = 1, className, style }: { lines?: number; className?: string; style?: any }) {
  return (
    <View style={[tw`space-y-2`, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonItem
          key={index}
          height={16}
          width={index === lines - 1 ? '80%' : '100%'}
          style={style}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40, className, style }: { size?: number; className?: string; style?: any }) {
  return (
    <SkeletonItem
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

export function SkeletonButton({ className, style }: { className?: string; style?: any }) {
  return (
    <SkeletonItem
      height={40}
      borderRadius={8}
      style={style}
    />
  );
}

export function SkeletonCard({ className, style }: { className?: string; style?: any }) {
  return (
    <View style={[tw`p-4 space-y-3`, { backgroundColor: theme.colors.card }, style]}>
      <SkeletonAvatar size={48} />
      <SkeletonText lines={2} />
      <SkeletonButton />
    </View>
  );
} 