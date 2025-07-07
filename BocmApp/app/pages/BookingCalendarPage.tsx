// screens/BookingPage.tsx
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
import { RootStackParamList, Service, Availability, SpecialHours } from '../types/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type BookingPageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingPage'>;
type BookingPageRouteProp = RouteProp<RootStackParamList, 'BookingPage'>;

export default function BookingPage() {
    const navigation = useNavigation<BookingPageNavigationProp>();
    const route = useRoute<BookingPageRouteProp>();
    const { barberId, barberName } = route.params;
    const { user } = useAuth();

    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
    const [loading, setLoading] = useState(true);
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
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedDate && selectedServices.length > 0) {
            fetchAvailability();
        }
    }, [selectedDate, selectedServices]);

    const fetchInitialData = async () => {
        try {
            const [servicesRes, availabilityRes, specialHoursRes] = await Promise.all([
                supabase.from('services').select('*').eq('barber_id', barberId).order('price'),
                supabase.from('availability').select('*').eq('barber_id', barberId),
                supabase.from('special_hours').select('*').eq('barber_id', barberId)
                    .gte('date', new Date().toISOString().split('T')[0])
            ]);

            if (servicesRes.error) throw servicesRes.error;
            if (availabilityRes.error) throw availabilityRes.error;
            if (specialHoursRes.error) throw specialHoursRes.error;

            setServices(servicesRes.data || []);
            setAvailability(availabilityRes.data || []);
            setSpecialHours(specialHoursRes.data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load booking information');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        if (!selectedDate || selectedServices.length === 0) return;

        const selectedDateString = selectedDate.toISOString().split('T')[0];
        const dayOfWeek = selectedDate.getDay();
        const totalDuration = selectedServices.reduce((total, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return total + (service?.duration || 0);
        }, 0);

        const specialHour = specialHours.find(sh => sh.date === selectedDateString);
        if (specialHour?.is_closed) {
            setAvailableTimeSlots([]);
            return;
        }

        const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
        if (!dayAvailability && !specialHour) {
            setAvailableTimeSlots([]);
            return;
        }

        const startTime = specialHour?.start_time || dayAvailability?.start_time;
        const endTime = specialHour?.end_time || dayAvailability?.end_time;
        if (!startTime || !endTime) {
            setAvailableTimeSlots([]);
            return;
        }

        try {
            const { data: bookings } = await supabase
                .from('bookings')
                .select('date, service_id')
                .eq('barber_id', barberId)
                .gte('date', `${selectedDateString}T00:00:00`)
                .lt('date', `${selectedDateString}T23:59:59`)
                .in('status', ['pending', 'confirmed', 'payment_pending']);

            const slots: string[] = [];
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);

            const startDateTime = new Date(selectedDate);
            startDateTime.setHours(startHour, startMinute, 0, 0);
            const endDateTime = new Date(selectedDate);
            endDateTime.setHours(endHour, endMinute, 0, 0);

            const currentTime = new Date(startDateTime);
            const now = new Date();
            const isToday = selectedDate.toDateString() === now.toDateString();

            while (currentTime < endDateTime) {
                const timeString = currentTime.toTimeString().slice(0, 5);
                const slotEndTime = new Date(currentTime.getTime() + totalDuration * 60000);
                
                if (slotEndTime <= endDateTime) {
                    const hasConflict = bookings?.some(booking => {
                        const bookingTime = new Date(booking.date);
                        const bookingService = services.find(s => s.id === booking.service_id);
                        const bookingDuration = bookingService?.duration || 60;
                        const bookingEndTime = new Date(bookingTime.getTime() + bookingDuration * 60000);
                        return (currentTime < bookingEndTime && slotEndTime > bookingTime);
                    });

                    const isPastTime = isToday && currentTime <= now;
                    if (!hasConflict && !isPastTime) {
                        slots.push(timeString);
                    }
                }
                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }
            setAvailableTimeSlots(slots);
        } catch (error) {
            Alert.alert('Error', 'Failed to load available time slots');
        }
    };

    const handleCreateCheckoutSession = async () => {
        if (!user && (!guestInfo.name || !guestInfo.email || !guestInfo.phone)) {
            Alert.alert('Error', 'Please fill in all guest information');
            return;
        }

        setBookingLoading(true);
        try {
            const [hours, minutes] = selectedTime.split(':');
            const bookingDate = new Date(selectedDate!);
            bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const checkoutData = {
                barberId,
                serviceId: selectedServices[0],
                date: bookingDate.toISOString(),
                notes: guestInfo.notes,
                guestName: user ? null : guestInfo.name,
                guestEmail: user ? null : guestInfo.email,
                guestPhone: user ? null : guestInfo.phone,
                clientId: user?.id || null,
                paymentType,
            };

            const response = await fetch('https://your-api-url.com/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');

            if (data.url) {
                await Linking.openURL(data.url);
                setShowBookingModal(false);
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process payment');
        } finally {
            setBookingLoading(false);
        }
    };

    const getTotalPrice = () => selectedServices.reduce((total, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return total + (service?.price || 0);
    }, 0);

    const getTotalDuration = () => selectedServices.reduce((total, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return total + (service?.duration || 0);
    }, 0);

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
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                date,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: date.getDate(),
                monthName: date.toLocaleDateString('en-US', { month: 'short' }),
                isToday: i === 0,
            });
        }
        return days;
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-900`}>
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color="#9333ea" />
                    <Text style={tw`text-gray-400 mt-4`}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-900`}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={tw`px-5 pt-4 pb-6`}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
                        <Text style={tw`text-purple-500 text-base`}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={tw`text-white text-3xl font-bold mb-2`}>Book Appointment</Text>
                    <Text style={tw`text-gray-400 text-base`}>with {barberName}</Text>
                </View>

                {/* Services */}
                <View style={tw`px-5 mb-6`}>
                    <Text style={tw`text-white text-xl font-semibold mb-4`}>Select Services</Text>
                    {services.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            onPress={() => setSelectedServices(prev => 
                                prev.includes(service.id) 
                                    ? prev.filter(id => id !== service.id)
                                    : [...prev, service.id]
                            )}
                        >
                            <View style={tw`bg-gray-800 rounded-xl p-4 mb-3 ${
                                selectedServices.includes(service.id) ? 'border-2 border-purple-600' : ''
                            }`}>
                                <View style={tw`flex-row justify-between`}>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-white text-base font-medium`}>{service.name}</Text>
                                        {service.description && (
                                            <Text style={tw`text-gray-400 text-sm mt-1`}>{service.description}</Text>
                                        )}
                                        <Text style={tw`text-gray-500 text-sm mt-2`}>
                                            {service.duration} min • ${service.price}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {selectedServices.length > 0 && (
                        <View style={tw`bg-purple-600/20 rounded-xl p-4 mt-3`}>
                            <Text style={tw`text-white`}>
                                Total: {getTotalDuration()} min • ${getTotalPrice()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Date Selection */}
                {selectedServices.length > 0 && (
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-white text-xl font-semibold mb-4 px-5`}>Select Date</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-5`}>
                            {generateCalendarDays().map((day, index) => {
                                const dayOfWeek = day.date.getDay();
                                const dateString = day.date.toISOString().split('T')[0];
                                const specialHour = specialHours.find(sh => sh.date === dateString);
                                const isAvailable = specialHour ? !specialHour.is_closed : 
                                    availability.some(a => a.day_of_week === dayOfWeek);
                                
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => isAvailable ? setSelectedDate(day.date) : null}
                                        disabled={!isAvailable}
                                    >
                                        <View style={tw`rounded-xl p-3 mr-3 items-center ${
                                            !isAvailable ? 'bg-gray-800 opacity-50' :
                                            selectedDate?.toDateString() === day.date.toDateString() ? 'bg-purple-600' : 'bg-gray-800'
                                        } ${day.isToday ? 'border border-purple-500' : ''}`}>
                                            <Text style={tw`text-xs text-gray-400`}>{day.dayName}</Text>
                                            <Text style={tw`text-lg font-bold text-white my-1`}>{day.dayNumber}</Text>
                                            <Text style={tw`text-xs text-gray-400`}>{day.monthName}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Time Selection */}
                {selectedServices.length > 0 && selectedDate && (
                    <View style={tw`px-5 mb-6`}>
                        <Text style={tw`text-white text-xl font-semibold mb-4`}>Select Time</Text>
                        {availableTimeSlots.length === 0 ? (
                            <Text style={tw`text-gray-400 text-center`}>No available time slots</Text>
                        ) : (
                            <View style={tw`flex-row flex-wrap -mx-1`}>
                                {availableTimeSlots.map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        onPress={() => setSelectedTime(time)}
                                        style={tw`w-1/3 px-1 mb-2`}
                                    >
                                        <View style={tw`rounded-lg py-3 items-center ${
                                            selectedTime === time ? 'bg-purple-600' : 'bg-gray-800'
                                        }`}>
                                            <Text style={tw`text-sm text-white`}>{formatTime(time)}</Text>
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
                        disabled={selectedServices.length === 0 || !selectedDate || !selectedTime}
                    >
                        <View style={tw`py-4 rounded-full items-center ${
                            selectedServices.length > 0 && selectedDate && selectedTime ? 'bg-purple-600' : 'bg-gray-700 opacity-50'
                        }`}>
                            <Text style={tw`text-white text-lg font-semibold`}>Continue</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal */}
            <Modal visible={showBookingModal} animationType="slide" transparent onRequestClose={() => setShowBookingModal(false)}>
                <View style={tw`flex-1 bg-black/50 justify-end`}>
                    <View style={tw`bg-gray-800 rounded-t-3xl p-6`}>
                        <Text style={tw`text-white text-xl font-bold mb-6`}>Complete Booking</Text>

                        {!user && (
                            <>
                                <TextInput
                                    style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg mb-3`}
                                    placeholder="Full Name"
                                    placeholderTextColor="#6B7280"
                                    value={guestInfo.name}
                                    onChangeText={(text) => setGuestInfo({...guestInfo, name: text})}
                                />
                                <TextInput
                                    style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg mb-3`}
                                    placeholder="Email"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="email-address"
                                    value={guestInfo.email}
                                    onChangeText={(text) => setGuestInfo({...guestInfo, email: text})}
                                />
                                <TextInput
                                    style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg mb-6`}
                                    placeholder="Phone"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="phone-pad"
                                    value={guestInfo.phone}
                                    onChangeText={(text) => setGuestInfo({...guestInfo, phone: text})}
                                />
                            </>
                        )}

                        <TextInput
                            style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg mb-6`}
                            placeholder="Notes (optional)"
                            placeholderTextColor="#6B7280"
                            value={guestInfo.notes}
                            onChangeText={(text) => setGuestInfo({...guestInfo, notes: text})}
                            multiline
                        />

                        <View style={tw`mb-6`}>
                            <TouchableOpacity
                                onPress={() => setPaymentType('fee')}
                                style={tw`flex-row items-center mb-3`}
                            >
                                <View style={tw`w-5 h-5 rounded-full border-2 mr-3 ${
                                    paymentType === 'fee' ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
                                }`} />
                                <Text style={tw`text-gray-300`}>Pay platform fee only ($3.38)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setPaymentType('full')}
                                style={tw`flex-row items-center`}
                            >
                                <View style={tw`w-5 h-5 rounded-full border-2 mr-3 ${
                                    paymentType === 'full' ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
                                }`} />
                                <Text style={tw`text-gray-300`}>
                                    Pay full amount (${getTotalPrice() + 3.38})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={tw`flex-row gap-3`}>
                            <TouchableOpacity onPress={() => setShowBookingModal(false)} style={tw`flex-1`}>
                                <View style={tw`py-3 rounded-full items-center bg-gray-700`}>
                                    <Text style={tw`text-white font-medium`}>Cancel</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateCheckoutSession} disabled={bookingLoading} style={tw`flex-1`}>
                                <View style={tw`py-3 rounded-full items-center bg-purple-600`}>
                                    {bookingLoading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={tw`text-white font-medium`}>Pay</Text>
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