// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

// Types
export type UserRole = 'client' | 'barber';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  bio?: string;
  favorites?: string[];
  join_date?: string;
  created_at?: string;
  updated_at?: string;
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, businessName?: string) => Promise<boolean | 'needs-confirmation' | 'already-exists'>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addToFavorites: (barberId: string) => Promise<void>;
  removeFromFavorites: (barberId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        await AsyncStorage.setItem('user', JSON.stringify(session.user));
      } else {
        setUserProfile(null);
        await AsyncStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      let profile = null;
      let profileError = null;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      for (let i = 0; i < maxRetries; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows

        if (data) {
          profile = data;
          break;
        }

        if (error && error.code !== 'PGRST116') {
          // If it's not a "not found" error, break immediately
          profileError = error;
          break;
        }

        // Wait before retrying only if we haven't found the profile yet
        if (i < maxRetries - 1 && !data) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!profile) {
        // Don't log as error if profile doesn't exist yet (user might not be confirmed)
        console.log('Profile not found for user:', userId);
        setUserProfile(null);
        return;
      }

      setUserProfile({
        id: userId,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        favorites: profile.favorites,
        join_date: profile.join_date,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      });

      // Ensure barber row exists after confirmation
      if (profile.role === 'barber') {
        const { data: barber } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle(); // Use maybeSingle() here too
          
        if (!barber) {
          const { error: insertError } = await supabase
            .from('barbers')
            .insert({
              user_id: userId,
              business_name: profile.business_name || '',
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          if (insertError) {
            console.error('Failed to create barber profile after confirmation:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUserProfile(null);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Login error:', authError);
        return false;
      }

      if (!authData.user) {
        return false;
      }

      // Fetch profile with optimized query
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        return false;
      }

      setUser(authData.user);
      setUserProfile({
        id: authData.user.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        favorites: profile.favorites,
        join_date: profile.join_date,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      });

      await AsyncStorage.setItem('user', JSON.stringify(authData.user));
      console.log('Login successful for user:', profile.email);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole,
    businessName?: string
  ): Promise<boolean | 'needs-confirmation' | 'already-exists'> => {
    try {
      console.log('=== Registration Process Started ===');
      console.log('Registration Data:', { name, email, role, businessName });
      
      // Create auth user with role in metadata
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            business_name: businessName,
          },
        },
      });

      if (authError) {
        console.error('Auth Error:', authError);
        
        // Check for user already registered error
        if (authError.message?.includes('User already registered') || 
            authError.status === 400) {
          // Try to check if user exists but needs confirmation
          console.log('User may already exist, checking confirmation status...');
          
          // Return needs-confirmation since the user exists but may not be confirmed
          return 'already-exists';
        }
        
        return false;
      }

      console.log('Auth Data:', authData);
      console.log('Auth Error:', authError);

      // Check if this is a repeated signup (user already exists)
      if (!authError && authData.user && authData.user.identities?.length === 0) {
        // For repeated signups, check if user exists in profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (existingProfile) {
          console.log('User already exists with this email');
          return 'already-exists';
        } else {
          console.log('Email confirmation required for new user');
          return 'needs-confirmation';
        }
      }

      if (authError) {
        console.error('Auth Error:', authError);
        return false;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        return false;
      }

        // Try to fetch the profile with retries
        let profile = null;
        let profileError = null;
        let retries = 3;
        
        while (retries > 0) {
          console.log(`Fetching profile - Attempt ${4 - retries}/3...`);
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (result.data) {
            profile = result.data;
            console.log('Profile fetched successfully:', profile);
            break;
          }
          
          profileError = result.error;
          console.log('Profile fetch attempt failed:', profileError);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (profileError || !profile) {
          console.error('Profile Creation Failed:', profileError);
          // If profile doesn't exist, it might not be auto-created, so create it manually
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              name,
              role,
              business_name: businessName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (createProfileError) {
            console.error('Manual profile creation failed:', createProfileError);
            return false;
          }

          // Try to fetch the newly created profile
          const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (newProfileError || !newProfile) {
            console.error('Failed to fetch newly created profile:', newProfileError);
            return false;
          }

          profile = newProfile;
        }

        // For barbers, create a business profile
        if (role === 'barber' && businessName) {
          console.log('Creating business profile...');
          const { error: businessError } = await supabase
            .from('barbers')
            .insert({
              id: authData.user.id,
              user_id: authData.user.id,
              business_name: businessName,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (businessError) {
            console.error('Business Profile Creation Failed:', businessError);
            // Don't fail the registration, just log the error
          } else {
            console.log('Business profile created successfully');
          }
        }

        // Set user state
        console.log('Setting user state...');
        setUser(authData.user);
        setUserProfile({
          id: authData.user.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          favorites: profile.favorites,
          join_date: profile.join_date,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        });

        await AsyncStorage.setItem('user', JSON.stringify(authData.user));
        console.log('Registration completed successfully');

        return true;
    } catch (error) {
      console.error('Registration Process Failed:', error);
      return false;
    }
    return false;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    try {
      // Update profile data
      const profileData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
        favorites: data.favorites,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...data } : null);

      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const addToFavorites = async (barberId: string) => {
    if (!userProfile) return;

    try {
      const favorites = userProfile.favorites || [];
      if (!favorites.includes(barberId)) {
        const updatedFavorites = [...favorites, barberId];
        await updateProfile({ favorites: updatedFavorites });
      }
    } catch (error) {
      console.error('Add to favorites error:', error);
      throw error;
    }
  };

  const removeFromFavorites = async (barberId: string) => {
    if (!userProfile || !userProfile.favorites) return;

    try {
      const updatedFavorites = userProfile.favorites.filter((id) => id !== barberId);
      await updateProfile({ favorites: updatedFavorites });
    } catch (error) {
      console.error('Remove from favorites error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userProfile,
        loading, 
        login, 
        register, 
        logout,
        updateProfile,
        addToFavorites,
        removeFromFavorites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}