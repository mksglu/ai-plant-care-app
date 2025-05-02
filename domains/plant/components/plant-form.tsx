'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createPlant, updatePlant } from '../actions/plant';
import { plantSchema, PlantFormValues } from '../schemas/plant';
import { LocationSearch } from './location-search';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface PlantFormProps {
  initialData?: PlantFormValues & { id?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PlantForm({ initialData, onSuccess, onCancel }: PlantFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;
  
  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      weekly_water_need: initialData?.weekly_water_need ?? null,
      expected_humidity: initialData?.expected_humidity ?? null,
      latitude: initialData?.latitude || 40.7128, // Default to NYC coordinates
      longitude: initialData?.longitude || -74.0060,
    },
  });
  
  // Format the location display string from coordinates
  const [locationDisplay, setLocationDisplay] = useState<string>('');
  
  useEffect(() => {
    // If we have coordinates, try to get location name
    const fetchLocationName = async () => {
      const lat = initialData?.latitude;
      const lon = initialData?.longitude;
      
      if (lat && lon) {
        try {
          // Using Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
              headers: {
                'User-Agent': 'PlantCareApp/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              setLocationDisplay(data.display_name);
            } else {
              // If no display name, fall back to coordinates
              setLocationDisplay(`${lat}, ${lon}`);
            }
          } else {
            // API returned an error - fall back to coordinates
            setLocationDisplay(`${lat}, ${lon}`);
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          // On error, fall back to displaying coordinates
          setLocationDisplay(`${lat}, ${lon}`);
        }
      }
    };
    
    fetchLocationName();
  }, [initialData?.latitude, initialData?.longitude]);
  
  // Handle location selection from the search component
  const handleLocationSelect = (location: { latitude: number; longitude: number; name: string }) => {
    form.setValue('latitude', location.latitude);
    form.setValue('longitude', location.longitude);
    setLocationDisplay(location.name);
  };
  
  const onSubmit = async (data: PlantFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialData?.id) {
        // Update existing plant
        await updatePlant(initialData.id, data);
      } else {
        // Create new plant
        await createPlant(data);
      }
      
      // Refresh the page to show updated data
      router.refresh();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} plant:`, error);
      setIsSubmitting(false);
      
      // Show error message - you can enhance this with a toast notification
      alert(`Failed to ${isEditing ? 'update' : 'add'} plant. Please try again.`);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-700 block mb-1.5">Plant Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Snake Plant" 
                  className="h-10 rounded-lg border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-xs pt-1" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-700 block mb-1.5">Plant Type</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Succulent" 
                  className="h-10 rounded-lg border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-xs text-neutral-500 pt-1.5">
                Optional: Select or enter the type of your plant
              </FormDescription>
              <FormMessage className="text-xs pt-1" />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weekly_water_need"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-700 block mb-1.5">Water Need (L/wk)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0"
                    placeholder="e.g., 0.5"
                    className="h-10 rounded-lg border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                    value={value === null ? '' : value}
                    onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-neutral-500">
                  Amount of water your plant needs weekly
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expected_humidity"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-700 block mb-1.5">Humidity (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="1"
                    min="0"
                    max="100"
                    placeholder="e.g., 60"
                    className="h-10 rounded-lg border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                    value={value === null ? '' : value}
                    onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-neutral-500">
                  Ideal humidity level for your plant
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-1.5">
          <FormLabel className="text-sm font-medium text-neutral-700 block">Location</FormLabel>
          <FormDescription className="text-xs text-neutral-500">
            Used for historical weather data.
          </FormDescription>
        </div>
        
        <div className="space-y-2">
          <LocationSearch 
            onLocationSelect={handleLocationSelect} 
            defaultValue={locationDisplay}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-neutral-500 block mb-1">Latitude</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="e.g., 40.7128"
                      className="h-10 rounded-lg border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                      value={value}
                      onChange={(e) => onChange(parseFloat(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="longitude"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-neutral-500 block mb-1">Longitude</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="e.g., -74.0060"
                      className="h-10 rounded-lg border-neutral-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                      value={value}
                      onChange={(e) => onChange(parseFloat(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-9 rounded-lg px-4 font-medium border-neutral-300 text-neutral-800 hover:bg-neutral-100 focus-visible:ring-neutral-400"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`h-9 rounded-lg px-4 font-medium bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Plant' : 'Add Plant')}
          </Button>
        </div>
      </form>
    </Form>
  );
} 