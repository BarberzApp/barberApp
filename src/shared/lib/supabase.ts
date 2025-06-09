import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single Supabase client instance for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'barber-app-auth',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null
        const value = window.localStorage.getItem(key)
        if (!value) return null
        try {
          const { session, expiresAt } = JSON.parse(value)
          if (new Date(expiresAt) <= new Date()) {
            // Session expired, remove it
            window.localStorage.removeItem(key)
            return null
          }
          return session
        } catch {
          return null
        }
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return
        const sessionData = {
          session: value,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
        window.localStorage.setItem(key, JSON.stringify(sessionData))
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return
        window.localStorage.removeItem(key)
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
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) 