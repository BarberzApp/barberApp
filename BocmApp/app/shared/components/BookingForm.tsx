import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { format, addDays, isToday, isSameDay } from 'date-fns';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../types';
import { bookingService, Service, TimeSlot } from '../lib/bookingService';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { supabase } from '../lib/supabase';

type BookingFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingCalendar'>;

interface BookingFormProps {
  isVisible: boolean;
  onClose: () => void;
  barberId: string;
  barberName: string;
  onBookingCreated: (booking: any) => void;
}

interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  dateString: string;
}

export default function BookingForm({ 
  isVisible, 
  onClose, 
  barberId, 
  barberName, 
  onBookingCreated 
}: BookingFormProps) {
  const navigation = useNavigation<BookingFormNavigationProp>();
  const { user } = useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Form data
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  const [paymentType, setPaymentType] = useState<'full' | 'fee'>('full');
  const [isDeveloperAccount, setIsDeveloperAccount] = useState(false);

  const totalSteps = 4;

  useEffect(() => {
    if (isVisible) {
      fetchServices();
      fetchBarberStatus();
      setCurrentStep(1);
    }
  }, [isVisible, barberId]);

  useEffect(() => {
    if (isVisible && selectedService && selectedDate) {
      fetchTimeSlots();
    }
  }, [isVisible, selectedService, selectedDate]);

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

  const fetchBarberStatus = async () => {
    try {
      const { data: barber, error } = await supabase
        .from('barbers')
        .select('is_developer')
        .eq('id', barberId)
        .single();

      if (!error && barber) {
        setIsDeveloperAccount(barber.is_developer || false);
      }
    } catch (error) {
      console.error('Error fetching barber status:', error);
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
    setSelectedTime('');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedService;
      case 2:
        return !!selectedDate && !!selectedTime;
      case 3:
        if (user) return true;
        if (isDeveloperAccount) {
          return !!(guestInfo.name && guestInfo.email && guestInfo.phone);
        }
        return false;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please complete all required fields.');
      return;
    }

    if (!user && !isDeveloperAccount) {
      Alert.alert('Error', 'Please sign in to book with this barber.');
      return;
    }

    if (!user && isDeveloperAccount && (!guestInfo.name || !guestInfo.email || !guestInfo.phone)) {
      Alert.alert('Error', 'Please fill in all guest information.');
      return;
    }

    setBookingLoading(true);

    try {
      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (isDeveloperAccount) {
        // Developer booking (no payment required)
        const response = await fetch('https://bocmstyle.com/api/create-developer-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barberId,
            serviceId: selectedService.id,
            date: bookingDate.toISOString(),
            notes: guestInfo.notes,
            guestName: user ? undefined : guestInfo.name,
            guestEmail: user ? undefined : guestInfo.email,
            guestPhone: user ? undefined : guestInfo.phone,
            clientId: user?.id || null,
            paymentType: 'fee',
            addonIds: []
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create developer booking');
        }

        Alert.alert(
          'Success!',
          'Your booking has been created successfully (developer mode - no payment required).',
          [{ text: 'OK', onPress: () => onBookingCreated(data.booking) }]
        );
      } else {
        // Regular booking with payment
        if (!user) {
          Alert.alert('Error', 'Please sign in to book with this barber.');
          return;
        }

        const response = await fetch('https://bocmstyle.com/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barber_id: barberId,
            service_id: selectedService.id,
            date: bookingDate.toISOString(),
            price: selectedService.price,
            client_id: user.id,
            notes: guestInfo.notes,
            platform_fee: paymentType === 'fee' ? 3.38 : 0,
            barber_payout: selectedService.price
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create booking');
        }

        Alert.alert(
          'Success!',
          'Your booking has been created successfully.',
          [{ text: 'OK', onPress: () => onBookingCreated(data.booking) }]
        );
      }

      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      days.push({
        date,
        dayName: format(date, 'EEE'),
        dayNumber: parseInt(format(date, 'd')),
        monthName: format(date, 'MMM'),
        isToday: isToday(date),
        dateString: format(date, 'yyyy-MM-dd'),
      });
    }
    return days;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Choose Your Service';
      case 2: return 'Pick Your Time';
      case 3: return 'Your Information';
      case 4: return 'Review & Book';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Select the service you\'d like to book';
      case 2: return 'Choose your preferred appointment time';
      case 3: return 'Provide your contact information';
      case 4: return 'Review your booking details and confirm';
      default: return '';
    }
  };

  const getTotalPrice = () => {
    if (!selectedService) return 0;
    return paymentType === 'fee' ? 3.38 : selectedService.price;
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={tw`px-5 pt-4 pb-6 border-b border-white/10`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-semibold`, { color: theme.colors.foreground }]}>
              {getStepTitle()}
            </Text>
            <View style={tw`w-6`} />
          </View>

          {/* Progress Bar */}
          <View style={tw`w-full bg-white/10 rounded-full h-2 mb-4`}>
            <View 
              style={[
                tw`h-2 rounded-full`,
                { 
                  backgroundColor: theme.colors.secondary,
                  width: `${(currentStep / totalSteps) * 100}%` 
                }
              ]}
            />
          </View>

          {/* Step Indicators */}
          <View style={tw`flex-row justify-between`}>
            {[1, 2, 3, 4].map((step) => (
              <View key={step} style={tw`items-center`}>
                <View style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  currentStep >= step 
                    ? { backgroundColor: theme.colors.secondary }
                    : { backgroundColor: 'rgba(255,255,255,0.1)' }
                ]}>
                  <Text style={[
                    tw`text-sm font-medium`,
                    currentStep >= step 
                      ? { color: theme.colors.background }
                      : { color: theme.colors.mutedForeground }
                  ]}>
                    {step}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <View style={tw`p-5`}>
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <View style={tw`space-y-6`}>
                <View style={tw`items-center mb-6`}>
                  <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Icon name="scissors" size={24} color={theme.colors.secondary} />
                  </View>
                  <Text style={[tw`text-xl font-bold mb-2`, { color: theme.colors.foreground }]}>
                    What service do you need?
                  </Text>
                  <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                    Choose from our available services
                  </Text>
                </View>

                {loading ? (
                  <View style={tw`items-center py-8`}>
                    <ActivityIndicator size="large" color={theme.colors.secondary} />
                    <Text style={[tw`mt-4`, { color: theme.colors.mutedForeground }]}>Loading services...</Text>
                  </View>
                ) : (
                  <View style={tw`space-y-4`}>
                    {services.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        onPress={() => handleServiceSelect(service)}
                      >
                        <View style={[
                          tw`p-4 rounded-2xl border-2`,
                          selectedService?.id === service.id
                            ? { 
                                borderColor: theme.colors.secondary, 
                                backgroundColor: `${theme.colors.secondary}10` 
                              }
                            : { 
                                borderColor: 'rgba(255,255,255,0.1)', 
                                backgroundColor: 'rgba(255,255,255,0.05)' 
                              }
                        ]}>
                          {selectedService?.id === service.id && (
                            <View style={[tw`absolute top-4 right-4 w-6 h-6 rounded-full items-center justify-center`, { backgroundColor: theme.colors.secondary }]}>
                              <Icon name="check" size={16} color={theme.colors.background} />
                            </View>
                          )}
                          
                          <View style={tw`flex-row justify-between items-start`}>
                            <View style={tw`flex-1`}>
                              <Text style={[tw`text-lg font-semibold mb-1`, { color: theme.colors.foreground }]}>
                                {service.name}
                              </Text>
                              {service.description && (
                                <Text style={[tw`text-sm mb-2`, { color: theme.colors.mutedForeground }]}>
                                  {service.description}
                                </Text>
                              )}
                              <View style={tw`flex-row items-center`}>
                                <Icon name="clock" size={16} color={theme.colors.mutedForeground} />
                                <Text style={[tw`ml-1 text-sm`, { color: theme.colors.mutedForeground }]}>
                                  {service.duration} min
                                </Text>
                              </View>
                            </View>
                            <Text style={[tw`text-lg font-bold`, { color: theme.colors.secondary }]}>
                              ${service.price.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Date and Time Selection */}
            {currentStep === 2 && (
              <View style={tw`space-y-6`}>
                <View style={tw`items-center mb-6`}>
                  <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Icon name="calendar" size={24} color={theme.colors.secondary} />
                  </View>
                  <Text style={[tw`text-xl font-bold mb-2`, { color: theme.colors.foreground }]}>
                    Pick Your Time
                  </Text>
                  <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                    Choose your preferred appointment time
                  </Text>
                </View>

                {/* Date Selection */}
                <View>
                  <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>
                    Select Date
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`pb-4`}
                  >
                    {generateCalendarDays().map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleDateSelect(day.date)}
                        style={tw`mr-3`}
                      >
                        <View style={[
                          tw`rounded-xl p-4 items-center min-w-[80px]`,
                          selectedDate && isSameDay(selectedDate, day.date)
                            ? { backgroundColor: theme.colors.secondary }
                            : { backgroundColor: 'rgba(255,255,255,0.05)' },
                          day.isToday && { borderWidth: 1, borderColor: theme.colors.secondary }
                        ]}>
                          <Text style={[
                            tw`text-xs font-medium`,
                            selectedDate && isSameDay(selectedDate, day.date)
                              ? { color: theme.colors.background }
                              : { color: theme.colors.mutedForeground }
                          ]}>
                            {day.dayName}
                          </Text>
                          <Text style={[
                            tw`text-xl font-bold my-1`,
                            selectedDate && isSameDay(selectedDate, day.date)
                              ? { color: theme.colors.background }
                              : { color: theme.colors.foreground }
                          ]}>
                            {day.dayNumber}
                          </Text>
                          <Text style={[
                            tw`text-xs`,
                            selectedDate && isSameDay(selectedDate, day.date)
                              ? { color: theme.colors.background }
                              : { color: theme.colors.mutedForeground }
                          ]}>
                            {day.monthName}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Time Selection */}
                {selectedDate && (
                  <View>
                    <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>
                      Select Time
                    </Text>
                    {loadingSlots ? (
                      <View style={tw`items-center py-8`}>
                        <ActivityIndicator size="small" color={theme.colors.secondary} />
                        <Text style={[tw`mt-2`, { color: theme.colors.mutedForeground }]}>Loading times...</Text>
                      </View>
                    ) : (
                      <View style={tw`flex-row flex-wrap -mx-1`}>
                        {timeSlots
                          .filter(slot => slot.available)
                          .map((slot) => (
                            <TouchableOpacity
                              key={slot.time}
                              onPress={() => handleTimeSelect(slot.time)}
                              style={tw`w-1/3 px-1 mb-2`}
                            >
                              <View style={[
                                tw`rounded-lg py-3 items-center`,
                                selectedTime === slot.time
                                  ? { backgroundColor: theme.colors.secondary }
                                  : { backgroundColor: 'rgba(255,255,255,0.05)' }
                              ]}>
                                <Text style={[
                                  tw`text-sm font-medium`,
                                  selectedTime === slot.time
                                    ? { color: theme.colors.background }
                                    : { color: theme.colors.foreground }
                                ]}>
                                  {formatTime(slot.time)}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Step 3: Guest Information */}
            {currentStep === 3 && (
              <View style={tw`space-y-6`}>
                <View style={tw`items-center mb-6`}>
                  <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Icon name="user" size={24} color={theme.colors.secondary} />
                  </View>
                  <Text style={[tw`text-xl font-bold mb-2`, { color: theme.colors.foreground }]}>
                    Tell us about yourself
                  </Text>
                  <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                    We'll use this to confirm your booking
                  </Text>
                </View>

                {!user ? (
                  isDeveloperAccount ? (
                    <View style={tw`space-y-4`}>
                      <View>
                        <Text style={[tw`text-sm font-medium mb-2`, { color: theme.colors.foreground }]}>
                          Full Name *
                        </Text>
                        <TextInput
                          style={[
                            tw`px-4 py-3 rounded-xl`,
                            { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                          ]}
                          placeholder="Enter your full name"
                          placeholderTextColor={theme.colors.mutedForeground}
                          value={guestInfo.name}
                          onChangeText={(text) => setGuestInfo({ ...guestInfo, name: text })}
                        />
                      </View>
                      <View>
                        <Text style={[tw`text-sm font-medium mb-2`, { color: theme.colors.foreground }]}>
                          Email Address *
                        </Text>
                        <TextInput
                          style={[
                            tw`px-4 py-3 rounded-xl`,
                            { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                          ]}
                          placeholder="Enter your email"
                          placeholderTextColor={theme.colors.mutedForeground}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={guestInfo.email}
                          onChangeText={(text) => setGuestInfo({ ...guestInfo, email: text })}
                        />
                      </View>
                      <View>
                        <Text style={[tw`text-sm font-medium mb-2`, { color: theme.colors.foreground }]}>
                          Phone Number *
                        </Text>
                        <TextInput
                          style={[
                            tw`px-4 py-3 rounded-xl`,
                            { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                          ]}
                          placeholder="Enter your phone number"
                          placeholderTextColor={theme.colors.mutedForeground}
                          keyboardType="phone-pad"
                          value={guestInfo.phone}
                          onChangeText={(text) => setGuestInfo({ ...guestInfo, phone: text })}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={[tw`p-6 rounded-2xl`, { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }]}>
                      <View style={tw`items-center`}>
                        <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-4`, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                          <Icon name="x" size={24} color="#ef4444" />
                        </View>
                        <Text style={[tw`text-lg font-semibold mb-2`, { color: theme.colors.foreground }]}>
                          Sign In Required
                        </Text>
                        <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                          Please sign in to book with this barber
                        </Text>
                      </View>
                    </View>
                  )
                ) : (
                  <View style={[tw`p-6 rounded-2xl`, { backgroundColor: `${theme.colors.secondary}10`, borderWidth: 1, borderColor: `${theme.colors.secondary}20` }]}>
                    <View style={tw`items-center`}>
                      <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-4`, { backgroundColor: `${theme.colors.secondary}20` }]}>
                        <Icon name="check" size={24} color={theme.colors.secondary} />
                      </View>
                      <Text style={[tw`text-lg font-semibold mb-2`, { color: theme.colors.foreground }]}>
                        Welcome back, {user.name}!
                      </Text>
                      <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                        We'll use your account information for this booking
                      </Text>
                    </View>
                  </View>
                )}

                {/* Notes */}
                <View>
                  <Text style={[tw`text-sm font-medium mb-2`, { color: theme.colors.foreground }]}>
                    Additional Notes (Optional)
                  </Text>
                  <TextInput
                    style={[
                      tw`px-4 py-3 rounded-xl min-h-[100px]`,
                      { backgroundColor: 'rgba(255,255,255,0.1)', color: theme.colors.foreground }
                    ]}
                    placeholder="Any special requests or notes..."
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={guestInfo.notes}
                    onChangeText={(text) => setGuestInfo({ ...guestInfo, notes: text })}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {/* Step 4: Review & Payment */}
            {currentStep === 4 && (
              <View style={tw`space-y-6`}>
                <View style={tw`items-center mb-6`}>
                  <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Icon name="credit-card" size={24} color={theme.colors.secondary} />
                  </View>
                  <Text style={[tw`text-xl font-bold mb-2`, { color: theme.colors.foreground }]}>
                    Review Your Booking
                  </Text>
                  <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                    Confirm your details and complete payment
                  </Text>
                </View>

                {/* Booking Summary */}
                <View style={[tw`p-4 rounded-xl`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[tw`font-semibold mb-4`, { color: theme.colors.secondary }]}>
                    Booking Summary
                  </Text>
                  <View style={tw`space-y-2`}>
                    <View style={tw`flex-row justify-between`}>
                      <Text style={{ color: theme.colors.mutedForeground }}>Service:</Text>
                      <Text style={{ color: theme.colors.foreground }}>{selectedService?.name}</Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
                      <Text style={{ color: theme.colors.mutedForeground }}>Date:</Text>
                      <Text style={{ color: theme.colors.foreground }}>
                        {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                      </Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
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
                    <View style={tw`flex-row justify-between`}>
                      <Text style={{ color: theme.colors.mutedForeground }}>Price:</Text>
                      <Text style={{ color: theme.colors.foreground }}>
                        ${selectedService?.price.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment Options */}
                <View>
                  <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>
                    Payment Options
                  </Text>
                  <View style={tw`space-y-3`}>
                    <TouchableOpacity
                      onPress={() => setPaymentType('full')}
                      style={tw`flex-row items-center`}
                    >
                      <View style={[
                        tw`w-5 h-5 rounded-full border-2 mr-3`,
                        paymentType === 'full'
                          ? { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                          : { borderColor: theme.colors.mutedForeground }
                      ]} />
                      <Text style={{ color: theme.colors.foreground }}>
                        Pay full amount (${selectedService?.price.toFixed(2)})
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
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer with Navigation */}
        <View style={tw`p-5 border-t border-white/10`}>
          <View style={tw`flex-row gap-3`}>
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handlePrevStep}
                style={tw`flex-1`}
              >
                <View style={[
                  tw`py-4 rounded-full items-center`,
                  { backgroundColor: 'rgba(255,255,255,0.1)' }
                ]}>
                  <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>
                    Back
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            {currentStep < totalSteps ? (
              <TouchableOpacity
                onPress={handleNextStep}
                disabled={!validateStep()}
                style={tw`flex-1`}
              >
                <View style={[
                  tw`py-4 rounded-full items-center`,
                  { backgroundColor: theme.colors.secondary },
                  !validateStep() && { opacity: 0.5 }
                ]}>
                  <Text style={[tw`font-medium`, { color: theme.colors.background }]}>
                    Continue
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleCreateBooking}
                disabled={bookingLoading}
                style={tw`flex-1`}
              >
                <View style={[
                  tw`py-4 rounded-full items-center`,
                  { backgroundColor: theme.colors.secondary }
                ]}>
                  {bookingLoading ? (
                    <ActivityIndicator color={theme.colors.background} size="small" />
                  ) : (
                    <Text style={[tw`font-medium`, { color: theme.colors.background }]}>
                      Complete Booking
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
