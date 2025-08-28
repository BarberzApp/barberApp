import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'
import { mockUser } from '@/shared/utils/test-utils'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.status).toBe('loading')
    expect(result.current.user).toBeNull()
  })

  it('should handle successful authentication', async () => {
    const mockSession = {
      user: mockUser,
      access_token: 'test-token',
      refresh_token: 'test-refresh',
    }
    
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle unauthenticated state', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    })
    
    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle authentication errors', async () => {
    const mockError = { message: 'Authentication failed' }
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: null }, 
      error: mockError 
    })
    
    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated')
    })
    
    expect(result.current.user).toBeNull()
  })

  it('should handle sign in', async () => {
    const mockSession = { user: mockUser }
    mockSupabase.auth.signIn.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password')
    })
    
    expect(mockSupabase.auth.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should handle sign in errors', async () => {
    const mockError = { message: 'Invalid credentials' }
    mockSupabase.auth.signIn.mockResolvedValue({ 
      data: { session: null }, 
      error: mockError 
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const error = await result.current.signIn('test@example.com', 'wrong-password')
      expect(error).toEqual(mockError)
    })
  })

  it('should handle sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signOut()
    })
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should handle sign out errors', async () => {
    const mockError = { message: 'Sign out failed' }
    mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const error = await result.current.signOut()
      expect(error).toEqual(mockError)
    })
  })

  it('should set up auth state change listener', () => {
    const mockCallback = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
    
    renderHook(() => useAuth())
    
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    let authChangeCallback: any
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })
    
    const { result } = renderHook(() => useAuth())
    
    // Simulate auth state change
    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: mockUser })
    })
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.status).toBe('authenticated')
    })
  })

  it('should handle sign out state change', async () => {
    let authChangeCallback: any
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })
    
    const { result } = renderHook(() => useAuth())
    
    // Set initial authenticated state
    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: mockUser })
    })
    
    // Simulate sign out
    await act(async () => {
      authChangeCallback('SIGNED_OUT', null)
    })
    
    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.status).toBe('unauthenticated')
    })
  })
})

