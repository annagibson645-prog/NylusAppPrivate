# Vault Configuration

## Overview

The NylusS app uses centralized configuration in `lib/config.ts` to control data limits and behavior. This allows you to scale the vault without code changes.

## Configuration Options

### `maxConcepts` (default: 100)
Maximum number of top concepts (by backlink count) to include in the homepage constellation. Increase for larger vaults.

**Environment:** `VAULT_MAX_CONCEPTS=200`

### `maxCollisions` (default: 60)
Maximum number of collisions to load. After filtering, approximately 67% are kept for display.

**Environment:** `VAULT_MAX_COLLISIONS=150`

### `maxSparks` (default: 1000)
Maximum number of sparks (creative ideas, essays seeds, etc.) to load. No filtering applied.

### `maxEssays` (default: 200)
Maximum number of essays/research notes to load.

### `tensionRatio` (default: 0.15)
Fraction of collisions that become "tensions" (high-impact ideas). Set to 0.15 for 15% of collisions.

### `seedRatio` (default: 0.08)
Fraction of sparks that become essay seeds. Set to 0.08 for 8% of sparks.

### `collisionTitleMaxChars` (default: 60)
Maximum character length for collision titles before truncation. Respects word boundaries.

### `excerptMaxChars` (default: 200)
Maximum character length for excerpts before truncation.

## How to Override

### For Development

Set environment variables before running:

```bash
VAULT_MAX_CONCEPTS=50 npm run dev
```

### For Production Build

Set in your Vercel environment variables dashboard or `.env.production`:

```bash
VAULT_MAX_CONCEPTS=200
VAULT_MAX_COLLISIONS=100
```

## Tuning for Large Vaults

If your vault grows beyond 5000 concepts:

1. Increase `maxConcepts` to 200-300
2. Increase `maxCollisions` to 100-150
3. Monitor build time (`npm run parse`)
4. If build > 30s, you may need to split into sub-vaults

## Type Safety

All limits are validated at build time. Invalid values will cause the build to fail with a clear error.
