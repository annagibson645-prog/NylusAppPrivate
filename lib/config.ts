// lib/config.ts
// Centralized configuration for data limits and build behavior

export interface VaultConfig {
  // Hard limits for data collection
  maxConcepts: number;
  maxCollisions: number;
  maxSparks: number;
  maxEssays: number;

  // Calculation ratios
  tensionRatio: number; // % of collisions that become tensions
  seedRatio: number;    // % of sparks that become essay seeds

  // String truncation
  collisionTitleMaxChars: number;
  excerptMaxChars: number;
}

export const DEFAULT_CONFIG: VaultConfig = {
  maxConcepts: 100,
  maxCollisions: 60,
  maxSparks: 1000,
  maxEssays: 200,

  tensionRatio: 0.15,
  seedRatio: 0.08,

  collisionTitleMaxChars: 60,
  excerptMaxChars: 200,
};

// Allow environment-based override for builds
export function getConfig(): VaultConfig {
  const maxConcepts = process.env.VAULT_MAX_CONCEPTS
    ? parseInt(process.env.VAULT_MAX_CONCEPTS, 10)
    : DEFAULT_CONFIG.maxConcepts;

  const maxCollisions = process.env.VAULT_MAX_COLLISIONS
    ? parseInt(process.env.VAULT_MAX_COLLISIONS, 10)
    : DEFAULT_CONFIG.maxCollisions;

  return {
    ...DEFAULT_CONFIG,
    maxConcepts,
    maxCollisions,
  };
}
