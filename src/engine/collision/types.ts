/**
 * Collision system types for Stationeers Build Planner
 *
 * Handles placement rules:
 * - Gas pipes + liquid pipes can coexist (different networks)
 * - Same pipe type overlay triggers variant transformation
 * - Cables can cross pipes/chutes but block same-position cables
 * - Chutes block pipes and cables at same position
 */

import { SlotType, ObjectType, type GameObject } from '../objects/types';

/**
 * Network types for pipe categorization
 */
export enum PipeNetwork {
  Gas = 'gas',
  Liquid = 'liquid'
}

/**
 * Get the pipe network type from a slot type
 */
export function getPipeNetwork(slot: SlotType): PipeNetwork | null {
  switch (slot) {
    case SlotType.GasPipe:
      return PipeNetwork.Gas;
    case SlotType.LiquidPipe:
      return PipeNetwork.Liquid;
    default:
      return null;
  }
}

/**
 * Get the pipe network from a variant string
 */
export function getPipeNetworkFromVariant(variant: string): PipeNetwork | null {
  // Liquid pipe variants contain 'Liquid' in the name
  if (variant.includes('Liquid')) {
    return PipeNetwork.Liquid;
  }
  // Gas pipe variants start with 'StructurePipe' or 'StructureInsulatedPipe'
  if (variant.startsWith('StructurePipe') || variant.startsWith('StructureInsulatedPipe')) {
    return PipeNetwork.Gas;
  }
  return null;
}

/**
 * Check if a variant is insulated
 */
export function isInsulatedPipe(variant: string): boolean {
  return variant.includes('Insulated');
}

/**
 * Result of collision check
 */
export interface CollisionResult {
  canPlace: boolean;
  reason?: string;
  conflictingObject?: GameObject;
  suggestedTransform?: string;  // Suggested variant transformation
}

/**
 * Check if two objects can coexist at the same position
 */
export function canCoexist(a: GameObject, b: GameObject): boolean {
  // All pipes block each other (gas, liquid, insulated - all conflict)
  const aIsPipe = a.slot === SlotType.GasPipe || a.slot === SlotType.LiquidPipe;
  const bIsPipe = b.slot === SlotType.GasPipe || b.slot === SlotType.LiquidPipe;
  if (aIsPipe && bIsPipe) {
    return false;
  }

  // Cables can cross pipes (only valid crossing case)
  if ((a.slot === SlotType.Cable && bIsPipe) ||
      (b.slot === SlotType.Cable && aIsPipe)) {
    return true;
  }

  // Cables block other cables
  if (a.slot === SlotType.Cable && b.slot === SlotType.Cable) {
    return false;
  }

  // Chutes block pipes and cables
  if (a.slot === SlotType.Chute || b.slot === SlotType.Chute) {
    const other = a.slot === SlotType.Chute ? b : a;
    if (other.slot === SlotType.Cable ||
        other.slot === SlotType.GasPipe ||
        other.slot === SlotType.LiquidPipe ||
        other.slot === SlotType.Chute) {
      return false;
    }
  }

  // Same slot type conflicts
  if (a.slot === b.slot) {
    return false;
  }

  // Different slot types can coexist (structural + cable, etc.)
  return true;
}

/**
 * Check if placing object would require a transformation
 * Returns the suggested new variant if transformation is needed
 *
 * Note: This is a placeholder - actual implementation uses
 * the connections/transformer module which handles pattern matching
 */
export function checkTransformNeeded(
  existing: GameObject,
  incoming: GameObject
): string | null {
  // Only check pipe/cable transformations
  if (existing.type !== ObjectType.Pipe && existing.type !== ObjectType.Cable) {
    return null;
  }

  // Must be same type
  if (existing.type !== incoming.type) {
    return null;
  }

  // Must be same network to transform (for pipes)
  if (existing.slot !== incoming.slot) {
    return null;
  }

  // Transformation logic is handled by connections/transformer module
  // This function is just for quick checks
  return null;
}
