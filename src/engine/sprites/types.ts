/**
 * Sprite management types
 */

/**
 * Sprite category
 */
export enum SpriteCategory {
  Frame = 'frames',
  Pipe = 'pipes',
  LiquidPipe = 'pipes/liquid',
  Cable = 'cables',
  Chute = 'chutes'
}

/**
 * Loaded sprite image
 */
export interface LoadedSprite {
  image: HTMLImageElement;
  width: number;
  height: number;
  loaded: boolean;
}

/**
 * Sprite definition mapping variant to path
 */
export interface SpriteDefinition {
  variant: string;
  path: string;
  category: SpriteCategory;
}

/**
 * All frame sprite definitions
 */
export const FRAME_SPRITES: SpriteDefinition[] = [
  { variant: 'StructureFrame', path: 'StructureFrame.png', category: SpriteCategory.Frame },
  { variant: 'StructureFrameCorner', path: 'StructureFrameCorner.png', category: SpriteCategory.Frame },
  { variant: 'StructureFrameCornerCut', path: 'StructureFrameCornerCut.png', category: SpriteCategory.Frame },
  { variant: 'StructureFrameSide', path: 'StructureFrameSide.png', category: SpriteCategory.Frame },
  { variant: 'StructureFrameIron', path: 'StructureFrameIron.png', category: SpriteCategory.Frame }
];

/**
 * Gas pipe sprite definitions
 */
export const GAS_PIPE_SPRITES: SpriteDefinition[] = [
  { variant: 'StructurePipeStraight', path: 'StructurePipeStraight.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeCorner', path: 'StructurePipeCorner.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeTJunction', path: 'StructurePipeTJunction.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeCrossJunction', path: 'StructurePipeCrossJunction.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeCrossJunction3', path: 'StructurePipeCrossJunction3.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeCrossJunction4', path: 'StructurePipeCrossJunction4.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeCrossJunction5', path: 'StructurePipeCrossJunction5.png', category: SpriteCategory.Pipe },
  { variant: 'StructurePipeCrossJunction6', path: 'StructurePipeCrossJunction6.png', category: SpriteCategory.Pipe }
];

/**
 * Liquid pipe sprite definitions
 */
export const LIQUID_PIPE_SPRITES: SpriteDefinition[] = [
  { variant: 'StructurePipeLiquidStraight', path: 'StructurePipeLiquidStraight.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidCorner', path: 'StructurePipeLiquidCorner.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidTJunction', path: 'StructurePipeLiquidTJunction.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidCrossJunction', path: 'StructurePipeLiquidCrossJunction.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidCrossJunction3', path: 'StructurePipeLiquidCrossJunction3.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidCrossJunction4', path: 'StructurePipeLiquidCrossJunction4.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidCrossJunction5', path: 'StructurePipeLiquidCrossJunction5.png', category: SpriteCategory.LiquidPipe },
  { variant: 'StructurePipeLiquidCrossJunction6', path: 'StructurePipeLiquidCrossJunction6.png', category: SpriteCategory.LiquidPipe }
];

/**
 * Cable sprite definitions
 */
export const CABLE_SPRITES: SpriteDefinition[] = [
  { variant: 'StructureCableStraight', path: 'StructureCableStraight.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableCorner', path: 'StructureCableCorner.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableCorner3', path: 'StructureCableCorner3.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableCorner4', path: 'StructureCableCorner4.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableJunction', path: 'StructureCableJunction.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableJunction4', path: 'StructureCableJunction4.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableJunction5', path: 'StructureCableJunction5.png', category: SpriteCategory.Cable },
  { variant: 'StructureCableJunction6', path: 'StructureCableJunction6.png', category: SpriteCategory.Cable }
];

/**
 * All sprite definitions
 */
export const ALL_SPRITES: SpriteDefinition[] = [
  ...FRAME_SPRITES,
  ...GAS_PIPE_SPRITES,
  ...LIQUID_PIPE_SPRITES,
  ...CABLE_SPRITES
];
