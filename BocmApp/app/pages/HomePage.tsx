// screens/HomePage.tsx
import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import Button from "../components/Button"
import { RootStackParamList } from '../types/types';


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomePage() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-900`}>
      <View style={tw`flex-1 justify-center items-center px-6`}>
        <View style={tw`max-w-3xl`}>
          <Text style={tw`text-4xl font-bold text-white text-center mb-6`}>
            Book Your Next Haircut{'\n'}with Ease
          </Text>
          <Text style={tw`text-xl text-gray-400 text-center mb-8`}>
            Find the perfect barber, book your appointment, and get the look you want.
          </Text>
          <View style={tw`items-center`}>
            <Button onPress={handleGetStarted} size="lg">
              Get Started
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}