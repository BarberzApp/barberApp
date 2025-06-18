"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from '@/shared/lib/supabase'
import { useToast } from "@/shared/components/ui/use-toast"

// Types
export type UserRole = "client" | "barber"

export type User = {
  id: string
  name: string
  email: string
  role: "client" | "barber"
  phone?: string
  location?: string
  description?: string
  bio?: string
  favorites?: string[]
  joinDate?: string
  createdAt?: string
  updatedAt?: string
  barberId?: string
  specialties?: string[]
  priceRange?: string
  nextAvailable?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  status: "loading" | "authenticated" | "unauthenticated"
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: UserRole, businessName?: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => void
  addToFavorites: (barberId: string) => void
  removeFromFavorites: (barberId: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  status: "loading",
  login: async () => false,
  register: async () => false,
  logout: () => {},
  updateProfile: () => {},
  addToFavorites: () => {},
  removeFromFavorites: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Check for existing session in localStorage
        const storedSession = localStorage.getItem('barber-app-auth')
        if (storedSession) {
          const { session, expiresAt } = JSON.parse(storedSession)
          if (new Date(expiresAt) > new Date()) {
            // Session is still valid
            if (session?.user) {
              await fetchUserProfile(session.user.id)
              return
            }
          }
        }

        // If no valid stored session, check current session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id)
        // Store session with expiration
        const sessionData = {
          session,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
        localStorage.setItem('barber-app-auth', JSON.stringify(sessionData))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('barber-app-auth')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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
          .single();

        if (data) {
          profile = data;
          break;
        }

        if (error) {
          profileError = error;
          // If it's not a "not found" error, break immediately
          if (error.code !== 'PGRST116') {
            break;
          }
        }

        // Wait before retrying
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!profile) {
        console.error('Error fetching user profile:', profileError);
        setUser(null);
        return;
      }

      setUser({
        id: userId,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        location: profile.location,
        description: profile.bio,
        bio: profile.bio,
        favorites: profile.favorites,
        joinDate: profile.join_date,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      });

      // Ensure barber row exists after confirmation
      if (profile.role === 'barber') {
        const { data: barber, error: barberError } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', userId)
          .single();
        if (!barber) {
          // Debugging: log current session user id and user_id to insert
          const { data: sessionData } = await supabase.auth.getSession();
          console.log('Current session user id:', sessionData?.session?.user?.id);
          console.log('user_id to insert:', userId);
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
            toast({
              title: "Barber profile creation failed",
              description: insertError.message,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 1. First authenticate the user with rate limiting check
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Handle specific error cases
        let errorMessage = authError.message;
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address first';
        } else if (authError.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later';
        }

        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      if (!authData.user) {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }

      // 2. Fetch profile with optimized query
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          barbers (
            id,
            specialties,
            price_range,
            next_available
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        // Sign out if profile doesn't exist
        await supabase.auth.signOut();
        
        const errorMessage = profileError?.code === 'PGRST116' 
          ? "User profile not found. Please contact support."
          : "Failed to load user profile. Please try again.";
          
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      // 3. Set user state with profile data and barber info if applicable
      const userData = {
        id: authData.user.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        location: profile.location,
        description: profile.bio,
        bio: profile.bio,
        favorites: profile.favorites,
        joinDate: profile.join_date,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        ...(profile.role === 'barber' && profile.barbers?.[0] ? {
          barberId: profile.barbers[0].id,
          specialties: profile.barbers[0].specialties,
          priceRange: profile.barbers[0].price_range,
          nextAvailable: profile.barbers[0].next_available
        } : {})
      };

      setUser(userData);

      // 4. Store session with expiration
      const sessionData = {
        user: authData.user,
        session: authData.session,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      localStorage.setItem('barber-app-auth', JSON.stringify(sessionData));

      // 5. Set up session refresh
      const refreshInterval = setInterval(async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          clearInterval(refreshInterval);
          await logout();
          return;
        }
        // Update session in storage
        localStorage.setItem('barber-app-auth', JSON.stringify({
          ...sessionData,
          session
        }));
      }, 15 * 60 * 1000); // Refresh every 15 minutes

      // Store refresh interval ID for cleanup
      localStorage.setItem('refresh-interval-id', refreshInterval.toString());

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial session data
      await supabase.auth.signOut();
      localStorage.removeItem('barber-app-auth');
      localStorage.removeItem('refresh-interval-id');
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, businessName?: string): Promise<boolean> => {
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
          }
        },
      });

      if (authError) {
        console.error('Auth Error:', authError);
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      console.log('Auth Data:', authData);

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.user.identities?.length === 0) {
          console.log('Email confirmation required');
          toast({
            title: "Check your email to confirm your account",
            description: "We've sent you a confirmation email. Please verify your email address to complete registration. You won't be able to log in until you confirm.",
            variant: "default",
          });
          return true;
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
          toast({
            title: "Registration failed",
            description: "Failed to create user profile. Please try again.",
            variant: "destructive",
          });
          return false;
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
            toast({
              title: "Registration warning",
              description: "Account created but business profile setup failed. Please complete setup in your profile.",
              variant: "destructive",
            });
          } else {
            console.log('Business profile created successfully');
          }
        }

        // Set user state
        console.log('Setting user state...');
        setUser({
          id: authData.user.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          phone: profile.phone,
          location: profile.location,
          description: profile.bio,
          bio: profile.bio,
          favorites: profile.favorites,
          joinDate: profile.join_date,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        });

        console.log('Registration completed successfully');
        toast({
          title: "Registration successful",
          description: role === 'barber' 
            ? "Welcome to BOCM! Please complete your business profile setup."
            : "Welcome to BOCM!",
        });

        // Redirect barbers to onboarding page
        if (role === 'barber') {
          console.log('Redirecting to onboarding page...');
          window.location.href = '/barber/onboarding';
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration Process Failed:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear refresh interval
      const intervalId = localStorage.getItem('refresh-interval-id');
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        localStorage.removeItem('refresh-interval-id');
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('barber-app-auth');
      
      // Reset user state
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    try {
      // Update profile data
      const profileData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        description: data.description,
        bio: data.bio,
        favorites: data.favorites,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user state
      setUser(prev => prev ? { ...prev, ...data } : null);

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Profile update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const addToFavorites = async (barberId: string) => {
    if (!user) return;

    try {
      const favorites = user.favorites || [];
      if (!favorites.includes(barberId)) {
        const updatedFavorites = [...favorites, barberId];
        await updateProfile({ favorites: updatedFavorites });
      }
    } catch (error) {
      console.error('Add to favorites error:', error);
      toast({
        title: "Failed to add to favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const removeFromFavorites = async (barberId: string) => {
    if (!user || !user.favorites) return;

    try {
      const updatedFavorites = user.favorites.filter((id) => id !== barberId);
      await updateProfile({ favorites: updatedFavorites });
    } catch (error) {
      console.error('Remove from favorites error:', error);
      toast({
        title: "Failed to remove from favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        status: isLoading ? "loading" : user ? "authenticated" : "unauthenticated",
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
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
