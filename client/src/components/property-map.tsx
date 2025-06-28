import { useEffect, useRef } from 'react';
import type { Property } from '@shared/schema';

interface PropertyMapProps {
  property: Property;
  className?: string;
}

export default function PropertyMap({ property, className = "" }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create a simple map using OpenStreetMap
    const createMap = () => {
      const mapElement = mapRef.current;
      if (!mapElement) return;

      // Get coordinates from postal code or address
      const getCoordinates = async () => {
        try {
          const query = `${property.address}, ${property.city || ''}, ${property.postalCode || ''}, Denmark`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await response.json();
          
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            // Create simple map with OpenStreetMap
            mapElement.innerHTML = `
              <div class="w-full h-full bg-white rounded-lg shadow-sm border flex flex-col">
                <div class="p-6 bg-white rounded-t-lg border-b">
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">Lokation</h4>
                  <p class="text-sm text-gray-600">${property.city || ''}</p>
                  ${property.postalCode ? `<p class="text-sm text-gray-600">${property.postalCode} ${property.city || ''}</p>` : ''}
                </div>
                <div class="flex-1 relative min-h-[300px]">
                  <iframe
                    src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}"
                    class="w-full h-full rounded-b-lg border-0"
                    frameborder="0"
                    style="border: none;"
                  ></iframe>
                </div>
              </div>
            `;
          } else {
            // Fallback if coordinates not found
            mapElement.innerHTML = `
              <div class="w-full h-full bg-white rounded-lg shadow-sm border flex items-center justify-center min-h-[300px]">
                <div class="text-center p-8">
                  <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">Lokation</h4>
                  <p class="text-sm text-gray-600">${property.city || ''}</p>
                  ${property.postalCode ? `<p class="text-sm text-gray-600">${property.postalCode} ${property.city || ''}</p>` : ''}
                </div>
              </div>
            `;
          }
        } catch (error) {
          console.error('Error loading map:', error);
          mapElement.innerHTML = `
            <div class="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div class="text-center p-6">
                <div class="w-12 h-12 bg-danish-blue rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <h4 class="font-semibold text-gray-900 mb-1">Adresse</h4>
                <p class="text-sm text-gray-600">${property.address}</p>
                ${property.city ? `<p class="text-sm text-gray-600">${property.postalCode} ${property.city}</p>` : ''}
              </div>
            </div>
          `;
        }
      };

      getCoordinates();
    };

    createMap();
  }, [property]);

  return (
    <div className={`h-64 ${className}`} ref={mapRef}>
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg"></div>
    </div>
  );
}