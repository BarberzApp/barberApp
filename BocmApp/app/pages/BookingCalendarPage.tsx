import React, { useState } from 'react';
import {
    View,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../types/types';
import { theme } from '../lib/theme';

type BookingPageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingCalendar'>;
type BookingPageRouteProp = RouteProp<RootStackParamList, 'BookingCalendar'>;

export default function BookingCalendarPage() {
    const navigation = useNavigation<BookingPageNavigationProp>();
    const route = useRoute<BookingPageRouteProp>();
    const { barberId } = route.params;
    const [loading, setLoading] = useState(true);

    const BOOKING_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
    const bookingUrl = `${BOOKING_BASE_URL}/book/${barberId}`;

    console.log('[BookingCalendarPage] Booking URL:', bookingUrl);

    const handleWebViewError = (error: any) => {
        console.error('WebView error:', error);
        Alert.alert(
            'Error',
            'Failed to load booking page. Please check your internet connection and try again.',
            [
                {
                    text: 'Go Back',
                    onPress: () => navigation.goBack(),
                },
                {
                    text: 'Retry',
                    onPress: () => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 100);
                    },
                },
            ]
        );
    };

    const handleNavigationStateChange = (navState: any) => {
        if (navState.url.includes('/booking/success')) {
            // navigation.navigate('BookingSuccess'); // This screen is not in RootStackParamList
        }
    };

    const handleMessage = (event: any) => {
        const data = JSON.parse(event.nativeEvent.data);
        
        switch (data.type) {
            case 'booking_success':
                // navigation.navigate('BookingSuccess'); // This screen is not in RootStackParamList
                break;
            case 'booking_cancelled':
                navigation.goBack();
                break;
            case 'error':
                Alert.alert('Error', data.message);
                break;
        }
    };

    return (
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[tw`px-5 py-4 flex-row items-center`, { backgroundColor: theme.colors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mr-4`}>
                    <Icon name="arrow-left" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <View style={tw`flex-1`}>
                <WebView
                    source={{ uri: bookingUrl }}
                    style={tw`flex-1`}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={handleWebViewError}
                    onNavigationStateChange={handleNavigationStateChange}
                    onMessage={handleMessage}
                    // Enable JavaScript
                    javaScriptEnabled={true}
                    // Enable DOM storage
                    domStorageEnabled={true}
                    // Allow file uploads
                    allowsInlineMediaPlayback={true}
                    // Handle back button
                    allowsBackForwardNavigationGestures={true}
                    // Inject JavaScript to communicate with the app
                    injectedJavaScript={`
                        // Add event listeners for booking events
                        window.addEventListener('booking-success', (event) => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'booking_success',
                                data: event.detail
                            }));
                        });
                        
                        window.addEventListener('booking-cancelled', () => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'booking_cancelled'
                            }));
                        });
                        
                        window.addEventListener('booking-error', (event) => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'error',
                                message: event.detail.message
                            }));
                        });
                        
                        true; // Required for injectedJavaScript
                    `}
                />

                {/* Loading Overlay */}
                {loading && (
                    <View style={[
                        tw`absolute inset-0 items-center justify-center`,
                        { backgroundColor: 'rgba(0,0,0,0.5)' }
                    ]}>
                        <ActivityIndicator size="large" color={theme.colors.secondary} />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}