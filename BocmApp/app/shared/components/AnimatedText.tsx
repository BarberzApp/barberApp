import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { theme } from '../lib/theme';

interface AnimatedTextProps {
  text: string;
  type?: 'welcome' | 'title' | 'tagline';
  delay?: number;
  style?: any;
}

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'title':
      return {
        fontSize: 72,
        fontFamily: theme.typography.fontFamily.bebas[0],
        letterSpacing: -1.44,
        lineHeight: 79.2,
        textAlign: 'center' as const,
        color: theme.colors.secondary, // Use saffron color for title
      };
    case 'welcome':
      return {
        fontSize: 28,
        fontWeight: '500' as const,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 0.28,
        textAlign: 'center' as const,
      };
    case 'tagline':
      return {
        fontSize: 22,
        fontWeight: '500' as const,
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 0.11,
        textAlign: 'center' as const,
      };
    default:
      return {
        fontSize: 18,
        fontWeight: '400' as const,
        color: theme.colors.mutedForeground,
        textAlign: 'center' as const,
      };
  }
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  text, 
  type = 'welcome', 
  delay = 0,
  style = {}
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const animatedValues = useRef(text.split('').map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible) {
      const animations = text.split('').map((_, index) =>
        Animated.spring(animatedValues[index], {
          toValue: 1,
          delay: delay + index * theme.animations.timing.CHARACTER_DELAY,
          ...theme.animations.spring.TIGHT,
          useNativeDriver: true,
        })
      );

      Animated.stagger(theme.animations.timing.CHARACTER_DELAY, animations).start();
    }
  }, [isVisible]);

  const typeStyles = getTypeStyles(type);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {text.split('').map((char, index) => {
        const animatedStyle = {
          opacity: animatedValues[index],
          transform: [
            {
              translateY: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: type === 'title' ? [50, 0] : [30, 0],
              }),
            },
            {
              scale: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: type === 'title' ? [0.3, 1] : [0.8, 1],
              }),
            },
          ],
        };

        const textStyle = [
          typeStyles,
          style,
          animatedStyle,
        ];

        return (
          <Animated.View key={index} style={{ marginHorizontal: type === 'title' ? 2 : 0 }}>
            <Animated.Text style={textStyle}>
              {char === ' ' ? '\u00A0' : char}
            </Animated.Text>
          </Animated.View>
        );
      })}
    </View>
  );
};
