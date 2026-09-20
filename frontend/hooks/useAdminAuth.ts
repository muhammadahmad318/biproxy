import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const useAdminAuth = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Defer the state update to a microtask to avoid React's synchronous 
    // setState warning, while maintaining Next.js hydration safety.
    Promise.resolve().then(() => {
      if (!isMounted) return;
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setIsAuthenticated(false);
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return { isAuthenticated, logout };
};
