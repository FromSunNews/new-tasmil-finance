"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have auth token
        let hasToken = false;
        
        if (typeof window !== 'undefined') {
          try {
            const { useAuthStore } = await import('@/store/use-auth');
            const token = useAuthStore.getState().accessToken;
            hasToken = !!token || !!localStorage.getItem('auth_token');
          } catch {
            hasToken = !!localStorage.getItem('auth_token');
          }
        }

        setIsAuthenticated(hasToken);

        // If no token, redirect to login or show fallback
        if (!hasToken && !fallback) {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        if (!fallback) {
          router.push('/');
        }
      }
    };

    checkAuth();
  }, [router, fallback]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null; // Will redirect
  }

  // Authenticated
  return <>{children}</>;
}

// Hook to use authentication state
export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        try {
          const token = localStorage.getItem('auth_token');
          setIsAuthenticated(!!token);
        } catch {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();

    // Listen for storage changes (logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return isAuthenticated;
}