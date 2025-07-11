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
import { Scissors } from 'lucide-react-native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomePage() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.primary }]}>
      <View style={tw`flex-1 justify-center items-center px-6`}>
        <Card style={[
          tw`w-full max-w-md`,
          { 
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.xl * 1.5, // 24px
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            shadowColor: theme.shadows.lg.shadowColor,
            shadowOpacity: theme.shadows.lg.shadowOpacity,
            shadowRadius: theme.shadows.lg.shadowRadius,
            elevation: theme.shadows.lg.elevation
          }
        ]}>
          <CardContent style={tw`items-center px-8 py-12`}>
            <View style={tw`items-center mb-8`}>
              <Scissors size={48} color={theme.colors.secondary} style={tw`mb-4`} />
              <Text style={[
                tw`text-4xl font-bold text-center mb-3`,
                { color: theme.colors.secondary}
              ]}>
                BOCM
              </Text>
              <Text style={tw`text-xl text-center text-white/80 leading-7`}>
                Book Your Next Haircut{'\n'}with Ease
              </Text>
            </View>
            
            <Text style={tw`text-base text-center text-white/60 mb-10 leading-6 px-4`}>
              Find the perfect barber, book your appointment, and get the look you want.
            </Text>
            
            <View style={tw`w-full gap-4`}>
              <Button 
                onPress={handleGetStarted} 
                size="lg" 
                style={[
                  tw`w-full`,
                  { backgroundColor: theme.colors.secondary, height: 48 }
                ]}
                textStyle={{ color: theme.colors.primary, fontSize: theme.typography.fontSizes.lg }}
              >
                Get Started
              </Button>
              
              <Button 
                onPress={() => navigation.navigate('SignUp')} 
                size="lg" 
                variant="outline"
                style={[
                  tw`w-full`,
                  { 
                    borderColor: theme.colors.secondary,
                    borderWidth: 2,
                    height: 48,
                    backgroundColor: 'transparent'
                  }
                ]}
                textStyle={{ color: theme.colors.secondary, fontSize: theme.typography.fontSizes.lg }}
              >
                Create Account
              </Button>
            </View>
            
            <Text style={tw`text-sm text-white/50 text-center mt-8`}>
              By continuing, you agree to our{' '}
              <Text 
                onPress={() => navigation.navigate('Terms')}
                style={[tw`underline`, { color: theme.colors.secondary }]}
              >
                Terms & Conditions
              </Text>
            </Text>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}