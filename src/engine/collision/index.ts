/**
 * Collision module - handles placement rules and conflict detection
 */

export {
  PipeNetwork,
  getPipeNetwork,
  getPipeNetworkFromVariant,
  isInsulatedPipe,
  canCoexist,
  checkTransformNeeded,
  type CollisionResult
} from './types';

import type { GameObject } from '../objects/types';
import { CollisionType, SlotType } from '../objects/types';
import type { Grid } from '../grid/Grid';
import type { Grid3 } from '../grid/types';
import type { CollisionResult } from './types';
import { canCoexist } from './types';
import { calculateTransform } from '../connections/transformer';

/**
 * Check if an object can be placed at a position in the grid
 */
export function canPlace(grid: Grid, obj: GameObject): CollisionResult {
  const existingObjects = grid.getObjectsAt(obj.position);

  // No existing objects = can always place
  if (existingObjects.length === 0) {
    return { canPlace: true };
  }

  // Check against each existing object
  for (const existing of existingObjects) {
    // Skip self (for move operations)
    if (existing.id === obj.id) {
      continue;
    }

    // BlockGrid objects are exclusive - nothing else can be placed
    if (existing.collisionType === CollisionType.BlockGrid) {
      return {
        canPlace: false,
        reason: 'Position blocked by exclusive object',
        conflictingObject: existing
      };
    }

    // Check if objects can coexist
    if (!canCoexist(existing, obj)) {
      // Check if transformation is possible using connections module
      const transformResult = calculateTransform(existing, obj);
      if (transformResult) {
        return {
          canPlace: true,
          suggestedTransform: transformResult.variant
        };
      }

      return {
        canPlace: false,
        reason: `Cannot place ${obj.type} - conflicts with existing ${existing.type}`,
        conflictingObject: existing
      };
    }
  }

  return { canPlace: true };
}

/**
 * Get all objects at a position that would conflict with the given object
 */
export function getConflicts(grid: Grid, obj: GameObject): GameObject[] {
  const existingObjects = grid.getObjectsAt(obj.position);
  return existingObjects.filter(existing =>
    existing.id !== obj.id && !canCoexist(existing, obj)
  );
}

/**
 * Check if a position is completely blocked (has BlockGrid object)
 */
export function isPositionBlocked(grid: Grid, position: Grid3): boolean {
  const objects = grid.getObjectsAt(position);
  return objects.some(obj => obj.collisionType === CollisionType.BlockGrid);
}

/**
 * Get the slot type for an object's pipe network
 * Used for determining which slot a pipe should occupy
 */
export function getSlotForPipeVariant(variant: string): SlotType {
  if (variant.includes('Liquid')) {
    return SlotType.LiquidPipe;
  }
  return SlotType.GasPipe;
}
