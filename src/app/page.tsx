'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'

export default function HomePage() {
  const router = useRouter();
  const { replace: safeReplace } = useSafeNavigation();
  useEffect(() => {
    safeReplace('/landing');
  }, [safeReplace]);
  return null;
} 