import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { Button } from '../shared/components/ui';
import { theme } from '../shared/lib/theme';
import { ArrowRight, Sparkles } from 'lucide-react-native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animated Text Component
const AnimatedText = ({ text, delay = 0, style }: { text: string; delay?: number; style?: any }) => {
  const animatedValues = useRef(text.split('').map(() => new Animated.Value(0))).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const animations = text.split('').map((_, index) =>
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 100,
        delay: delay + index * 50,
        useNativeDriver: true,
      })
    );

    Animated.stagger(50, animations).start();
  }, [mounted]);

  return (
    <View style={tw`flex-row flex-wrap justify-center`}>
      {text.split('').map((char, index) => (
        <Animated.Text
          key={index}
          style={[
            style,
            {
              opacity: animatedValues[index],
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {char === ' ' ? '\u00A0' : char}
        </Animated.Text>
      ))}
    </View>
  );
};

// Gradient Background Component
const GradientBackground = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 209, 128, 0.1)', 'rgba(255, 209, 128, 0.05)'],
  });

  return (
    <Animated.View
      style={[
        tw`absolute inset-0`,
        { backgroundColor },
      ]}
    />
  );
};

// Floating Icon Component
const FloatingIcon = ({ icon: Icon, delay = 0 }: { icon: any; delay?: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={[
        tw`absolute`,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Icon size={24} color={theme.colors.secondary} />
    </Animated.View>
  );
};

export default function HomePage() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content appearance for better animation timing
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('SignUp' as never);
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Animated Background */}
      <GradientBackground />
      
      {/* Floating Icons */}
      <FloatingIcon icon={Sparkles} delay={0} />
      <FloatingIcon icon={Sparkles} delay={1000} />
      <FloatingIcon icon={Sparkles} delay={2000} />
      
      {/* Main Content */}
      <View style={tw`flex-1 justify-center items-center px-8`}>
        {/* Logo/Icon */}
        <View style={tw`mb-12 items-center`}>
          <View style={[
            tw`w-24 h-24 rounded-full items-center justify-center mb-6`,
            { backgroundColor: `${theme.colors.secondary}20` }
          ]}>
            <Image
              source={require('../../assets/images/BocmLogo.png')}
              style={tw`w-16 h-16`}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Animated Title */}
        {showContent && (
          <View style={tw`mb-8`}>
            <AnimatedText
              text="Welcome to"
              delay={0}
              style={[tw`text-2xl font-medium text-center`, { color: theme.colors.mutedForeground }]}
            />
            <AnimatedText
              text="BOCM"
              delay={800}
              style={[tw`text-5xl font-bold text-center mt-2`, { color: theme.colors.secondary }]}
            />
          </View>
        )}

        {/* Subtitle */}
        {showContent && (
          <AnimatedText
            text="The future of barbering is here"
            delay={1600}
            style={[tw`text-lg text-center mb-12`, { color: theme.colors.mutedForeground }]}
          />
        )}

        {/* Action Buttons */}
        {showContent && (
          <View style={tw`w-full space-y-4`}>
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[
                tw`w-full py-4 rounded-2xl flex-row items-center justify-center`,
                { backgroundColor: theme.colors.secondary }
              ]}
            >
              <Text style={[tw`text-lg font-semibold mr-2`, { color: theme.colors.background }]}>
                Get Started
              </Text>
              <ArrowRight size={20} color={theme.colors.background} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              style={[
                tw`w-full py-4 rounded-2xl border-2 flex-row items-center justify-center`,
                { borderColor: theme.colors.secondary, backgroundColor: 'transparent' }
              ]}
            >
              <Text style={[tw`text-lg font-semibold`, { color: theme.colors.secondary }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Text */}
        {showContent && (
          <View style={tw`absolute bottom-12 items-center`}>
            <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
              Join cosmetologists and clients
            </Text>
            <Text style={[tw`text-sm text-center mt-1`, { color: theme.colors.mutedForeground }]}>
              revolutionizing the beauty industry
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Type definitions
type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
};