'use server';

/**
 * Household domain actions
 * 
 * Note: This is a minimal implementation for MVP. In the future, this would handle:
 * - Multiple households/locations for a user
 * - Grouping plants by household
 * - Location-specific settings and data
 */

// For MVP, we're handling location (latitude, longitude) directly in the Plant model
// This file serves as a placeholder for future expansion

export async function getDefaultLocation() {
  // In the future, this would fetch user's default location or household
  return {
    latitude: 40.7128, // Default to NYC
    longitude: -74.006,
    name: 'Default Location'
  };
} 