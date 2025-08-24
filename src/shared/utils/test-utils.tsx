// TODO: Fix testing library imports
// import React, { ReactElement } from 'react'
// import { render, RenderOptions } from '@testing-library/react'
// import { ThemeProvider } from '@/shared/components/theme/ThemeProvider'
// import { DataProvider } from '@/shared/contexts/data-context'

// Mock providers for testing
// const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <ThemeProvider
//       attribute="class"
//       defaultTheme="system"
//       enableSystem
//       disableTransitionOnChange
//     >
//       <DataProvider>
//         {children}
//       </DataProvider>
//     </ThemeProvider>
//   )
// }

// const customRender = (
//   ui: ReactElement,
//   options?: Omit<RenderOptions, 'wrapper'>
// ) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const mockBarber = {
  id: 'test-barber-id',
  name: 'Test Barber',
  business_name: 'Test Business',
  email: 'test@example.com',
  phone: '+1234567890',
  location: 'Test Location',
  rating: 4.5,
  review_count: 10,
  is_developer: false,
  stripe_account_id: 'acct_test123',
  stripe_account_status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockService = {
  id: 'test-service-id',
  barber_id: 'test-barber-id',
  name: 'Test Service',
  description: 'Test service description',
  price: 2500, // $25.00
  duration: 30,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockBooking = {
  id: 'test-booking-id',
  barber_id: 'test-barber-id',
  client_id: 'test-client-id',
  service_id: 'test-service-id',
  date: '2024-01-15',
  time: '10:00',
  status: 'confirmed',
  payment_status: 'paid',
  total_amount: 2500,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'client',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Mock API responses
export const mockApiResponse = {
  success: (data: any) => ({ data, error: null }),
  error: (message: string) => ({ data: null, error: { message } }),
}

// Mock Stripe payment intent
export const mockPaymentIntent = {
  id: 'pi_test123',
  client_secret: 'pi_test123_secret_test',
  amount: 2500,
  currency: 'usd',
  status: 'requires_payment_method',
}

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const mockSupabaseResponse = (data: any, error: any = null) => {
  return Promise.resolve({ data, error })
}

export const mockStripeResponse = (data: any, error: any = null) => {
  return Promise.resolve({ data, error })
}

// Re-export everything
// export * from '@testing-library/react'
// export { customRender as render }
