import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import tw from 'twrnc';
import { theme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, LoadingSpinner } from '../index';
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Loader2
} from 'lucide-react-native';

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  pendingPayouts: number;
  completedBookings: number;
  averageServicePrice: number;
  stripeConnected: boolean;
  stripeAccountId?: string;
}

interface EarningsDashboardProps {
  barberId: string;
}

export function EarningsDashboard({ barberId }: EarningsDashboardProps) {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    pendingPayouts: 0,
    completedBookings: 0,
    averageServicePrice: 0,
    stripeConnected: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (barberId) {
      loadEarningsData();
    }
  }, [barberId, period]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);

      // Get barber's Stripe status
      const { data: barber } = await supabase
        .from('barbers')
        .select('stripe_account_id, stripe_account_status')
        .eq('id', barberId)
        .single();

      // Get bookings data
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, services(price)')
        .eq('barber_id', barberId)
        .eq('status', 'completed');

      if (error) throw error;

      // Calculate earnings
      let totalEarnings = 0;
      let monthlyEarnings = 0;
      let weeklyEarnings = 0;
      let yearlyEarnings = 0;

      bookings?.forEach(booking => {
        const amount = booking.services?.price || 0;
        const bookingDate = new Date(booking.created_at);
        
        totalEarnings += amount;
        
        if (bookingDate >= startOfWeek) {
          weeklyEarnings += amount;
        }
        if (bookingDate >= startOfMonth) {
          monthlyEarnings += amount;
        }
        if (bookingDate >= startOfYear) {
          yearlyEarnings += amount;
        }
      });

      const averageServicePrice = bookings?.length ? totalEarnings / bookings.length : 0;

      setEarnings({
        totalEarnings,
        monthlyEarnings: period === 'month' ? monthlyEarnings : period === 'week' ? weeklyEarnings : yearlyEarnings,
        weeklyEarnings,
        pendingPayouts: 0, // Would come from Stripe API
        completedBookings: bookings?.length || 0,
        averageServicePrice,
        stripeConnected: barber?.stripe_account_status === 'active',
        stripeAccountId: barber?.stripe_account_id
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeConnect = async () => {
    try {
      // Removing stripe connect data since it broke down for some reason
      const stripeUrl = 'https://connect.stripe.com/oauth/authorize';
      Linking.openURL(stripeUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to open Stripe Connect');
    }
  };

  const getPercentageChange = () => {
    // Calculate percentage change (random number, change later)
    return 12.5;
  };

  if (isLoading) {
    return (
      <Card style={[{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <CardContent style={tw`p-6 items-center`}>
          <Loader2 size={32} color={theme.colors.secondary} style={tw`mb-3`} />
          <Text style={[tw`text-base`, { color: theme.colors.mutedForeground }]}>
            Loading earnings data...
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
      {/* Stripe Connect Status */}
      {!earnings.stripeConnected && (
        <Card style={[tw`mb-6`, { backgroundColor: theme.colors.saffron + '10', borderColor: theme.colors.saffron + '20' }]}>
          <CardContent style={tw`p-4`}>
            <View style={tw`flex-row items-start`}>
              <AlertCircle size={20} color={theme.colors.saffron} style={tw`mr-3 mt-0.5`} />
              <View style={tw`flex-1`}>
                <Text style={[tw`font-semibold mb-1`, { color: theme.colors.saffron }]}>
                  Connect Stripe to receive payments
                </Text>
                <Text style={[tw`text-sm mb-3`, { color: theme.colors.saffron }]}>
                  You need to connect your Stripe account to receive payouts from bookings.
                </Text>
                <TouchableOpacity
                  onPress={handleStripeConnect}
                  style={[tw`py-2 px-4 rounded-xl flex-row items-center self-start`, { backgroundColor: theme.colors.saffron }]}
                >
                  <CreditCard size={16} color={theme.colors.primary} style={tw`mr-2`} />
                  <Text style={[tw`font-semibold`, { color: theme.colors.primary }]}>Connect Stripe</Text>
                  <ExternalLink size={14} color={theme.colors.primary} style={tw`ml-2`} />
                </TouchableOpacity>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Period Selector */}
      <View style={tw`flex-row gap-2 mb-6`}>
        {(['week', 'month', 'year'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              tw`flex-1 py-2 rounded-xl`,
              period === p
                ? { backgroundColor: theme.colors.secondary }
                : { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
            ]}
          >
            <Text style={[
              tw`text-center font-medium capitalize`,
              { color: period === p ? theme.colors.primaryForeground : theme.colors.foreground }
            ]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Earnings Card */}
      <Card style={[tw`mb-6`, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <CardContent style={tw`p-6`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
              {period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Yearly'} Earnings
            </Text>
            <View style={[
              tw`flex-row items-center px-2 py-1 rounded-full`,
              { backgroundColor: getPercentageChange() >= 0 ? theme.colors.secondary + '20' : theme.colors.destructive + '20' }
            ]}>
              {getPercentageChange() >= 0 ? (
                <ArrowUpRight size={14} color={theme.colors.secondary} />
              ) : (
                <ArrowDownRight size={14} color={theme.colors.destructive} />
              )}
              <Text style={[
                tw`text-xs font-bold ml-1`,
                { color: getPercentageChange() >= 0 ? theme.colors.secondary : theme.colors.destructive }
              ]}>
                {Math.abs(getPercentageChange())}%
              </Text>
            </View>
          </View>
          
          <Text style={[tw`text-3xl font-bold mb-4`, { color: theme.colors.foreground }]}>
            ${earnings.monthlyEarnings.toFixed(2)}
          </Text>

          <View style={tw`flex-row justify-between`}>
            <View>
              <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                Completed Bookings
              </Text>
              <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                {earnings.completedBookings}
              </Text>
            </View>
            <View>
              <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                Avg. Service Price
              </Text>
              <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                ${earnings.averageServicePrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <View style={tw`gap-3`}>
        <View style={tw`flex-row gap-3`}>
          <Card style={[tw`flex-1`, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <CardContent style={tw`p-4`}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <View style={[tw`p-2 rounded-xl`, { backgroundColor: theme.colors.secondary + '20' }]}>
                  <DollarSign size={20} color={theme.colors.secondary} />
                </View>
                <TrendingUp size={16} color={theme.colors.secondary} />
              </View>
              <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                Total Earnings
              </Text>
              <Text style={[tw`text-xl font-bold`, { color: theme.colors.foreground }]}>
                ${earnings.totalEarnings.toFixed(2)}
              </Text>
            </CardContent>
          </Card>

          <Card style={[tw`flex-1`, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <CardContent style={tw`p-4`}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <View style={[tw`p-2 rounded-xl`, { backgroundColor: theme.colors.saffron + '20' }]}>
                  <Calendar size={20} color={theme.colors.saffron} />
                </View>
              </View>
              <Text style={[tw`text-xs`, { color: theme.colors.mutedForeground }]}>
                This Week
              </Text>
              <Text style={[tw`text-xl font-bold`, { color: theme.colors.foreground }]}>
                ${earnings.weeklyEarnings.toFixed(2)}
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Pending Payouts */}
        {earnings.stripeConnected && (
          <Card style={[{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <CardContent style={tw`p-4`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View>
                  <View style={tw`flex-row items-center mb-1`}>
                    <CreditCard size={16} color={theme.colors.secondary} style={tw`mr-2`} />
                    <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>
                      Pending Payouts
                    </Text>
                  </View>
                  <Text style={[tw`text-2xl font-bold`, { color: theme.colors.secondary }]}>
                    ${earnings.pendingPayouts.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[tw`px-4 py-2 rounded-xl`, { backgroundColor: theme.colors.secondary + '20' }]}
                >
                  <Text style={[tw`text-sm font-medium`, { color: theme.colors.secondary }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        )}
      </View>

      {/* Success Message */}
      {earnings.stripeConnected && (
        <View style={[tw`mt-6 p-4 rounded-xl flex-row items-start`, { backgroundColor: theme.colors.secondary + '10', borderWidth: 1, borderColor: theme.colors.secondary + '20' }]}>
          <CheckCircle size={16} color={theme.colors.secondary} style={tw`mr-2 mt-0.5`} />
          <View style={tw`flex-1`}>
            <Text style={[tw`font-semibold mb-1`, { color: theme.colors.secondary }]}>
              Stripe Connected
            </Text>
            <Text style={[tw`text-sm`, { color: theme.colors.secondary }]}>
              Your payments are being processed automatically. Payouts occur daily.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}