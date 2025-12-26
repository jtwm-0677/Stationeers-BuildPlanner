/**
 * Validator - checks placement rules and constraints
 */

import type { Grid } from '../grid/Grid';
import type { GameObject } from '../objects/types';
import { CollisionType, SlotType } from '../objects/types';

export enum ValidationSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info'
}

export interface ValidationResult {
  valid: boolean;
  severity: ValidationSeverity;
  message: string;
  objectId?: string;
}

/**
 * Validates object placement according to game rules
 */
export class Validator {
  /**
   * Validate placing an object in the grid
   */
  static validatePlacement(obj: GameObject, grid: Grid): ValidationResult {
    // Check for conflicts at position
    const existing = grid.getObjectsAt(obj.position);

    for (const other of existing) {
      if (other.id === obj.id) continue;

      // Same slot conflict
      if (other.slot === obj.slot) {
        return {
          valid: false,
          severity: ValidationSeverity.Error,
          message: `Position already contains a ${other.slot} object`,
          objectId: other.id
        };
      }

      // BlockGrid objects are exclusive
      if (other.collisionType === CollisionType.BlockGrid) {
        return {
          valid: false,
          severity: ValidationSeverity.Error,
          message: `Position is blocked by ${other.variant}`,
          objectId: other.id
        };
      }

      // BlockFace objects block at same position
      if (obj.collisionType === CollisionType.BlockFace &&
          other.collisionType === CollisionType.BlockFace) {
        return {
          valid: false,
          severity: ValidationSeverity.Error,
          message: `Position conflicts with ${other.variant}`,
          objectId: other.id
        };
      }
    }

    return {
      valid: true,
      severity: ValidationSeverity.Info,
      message: 'Placement valid'
    };
  }

  /**
   * Validate entire grid for issues
   */
  static validateGrid(grid: Grid): ValidationResult[] {
    const results: ValidationResult[] = [];
    const objects = grid.getAllObjects();

    // Check each object
    for (const obj of objects) {
      const others = grid.getObjectsAt(obj.position).filter(o => o.id !== obj.id);

      for (const other of others) {
        // Check for slot conflicts
        if (other.slot === obj.slot) {
          results.push({
            valid: false,
            severity: ValidationSeverity.Error,
            message: `Duplicate ${obj.slot} objects at same position`,
            objectId: obj.id
          });
        }
      }
    }

    return results;
  }

  /**
   * Check if structural support exists (frames support other objects)
   */
  static checkStructuralSupport(obj: GameObject, grid: Grid): ValidationResult {
    // Structural objects don't need support
    if (obj.slot === SlotType.Structural) {
      return {
        valid: true,
        severity: ValidationSeverity.Info,
        message: 'Structural object'
      };
    }

    // Check for frame at same position
    const cellObjects = grid.getObjectsAt(obj.position);
    const hasFrame = cellObjects.some(o => o.slot === SlotType.Structural);

    if (!hasFrame) {
      return {
        valid: true, // Warning, not error
        severity: ValidationSeverity.Warning,
        message: 'No structural support at this position'
      };
    }

    return {
      valid: true,
      severity: ValidationSeverity.Info,
      message: 'Has structural support'
    };
  }
}
