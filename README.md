# Barber App

A modern booking platform connecting barbers with clients.

## Core Features (MVP)

### Authentication
- Client and barber account creation
- Secure login system
- Profile management

### Booking System
- Clean, intuitive calendar interface
- Real-time availability checking
- Instant booking confirmation
- Appointment management

### Payment Processing
- Secure Stripe integration
- Instant payment processing
- Receipt generation
- Payment history

## Technical Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Stripe

## Project Structure
```
src/
├── features/
│   ├── auth/
│   ├── booking/
│   ├── profile/
│   └── payment/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── app/
    ├── (auth)/
    ├── (client)/
    ├── (barber)/
    └── api/
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```
4. Run development server:
   ```bash
   npm run dev -- -p 3002
   ```

## Development

### Code Organization
- Feature-based architecture
- Clear separation of concerns
- Modular components
- Type-safe development

### Best Practices
- Follow TypeScript best practices
- Use proper error handling
- Write clean, maintainable code
- Document complex logic

### Testing (adding soon)
- Unit tests for components
- Integration tests for features
- End-to-end testing
- Performance testing

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License - see LICENSE file for details 
