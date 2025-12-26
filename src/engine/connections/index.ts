/**
 * Connections module - handles pipe/cable connection directions and transformations
 */

export {
  Direction,
  type ConnectionPattern,
  emptyPattern,
  BASE_PIPE_PATTERNS,
  BASE_CABLE_PATTERNS,
  countConnections,
  mergePatterns,
  patternsEqual,
  rotatePatternY90,
  applyRotationToPattern,
  getVariantKey
} from './types';

export {
  getBasePattern,
  getObjectPattern,
  type TransformResult,
  findVariantForPattern,
  getVariantPrefix,
  calculateTransform,
  canTransform
} from './transformer';
