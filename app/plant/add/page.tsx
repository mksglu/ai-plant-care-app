'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createPlant } from '../../../domains/plant/actions/plant';
import { plantSchema, PlantFormValues } from '../../../domains/plant/schemas/plant';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';

export default function AddPlant() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: '',
      type: '',
      weekly_water_need: null,
      expected_humidity: null,
      latitude: 40.7128, // Default to NYC coordinates
      longitude: -74.0060,
    },
  });
  
  const onSubmit = async (data: PlantFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Call the server action to create the plant
      const newPlant = await createPlant(data);
      
      // Redirect to the plant detail page
      router.push(`/plant/${newPlant.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error adding plant:', error);
      setIsSubmitting(false);
      
      // Show error message - you can enhance this with a toast notification
      alert('Failed to add plant. Please try again.');
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
        &larr; Back to Dashboard
      </Link>
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Add New Plant</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plant Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Snake Plant" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plant Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Succulent" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Select or enter the type of your plant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="weekly_water_need"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Weekly Water Need (L)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          min="0"
                          placeholder="e.g., 0.5"
                          value={value === null ? '' : value}
                          onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of water your plant needs weekly
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expected_humidity"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Expected Humidity (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1"
                          min="0"
                          max="100"
                          placeholder="e.g., 60"
                          value={value === null ? '' : value}
                          onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ideal humidity level for your plant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          value={value}
                          onChange={(e) => onChange(parseFloat(e.target.value))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          value={value}
                          onChange={(e) => onChange(parseFloat(e.target.value))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormDescription>
                The plant's location is used to fetch historical weather data.
                You can find coordinates using Google Maps - right-click on a location and select "What's here?".
              </FormDescription>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link href="/">Cancel</Link>
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                >
                  {isSubmitting ? 'Adding...' : 'Add Plant'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
} 