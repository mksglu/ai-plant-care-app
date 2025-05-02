'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationSearchProps {
  onLocationSelect: (location: { latitude: number; longitude: number; name: string }) => void;
  defaultValue?: string;
}

interface LocationResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Nominatim has a usage policy that requires limiting requests
// https://operations.osmfoundation.org/policies/nominatim/
const MIN_QUERY_INTERVAL = 1000; // 1 second between queries

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastQueryTime = useRef<number>(0);
  
  // Debounce search input and respect rate limits
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().length > 2) {
        const now = Date.now();
        const timeElapsed = now - lastQueryTime.current;
        
        // If we haven't waited long enough since the last query, wait more
        if (timeElapsed < MIN_QUERY_INTERVAL) {
          const additionalWait = MIN_QUERY_INTERVAL - timeElapsed;
          setTimeout(() => searchLocations(search), additionalWait);
        } else {
          searchLocations(search);
        }
      } else {
        setLocations([]);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Update displayed value when defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelect = useCallback((location: LocationResult) => {
    setValue(location.display_name);
    onLocationSelect({
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      name: location.display_name
    });
    setOpen(false);
    setSearch('');
    setError(null);
    inputRef.current?.blur();
  }, [onLocationSelect]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      // Down arrow
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < locations.length - 1 ? prev + 1 : 0
        );
      }
      
      // Up arrow
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : locations.length - 1
        );
      }
      
      // Enter
      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        if (locations[focusedIndex]) {
          handleSelect(locations[focusedIndex]);
        }
      }
      
      // Escape
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, focusedIndex, locations, handleSelect]);

  const searchLocations = async (query: string) => {
    if (!query || query.length < 3) return;
    
    setLoading(true);
    setError(null);
    
    try {
      lastQueryTime.current = Date.now();
      
      // Use the OpenStreetMap Nominatim API which is free but requires following usage policy
      // https://operations.osmfoundation.org/policies/nominatim/
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, 
        {
          headers: {
            // Setting a unique user agent is required by Nominatim usage policy
            'User-Agent': 'PlantCareApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Location search failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length === 0) {
        setError('No locations found for your search');
      }
      
      setLocations(Array.isArray(data) ? data.map(item => ({
        lat: item.lat,
        lon: item.lon,
        display_name: item.display_name
      })) : []);
      setFocusedIndex(-1); // Reset focused index when results change
    } catch (error) {
      console.error('Error searching locations:', error);
      setError('Failed to search locations. Please try again later.');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setGeolocating(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Respect rate limit
          const now = Date.now();
          const timeElapsed = now - lastQueryTime.current;
          if (timeElapsed < MIN_QUERY_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, MIN_QUERY_INTERVAL - timeElapsed));
          }
          
          lastQueryTime.current = Date.now();
          
          // Reverse geocode using Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'PlantCareApp/1.0'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }
          
          const data = await response.json();
          const locationName = data.display_name || `${latitude}, ${longitude}`;
          
          // Update the form with the location data
          onLocationSelect({
            latitude,
            longitude,
            name: locationName
          });
          
          setValue(locationName);
          setOpen(false);
          setSearch('');
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          // Still use the coordinates even if reverse geocoding fails
          onLocationSelect({
            latitude,
            longitude,
            name: `${latitude}, ${longitude}`
          });
          setValue(`${latitude}, ${longitude}`);
          setOpen(false);
          setSearch('');
        } finally {
          setGeolocating(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location.';
        
        // Provide more helpful error messages
        if (error.code === 1) {
          errorMessage = 'Location access denied. Please allow access in your browser settings.';
        } else if (error.code === 2) {
          errorMessage = 'Unable to determine your current location. Please try again later.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        setError(errorMessage);
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleInputFocus = () => {
    setOpen(true);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Search for a location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-lg pr-10 border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
          onFocus={handleInputFocus}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              type="button"
              onClick={getUserLocation}
              disabled={geolocating}
            >
              <Navigation className="h-4 w-4 text-neutral-400" />
              <span className="sr-only">Use my location</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-1 text-xs text-red-500">
          {error}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-[320px] overflow-auto">
          {loading && locations.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-neutral-500">Searching locations...</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="p-4 text-sm text-neutral-500 text-center">
              {search.length > 2 ? (error || 'No locations found.') : 'Type at least 3 characters to search'}
            </div>
          ) : (
            <ul className="py-1">
              {locations.map((location, index) => (
                <li key={`${location.lat}-${location.lon}`}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none transition-colors flex items-start ${
                      focusedIndex === index ? 'bg-neutral-100' : ''
                    }`}
                    onClick={() => handleSelect(location)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-neutral-500" />
                    <span className="line-clamp-2">{location.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {value && !open && (
        <div className="mt-2 text-sm text-neutral-700 flex items-start">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
          <span className="line-clamp-2">{value}</span>
        </div>
      )}
    </div>
  );
} 