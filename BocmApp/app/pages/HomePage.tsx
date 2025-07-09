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
import { Button, Card, CardContent } from "../components"
import { RootStackParamList } from '../types/types';
import { theme } from '../lib/theme';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomePage() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <View style={tw`flex-1 justify-center items-center px-6`}>
        <Card style={tw`w-full max-w-md`}>
          <CardContent style={tw`items-center py-8`}>
            <View style={tw`items-center mb-6`}>
              <Text style={[tw`text-4xl font-bold text-center mb-2`, { color: theme.colors.primary }]}>
                BOCM
              </Text>
              <Text style={[tw`text-xl text-center`, { color: theme.colors.mutedForeground }]}>
                Book Your Next Haircut{'\n'}with Ease
              </Text>
            </View>
            
            <Text style={[tw`text-base text-center mb-8 leading-relaxed`, { color: theme.colors.mutedForeground }]}>
              Find the perfect barber, book your appointment, and get the look you want.
            </Text>
            
            <View style={tw`w-full space-y-4`}>
              <Button 
                onPress={handleGetStarted} 
                size="lg" 
                variant="default"
                style={tw`w-full`}
              >
                Get Started
              </Button>
              
              <Button 
                onPress={() => navigation.navigate('SignUp')} 
                size="lg" 
                variant="outline"
                style={tw`w-full`}
              >
                Create Account
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}