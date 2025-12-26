/**
 * Connection direction types for pipes, cables, and chutes
 *
 * Stationeers uses a 6-directional connection system:
 * - +X (East), -X (West)
 * - +Y (Up), -Y (Down)
 * - +Z (North), -Z (South)
 *
 * Objects are placed with a base rotation, and their connection
 * directions are relative to that rotation.
 */

import type { Rotation } from '../objects/types';

/**
 * Connection directions in world space
 */
export enum Direction {
  PosX = 'posX',  // East
  NegX = 'negX',  // West
  PosY = 'posY',  // Up
  NegY = 'negY',  // Down
  PosZ = 'posZ',  // North
  NegZ = 'negZ'   // South
}

/**
 * Connection pattern for a pipe/cable variant
 * true = has connection in that direction
 */
export interface ConnectionPattern {
  posX: boolean;
  negX: boolean;
  posY: boolean;
  negY: boolean;
  posZ: boolean;
  negZ: boolean;
}

/**
 * Create an empty connection pattern
 */
export function emptyPattern(): ConnectionPattern {
  return {
    posX: false, negX: false,
    posY: false, negY: false,
    posZ: false, negZ: false
  };
}

/**
 * Base connection patterns for pipe variants (before rotation)
 * Straight pipes connect on +-Z axis (forward/back)
 */
export const BASE_PIPE_PATTERNS: Record<string, ConnectionPattern> = {
  // Straight - connects forward and back
  'Straight': { posX: false, negX: false, posY: false, negY: false, posZ: true, negZ: true },

  // Corner - connects forward and right
  'Corner': { posX: true, negX: false, posY: false, negY: false, posZ: false, negZ: true },

  // T-Junction - connects forward, back, and right
  'TJunction': { posX: true, negX: false, posY: false, negY: false, posZ: true, negZ: true },

  // Cross3 - connects forward, back, right (same as T)
  'Cross3': { posX: true, negX: false, posY: false, negY: false, posZ: true, negZ: true },

  // Cross4 - connects all 4 horizontal directions
  'Cross4': { posX: true, negX: true, posY: false, negY: false, posZ: true, negZ: true },

  // Cross5 - connects 4 horizontal + up
  'Cross5': { posX: true, negX: true, posY: true, negY: false, posZ: true, negZ: true },

  // Cross6 - connects all 6 directions
  'Cross6': { posX: true, negX: true, posY: true, negY: true, posZ: true, negZ: true }
};

/**
 * Base connection patterns for cable variants
 */
export const BASE_CABLE_PATTERNS: Record<string, ConnectionPattern> = {
  'Straight': { posX: false, negX: false, posY: false, negY: false, posZ: true, negZ: true },
  'Corner': { posX: true, negX: false, posY: false, negY: false, posZ: false, negZ: true },
  'Corner3': { posX: true, negX: false, posY: false, negY: false, posZ: true, negZ: true },
  'Corner4': { posX: true, negX: true, posY: false, negY: false, posZ: true, negZ: true },
  'Junction': { posX: true, negX: false, posY: false, negY: false, posZ: true, negZ: true },
  'Junction4': { posX: true, negX: true, posY: false, negY: false, posZ: true, negZ: true },
  'Junction5': { posX: true, negX: true, posY: true, negY: false, posZ: true, negZ: true },
  'Junction6': { posX: true, negX: true, posY: true, negY: true, posZ: true, negZ: true }
};

/**
 * Count active connections in a pattern
 */
export function countConnections(pattern: ConnectionPattern): number {
  return Object.values(pattern).filter(v => v).length;
}

/**
 * Merge two connection patterns (OR operation)
 */
export function mergePatterns(a: ConnectionPattern, b: ConnectionPattern): ConnectionPattern {
  return {
    posX: a.posX || b.posX,
    negX: a.negX || b.negX,
    posY: a.posY || b.posY,
    negY: a.negY || b.negY,
    posZ: a.posZ || b.posZ,
    negZ: a.negZ || b.negZ
  };
}

/**
 * Check if two patterns are equal
 */
export function patternsEqual(a: ConnectionPattern, b: ConnectionPattern): boolean {
  return a.posX === b.posX &&
         a.negX === b.negX &&
         a.posY === b.posY &&
         a.negY === b.negY &&
         a.posZ === b.posZ &&
         a.negZ === b.negZ;
}

/**
 * Rotate a connection pattern by 90 degrees on the Y axis
 * Used to apply object rotation to base patterns
 */
export function rotatePatternY90(pattern: ConnectionPattern): ConnectionPattern {
  // Y-axis rotation: posZ -> posX -> negZ -> negX -> posZ
  return {
    posX: pattern.posZ,
    negX: pattern.negZ,
    posY: pattern.posY,
    negY: pattern.negY,
    posZ: pattern.negX,
    negZ: pattern.posX
  };
}

/**
 * Apply a rotation (in 90-degree increments) to a connection pattern
 */
export function applyRotationToPattern(
  pattern: ConnectionPattern,
  rotation: Rotation
): ConnectionPattern {
  let result = { ...pattern };

  // Apply Y rotation (most common for horizontal layouts)
  const ySteps = Math.round(rotation.y / 90) % 4;
  for (let i = 0; i < ySteps; i++) {
    result = rotatePatternY90(result);
  }

  // TODO: Implement X and Z rotations if needed

  return result;
}

/**
 * Get the variant key from a full variant name
 * e.g., 'StructurePipeStraight' -> 'Straight'
 */
export function getVariantKey(variant: string): string {
  // Remove common prefixes
  let key = variant
    .replace('StructurePipeLiquid', '')
    .replace('StructureInsulatedPipeLiquid', '')
    .replace('StructureInsulatedPipe', '')
    .replace('StructurePipe', '')
    .replace('StructureChute', '')
    .replace('StructureCable', '')
    .replace('StructureCableSuperHeavy', '')
    .replace('H', ''); // Remove 'H' suffix from heavy cables

  // Handle numbered variants (Straight3, Straight5, etc.)
  key = key.replace(/\d+$/, '');

  return key || 'Straight';
}
