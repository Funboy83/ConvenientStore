'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading
    if (isUserLoading) return;

    // Don't redirect if on login page
    if (pathname === '/login') return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // Show loading state while checking auth
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
