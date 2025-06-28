import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SearchForm from '@/components/search-form';
import PropertyCard from '@/components/property-card';
import { useAuth } from '@/hooks/use-auth';
import type { Property, Favorite } from '@shared/schema';

export default function Properties() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchFilters, setSearchFilters] = useState<any>({});

  const isFavoritesPage = location === '/favorites';

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filters: any = {};
    
    if (urlParams.get('location')) filters.location = urlParams.get('location');
    if (urlParams.get('rooms')) filters.rooms = parseInt(urlParams.get('rooms')!);
    if (urlParams.get('maxPrice')) filters.maxPrice = parseInt(urlParams.get('maxPrice')!);
    
    setSearchFilters(filters);
  }, []);

  const { data: properties, isLoading: propertiesLoading, refetch: refetchProperties } = useQuery({
    queryKey: ['/api/properties', searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key]) params.append(key, searchFilters[key].toString());
      });
      
      const response = await fetch(`/api/properties?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: !isFavoritesPage,
  });

  const { data: favorites, isLoading: favoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isFavoritesPage && isAuthenticated,
  });

  const handleSearch = (filters: any) => {
    setSearchFilters(filters);
    
    // Update URL
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key].toString());
    });
    
    window.history.replaceState(
      {},
      '',
      `/properties${params.toString() ? '?' + params.toString() : ''}`
    );
  };

  const handleFavoriteChange = () => {
    if (isFavoritesPage) {
      refetchFavorites();
    } else {
      refetchProperties();
    }
  };

  const displayProperties = isFavoritesPage 
    ? (favorites?.map((f: any) => f.property) || [])
    : (properties || []);

  const isLoading = isFavoritesPage ? favoritesLoading : propertiesLoading;

  if (isFavoritesPage && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login påkrævet</h1>
            <p className="text-gray-600 mb-4">Du skal være logget ind for at se dine favoritter.</p>
            <Button onClick={() => window.location.href = '/login'}>
              Log ind
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            {isFavoritesPage ? 'Mine favoritter' : 'Find din næste bolig'}
          </h1>
          
          {!isFavoritesPage && (
            <div className="max-w-4xl">
              <SearchForm onSearch={handleSearch} />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="surface animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-4 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="surface max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isFavoritesPage ? 'Ingen favoritter endnu' : 'Ingen boliger fundet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isFavoritesPage 
                ? 'Du har ikke tilføjet nogen boliger til dine favoritter endnu.'
                : 'Prøv at justere dine søgekriterier eller fjern nogle filtre.'
              }
            </p>
            {!isFavoritesPage && (
              <Button onClick={() => handleSearch({})} className="bg-blue-600 hover:bg-blue-700">
                Ryd alle filtre
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-gray-600 text-lg">
                {displayProperties.length} {displayProperties.length === 1 ? 'bolig' : 'boliger'} fundet
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayProperties.map((property: Property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property}
                  isFavorite={isFavoritesPage}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
