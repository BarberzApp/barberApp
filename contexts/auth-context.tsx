"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Types
export type UserRole = "client" | "barber" | "business"

export type User = {
  id: string
  name: string
  email: string
  image?: string
  role: "client" | "barber" | "business"
  businessName?: string
  phone?: string
  location?: string
  description?: string
  favorites?: string[]
  wallet?: number
  stripeCustomerId?: string
  stripeAccountId?: string
  businessId?: string
  bio?: string
  joinDate?: string
  services?: Array<{
    id: string
    name: string
    price: number
    duration: number
  }>
  specialties?: string[]
  portfolio?: string[]
  isPublic?: boolean
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
  addFundsToWallet: (amount: number) => Promise<boolean>
  withdrawFromWallet: (amount: number) => Promise<boolean>
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
  addFundsToWallet: async () => false,
  withdrawFromWallet: async () => false,
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
        image: undefined,
        role: profile.role,
        phone: profile.phone,
        location: profile.location,
        favorites: profile.favorites,
        wallet: profile.wallet,
        stripeCustomerId: profile.stripe_customer_id,
        stripeAccountId: profile.stripe_account_id,
        businessId: profile.business_id,
        businessName: profile.business_name,
        description: profile.description,
        bio: profile.bio,
        joinDate: profile.join_date,
        services: profile.services,
        specialties: profile.specialties,
        portfolio: profile.portfolio,
        isPublic: profile.is_public,
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
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.session) {
        console.log('User authenticated, fetching profile...');
        
        // Fetch additional user data from the profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        console.log('Profile fetch response:', { profile, profileError });

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return false;
        }

        setUser({
          id: data.session.user.id,
          name: data.session.user.user_metadata?.name || "",
          email: data.session.user.email || "",
          image: data.session.user.user_metadata?.avatar_url || undefined,
          role: profile?.role || 'client',
          phone: profile?.phone || undefined,
          location: profile?.location || undefined,
          favorites: profile?.favorites || [],
          wallet: profile?.wallet || 0,
          stripeCustomerId: profile?.stripe_customer_id || undefined,
          stripeAccountId: profile?.stripe_account_id || undefined,
          businessId: profile?.business_id || undefined,
          businessName: profile?.business_name || undefined,
          description: profile?.description || undefined,
          bio: profile?.bio || undefined,
          joinDate: profile?.join_date || undefined,
          services: profile?.services || [],
          specialties: profile?.specialties || [],
          portfolio: profile?.portfolio || [],
          isPublic: profile?.is_public || false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      console.log('Starting registration process...');
      
      // Get the current URL for the callback
      const redirectTo = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/auth/callback'
        : `${window.location.origin}/auth/callback`;

      console.log('Using redirect URL:', redirectTo);
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: redirectTo,
        },
      });

      console.log('Auth signup response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      if (authData.user) {
        // Set user state
        setUser({
          id: authData.user.id,
          name,
          email,
          image: undefined,
          role,
          wallet: 0,
          favorites: [],
          description: undefined,
          bio: undefined,
          joinDate: undefined,
          services: [],
          specialties: [],
          portfolio: [],
          isPublic: false,
        });

        toast({
          title: "Registration successful",
          description: "Welcome to BarberHub!",
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
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) throw error

      setUser(prev => prev ? { ...prev, ...data } : null)
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Profile update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const addToFavorites = async (barberId: string) => {
    if (!user) return

    try {
      const favorites = user.favorites || []
      if (!favorites.includes(barberId)) {
        const updatedFavorites = [...favorites, barberId]
        await updateProfile({ favorites: updatedFavorites })
      }
    } catch (error) {
      console.error('Add to favorites error:', error)
      toast({
        title: "Failed to add to favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const removeFromFavorites = async (barberId: string) => {
    if (!user || !user.favorites) return

    try {
      const updatedFavorites = user.favorites.filter((id) => id !== barberId)
      await updateProfile({ favorites: updatedFavorites })
    } catch (error) {
      console.error('Remove from favorites error:', error)
      toast({
        title: "Failed to remove from favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const addFundsToWallet = async (amount: number): Promise<boolean> => {
    if (!user) return false

    try {
      const currentWallet = user.wallet || 0
      const { error } = await supabase
        .from('profiles')
        .update({ wallet: currentWallet + amount })
        .eq('id', user.id)

      if (error) throw error

      setUser(prev => prev ? { ...prev, wallet: currentWallet + amount } : null)
      return true
    } catch (error) {
      console.error('Add funds error:', error)
      toast({
        title: "Failed to add funds",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    }
  }

  const withdrawFromWallet = async (amount: number): Promise<boolean> => {
    if (!user || !user.wallet || user.wallet < amount) return false

    try {
      const currentWallet = user.wallet
      const { error } = await supabase
        .from('profiles')
        .update({ wallet: currentWallet - amount })
        .eq('id', user.id)

      if (error) throw error

      setUser(prev => prev ? { ...prev, wallet: currentWallet - amount } : null)
      return true
    } catch (error) {
      console.error('Withdraw funds error:', error)
      toast({
        title: "Failed to withdraw funds",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    }
  }

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
        addFundsToWallet,
        withdrawFromWallet,
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
