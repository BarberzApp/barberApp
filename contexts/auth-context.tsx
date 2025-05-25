"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

// Types
export type UserRole = "client" | "barber" | "business"

export type User = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  phone?: string
  location?: string
  favorites?: string[]
  wallet?: number
  stripeCustomerId?: string
  stripeAccountId?: string
  businessId?: string
  businessName?: string
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

// Mock user data
const mockUsers = [
  {
    id: "c1",
    name: "John Client",
    email: "client@example.com",
    image: "/placeholder.svg?height=100&width=100",
    role: "client" as UserRole,
    phone: "555-123-4567",
    location: "New York, NY",
    favorites: ["b1", "b3"],
    wallet: 150.0,
    stripeCustomerId: "cus_mock123",
  },
  {
    id: "b1",
    name: "Alex Johnson",
    email: "barber@example.com",
    image: "/placeholder.svg?height=100&width=100",
    role: "barber" as UserRole,
    phone: "555-987-6543",
    location: "Downtown, New York, NY",
    wallet: 750.0,
    stripeCustomerId: "cus_mock456",
    stripeAccountId: "acct_mock123",
  },
  {
    id: "biz1",
    name: "Elite Cuts",
    email: "business@example.com",
    image: "/placeholder.svg?height=100&width=100",
    role: "business" as UserRole,
    phone: "555-789-0123",
    location: "123 Main St, New York, NY",
    wallet: 2500.0,
    stripeCustomerId: "cus_mock789",
    businessName: "Elite Cuts",
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser) {
      setUser(foundUser)
      return true
    }
    return false
  }

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if email already exists
    if (mockUsers.some((u) => u.email === email)) {
      return false
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      role,
      image: "/placeholder.svg?height=100&width=100",
      favorites: [],
      wallet: 0,
      stripeCustomerId: `cus_new${Date.now()}`,
    }

    // Add Stripe Connect account ID for barbers
    if (role === "barber") {
      newUser.stripeAccountId = `acct_new${Date.now()}`
    }

    setUser(newUser)
    return true
  }

  const logout = () => {
    setUser(null)
  }

  const updateProfile = (data: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...data }
    setUser(updatedUser)
  }

  const addToFavorites = (barberId: string) => {
    if (!user) return

    const favorites = user.favorites || []
    if (!favorites.includes(barberId)) {
      const updatedFavorites = [...favorites, barberId]
      updateProfile({ favorites: updatedFavorites })
    }
  }

  const removeFromFavorites = (barberId: string) => {
    if (!user || !user.favorites) return

    const updatedFavorites = user.favorites.filter((id) => id !== barberId)
    updateProfile({ favorites: updatedFavorites })
  }

  const addFundsToWallet = async (amount: number): Promise<boolean> => {
    if (!user) return false

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const currentWallet = user.wallet || 0
    updateProfile({ wallet: currentWallet + amount })
    return true
  }

  const withdrawFromWallet = async (amount: number): Promise<boolean> => {
    if (!user || !user.wallet || user.wallet < amount) return false

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    updateProfile({ wallet: user.wallet - amount })
    return true
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === "loading",
        status,
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
