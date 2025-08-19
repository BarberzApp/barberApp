import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { theme } from '../lib/theme';

interface ActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
  icon?: boolean;
  style?: any;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onPress, 
  icon = false,
  style = {},
  disabled = false,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  
  const isPrimary = variant === 'primary';

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    if (isPrimary) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        ...theme.animations.spring.MEDIUM,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    onPress();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 1}
      style={[
        {
          width: '100%',
          height: 56,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 16,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ scale: scaleValue }],
        }}
      >
        {isPrimary ? (
          // Primary button with gradient
          <LinearGradient
            colors={theme.gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 24,
              shadowColor: theme.colors.secondary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: theme.colors.background,
                marginRight: icon ? 12 : 0,
              }}
            >
              {children}
            </Text>
            {icon && (
              <Animated.View
                style={{
                  transform: [{
                    translateX: glowOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 4],
                    }),
                  }],
                }}
              >
                <ArrowRight size={24} color={theme.colors.background} />
              </Animated.View>
            )}
          </LinearGradient>
        ) : (
          // Secondary button with glass effect
          <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                paddingHorizontal: 24,
                borderWidth: 2,
                borderColor: theme.colors.secondary,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: theme.colors.secondary,
                  marginRight: icon ? 12 : 0,
                }}
              >
                {children}
              </Text>
              {icon && (
                <Animated.View
                  style={{
                    transform: [{
                      translateX: glowOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 4],
                      }),
                    }],
                  }}
                >
                  <ArrowRight size={24} color={theme.colors.secondary} />
                </Animated.View>
              )}
            </View>
          </View>
        )}

        {/* Glow effect for primary button */}
        {isPrimary && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
              backgroundColor: theme.colors.secondary,
              opacity: glowOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.2],
              }),
              shadowColor: theme.colors.secondary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
              shadowRadius: 20,
              elevation: glowOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 16],
              }),
            }}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};
