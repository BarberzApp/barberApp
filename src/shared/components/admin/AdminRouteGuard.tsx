import { ReactNode } from 'react';
import { useAdminAuth } from '@/shared/hooks/useAdminAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, Shield, Lock, AlertTriangle } from 'lucide-react';

interface AdminRouteGuardProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  fallback?: ReactNode;
  hideHeader?: boolean;
}

export function AdminRouteGuard({ 
  children, 
  requireSuperAdmin = false,
  fallback,
  hideHeader = false
}: AdminRouteGuardProps) {
  const { isAdmin, isSuperAdmin, loading, adminUser } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect to login if not authenticated
      router.push('/login');
    } else if (!loading && requireSuperAdmin && !isSuperAdmin) {
      // Redirect to home if not super admin but super admin is required
      router.push('/');
    }
  }, [loading, isAdmin, isSuperAdmin, requireSuperAdmin, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-secondary" />
          <p className="text-white/60 font-medium">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/95 border border-white/20 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-500/20 rounded-full w-fit">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-white text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/60">
              You don't have permission to access this page. Admin privileges are required.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/')}
                className="flex-1 bg-secondary text-primary hover:bg-secondary/90"
              >
                Go Home
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/login')}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied for non-super admin when super admin is required
  if (requireSuperAdmin && !isSuperAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/95 border border-white/20 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-yellow-500/20 rounded-full w-fit">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-white text-xl">Super Admin Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/60">
              This page requires super admin privileges. You have admin access but not super admin access.
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-secondary text-primary hover:bg-secondary/90"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show admin interface
  if (hideHeader) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-black/95 border-b border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Admin Dashboard</h1>
                <p className="text-white/60 text-sm">
                  {adminUser?.name} ({adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm">
                {adminUser?.email}
              </span>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Exit Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
} 