'use server';

import postgres from 'postgres';
import { plantSchema, PlantFormValues } from '../schemas/plant';

// Get the database connection
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

// Type for creating a new plant
export type PlantInput = Omit<Plant, 'id' | 'created_at' | 'updated_at'>;

/**
 * Get all plants
 */
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

/**
 * Get a plant by ID
 */
export async function getPlantById(id: number): Promise<Plant | null> {
  console.log('Called getPlantById with id:', id);
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

/**
 * Create a new plant with zod validation
 */
export async function createPlant(plantData: PlantFormValues): Promise<Plant> {
  console.log('Called createPlant with data:', plantData);
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
    
    return plants[0];
  } catch (error) {
    console.error('Error creating plant:', error);
    throw new Error('Failed to create plant: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Update an existing plant
 */
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
    
    // Build the dynamic update query
    const updates = [];
    const values = [];
    
    if (validatedFields.name !== undefined) {
      updates.push('name');
      values.push(validatedFields.name);
    }
    
    if (validatedFields.type !== undefined) {
      updates.push('type');
      values.push(validatedFields.type === '' ? null : validatedFields.type);
    }
    
    if (validatedFields.weekly_water_need !== undefined) {
      updates.push('weekly_water_need');
      values.push(validatedFields.weekly_water_need);
    }
    
    if (validatedFields.expected_humidity !== undefined) {
      updates.push('expected_humidity');
      values.push(validatedFields.expected_humidity);
    }
    
    if (validatedFields.latitude !== undefined) {
      updates.push('latitude');
      values.push(validatedFields.latitude);
    }
    
    if (validatedFields.longitude !== undefined) {
      updates.push('longitude');
      values.push(validatedFields.longitude);
    }
    
    // Add updated_at
    updates.push('updated_at');
    values.push(new Date());
    
    if (updates.length === 0) {
      return existingPlant; // Nothing to update
    }
    
    // Dynamically build the SET clause using postgres-js syntax
    const setElements = updates.map((field, i) => `${field} = $${i + 1}`);
    
    // Execute the update using tagged template literal
    const plants = await Promise.resolve(sql<Plant[]>`
      UPDATE plant
      SET ${sql(setElements.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `);
    
    return plants[0];
  } catch (error) {
    console.error(`Error updating plant with ID ${id}:`, error);
    throw new Error(`Failed to update plant with ID ${id}: ` + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Delete a plant by ID
 */
export async function deletePlant(id: number): Promise<boolean> {
  console.log('Called deletePlant with id:', id);
  try {
    const result = await Promise.resolve(sql`
      DELETE FROM plant
      WHERE id = ${id}
    `);
    
    return result.count > 0;
  } catch (error) {
    console.error(`Error deleting plant with ID ${id}:`, error);
    throw new Error(`Failed to delete plant with ID ${id}`);
  }
} 