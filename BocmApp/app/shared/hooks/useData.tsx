import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from '../components/ui/use-toast';

export interface Barber {
  id: string;
  name: string;
  image: string;
  location: string;
  bio: string;
  totalClients: number;
  totalBookings: number;
  earnings: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  specialties: string[];
  services: Service[];
  portfolio: string[];
  joinDate: string;
  nextAvailable: string;
  isPublic: boolean;
  email?: string;
  phone?: string;
  bookingHistory?: Booking[];
  favoriteBarbers?: Barber[];
}

export interface Booking {
  id: string;
  date: string;
  time: string;
  service: string;
  barber: {
    id: string;
    name: string;
    image: string;
  };
  price: number;
  status: string;
  clientId: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  barberId: string;
}

export function useData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch barbers
  const fetchBarbers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select(`
          *,
          profiles (
            id,
            name,
            avatar_url,
            location,
            bio
          ),
          services (*)
        `)
        .eq('is_public', true);

      if (barbersError) {
        throw barbersError;
      }

      const formattedBarbers: Barber[] = (barbersData || []).map((barber: any) => ({
        id: barber.id,
        name: barber.profiles?.name || barber.business_name || 'Unknown',
        image: barber.profiles?.avatar_url || barber.avatar_url || '',
        location: barber.profiles?.location || barber.location || '',
        bio: barber.profiles?.bio || barber.bio || '',
        totalClients: barber.total_clients || 0,
        totalBookings: barber.total_bookings || 0,
        earnings: {
          thisWeek: barber.earnings_this_week || 0,
          thisMonth: barber.earnings_this_month || 0,
          lastMonth: barber.earnings_last_month || 0,
        },
        specialties: barber.specialties || [],
        services: (barber.services || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
          barberId: service.barber_id,
        })),
        portfolio: barber.portfolio || [],
        joinDate: barber.created_at || '',
        nextAvailable: barber.next_available || '',
        isPublic: barber.is_public || false,
        email: barber.email,
        phone: barber.phone,
      }));

      setBarbers(formattedBarbers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load barbers.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          barbers (
            id,
            business_name,
            avatar_url
          ),
          services (
            id,
            name,
            price
          )
        `)
        .eq('client_id', user.id)
        .order('date', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      const formattedBookings: Booking[] = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        service: booking.services?.name || booking.service_name || '',
        barber: {
          id: booking.barbers?.id || '',
          name: booking.barbers?.business_name || '',
          image: booking.barbers?.avatar_url || '',
        },
        price: booking.services?.price || booking.price || 0,
        status: booking.status || 'pending',
        clientId: booking.client_id,
      }));

      setBookings(formattedBookings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load bookings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    await Promise.all([fetchBarbers(), fetchBookings()]);
  }, [fetchBarbers, fetchBookings]);

  // Update barber
  const updateBarber = useCallback(
    async (id: string, data: Partial<Barber>) => {
      try {
        setLoading(true);
        setError(null);

        const { error } = await supabase
          .from('barbers')
          .update({
            business_name: data.name,
            location: data.location,
            bio: data.bio,
            is_public: data.isPublic,
            specialties: data.specialties,
            ...data,
          })
          .eq('id', id);

        if (error) {
          throw error;
        }

        setBarbers((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...data } : b))
        );

        toast({
          title: 'Success',
          description: 'Barber profile updated successfully.',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to update barber profile.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Add portfolio image
  const addPortfolioImage = useCallback(
    async (barberId: string, imageUrl: string) => {
      try {
        setLoading(true);
        setError(null);

        const currentBarber = barbers.find((b) => b.id === barberId);
        if (!currentBarber) {
          throw new Error('Barber not found');
        }

        const updatedPortfolio = [...currentBarber.portfolio, imageUrl];

        const { error } = await supabase
          .from('barbers')
          .update({
            portfolio: updatedPortfolio,
          })
          .eq('id', barberId);

        if (error) {
          throw error;
        }

        setBarbers((prev) =>
          prev.map((b) =>
            b.id === barberId
              ? { ...b, portfolio: [...b.portfolio, imageUrl] }
              : b
          )
        );

        toast({
          title: 'Success',
          description: 'Portfolio image added successfully.',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to add portfolio image.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Remove portfolio image
  const removePortfolioImage = useCallback(
    async (barberId: string, imageUrl: string) => {
      try {
        setLoading(true);
        setError(null);

        const currentBarber = barbers.find((b) => b.id === barberId);
        if (!currentBarber) {
          throw new Error('Barber not found');
        }

        const updatedPortfolio = currentBarber.portfolio.filter(
          (img) => img !== imageUrl
        );

        const { error } = await supabase
          .from('barbers')
          .update({ portfolio: updatedPortfolio })
          .eq('id', barberId);

        if (error) {
          throw error;
        }

        setBarbers((prev) =>
          prev.map((b) =>
            b.id === barberId
              ? { ...b, portfolio: updatedPortfolio }
              : b
          )
        );

        toast({
          title: 'Success',
          description: 'Portfolio image removed successfully.',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to remove portfolio image.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [barbers, toast]
  );

  // Load data on mount
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return {
    loading,
    error,
    barbers,
    bookings,
    fetchData,
    fetchBarbers,
    fetchBookings,
    updateBarber,
    addPortfolioImage,
    removePortfolioImage,
  };
} 