import { getPlants } from '../domains/plant/actions/plant';
import { PlantListClient } from '../domains/plant/components/plant-list-client';
import { Suspense } from 'react';

export default async function Home() {
  // Fetch all plants using the server action
  const plants = await getPlants();
  
  return (
    <main className="w-full pt-8">
      {/* Wrap in Suspense boundary to handle useSearchParams */}
      <Suspense fallback={<div className="flex items-center justify-center py-20">Loading...</div>}>
        <PlantListClient initialPlants={plants} />
      </Suspense>
    </main>
  );
} 