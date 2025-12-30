/**
 * GameObject factory and utilities
 */

import type { Grid3 } from '../grid/types';
import {
  type GameObject,
  type Rotation,
  ObjectType,
  CollisionType,
  SlotType,
  SteelFrameVariant,
  IronFrameVariant,
  SteelWallVariant,
  IronWallVariant,
  WindowVariant,
  DoorVariant,
  WallFace,
  GasPipeVariant,
  LiquidPipeVariant,
  InsulatedGasPipeVariant,
  InsulatedLiquidPipeVariant,
  ChuteVariant,
  CableVariant,
  HeavyCableVariant,
  SuperHeavyCableVariant,
  PaintColor,
  rotation,
  generateId
} from './types';

/**
 * Create a steel frame object
 */
export function createSteelFrame(
  position: Grid3,
  variant: SteelFrameVariant = SteelFrameVariant.Standard,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Frame,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.Structural
  };
}

/**
 * Create an iron frame object
 */
export function createIronFrame(
  position: Grid3,
  variant: IronFrameVariant = IronFrameVariant.Standard,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Frame,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.Structural
  };
}

/**
 * Create a steel wall object
 */
export function createSteelWall(
  position: Grid3,
  face: WallFace,
  variant: SteelWallVariant = SteelWallVariant.Standard,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Wall,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockFace,
    slot: SlotType.Structural,
    face
  };
}

/**
 * Create an iron wall object
 */
export function createIronWall(
  position: Grid3,
  face: WallFace,
  variant: IronWallVariant = IronWallVariant.Standard,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Wall,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockFace,
    slot: SlotType.Structural,
    face
  };
}

/**
 * Create a window object
 */
export function createWindow(
  position: Grid3,
  face: WallFace,
  variant: WindowVariant = WindowVariant.Standard,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Wall,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockFace,
    slot: SlotType.Structural,
    face
  };
}

/**
 * Create a door object
 */
export function createDoor(
  position: Grid3,
  face: WallFace,
  variant: DoorVariant = DoorVariant.Standard,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Wall,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockFace,
    slot: SlotType.Structural,
    face
  };
}

/**
 * Create a gas pipe object
 */
export function createGasPipe(
  position: Grid3,
  variant: GasPipeVariant = GasPipeVariant.Straight,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Pipe,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.GasPipe
  };
}

/**
 * Create a liquid pipe object
 */
export function createLiquidPipe(
  position: Grid3,
  variant: LiquidPipeVariant = LiquidPipeVariant.Straight,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Pipe,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.LiquidPipe
  };
}

/**
 * Create an insulated gas pipe object
 */
export function createInsulatedGasPipe(
  position: Grid3,
  variant: InsulatedGasPipeVariant = InsulatedGasPipeVariant.Straight,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Pipe,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.GasPipe
  };
}

/**
 * Create an insulated liquid pipe object
 */
export function createInsulatedLiquidPipe(
  position: Grid3,
  variant: InsulatedLiquidPipeVariant = InsulatedLiquidPipeVariant.Straight,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Pipe,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.LiquidPipe
  };
}

/**
 * Create a chute object
 */
export function createChute(
  position: Grid3,
  variant: ChuteVariant = ChuteVariant.Straight,
  rot: Rotation = rotation(),
  color: PaintColor | null = null
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Chute,
    variant,
    position,
    rotation: rot,
    color,
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.Chute
  };
}

/**
 * Create a normal cable object
 */
export function createCable(
  position: Grid3,
  variant: CableVariant = CableVariant.Straight,
  rot: Rotation = rotation()
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Cable,
    variant,
    position,
    rotation: rot,
    color: null, // Cables cannot be painted
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.Cable
  };
}

/**
 * Create a heavy cable object
 */
export function createHeavyCable(
  position: Grid3,
  variant: HeavyCableVariant = HeavyCableVariant.Straight,
  rot: Rotation = rotation()
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Cable,
    variant,
    position,
    rotation: rot,
    color: null, // Cables cannot be painted
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.Cable
  };
}

/**
 * Create a super heavy cable object
 */
export function createSuperHeavyCable(
  position: Grid3,
  variant: SuperHeavyCableVariant = SuperHeavyCableVariant.Straight,
  rot: Rotation = rotation()
): GameObject {
  return {
    id: generateId(),
    type: ObjectType.Cable,
    variant,
    position,
    rotation: rot,
    color: null, // Cables cannot be painted
    collisionType: CollisionType.BlockCustom,
    slot: SlotType.Cable
  };
}

/**
 * Clone a game object with a new ID
 */
export function cloneObject(obj: GameObject): GameObject {
  return {
    ...obj,
    id: generateId(),
    position: { ...obj.position },
    rotation: { ...obj.rotation }
  };
}

/**
 * Check if two objects would conflict at the same position
 */
export function objectsConflict(a: GameObject, b: GameObject): boolean {
  // Walls can coexist if on different faces
  if (a.type === ObjectType.Wall && b.type === ObjectType.Wall) {
    // Only conflict if same face (or no face specified)
    return a.face === b.face;
  }

  // BlockCustom objects can coexist if in different slots
  if (a.collisionType === CollisionType.BlockCustom &&
      b.collisionType === CollisionType.BlockCustom) {
    return a.slot === b.slot;
  }

  // BlockGrid objects are exclusive
  if (a.collisionType === CollisionType.BlockGrid ||
      b.collisionType === CollisionType.BlockGrid) {
    return true;
  }

  // BlockFace objects only conflict at same position (handled by caller)
  return a.slot === b.slot;
}
