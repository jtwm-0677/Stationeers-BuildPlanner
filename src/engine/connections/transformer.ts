/**
 * Variant transformer for auto-transforming pipes when overlaid
 *
 * When a pipe is placed at a position with an existing pipe of the same type,
 * the system should transform the existing pipe to accommodate both connections.
 *
 * Example: Straight pipe + perpendicular straight = T-junction
 */

import type { GameObject, Rotation } from '../objects/types';
import { ObjectType } from '../objects/types';
import {
  type ConnectionPattern,
  BASE_PIPE_PATTERNS,
  BASE_CABLE_PATTERNS,
  getVariantKey,
  applyRotationToPattern,
  mergePatterns,
  countConnections,
  patternsEqual
} from './types';

/**
 * Get the base pattern for a variant
 */
export function getBasePattern(variant: string): ConnectionPattern | null {
  const key = getVariantKey(variant);

  // Try pipe patterns first
  if (BASE_PIPE_PATTERNS[key]) {
    return BASE_PIPE_PATTERNS[key];
  }

  // Try cable patterns
  if (BASE_CABLE_PATTERNS[key]) {
    return BASE_CABLE_PATTERNS[key];
  }

  return null;
}

/**
 * Get the connection pattern for an object (with rotation applied)
 */
export function getObjectPattern(obj: GameObject): ConnectionPattern | null {
  const basePattern = getBasePattern(obj.variant);
  if (!basePattern) return null;

  return applyRotationToPattern(basePattern, obj.rotation);
}

/**
 * Suggested transformation result
 */
export interface TransformResult {
  variant: string;
  rotation: Rotation;
}

/**
 * Find the best variant and rotation that matches a connection pattern
 */
export function findVariantForPattern(
  pattern: ConnectionPattern,
  variantPrefix: string
): TransformResult | null {
  const connectionCount = countConnections(pattern);

  // Determine which pattern set to use
  const patterns = variantPrefix.includes('Cable')
    ? BASE_CABLE_PATTERNS
    : BASE_PIPE_PATTERNS;

  // Try each variant with rotations
  for (const [key, basePattern] of Object.entries(patterns)) {
    // Skip variants with wrong connection count
    if (countConnections(basePattern) !== connectionCount) continue;

    // Try all 4 Y-axis rotations
    for (let yRot = 0; yRot < 360; yRot += 90) {
      const rotatedPattern = applyRotationToPattern(basePattern, { x: 0, y: yRot, z: 0 });
      if (patternsEqual(rotatedPattern, pattern)) {
        return {
          variant: variantPrefix + key,
          rotation: { x: 0, y: yRot, z: 0 }
        };
      }
    }
  }

  return null;
}

/**
 * Get the variant prefix for an object (e.g., 'StructurePipe', 'StructurePipeLiquid')
 */
export function getVariantPrefix(variant: string): string {
  if (variant.startsWith('StructureInsulatedPipeLiquid')) {
    return 'StructureInsulatedPipeLiquid';
  }
  if (variant.startsWith('StructureInsulatedPipe')) {
    return 'StructureInsulatedPipe';
  }
  if (variant.startsWith('StructurePipeLiquid')) {
    return 'StructurePipeLiquid';
  }
  if (variant.startsWith('StructurePipe')) {
    return 'StructurePipe';
  }
  if (variant.startsWith('StructureCableSuperHeavy')) {
    return 'StructureCableSuperHeavy';
  }
  if (variant.startsWith('StructureCable') && variant.includes('H')) {
    return 'StructureCable'; // Heavy cable uses same prefix with 'H' suffix
  }
  if (variant.startsWith('StructureCable')) {
    return 'StructureCable';
  }
  if (variant.startsWith('StructureChute')) {
    return 'StructureChute';
  }
  return 'Structure';
}

/**
 * Calculate the transformation when overlaying a new object on an existing one
 * Returns the new variant/rotation for the merged object, or null if cannot merge
 */
export function calculateTransform(
  existing: GameObject,
  incoming: GameObject
): TransformResult | null {
  // Only transform pipes and cables
  if (existing.type !== ObjectType.Pipe && existing.type !== ObjectType.Cable) {
    return null;
  }

  // Must be same object type
  if (existing.type !== incoming.type) {
    return null;
  }

  // Get patterns for both objects
  const existingPattern = getObjectPattern(existing);
  const incomingPattern = getObjectPattern(incoming);

  if (!existingPattern || !incomingPattern) {
    return null;
  }

  // Merge the patterns
  const mergedPattern = mergePatterns(existingPattern, incomingPattern);

  // Find a variant that matches the merged pattern
  const prefix = getVariantPrefix(existing.variant);
  return findVariantForPattern(mergedPattern, prefix);
}

/**
 * Check if placing incoming on existing would result in a valid transformation
 */
export function canTransform(existing: GameObject, incoming: GameObject): boolean {
  return calculateTransform(existing, incoming) !== null;
}
