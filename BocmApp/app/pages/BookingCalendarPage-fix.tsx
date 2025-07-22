// screens/BookingCalendarPage.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../types/types';
import { bookingService, Service, TimeSlot } from '../lib/bookingService';
import { stripePaymentService } from '../lib/stripePaymentService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { format, addDays } from 'date-fns';

type BookingPageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingCalendar'>;
type BookingPageRouteProp = RouteProp<RootStackParamList, 'BookingCalendar'>;

export default function BookingCalendarPage() {
    const navigation = useNavigation<BookingPageNavigationProp>();
    const route = useRoute<BookingPageRouteProp>();
    const { barberId, barberName } = route.params;
    const { user } = useAuth();

    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [guestInfo, setGuestInfo] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });
    const [paymentType, setPaymentType] = useState<'fee' | 'full'>('full');
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (selectedDate && selectedService) {
            fetchTimeSlots();
        }
    }, [selectedDate, selectedService]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const servicesData = await bookingService.getBarberServices(barberId);
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            Alert.alert('Error', 'Failed to load services. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeSlots = async () => {
        if (!selectedDate || !selectedService) return;

        try {
            setLoadingSlots(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const slots = await bookingService.getAvailableSlots(
                barberId,
                dateStr,
                selectedService.duration
            );
            setTimeSlots(slots);
        } catch (error) {
            console.error('Error fetching time slots:', error);
            Alert.alert('Error', 'Failed to load available times. Please try again.');
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        // Reset time when service changes
        setSelectedTime('');
    };

    const validateBookingDetails = (): boolean => {
        if (!selectedService || !selectedDate || !selectedTime) {
            Alert.alert('Error', 'Please select a service, date, and time');
            return false;
        }

        if (!user) {
            const errors = stripePaymentService.validateGuestInfo({
                name: guestInfo.name,
                email: guestInfo.email,
                phone: guestInfo.phone
            });

            if (errors.length > 0) {
                Alert.alert('Validation Error', errors.join('\n'));
                return false;
            }
        }

        return true;
    };

    const handleCreateCheckoutSession = async () => {
        if (!validateBookingDetails()) return;

        setBookingLoading(true);
        try {
            const [hours, minutes] = selectedTime.split(':');
            const bookingDate = new Date(selectedDate!);
            bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const paymentData = {
                barberId,
                serviceId: selectedService!.id,
                date: bookingDate.toISOString(),
                servicePrice: selectedService!.price,
                paymentType,
                clientId: user?.id,
                guestName: !user ? guestInfo.name : undefined,
                guestEmail: !user ? guestInfo.email : undefined,
                guestPhone: !user ? guestInfo.phone : undefined,
                notes: guestInfo.notes,
            };

            setShowBookingModal(false);
            Alert.alert(
                'Payment Required',
                `Total: ${getTotalPrice().toFixed(2)}\n\nPayment integration is being configured.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // navigation.navigate('BookingSuccess'); // This screen does not exist in RootStackParamList
                        }
                    }
                ]
            );

            // Option 1: Use native Stripe (after fixing the SDK)
            // navigation.navigate('StripePayment', { paymentData });

            // Option 2: Use WebView payment
            // navigation.navigate('WebViewPayment', { paymentData });
        } catch (error) {
            console.error('Error preparing payment:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process payment');
        } finally {
            setBookingLoading(false);
        }
    };

    const getTotalPrice = () => {
        if (!selectedService) return 0;
        const fees = bookingService.calculateFees(selectedService.price, paymentType);
        return fees.total / 100; // Convert cents to dollars
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const generateCalendarDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = addDays(today, i);
            days.push({
                date,
                dayName: format(date, 'EEE'),
                dayNumber: format(date, 'd'),
                monthName: format(date, 'MMM'),
                isToday: i === 0,
            });
        }
        return days;
    };

    if (loading) {
        return (
            <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color={theme.colors.secondary} />
                    <Text style={[tw`mt-4`, { color: theme.colors.mutedForeground }]}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={tw`px-5 pt-4 pb-6`}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
                        <Icon name="arrow-left" size={24} color={theme.colors.secondary} />
                    </TouchableOpacity>
                    <Text style={[tw`text-3xl font-bold mb-2`, { color: theme.colors.foreground }]}>Book Appointment</Text>
                    <Text style={[tw`text-base`, { color: theme.colors.mutedForeground }]}>with {barberName}</Text>
                </View>

                {/* Services */}
                <View style={tw`px-5 mb-6`}>
                    <Text style={[tw`text-xl font-semibold mb-4`, { color: theme.colors.foreground }]}>Select Service</Text>
                    {services.length === 0 ? (
                        <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                            No services available
                        </Text>
                    ) : (
                        services.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                onPress={() => handleServiceSelect(service)}
                            >
                                <View style={[
                                    tw`rounded-xl p-4 mb-3`,
                                    { backgroundColor: 'rgba(255,255,255,0.05)' },
                                    selectedService?.id === service.id && {
                                        borderWidth: 2,
                                        borderColor: theme.colors.secondary
                                    }
                                ]}>
                                    <View style={tw`flex-row justify-between`}>
                                        <View style={tw`flex-1`}>
                                            <Text style={[tw`text-base font-medium`, { color: theme.colors.foreground }]}>
                                                {service.name}
                                            </Text>
                                            {service.description && (
                                                <Text style={[tw`text-sm mt-1`, { color: theme.colors.mutedForeground }]}>
                                                    {service.description}
                                                </Text>
                                            )}
                                            <Text style={[tw`text-sm mt-2`, { color: theme.colors.mutedForeground }]}>
                                                {service.duration} min • ${service.price.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Date Selection */}
                {selectedService && (
                    <View style={tw`mb-6`}>
                        <Text style={[tw`text-xl font-semibold mb-4 px-5`, { color: theme.colors.foreground }]}>
                            Select Date
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={tw`px-5`}
                        >
                            {generateCalendarDays().map((day, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedDate(day.date)}
                                >
                                    <View style={[
                                        tw`rounded-xl p-3 mr-3 items-center`,
                                        { backgroundColor: 'rgba(255,255,255,0.05)' },
                                        selectedDate?.toDateString() === day.date.toDateString() && {
                                            backgroundColor: theme.colors.secondary
                                        },
                                        day.isToday && {
                                            borderWidth: 1,
                                            borderColor: theme.colors.secondary
                                        }
                                    ]}>
                                        <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                                            {day.dayName}
                                        </Text>
                                        <Text style={[tw`text-lg font-bold my-1`, { color: theme.colors.foreground }]}>
                                            {day.dayNumber}
                                        </Text>
                                        <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                                            {day.monthName}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Time Selection */}
                {selectedService && selectedDate && (
                    <View style={tw`px-5 mb-6`}>
                        <Text style={[tw`text-xl font-semibold mb-4`, { color: theme.colors.foreground }]}>
                            Select Time
                        </Text>
                        {loadingSlots ? (
                            <ActivityIndicator size="small" color={theme.colors.secondary} />
                        ) : timeSlots.filter(slot => slot.available).length === 0 ? (
                            <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                                No available time slots for this date
                            </Text>
                        ) : (
                            <View style={tw`flex-row flex-wrap -mx-1`}>
                                {timeSlots
                                    .filter(slot => slot.available)
                                    .map((slot) => (
                                        <TouchableOpacity
                                            key={slot.time}
                                            onPress={() => setSelectedTime(slot.time)}
                                            style={tw`w-1/3 px-1 mb-2`}
                                        >
                                            <View style={[
                                                tw`rounded-lg py-3 items-center`,
                                                { backgroundColor: 'rgba(255,255,255,0.05)' },
                                                selectedTime === slot.time && {
                                                    backgroundColor: theme.colors.secondary
                                                }
                                            ]}>
                                                <Text style={[tw`text-sm`, { color: theme.colors.foreground }]}>
                                                    {formatTime(slot.time)}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Continue Button */}
                <View style={tw`px-5 pb-8`}>
                    <TouchableOpacity
                        onPress={() => setShowBookingModal(true)}
                        disabled={!selectedService || !selectedDate || !selectedTime}
                    >
                        <View style={[
                            tw`py-4 rounded-full items-center`,
                            { backgroundColor: theme.colors.secondary },
                            (!selectedService || !selectedDate || !selectedTime) && tw`opacity-50`
                        ]}>
                            <Text style={[tw`text-lg font-semibold`, { color: theme.colors.foreground }]}>
                                Continue
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Booking Modal */}
            <Modal
                visible={showBookingModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowBookingModal(false)}
            >
                <View style={tw`flex-1 bg-black/50 justify-end`}>
                    <View style={[tw`rounded-t-3xl p-6`, { backgroundColor: 'rgba(45,35,66,0.95)' }]}>
                        <Text style={[tw`text-xl font-bold mb-6`, { color: theme.colors.foreground }]}>
                            Complete Booking
                        </Text>

                        {/* Booking Summary */}
                        <View style={[tw`p-4 rounded-xl mb-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                            <Text style={[tw`font-semibold mb-2`, { color: theme.colors.secondary }]}>
                                Booking Summary
                            </Text>
                            <View>
                                <View style={tw`flex-row justify-between mb-2`}>
                                    <Text style={{ color: theme.colors.mutedForeground }}>Service:</Text>
                                    <Text style={{ color: theme.colors.foreground }}>
                                        {selectedService?.name}
                                    </Text>
                                </View>
                                <View style={tw`flex-row justify-between mb-2`}>
                                    <Text style={{ color: theme.colors.mutedForeground }}>Date:</Text>
                                    <Text style={{ color: theme.colors.foreground }}>
                                        {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                                    </Text>
                                </View>
                                <View style={tw`flex-row justify-between mb-2`}>
                                    <Text style={{ color: theme.colors.mutedForeground }}>Time:</Text>
                                    <Text style={{ color: theme.colors.foreground }}>
                                        {formatTime(selectedTime)}
                                    </Text>
                                </View>
                                <View style={tw`flex-row justify-between`}>
                                    <Text style={{ color: theme.colors.mutedForeground }}>Duration:</Text>
                                    <Text style={{ color: theme.colors.foreground }}>
                                        {selectedService?.duration} min
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Guest Information */}
                        {!user && (
                            <>
                                <TextInput
                                    style={[
                                        tw`px-4 py-3 rounded-lg mb-3`,
                                        { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                                    ]}
                                    placeholder="Full Name"
                                    placeholderTextColor={theme.colors.mutedForeground}
                                    value={guestInfo.name}
                                    onChangeText={(text) => setGuestInfo({ ...guestInfo, name: text })}
                                />
                                <TextInput
                                    style={[
                                        tw`px-4 py-3 rounded-lg mb-3`,
                                        { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                                    ]}
                                    placeholder="Email"
                                    placeholderTextColor={theme.colors.mutedForeground}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={guestInfo.email}
                                    onChangeText={(text) => setGuestInfo({ ...guestInfo, email: text })}
                                />
                                <TextInput
                                    style={[
                                        tw`px-4 py-3 rounded-lg mb-6`,
                                        { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                                    ]}
                                    placeholder="Phone"
                                    placeholderTextColor={theme.colors.mutedForeground}
                                    keyboardType="phone-pad"
                                    value={guestInfo.phone}
                                    onChangeText={(text) => setGuestInfo({ ...guestInfo, phone: text })}
                                />
                            </>
                        )}

                        {/* Notes */}
                        <TextInput
                            style={[
                                tw`px-4 py-3 rounded-lg mb-6`,
                                { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground, minHeight: 80 }
                            ]}
                            placeholder="Notes (optional)"
                            placeholderTextColor={theme.colors.mutedForeground}
                            value={guestInfo.notes}
                            onChangeText={(text) => setGuestInfo({ ...guestInfo, notes: text })}
                            multiline
                            textAlignVertical="top"
                        />

                        {/* Payment Options */}
                        <View style={tw`mb-6`}>
                            <TouchableOpacity
                                onPress={() => setPaymentType('full')}
                                style={tw`flex-row items-center mb-3`}
                            >
                                <View style={[
                                    tw`w-5 h-5 rounded-full border-2 mr-3`,
                                    paymentType === 'full'
                                        ? { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                                        : { borderColor: theme.colors.mutedForeground }
                                ]} />
                                <Text style={{ color: theme.colors.foreground }}>
                                    Pay full amount (${getTotalPrice().toFixed(2)})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setPaymentType('fee')}
                                style={tw`flex-row items-center`}
                            >
                                <View style={[
                                    tw`w-5 h-5 rounded-full border-2 mr-3`,
                                    paymentType === 'fee'
                                        ? { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                                        : { borderColor: theme.colors.mutedForeground }
                                ]} />
                                <Text style={{ color: theme.colors.foreground }}>
                                    Pay booking fee only ($3.38)
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons */}
                        <View style={tw`flex-row gap-3`}>
                            <TouchableOpacity
                                onPress={() => setShowBookingModal(false)}
                                style={tw`flex-1`}
                            >
                                <View style={[
                                    tw`py-3 rounded-full items-center`,
                                    { backgroundColor: 'rgba(255,255,255,0.1)' }
                                ]}>
                                    <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>
                                        Cancel
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateCheckoutSession}
                                disabled={bookingLoading}
                                style={tw`flex-1`}
                            >
                                <View style={[
                                    tw`py-3 rounded-full items-center`,
                                    { backgroundColor: theme.colors.secondary }
                                ]}>
                                    {bookingLoading ? (
                                        <ActivityIndicator color={theme.colors.foreground} size="small" />
                                    ) : (
                                        <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>
                                            Continue to Payment
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}