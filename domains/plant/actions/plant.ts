'use server';

import postgres from 'postgres';
import { plantSchema, PlantFormValues } from '../schemas/plant';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.DATABASE_URL || '', {
  ssl: 'require',
});

// Type for Plant entity
export type Plant = {
  id: number;
  name: string;
  type: string | null;
  weekly_water_need: number | null;
  expected_humidity: number | null;
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
};

export type PlantInput = Omit<Plant, 'id' | 'created_at' | 'updated_at'>;

export async function getPlants(): Promise<Plant[]> {
  console.log('Called getPlants');
  try {
    const plants = await Promise.resolve(sql<Plant[]>`
      SELECT * FROM plant
      ORDER BY created_at DESC
    `);
    
    return plants;
  } catch (error) {
    console.error('Error fetching plants:', error);
    throw new Error('Failed to fetch plants');
  }
}


export async function getPlantById(id: number): Promise<Plant | null> {
  try {
    const plants = await Promise.resolve(sql<Plant[]>`
      SELECT * FROM plant
      WHERE id = ${id}
    `);
    
    return plants.length > 0 ? plants[0] : null;
  } catch (error) {
    console.error(`Error fetching plant with ID ${id}:`, error);
    throw new Error(`Failed to fetch plant with ID ${id}`);
  }
}

export async function createPlant(plantData: PlantFormValues): Promise<Plant> {
  try {
    // Validate with zod schema
    const validated = plantSchema.parse(plantData);
    
    // Convert empty strings to null for optional fields
    const finalData = {
      ...validated,
      type: validated.type === '' ? null : validated.type,
      weekly_water_need: validated.weekly_water_need === null || validated.weekly_water_need === undefined ? null : validated.weekly_water_need,
      expected_humidity: validated.expected_humidity === null || validated.expected_humidity === undefined ? null : validated.expected_humidity,
    };
    
    const plants = await Promise.resolve(sql<Plant[]>`
      INSERT INTO plant (
        name,
        type,
        weekly_water_need,
        expected_humidity,
        latitude,
        longitude
      ) VALUES (
        ${finalData.name},
        ${finalData.type ?? null},
        ${finalData.weekly_water_need},
        ${finalData.expected_humidity},
        ${finalData.latitude},
        ${finalData.longitude}
      )
      RETURNING *
    `);
    
    // Revalidate cache
    revalidatePath('/', 'layout');
    
    return plants[0];
  } catch (error) {
    console.error('Error creating plant:', error);
    throw new Error('Failed to create plant: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function updatePlant(id: number, plantData: Partial<PlantFormValues>): Promise<Plant | null> {
  console.log('Called updatePlant with id:', id, 'and data:', plantData);
  try {
    // First check if plant exists
    const existingPlant = await getPlantById(id);
    if (!existingPlant) {
      return null;
    }
    
    // Validate with zod schema (partial validation)
    const validatedFields = plantSchema.partial().parse(plantData);
    
    // Create an update object instead of separate arrays
    const updateObject: Record<string, any> = {};
    
    if (validatedFields.name !== undefined) {
      updateObject.name = validatedFields.name;
    }
    
    if (validatedFields.type !== undefined) {
      updateObject.type = validatedFields.type === '' ? null : validatedFields.type;
    }
    
    if (validatedFields.weekly_water_need !== undefined) {
      updateObject.weekly_water_need = validatedFields.weekly_water_need;
    }
    
    if (validatedFields.expected_humidity !== undefined) {
      updateObject.expected_humidity = validatedFields.expected_humidity;
    }
    
    if (validatedFields.latitude !== undefined) {
      updateObject.latitude = validatedFields.latitude;
    }
    
    if (validatedFields.longitude !== undefined) {
      updateObject.longitude = validatedFields.longitude;
    }
    
    // Add updated_at
    updateObject.updated_at = new Date();
    
    if (Object.keys(updateObject).length === 0) {
      console.log('No fields to update for plant:', id);
      return existingPlant; // Nothing to update
    }
    
    console.log('Update object:', updateObject);
    
    // Using sql.begin for transaction and direct object assignment for safer SQL generation
    const plants = await sql.begin(async (sql) => {
      const result = await sql<Plant[]>`
        UPDATE plant
        SET ${sql(updateObject)}
        WHERE id = ${id}
        RETURNING *
      `;
      console.log('Update successful, returned rows:', result.length);
      return result;
    });
    
    // Revalidate cache
    revalidatePath('/', 'layout');
    revalidatePath(`/plant/${id}`, 'page');
    
    return plants[0];
  } catch (error) {
    console.error(`Error updating plant with ID ${id}:`, error);
    throw new Error(`Failed to update plant with ID ${id}: ` + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deletePlant(id: number): Promise<boolean> {
  console.log('Called deletePlant with id:', id);
  try {
    // First delete related health analysis records
    await Promise.resolve(sql`
      DELETE FROM health_analysis
      WHERE plant_id = ${id}
    `);
    
    // Then delete the plant itself
    const result = await Promise.resolve(sql`
      DELETE FROM plant
      WHERE id = ${id}
    `);
    
    // Revalidate cache
    revalidatePath('/', 'layout');
    
    return result.count > 0;
  } catch (error) {
    console.error(`Error deleting plant with ID ${id}:`, error);
    throw new Error(`Failed to delete plant with ID ${id}`);
  }
} 