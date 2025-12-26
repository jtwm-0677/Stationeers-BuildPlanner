/**
 * Game object type definitions
 */

import type { Grid3 } from '../grid/types';

/**
 * Rotation stored as Euler angles in degrees (90-degree increments)
 * Matches Stationeers rotation system
 */
export interface Rotation {
  x: number; // 0, 90, 180, 270
  y: number; // 0, 90, 180, 270
  z: number; // 0, 90, 180, 270
}

/**
 * Create a Rotation with default values (no rotation)
 */
export function rotation(x = 0, y = 0, z = 0): Rotation {
  return {
    x: normalizeAngle(x),
    y: normalizeAngle(y),
    z: normalizeAngle(z)
  };
}

/**
 * Normalize angle to 0, 90, 180, or 270
 */
export function normalizeAngle(degrees: number): number {
  const normalized = ((degrees % 360) + 360) % 360;
  return Math.round(normalized / 90) * 90;
}

/**
 * Rotate by 90 degrees on an axis
 */
export function rotate90(rot: Rotation, axis: 'x' | 'y' | 'z', direction: 1 | -1 = 1): Rotation {
  return {
    ...rot,
    [axis]: normalizeAngle(rot[axis] + direction * 90)
  };
}

/**
 * View types for orthographic projections
 */
export type ViewType = 'top' | 'north' | 'south' | 'east' | 'west';

/**
 * Object types in the game
 */
export enum ObjectType {
  Frame = 'frame',
  Wall = 'wall',
  Cable = 'cable',
  Pipe = 'pipe',
  Chute = 'chute',
  Device = 'device'
}

/**
 * Grid type for placement snapping
 */
export enum GridType {
  Main = 'main',      // 20-unit increments (2m) - frames, walls
  Small = 'small'     // 5-unit increments (0.5m) - pipes, cables, chutes
}

/**
 * Get the grid type for an object type
 */
export function getGridTypeForObject(type: ObjectType): GridType {
  switch (type) {
    case ObjectType.Pipe:
    case ObjectType.Cable:
    case ObjectType.Chute:
      return GridType.Small;
    case ObjectType.Frame:
    case ObjectType.Wall:
    case ObjectType.Device:
    default:
      return GridType.Main;
  }
}

/**
 * Collision types matching Stationeers
 */
export enum CollisionType {
  BlockGrid = 0,   // Exclusive cell ownership
  BlockFace = 1,   // Only blocks same position
  BlockCustom = 2  // Allows coexistence (frames, stairs)
}

/**
 * Slot types for multi-object cells
 * Each slot allows one object - different slots can coexist
 */
export enum SlotType {
  Structural = 'structural',
  Cable = 'cable',
  GasPipe = 'gasPipe',           // Gas network (regular + insulated)
  LiquidPipe = 'liquidPipe',     // Liquid network (regular + insulated)
  Chute = 'chute',
  Device = 'device'
}

// Legacy alias for backwards compatibility
export const Pipe = 'pipe' as const;

/**
 * Frame variants (Steel)
 */
export enum SteelFrameVariant {
  Standard = 'StructureFrame',
  Corner = 'StructureFrameCorner',
  Side = 'StructureFrameSide',
  CornerCut = 'StructureFrameCornerCut'
}

/**
 * Frame variants (Iron)
 */
export enum IronFrameVariant {
  Standard = 'StructureFrameIron'
}

/**
 * Gas Pipe variants (verified prefab names)
 */
export enum GasPipeVariant {
  Straight = 'StructurePipeStraight',
  Straight3 = 'StructurePipeStraight3',
  Straight5 = 'StructurePipeStraight5',
  Straight10 = 'StructurePipeStraight10',
  Corner = 'StructurePipeCorner',
  TJunction = 'StructurePipeTJunction',
  Cross3 = 'StructurePipeCrossJunction',
  Cross4 = 'StructurePipeCrossJunction4',
  Cross5 = 'StructurePipeCrossJunction5',
  Cross6 = 'StructurePipeCrossJunction6'
}

/**
 * Liquid Pipe variants (verified prefab names)
 */
export enum LiquidPipeVariant {
  Straight = 'StructurePipeLiquidStraight',
  Straight3 = 'StructurePipeLiquidStraight3',
  Straight5 = 'StructurePipeLiquidStraight5',
  Straight10 = 'StructurePipeLiquidStraight10',
  Corner = 'StructurePipeLiquidCorner',
  TJunction = 'StructurePipeLiquidTJunction',
  Cross3 = 'StructurePipeLiquidCrossJunction',
  Cross4 = 'StructurePipeLiquidCrossJunction4',
  Cross5 = 'StructurePipeLiquidCrossJunction5',
  Cross6 = 'StructurePipeLiquidCrossJunction6'
}

/**
 * Insulated Gas Pipe variants (verified prefab names)
 */
