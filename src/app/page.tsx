'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function HomePage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

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
  }, [user, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
} 