import { getPlants } from '../domains/plant/actions/plant';
import { PlantListClient } from '../domains/plant/components/plant-list-client';

export default async function Home() {
  // Fetch all plants using the server action
  const plants = await getPlants();
  
  return (
    <main className="w-full pt-8">
      {/* The header is now handled inside PlantListClient */}
      <PlantListClient initialPlants={plants} />
    </main>
  );
} 