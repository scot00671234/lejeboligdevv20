import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Home } from 'lucide-react';
import TenantNavbar from './tenant-navbar';
import LandlordNavbar from './landlord-navbar';
import type { User } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

export default function Navbar() {
  const [location] = useLocation();
  
  // Use React Query to get current user directly from the API
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      try {
        const apiUrl = API_CONFIG.getApiUrl('/api/auth/me');
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        return data.user;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // If user is authenticated, show role-specific navbar
  if (user && user.role) {
    if (user.role === 'tenant') {
      return <TenantNavbar />;
    } else if (user.role === 'landlord') {
      return <LandlordNavbar />;
    }
  }

  // Default navbar for non-authenticated users
  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/30">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-12">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Home className="text-white h-4 w-4" />
              </div>
              <span className="text-lg font-semibold text-gray-900 tracking-tight">Lejebolig Find</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/properties" 
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  location === '/properties' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Boliger
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                  Log ind
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                  Opret konto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
