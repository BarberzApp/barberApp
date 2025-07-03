// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import FindBarberPage from '../pages/FindBarberPage';
import BookingCalendarPage from '../pages/BookingCalendarPage';
import BarberOnboardingPage from '../pages/BarberOnboardingPage';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomePage} options={{ headerShown: false }}/>
        <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }}/>
        <Stack.Screen name="SignUp" component={SignUpPage} options={{ headerShown: false }}/>
        <Stack.Screen name="FindBarber" component={FindBarberPage} options={{ headerShown: false }}/>
        <Stack.Screen name="BookingCalendar" component={BookingCalendarPage} options={{ headerShown: false }}/>
        <Stack.Screen name="BarberOnboarding" component={BarberOnboardingPage} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;