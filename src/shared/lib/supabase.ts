import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    anonKey: supabaseAnonKey ? 'present' : 'missing'
  })
  
  // In development, throw an error
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing Supabase environment variables')
  }
}

// Create a single Supabase client instance for the entire app
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'barber-app-auth',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null
        try {
          const value = window.localStorage.getItem(key)
          if (!value) return null
          const { session, expiresAt } = JSON.parse(value)
          if (new Date(expiresAt) <= new Date()) {
            // Session expired, remove it
            window.localStorage.removeItem(key)
            return null
          }
          return session
        } catch (error) {
          console.error('Error reading from localStorage:', error)
          return null
        }
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return
        try {
          const sessionData = {
            session: value,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }
          window.localStorage.setItem(key, JSON.stringify(sessionData))
        } catch (error) {
          console.error('Error writing to localStorage:', error)
        }
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return
        try {
          window.localStorage.removeItem(key)
        } catch (error) {
          console.error('Error removing from localStorage:', error)
        }
      }
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'barber-app'
    }
  }
})

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) 