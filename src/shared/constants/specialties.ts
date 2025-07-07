// Comprehensive list of barber and cosmetology specialties for autocomplete, search, and filtering
export const BARBER_SPECIALTIES = [
  // Hair Services
  'Haircuts',
  'Hair Coloring',
  'Hair Styling',
  'Hair Extensions',
  'Hair Treatments',
  'Hair Perming',
  'Hair Bleaching',
  'Hair Highlights',
  'Hair Lowlights',
  'Hair Toner',
  'Hair Gloss',
  'Hair Masks',
  'Hair Trimming',
  'Hair Shaping',
  
  // Beard & Facial Services
  'Beard Trim',
  'Beard Styling',
  'Beard Shaping',
  'Mustache Trim',
  'Mustache Styling',
  'Facial Hair Design',
  'Hot Towel Shaves',
  'Straight Razor Shaves',
  'Facial Treatments',
  'Skin Care',
  'Facial Massage',
  'Beard Oil Treatment',
  'Beard Waxing',
  
  // Specialized Techniques
  'Fade',
  'Taper Cut',
  'Undercut',
  'Line Up',
  'Edge Up',
  'Textured Cut',
  'Layered Cut',
  'Blunt Cut',
  'Point Cut',
  'Razor Cut',
  'Scissor Cut',
  'Clipper Cut',
  'Thinning',
  'Texturizing',
  'Graduation',
  
  // Styling & Design
  'Pompadour',
  'Slick Back',
  'Quiff',
  'Side Part',
  'Modern Style',
  'Classic Style',
  'Vintage Style',
  'Contemporary Style',
  'Wedding Hair',
  'Special Occasion Styling',
  'Updos',
  'Braids',
  'Cornrows',
  'Dreadlocks',
  'Twists',
  
  // Demographics
  'Kids Haircut',
  'Senior Haircut',
  'Men\'s Haircut',
  'Women\'s Haircut',
  'Teen Haircut',
  'Toddler Haircut',
  
  // Advanced Services
  'Hair Consultation',
  'Color Correction',
  'Hair Repair',
  'Scalp Treatments',
  'Hair Loss Treatment',
  'Hair Growth Treatment',
  'Keratin Treatment',
  'Brazilian Blowout',
  'Hair Bonding',
  'Hair Weaving',
  'Hair Taping',
  'Hair Fusion',
  'Hair Microlinks',
  'Hair Clip-ins',
  'Hair Wigs',
  
  // Maintenance & Care
  'Hair Wash',
  'Hair Blow Dry',
  'Hair Set',
  'Hair Roller Set',
  'Hair Curling',
  'Hair Straightening',
  'Hair Detangling',
  'Hair Detox',
  'Hair Clarifying',
  'Hair Moisturizing',
  'Hair Protein Treatment',
  'Hair Deep Conditioning',
  'Hair Trim',
  'Hair Dusting'
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
    hairServices: [
      'Haircuts', 'Hair Coloring', 'Hair Styling', 'Hair Extensions', 'Hair Treatments',
      'Hair Straightening', 'Hair Perming', 'Hair Bleaching', 'Hair Highlights', 'Hair Lowlights',
      'Hair Toner', 'Hair Gloss', 'Hair Masks', 'Hair Trimming', 'Hair Shaping'
    ],
    beardFacial: [
      'Beard Trim', 'Beard Styling', 'Beard Shaping', 'Mustache Trim', 'Mustache Styling',
      'Facial Hair Design', 'Hot Towel Shaves', 'Straight Razor Shaves', 'Facial Treatments',
      'Skin Care', 'Facial Massage', 'Beard Oil Treatment', 'Beard Waxing'
    ],
    techniques: [
      'Fade', 'Taper Cut', 'Undercut', 'Line Up', 'Edge Up', 'Textured Cut', 'Layered Cut',
      'Blunt Cut', 'Point Cut', 'Razor Cut', 'Scissor Cut', 'Clipper Cut', 'Thinning',
      'Texturizing', 'Graduation'
    ],
    styling: [
      'Pompadour', 'Slick Back', 'Quiff', 'Side Part', 'Modern Style', 'Classic Style',
      'Vintage Style', 'Contemporary Style', 'Wedding Hair', 'Special Occasion Styling',
      'Updos', 'Braids', 'Cornrows', 'Dreadlocks', 'Twists'
    ],
    demographics: [
      'Kids Haircut', 'Senior Haircut', 'Men\'s Haircut', 'Women\'s Haircut',
      'Teen Haircut', 'Toddler Haircut'
    ],
    advanced: [
      'Hair Consultation', 'Color Correction', 'Hair Repair', 'Scalp Treatments',
      'Hair Loss Treatment', 'Hair Growth Treatment', 'Keratin Treatment', 'Brazilian Blowout',
      'Hair Bonding', 'Hair Weaving', 'Hair Taping', 'Hair Fusion', 'Hair Microlinks',
      'Hair Clip-ins', 'Hair Wigs'
    ],
    maintenance: [
      'Hair Wash', 'Hair Blow Dry', 'Hair Set', 'Hair Roller Set', 'Hair Curling',
      'Hair Straightening', 'Hair Detangling', 'Hair Detox', 'Hair Clarifying',
      'Hair Moisturizing', 'Hair Protein Treatment', 'Hair Deep Conditioning',
      'Hair Trim', 'Hair Dusting', 'Hair Shaping'
    ]
  }
} 