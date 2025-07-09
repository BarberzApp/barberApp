# Zustand Auth Store

This directory contains the Zustand-based authentication store that replaces the Context-based auth system.

## Features

- **Better Performance**: Zustand provides better performance than Context API
- **TypeScript Support**: Full TypeScript support with proper type inference
- **Selectors**: Individual selectors for better performance optimization
- **Persistence**: Automatic session persistence with Supabase
- **Real-time Updates**: Automatic auth state synchronization

## Usage

### Basic Usage

```tsx
import { useAuth } from '@/shared/hooks/use-auth-zustand'

function MyComponent() {
  const { user, isLoading, login, logout } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login('email', 'password')}>Login</button>
      )}
    </div>
  )
}
```

### Using Individual Selectors

For better performance, use individual selectors:

```tsx
import { useUser, useIsAuthenticated, useIsLoading } from '@/shared/hooks/use-auth-zustand'

function MyComponent() {
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useIsLoading()
  
  // Component will only re-render when these specific values change
}
```

### Direct Store Access

You can also access the store directly:

```tsx
import { useAuthStore } from '@/shared/stores/auth-store'

function MyComponent() {
  const { user, login, logout } = useAuthStore()
  
  // Direct access to all store methods and state
}
```

## Store Methods

### State
- `user: User | null` - Current user data
- `isLoading: boolean` - Loading state
- `status: "loading" | "authenticated" | "unauthenticated"` - Auth status
- `isInitialized: boolean` - Whether the store has been initialized

### Actions
- `login(email: string, password: string): Promise<boolean>` - Login user
- `register(name: string, email: string, password: string, role: UserRole, businessName?: string): Promise<boolean>` - Register user
- `logout(): Promise<void>` - Logout user
- `updateProfile(data: Partial<User>): Promise<void>` - Update user profile
- `addToFavorites(barberId: string): Promise<void>` - Add barber to favorites
- `removeFromFavorites(barberId: string): Promise<void>` - Remove barber from favorites
- `initialize(): Promise<void>` - Initialize auth state

## Migration from Context API

The new Zustand store provides the same interface as the old Context API, so migration is straightforward:

### Before (Context API)
```tsx
import { useAuth } from '@/features/auth/hooks/use-auth'
```

### After (Zustand)
```tsx
import { useAuth } from '@/shared/hooks/use-auth-zustand'
```

The API remains the same, so no other changes are needed.

## Benefits of Zustand

1. **Better Performance**: No unnecessary re-renders
2. **Smaller Bundle**: Lighter than Redux or Context API
3. **TypeScript**: Excellent TypeScript support
4. **DevTools**: Built-in Redux DevTools support
5. **Middleware**: Support for middleware like `subscribeWithSelector`
6. **No Provider**: No need to wrap components in providers

## Example Components

See `src/shared/components/examples/zustand-example.tsx` for a complete example of how to use the store.

## Provider Setup

The store automatically initializes when used, but you can also wrap your app with the `ZustandProvider` for explicit initialization:

```tsx
import { ZustandProvider } from '@/shared/components/providers/zustand-provider'

function App() {
  return (
    <ZustandProvider>
      {/* Your app components */}
    </ZustandProvider>
  )
}
``` 