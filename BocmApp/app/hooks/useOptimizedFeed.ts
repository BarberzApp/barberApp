import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../shared/lib/supabase';
import type { FeedItem, FeedOptions } from '../types/feed.types';

export function useOptimizedFeed(opts: FeedOptions = {}) {
  const pageSize = opts.pageSize ?? 10;
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [endReached, setEndReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const pageRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (selectedSpecialty?: string) => {
    // Use refs to avoid dependency issues
    if (pageRef.current === 0) {
      // Only check loading/endReached for initial load
      if (loading || endReached) return;
    }
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    
    try {
      const page = pageRef.current;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      console.log(`📡 Fetching cuts page ${page} (${from}-${to})${selectedSpecialty ? ` for specialty: ${selectedSpecialty}` : ''}`);

      let query = supabase
        .from('cuts')
        .select(`
          id,
          url,
          description,
          title,
          created_at,
          duration,
          views,
          likes,
          shares,
          comments_count,
          barber_id,
          barbers!inner(
            id,
            user_id,
            specialties,
            latitude,
            longitude,
            city,
            state,
            profiles!barbers_user_id_fkey(
              username,
              name,
              avatar_url
            )
          )
        `)
        .eq('is_public', true);

      // Filter by specialty if selected
      if (selectedSpecialty && selectedSpecialty !== 'all') {
        query = query.filter('barbers.specialties', 'cs', `{${selectedSpecialty}}`);
      }

      const { data: cuts, error: cutsError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cutsError) {
        throw new Error(`Failed to fetch cuts: ${cutsError.message}`);
      }

      if (!cuts || cuts.length === 0) {
        setEndReached(true);
        return;
      }

      // Transform cuts to FeedItem format with distance calculation
      const feedItems: FeedItem[] = cuts.map((cut) => {
        // Calculate distance if location is enabled and barber has coordinates
        let distance: number | undefined;
        if (useLocation && userLocation && cut.barbers?.latitude && cut.barbers?.longitude) {
          distance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            cut.barbers.latitude,
            cut.barbers.longitude
          );
        }

        return {
          id: cut.id,
          videoUrl: cut.url,
          caption: cut.description || cut.title,
          username: cut.barbers?.profiles?.username || 'unknown',
          barber_id: cut.barber_id,
          barber_name: cut.barbers?.profiles?.name,
          barber_avatar: cut.barbers?.profiles?.avatar_url,
          created_at: cut.created_at,
          aspect_ratio: 9/16, // Default to 9:16 aspect ratio
          duration: cut.duration,
          view_count: cut.views || 0,
          reach_count: cut.views || 0, // Use views as reach count for now
          likes: cut.likes || 0,
          comments: cut.comments_count || 0,
          shares: cut.shares || 0,
          music: 'Original Sound', // TODO: Add music field to cuts table
          distance: distance,
          barber_location: cut.barbers?.city || cut.barbers?.state || 'Unknown location',
        };
      });

      // Sort by distance if location is enabled
      if (useLocation && userLocation) {
        feedItems.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
        console.log('📍 Cuts sorted by distance');
      } else {
        // Only randomize on initial load to maintain consistency
        if (page === 0) {
          feedItems.sort(() => Math.random() - 0.5);
          console.log('🎲 Randomized initial feed order');
        }
      }

      // If we got fewer items than requested, we've reached the end
      if (feedItems.length < pageSize) {
        setEndReached(true);
      }

      // Replace items for page 0, append for subsequent pages
      if (page === 0) {
        setItems(feedItems);
        pageRef.current = 1;
      } else {
        setItems((prev) => [...prev, ...feedItems]);
        pageRef.current += 1;
      }

      console.log(`✅ Loaded ${feedItems.length} cuts`);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🛑 Feed fetch cancelled');
        return;
      }
      
      console.error('❌ Feed fetch error:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [pageSize]); // Remove loading and endReached from dependencies

  // Location functions
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      setLocationLoading(true);
      
      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        console.log('Location services disabled');
        return false;
      }
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== 'granted') {
        console.log('Location permission denied');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const getUserLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      
      setUserLocation(location);
      setUseLocation(true);
      console.log('📍 User location obtained for cuts:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      // Refresh cuts with location-based sorting
      refresh();
      
    } catch (error) {
      console.error('Error getting user location for cuts:', error);
    } finally {
      setLocationLoading(false);
    }
  }, [requestLocationPermission, refresh]);

  // Fetch available specialties from barbers
  const fetchAvailableSpecialties = useCallback(async () => {
    try {
      const { data: barbers, error } = await supabase
        .from('barbers')
        .select('specialties')
        .not('specialties', 'is', null)
        .neq('specialties', '{}');

      if (error) {
        console.error('Error fetching specialties:', error);
        return;
      }

      // Extract all unique specialties
      const allSpecialties = new Set<string>();
      barbers?.forEach(barber => {
        if (barber.specialties && Array.isArray(barber.specialties)) {
          barber.specialties.forEach(specialty => {
            if (specialty) allSpecialties.add(specialty);
          });
        }
      });

      const specialtiesArray = Array.from(allSpecialties).sort();
      setAvailableSpecialties(specialtiesArray);
      console.log(`📋 Found ${specialtiesArray.length} available specialties:`, specialtiesArray);
    } catch (error) {
      console.error('Error fetching available specialties:', error);
    }
  }, []);

  // Preload next page when approaching end
  const prefetchNextPage = useCallback(() => {
    if (!loading && !endReached && items.length > 0) {
      const lastItemIndex = items.length - 1;
      
      // If we're within 2 items of the end, prefetch
      if (lastItemIndex % pageSize >= pageSize - 2) {
        console.log('🔄 Prefetching next page...');
        fetchPage();
      }
    }
  }, [loading, endReached, items.length, pageSize, fetchPage]);

  useEffect(() => {
    fetchPage();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPage]);

  const refresh = useCallback(() => {
    setItems([]);
    setEndReached(false);
    pageRef.current = 0;
    fetchPage();
  }, [fetchPage]);

  return {
    items,
    loading,
    endReached,
    error,
    availableSpecialties,
    fetchMore: fetchPage,
    prefetchNextPage,
    refresh,
    fetchAvailableSpecialties,
    // Location functions
    userLocation,
    locationLoading,
    useLocation,
    getUserLocation,
  };
}
