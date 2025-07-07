import { useAuthStore, useUser, useIsAuthenticated, useIsLoading, useAuthStatus, useIsInitialized } from '@/shared/stores/auth-store'
import { useToast } from '@/shared/components/ui/use-toast'
import { useEffect } from 'react'

export const useAuth = () => {
  const { toast } = useToast()
  const {
    user,
    isLoading,
    status,
    isInitialized,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
    updateProfile: updateProfileAction,
    addToFavorites: addToFavoritesAction,
    removeFromFavorites: removeFromFavoritesAction,
    initialize
  } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const success = await loginAction(email, password)
      if (success) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user?.name}!`,
        })
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        })
      }
      return success
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    }
  }

  const register = async (name: string, email: string, password: string, role: "client" | "barber", businessName?: string): Promise<boolean> => {
    try {
      const success = await registerAction(name, email, password, role, businessName)
      if (success) {
        toast({
          title: "Registration successful",
          description: role === 'barber' 
            ? "Welcome to BOCM! Please complete your business profile setup."
            : "Welcome to BOCM!",
        })
      } else {
        toast({
          title: "Registration failed",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        })
      }
      return success
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = async () => {
    try {
      await logoutAction()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateProfile = async (data: Partial<import('@/shared/stores/auth-store').User>) => {
    try {
      await updateProfileAction(data)
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Profile update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const addToFavorites = async (barberId: string) => {
    try {
      await addToFavoritesAction(barberId)
      toast({
        title: "Added to favorites",
        description: "Barber added to your favorites",
      })
    } catch (error) {
      toast({
        title: "Failed to add to favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const removeFromFavorites = async (barberId: string) => {
    try {
      await removeFromFavoritesAction(barberId)
      toast({
        title: "Removed from favorites",
        description: "Barber removed from your favorites",
      })
    } catch (error) {
      toast({
        title: "Failed to remove from favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return {
    user,
    isLoading,
    status,
    isInitialized,
    login,
    register,
    logout,
    updateProfile,
    addToFavorites,
    removeFromFavorites,
  }
}

// Export individual selectors for better performance
export { useUser, useIsAuthenticated, useIsLoading, useAuthStatus, useIsInitialized } 