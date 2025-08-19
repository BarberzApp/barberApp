import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// Types
export type UserRole = "client" | "barber"

export type User = {
  id: string
  name: string
  email: string
  role?: "client" | "barber" // Make role optional to handle OAuth users without roles
  username?: string
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
  avatar_url?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  status: "loading" | "authenticated" | "unauthenticated"
  isInitialized: boolean
  showLoginModal: boolean
}

interface AuthActions {
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: UserRole, businessName?: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  addToFavorites: (barberId: string) => Promise<void>
  removeFromFavorites: (barberId: string) => Promise<void>
  
  // Internal state setters
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setStatus: (status: "loading" | "authenticated" | "unauthenticated") => void
  setInitialized: (initialized: boolean) => void
  setShowLoginModal: (show: boolean) => void
  
  // Initialize auth state
  initialize: () => Promise<void>
  fetchUserProfile: (userId: string) => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    isLoading: true,
    status: "loading",
    isInitialized: false,
    showLoginModal: false,

    // State setters
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ isLoading: loading }),
    setStatus: (status) => set({ status }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),
    setShowLoginModal: (show) => set({ showLoginModal: show }),

    // Initialize auth state
    initialize: async () => {
      try {
        console.log('[AUTH] initialize: starting');
        set({ isLoading: true, status: "loading" })
        
        // Check current session from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[AUTH] initialize: session', session);
        
        if (session?.user) {
          console.log('[AUTH] initialize: found session for user', session.user.email)
          await get().fetchUserProfile(session.user.id)
        } else {
          console.log('[AUTH] initialize: no active session found')
          set({ 
            user: null, 
            isLoading: false, 
            status: "unauthenticated",
            isInitialized: true 
          })
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[AUTH] auth state change:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' && session?.user) {
            await get().fetchUserProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              isLoading: false, 
              status: "unauthenticated",
              isInitialized: true 
            })
          }
        })

        // Store subscription for cleanup (we'll handle cleanup elsewhere)
        // Note: In a real app, you might want to store this subscription and clean it up on app unmount
        console.log('[AUTH] initialize: auth subscription set up')
      } catch (error) {
        console.error('[AUTH] initialize error:', error)
        set({ 
          user: null, 
          isLoading: false, 
          status: "unauthenticated",
          isInitialized: true 
        })
      }
    },

    // Fetch user profile from database
    fetchUserProfile: async (userId: string) => {
      try {
        console.log('[AUTH] fetchUserProfile: fetching profile for user', userId)
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('[AUTH] fetchUserProfile error:', error)
          set({ 
            user: null, 
            isLoading: false, 
            status: "unauthenticated",
            isInitialized: true 
          })
          return
        }

        if (profile) {
          const user: User = {
            id: profile.id,
            name: profile.name || '',
            email: profile.email || '',
            role: profile.role as UserRole,
            username: profile.username,
            phone: profile.phone,
            location: profile.location,
            description: profile.description,
            bio: profile.bio,
            favorites: profile.favorites,
            joinDate: profile.created_at,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            barberId: profile.barber_id,
            specialties: profile.specialties,
            priceRange: profile.price_range,
            nextAvailable: profile.next_available,
            avatar_url: profile.avatar_url,
          }

          console.log('[AUTH] fetchUserProfile: user profile loaded', user)
          set({ 
            user, 
            isLoading: false, 
            status: "authenticated",
            isInitialized: true 
          })
        } else {
          console.log('[AUTH] fetchUserProfile: no profile found')
          set({ 
            user: null, 
            isLoading: false, 
            status: "unauthenticated",
            isInitialized: true 
          })
        }
      } catch (error) {
        console.error('[AUTH] fetchUserProfile error:', error)
        set({ 
          user: null, 
          isLoading: false, 
          status: "unauthenticated",
          isInitialized: true 
        })
      }
    },

    // Login action
    login: async (email: string, password: string) => {
      try {
        console.log('[AUTH] login: attempting login for', email)
        set({ isLoading: true })
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error('[AUTH] login error:', error)
          set({ isLoading: false })
          return false
        }

        if (data.user) {
          console.log('[AUTH] login: successful login for', data.user.email)
          await get().fetchUserProfile(data.user.id)
          return true
        }

        set({ isLoading: false })
        return false
      } catch (error) {
        console.error('[AUTH] login error:', error)
        set({ isLoading: false })
        return false
      }
    },

    // Register action
    register: async (name: string, email: string, password: string, role: UserRole, businessName?: string) => {
      try {
        console.log('[AUTH] register: attempting registration for', email)
        set({ isLoading: true })
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              business_name: businessName,
            },
          },
        })

        if (error) {
          console.error('[AUTH] register error:', error)
          set({ isLoading: false })
          return false
        }

        if (data.user) {
          console.log('[AUTH] register: successful registration for', data.user.email)
          
          // Create profile in database
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                name,
                email,
                role,
                username: name.toLowerCase().replace(/\s+/g, ''),
                business_name: businessName,
              },
            ])

          if (profileError) {
            console.error('[AUTH] register: profile creation error:', profileError)
            set({ isLoading: false })
            return false
          }

          // If role is barber, create barber record
          if (role === 'barber') {
            const { error: barberError } = await supabase
              .from('barbers')
              .insert([
                {
                  user_id: data.user.id,
                  business_name: businessName,
                  specialties: [],
                },
              ])

            if (barberError) {
              console.error('[AUTH] register: barber creation error:', barberError)
            }
          }

          set({ isLoading: false })
          return true
        }

        set({ isLoading: false })
        return false
      } catch (error) {
        console.error('[AUTH] register error:', error)
        set({ isLoading: false })
        return false
      }
    },

    // Logout action
    logout: async () => {
      try {
        console.log('[AUTH] logout: signing out user')
        set({ isLoading: true })
        
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('[AUTH] logout error:', error)
        } else {
          console.log('[AUTH] logout: successful logout')
        }

        set({ 
          user: null, 
          isLoading: false, 
          status: "unauthenticated",
          showLoginModal: false 
        })
      } catch (error) {
        console.error('[AUTH] logout error:', error)
        set({ 
          user: null, 
          isLoading: false, 
          status: "unauthenticated",
          showLoginModal: false 
        })
      }
    },

    // Update profile action
    updateProfile: async (data: Partial<User>) => {
      try {
        const { user } = get()
        if (!user) return

        console.log('[AUTH] updateProfile: updating profile for user', user.id)
        
        const { error } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            username: data.username,
            phone: data.phone,
            location: data.location,
            description: data.description,
            bio: data.bio,
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (error) {
          console.error('[AUTH] updateProfile error:', error)
          return
        }

        // Update local state
        set({ user: { ...user, ...data } })
        console.log('[AUTH] updateProfile: profile updated successfully')
      } catch (error) {
        console.error('[AUTH] updateProfile error:', error)
      }
    },

    // Add to favorites action
    addToFavorites: async (barberId: string) => {
      try {
        const { user } = get()
        if (!user) return

        const currentFavorites = user.favorites || []
        const newFavorites = [...currentFavorites, barberId]

        const { error } = await supabase
          .from('profiles')
          .update({ favorites: newFavorites })
          .eq('id', user.id)

        if (error) {
          console.error('[AUTH] addToFavorites error:', error)
          return
        }

        set({ user: { ...user, favorites: newFavorites } })
        console.log('[AUTH] addToFavorites: added barber to favorites')
      } catch (error) {
        console.error('[AUTH] addToFavorites error:', error)
      }
    },

    // Remove from favorites action
    removeFromFavorites: async (barberId: string) => {
      try {
        const { user } = get()
        if (!user) return

        const currentFavorites = user.favorites || []
        const newFavorites = currentFavorites.filter(id => id !== barberId)

        const { error } = await supabase
          .from('profiles')
          .update({ favorites: newFavorites })
          .eq('id', user.id)

        if (error) {
          console.error('[AUTH] removeFromFavorites error:', error)
          return
        }

        set({ user: { ...user, favorites: newFavorites } })
        console.log('[AUTH] removeFromFavorites: removed barber from favorites')
      } catch (error) {
        console.error('[AUTH] removeFromFavorites error:', error)
      }
    },
  }))
)

// Convenience hooks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.status === "authenticated")
export const useIsLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthStatus = () => useAuthStore((state) => state.status)
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized)
export const useShowLoginModal = () => useAuthStore((state) => state.showLoginModal) 