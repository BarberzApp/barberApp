// Cosmetology practice specialties for autocomplete, search, and filtering
export const BARBER_SPECIALTIES = [
  'Barber',
  'Stylist',
  'Nail Tech',
  'Braids',
  'Tattoos',
  'Lashes',
  'Brows',
] as const

// Type for TypeScript support
export type BarberSpecialty = typeof BARBER_SPECIALTIES[number]

// Helper function to check if a string is a valid specialty
export const isValidSpecialty = (specialty: string): specialty is BarberSpecialty => {
  return BARBER_SPECIALTIES.includes(specialty as BarberSpecialty)
}

// Helper function to get filtered specialties based on search query
export const getFilteredSpecialties = (query: string): BarberSpecialty[] => {
  const lowercaseQuery = query.toLowerCase()
  return BARBER_SPECIALTIES.filter(specialty => 
    specialty.toLowerCase().includes(lowercaseQuery)
  )
}

// Helper function to get specialties by category
export const getSpecialtiesByCategory = () => {
  return {
    practices: [
      'Barber', 'Stylist', 'Nail Tech', 'Braids', 'Tattoos', 'Lashes', 'Brows'
    ]
  }
} 