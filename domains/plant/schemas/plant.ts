import { z } from 'zod';

// Plant input validation schema
export const plantSchema = z.object({
  name: z.string().min(1, { message: 'Plant name is required' }),
  type: z.string().optional(),
  weekly_water_need: z.coerce
    .number()
    .min(0, { message: 'Weekly water need must be a positive number' })
    .nullable(),
  expected_humidity: z.coerce
    .number()
    .min(0, { message: 'Humidity must be a positive number' })
    .max(100, { message: 'Humidity must be less than or equal to 100%' })
    .nullable(),
  latitude: z.coerce
    .number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  longitude: z.coerce
    .number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' }),
});

// Type inferred from the schema
export type PlantFormValues = z.infer<typeof plantSchema>; 