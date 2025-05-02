'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PlantForm } from './plant-form';
import { Plant } from '../actions/plant';
import { PlantFormValues } from '../schemas/plant';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface PlantDrawerProps {
  plant?: Plant;
  isOpen: boolean;
  onClose: () => void;
}

export function PlantDrawer({ plant, isOpen, onClose }: PlantDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Transform Plant to PlantFormValues & id format
  const formattedPlantData = plant ? {
    id: plant.id,
    name: plant.name,
    type: plant.type === null ? '' : plant.type,
    weekly_water_need: plant.weekly_water_need,
    expected_humidity: plant.expected_humidity,
    latitude: plant.latitude,
    longitude: plant.longitude,
  } : undefined;
  
  // Handle success - close drawer and refresh data
  const handleSuccess = () => {
    onClose();
    router.refresh();
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-md border-l border-neutral-100 shadow-xl px-6 py-6 overflow-y-auto">
        <SheetHeader className="text-left pb-5 space-y-2">
          <SheetTitle className="text-xl font-medium text-neutral-900">
            {plant?.id ? 'Edit Plant' : 'Add Plant'}
          </SheetTitle>
          <SheetDescription className="text-neutral-500">
            {plant?.id 
              ? 'Update your plant information to keep your care data accurate'
              : 'Fill in the details of your plant to start monitoring its health'}
          </SheetDescription>
        </SheetHeader>
          
        <div className="space-y-6">
          <PlantForm
            initialData={formattedPlantData}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
} 