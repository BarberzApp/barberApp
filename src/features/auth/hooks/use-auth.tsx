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
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  status: "loading" | "authenticated" | "unauthenticated"
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>
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
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

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
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Start both auth and profile fetch in parallel
      const [authResponse, profileResponse] = await Promise.all([
        supabase.auth.signInWithPassword({ email, password }),
        supabase.from('profiles').select('*').eq('email', email).single()
      ]);

      const { data: authData, error: authError } = authResponse;
      const { data: profile, error: profileError } = profileResponse;

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Login failed",
          description: authError.message,
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

      // If profile fetch failed, try one more time with user ID
      if (profileError || !profile) {
        const { data: retryProfile, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (retryError || !retryProfile) {
          console.error('Profile fetch error:', retryError);
          // Sign out if profile doesn't exist
          await supabase.auth.signOut();
          toast({
            title: "Login failed",
            description: "User profile not found. Please try again.",
            variant: "destructive",
          });
          return false;
        }

        // Set user state with retry profile data
        setUser({
          id: authData.user.id,
          name: retryProfile.name,
          email: retryProfile.email,
          role: retryProfile.role,
          phone: retryProfile.phone,
          location: retryProfile.location,
          description: retryProfile.description,
          bio: retryProfile.bio,
          favorites: retryProfile.favorites,
          joinDate: retryProfile.join_date,
          createdAt: retryProfile.created_at,
          updatedAt: retryProfile.updated_at
        });
      } else {
        // Set user state with initial profile data
        setUser({
          id: authData.user.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          phone: profile.phone,
          location: profile.location,
          description: profile.description,
          bio: profile.bio,
          favorites: profile.favorites,
          joinDate: profile.join_date,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        });
      }

      // Store session in localStorage
      localStorage.setItem('barber-app-auth', JSON.stringify({
        user: authData.user,
        session: authData.session
      }));

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
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      console.log('Starting registration process...');
      console.log('Registration data:', { name, email, role });
      
      const redirectTo = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/auth/callback'
        : `${window.location.origin}/auth/callback`;

      // Create auth user with role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            name,
            role,
          }
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      console.log('Auth data:', authData);
      console.log('User metadata:', authData.user?.user_metadata);

      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch the created profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        console.log('Profile fetch result:', { profile, profileError });

        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError);
          toast({
            title: "Registration failed",
            description: "Failed to create user profile",
            variant: "destructive",
          });
          return false;
        }

        // Set user state
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

        toast({
          title: "Registration successful",
          description: "Welcome to BOCM!",
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

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
