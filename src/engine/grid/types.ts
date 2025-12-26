/**
 * Grid system type definitions
 */

/**
 * 3D grid position (matches Stationeers coordinate system)
 * - x: East/West
 * - y: Floor level (vertical)
 * - z: North/South
 */
export interface Grid3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Create a Grid3 position
 */
export function grid3(x: number, y: number, z: number): Grid3 {
  return { x, y, z };
}

/**
 * Convert Grid3 to string key for Map/Set storage
 */
export function grid3Key(pos: Grid3): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

/**
 * Parse string key back to Grid3
 */
export function parseGrid3Key(key: string): Grid3 {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}

/**
 * Check if two Grid3 positions are equal
 */
export function grid3Equals(a: Grid3, b: Grid3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

/**
 * Grid system constants matching Stationeers
 * 1 unit = 0.1m (matching game's Grid3 internal precision)
 */
export const GRID_PRECISION = 0.1;        // meters per unit
export const MAIN_GRID = 20;              // units per main grid cell (2.0m)
export const SMALL_GRID = 5;              // units per small grid cell (0.5m)
export const MAIN_GRID_METERS = 2.0;      // meters per main grid cell
export const SMALL_GRID_METERS = 0.5;     // meters per small grid cell

// Legacy aliases (deprecated)
export const GRID_SIZE = MAIN_GRID_METERS;
export const SMALL_GRID_SIZE = SMALL_GRID_METERS;

/**
 * Convert grid units to world meters
 */
export function gridToMeters(units: number): number {
  return units * GRID_PRECISION;
}

/**
 * Convert world meters to grid units
 */
export function metersToGrid(meters: number): number {
  return Math.round(meters / GRID_PRECISION);
}

/**
 * Convert Grid3 to world position in meters
 */
export function toWorldMeters(grid: Grid3): { x: number; y: number; z: number } {
  return {
    x: grid.x * GRID_PRECISION,
    y: grid.y * GRID_PRECISION,
    z: grid.z * GRID_PRECISION
  };
}

/**
 * Convert world position in meters to Grid3
 */
export function fromWorldMeters(x: number, y: number, z: number): Grid3 {
  return {
    x: Math.round(x / GRID_PRECISION),
    y: Math.round(y / GRID_PRECISION),
    z: Math.round(z / GRID_PRECISION)
  };
}

/**
 * Snap Grid3 to main grid (20-unit increments)
 */
export function snapToMainGrid(grid: Grid3): Grid3 {
  return {
    x: Math.round(grid.x / MAIN_GRID) * MAIN_GRID,
    y: Math.round(grid.y / MAIN_GRID) * MAIN_GRID,
    z: Math.round(grid.z / MAIN_GRID) * MAIN_GRID
  };
}

/**
 * Snap Grid3 to small grid (5-unit increments)
 */
export function snapToSmallGrid(grid: Grid3): Grid3 {
  return {
    x: Math.round(grid.x / SMALL_GRID) * SMALL_GRID,
    y: Math.round(grid.y / SMALL_GRID) * SMALL_GRID,
    z: Math.round(grid.z / SMALL_GRID) * SMALL_GRID
  };
}
