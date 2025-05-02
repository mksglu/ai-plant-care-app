import { getPlants, Plant } from '../domains/plant/actions/plant';
import Link from 'next/link';

export default async function Home() {
  // Fetch all plants using the server action
  const plants: Plant[] = await getPlants();
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Plant Care Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plants.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No plants added yet. Add your first plant to start monitoring its health.
          </p>
        ) : (
          plants.map((plant) => (
            <div key={plant.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{plant.name}</h2>
              <p className="text-gray-600 mb-1">Type: {plant.type || 'Not specified'}</p>
              <p className="text-gray-600 mb-1">
                Water Need: {plant.weekly_water_need ? `${plant.weekly_water_need}L/week` : 'Not specified'}
              </p>
              <p className="text-gray-600 mb-3">
                Humidity: {plant.expected_humidity ? `${plant.expected_humidity}%` : 'Not specified'}
              </p>
              <div className="flex justify-between">
                <Link href={`/plant/${plant.id}`} className="text-blue-600 hover:text-blue-800">
                  View Health
                </Link>
                <button className="text-gray-600 hover:text-gray-800">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/plant/add" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block">
          Add New Plant
        </Link>
      </div>
    </main>
  );
} 