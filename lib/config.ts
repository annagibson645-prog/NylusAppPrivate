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
  const parsePositiveInt = (envKey: string, fallback: number): number => {
    const val = process.env[envKey];
    if (!val) return fallback;

    const parsed = parseInt(val, 10); // Base 10 for consistency with decimal env vars
    if (isNaN(parsed) || parsed <= 0) {
      console.warn(`Invalid ${envKey}="${val}" (must be positive integer), using default: ${fallback}`);
      return fallback;
    }
    return parsed;
  };

  const parsePositiveFloat = (envKey: string, fallback: number): number => {
    const val = process.env[envKey];
    if (!val) return fallback;

    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed <= 0 || parsed > 1) {
      console.warn(`Invalid ${envKey}="${val}" (must be 0 < x < 1), using default: ${fallback}`);
      return fallback;
    }
    return parsed;
  };

  return {
    maxConcepts: parsePositiveInt('VAULT_MAX_CONCEPTS', DEFAULT_CONFIG.maxConcepts),
    maxCollisions: parsePositiveInt('VAULT_MAX_COLLISIONS', DEFAULT_CONFIG.maxCollisions),
    maxSparks: parsePositiveInt('VAULT_MAX_SPARKS', DEFAULT_CONFIG.maxSparks),
    maxEssays: parsePositiveInt('VAULT_MAX_ESSAYS', DEFAULT_CONFIG.maxEssays),
    tensionRatio: parsePositiveFloat('VAULT_TENSION_RATIO', DEFAULT_CONFIG.tensionRatio),
    seedRatio: parsePositiveFloat('VAULT_SEED_RATIO', DEFAULT_CONFIG.seedRatio),
    collisionTitleMaxChars: parsePositiveInt('VAULT_COLLISION_TITLE_MAX', DEFAULT_CONFIG.collisionTitleMaxChars),
    excerptMaxChars: parsePositiveInt('VAULT_EXCERPT_MAX', DEFAULT_CONFIG.excerptMaxChars),
  };
}
