/**
 * Sprites module - manages game object sprites
 */

export {
  SpriteCategory,
  type LoadedSprite,
  type SpriteDefinition,
  FRAME_SPRITES,
  GAS_PIPE_SPRITES,
  LIQUID_PIPE_SPRITES,
  CABLE_SPRITES,
  ALL_SPRITES
} from './types';

export {
  SpriteManager,
  getSpriteManager,
  initializeSprites
} from './SpriteManager';