export enum InsulatedGasPipeVariant {
  Straight = 'StructureInsulatedPipeStraight',
  Straight3 = 'StructureInsulatedPipeStraight3',
  Straight5 = 'StructureInsulatedPipeStraight5',
  Straight10 = 'StructureInsulatedPipeStraight10',
  Corner = 'StructureInsulatedPipeCorner',
  TJunction = 'StructureInsulatedPipeTJunction',
  Cross3 = 'StructureInsulatedPipeCrossJunction3',
  Cross4 = 'StructureInsulatedPipeCrossJunction4',
  Cross5 = 'StructureInsulatedPipeCrossJunction5',
  Cross6 = 'StructureInsulatedPipeCrossJunction6'
}

/**
 * Insulated Liquid Pipe variants (verified prefab names)
 */
export enum InsulatedLiquidPipeVariant {
  Straight = 'StructureInsulatedPipeLiquidStraight',
  Straight3 = 'StructureInsulatedPipeLiquidStraight3',
  Straight5 = 'StructureInsulatedPipeLiquidStraight5',
  Straight10 = 'StructureInsulatedPipeLiquidStraight10',
  Corner = 'StructureInsulatedPipeLiquidCorner',
  TJunction = 'StructureInsulatedPipeLiquidTJunction',
  Cross3 = 'StructureInsulatedPipeLiquidCrossJunction3',
  Cross4 = 'StructureInsulatedPipeLiquidCrossJunction4',
  Cross5 = 'StructureInsulatedPipeLiquidCrossJunction5',
  Cross6 = 'StructureInsulatedPipeLiquidCrossJunction6'
}

/**
 * Chute variants (verified prefab names)
 */
export enum ChuteVariant {
  Straight = 'StructureChuteStraight',
  Straight3 = 'StructureChuteStraight3',
  Straight5 = 'StructureChuteStraight5',
  Straight10 = 'StructureChuteStraight10',
  Corner = 'StructureChuteCorner',
  Junction = 'StructureChuteJunction',
  FlipFlop = 'StructureChuteFlipFlopSplitter',
  Outlet = 'StructureChuteOutlet',
  Inlet = 'StructureChuteInlet',
  Bin = 'StructureChuteBin',
  ExportBin = 'StructureChuteExportBin',
  Valve = 'StructureChuteValve',
  Overflow = 'StructureChuteOverflow',
  Window = 'StructureChuteWindow'
}

/**
 * Normal Cable variants (verified prefab names)
 */
export enum CableVariant {
  Straight = 'StructureCableStraight',
  Corner = 'StructureCableCorner',
  Corner3 = 'StructureCableCorner3',
  Corner4 = 'StructureCableCorner4',
  Junction = 'StructureCableJunction',
  Junction4 = 'StructureCableJunction4',
  Junction5 = 'StructureCableJunction5',
  Junction6 = 'StructureCableJunction6'
}

/**
 * Heavy Cable variants (verified prefab names)
 */
export enum HeavyCableVariant {
  Straight = 'StructureCableStraightH',
  Corner = 'StructureCableCornerH',
  Corner3 = 'StructureCableCornerH3',
  Corner4 = 'StructureCableCornerH4',
  Junction = 'StructureCableJunctionH',
  Junction4 = 'StructureCableJunctionH4',
  Junction5 = 'StructureCableJunctionH5',
  Junction6 = 'StructureCableJunctionH6'
}

/**
 * Super Heavy Cable variants (verified prefab names)
 */
export enum SuperHeavyCableVariant {
  Straight = 'StructureCableSuperHeavyStraight',
  Straight3 = 'StructureCableSuperHeavyStraight3',
  Straight5 = 'StructureCableSuperHeavyStraight5',
  Straight10 = 'StructureCableSuperHeavyStraight10',
  Corner = 'StructureCableSuperHeavyCorner',
  Corner3 = 'StructureCableSuperHeavyCorner3',
  Corner4 = 'StructureCableSuperHeavyCorner4',
  Junction = 'StructureCableSuperHeavyJunction',
  Junction4 = 'StructureCableSuperHeavyJunction4',
  Junction5 = 'StructureCableSuperHeavyJunction5',
  Junction6 = 'StructureCableSuperHeavyJunction6'
}

/**
 * Paint colors available in the game
 */
export enum PaintColor {
  Black = 'black',
  Blue = 'blue',
  Brown = 'brown',
  Green = 'green',
  Grey = 'grey',
  Khaki = 'khaki',
  Orange = 'orange',
  Pink = 'pink',
  Purple = 'purple',
  Red = 'red',
  White = 'white',
  Yellow = 'yellow'
}

/**
 * Base game object interface
 */
export interface GameObject {
  id: string;
  type: ObjectType;
  variant: string;
  position: Grid3;
  rotation: Rotation;
  color: PaintColor | null;
  collisionType: CollisionType;
  slot: SlotType;
}

/**
 * Generate a unique ID for game objects
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
