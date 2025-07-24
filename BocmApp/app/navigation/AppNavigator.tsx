// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import {Home, Search, Settings as SettingsIcon, Calendar, Video, User } from 'lucide-react-native';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import FindBarberPage from '../pages/FindBarberPage';
import BookingCalendarPage from '../pages/BookingCalendarPage';
import BarberOnboardingPage from '../pages/BarberOnboardingPage';
import EmailConfirmationScreen from '../pages/EmailConfirmationScreen';
import BookingSuccessPage from '../pages/BookingSuccessPage';
import SettingsPage from '../pages/SettingsPage';
import TermsPage from '../pages/TermsPage';
import tw from 'twrnc';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import CalendarPage from '../pages/CalendarPage';
import CutsPage from '../pages/CutsPage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GlassyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={[
        tw`absolute left-0 right-0 bottom-0 flex-row items-center justify-between px-6 pt-2 pb-5`,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: 'rgba(30, 24, 44, 0.85)', borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' }
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        let label: string;
        if (typeof options.tabBarLabel === 'string') {
          label = options.tabBarLabel;
        } else if (typeof options.title === 'string') {
          label = options.title;
        } else {
          label = route.name;
        }
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        let IconComponent = Home;
        if (route.name === 'Home') IconComponent = Home;
        if (route.name === 'Browse') IconComponent = Search;
        if (route.name === 'Settings') IconComponent = SettingsIcon;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tw`flex-1 items-center`}
          >
            <IconComponent
              size={28}
              color={isFocused ? '#FFD180' : '#fff'}
              style={tw`${isFocused ? 'drop-shadow-lg' : ''}`}
            />
            <Text
              style={tw`${isFocused ? 'text-[#FFD180]' : 'text-white/70'} text-xs font-semibold mt-1`}
            >
              {label}
            </Text>
            {isFocused && <View style={tw`h-1 w-6 rounded-full bg-[#FFD180] mt-1`} />}
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(30, 24, 44, 0.85)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          elevation: 0,
        },
      }}
      tabBar={props => <GlassyTabBar {...props} />}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarPage}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />, 
        }}
      />
      <Tab.Screen
        name="Cuts"
        component={CutsPage}
        options={{
          tabBarIcon: ({ color, size }) => <Video color={color} size={size} />, 
        }}
      />
      <Tab.Screen
        name="Search"
        component={FindBarberPage}
        options={{
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />, 
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsPage}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />, 
        }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="SignUp" component={SignUpPage} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="BookingCalendar" component={BookingCalendarPage} />
        <Stack.Screen name="BarberOnboarding" component={BarberOnboardingPage} />
        <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
        <Stack.Screen name="Terms" component={TermsPage} />
        <Stack.Screen name="Settings" component={SettingsPage} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccessPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;