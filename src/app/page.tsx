'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (!user) {
      router.push('/login');
    } else {
      switch (user.role) {
        case 'client':
          router.push('/browse');
          break;
        case 'barber':
          router.push('/settings');
          break;
        default:
          router.push('/login');
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Book Your Next Haircut with Ease
        </h1>
        <p className="text-xl text-muted-foreground">
          Find the perfect barber, book your appointment, and get the look you want.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={handleGetStarted} size="lg">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
} 