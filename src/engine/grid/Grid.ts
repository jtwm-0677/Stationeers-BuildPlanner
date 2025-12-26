/**
 * Grid - spatial container for game objects
 */

import { type Grid3, grid3Key } from './types';
import { Cell } from './Cell';
import type { GameObject } from '../objects/types';

/**
 * 3D grid that manages cells and object placement
 */
export class Grid {
  private cells: Map<string, Cell> = new Map();
  private objectIndex: Map<string, Grid3> = new Map(); // object ID -> position

  /**
   * Get or create a cell at position
   */
  private getOrCreateCell(position: Grid3): Cell {
    const key = grid3Key(position);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = new Cell(position);
      this.cells.set(key, cell);
    }
    return cell;
  }

  /**
   * Get cell at position (returns null if doesn't exist)
   */
  getCell(position: Grid3): Cell | null {
    return this.cells.get(grid3Key(position)) || null;
  }

  /**
   * Check if an object can be placed at its position
   */
  canPlace(obj: GameObject): boolean {
    const cell = this.getCell(obj.position);
    if (!cell) return true;
    return cell.canPlace(obj);
  }

  /**
   * Place an object in the grid
   * Returns displaced object if any
   */
  place(obj: GameObject): GameObject | null {
    const cell = this.getOrCreateCell(obj.position);
    const displaced = cell.place(obj);

    // Update object index
    if (displaced) {
      this.objectIndex.delete(displaced.id);
    }
    this.objectIndex.set(obj.id, obj.position);

    return displaced;
  }

  /**
   * Remove an object by ID
   */
  remove(id: string): GameObject | null {
    const position = this.objectIndex.get(id);
    if (!position) return null;

    const cell = this.getCell(position);
    if (!cell) return null;

    const obj = cell.removeById(id);
    if (obj) {
      this.objectIndex.delete(id);

      // Clean up empty cells
      if (cell.isEmpty()) {
        this.cells.delete(grid3Key(position));
      }
    }

    return obj;
  }

  /**
   * Get object by ID
   */
  getObject(id: string): GameObject | null {
    const position = this.objectIndex.get(id);
    if (!position) return null;

    const cell = this.getCell(position);
    return cell?.getById(id) || null;
  }

  /**
   * Get all objects at a position
   */
  getObjectsAt(position: Grid3): GameObject[] {
    const cell = this.getCell(position);
    return cell?.getAll() || [];
  }

  /**
   * Get all objects in the grid
   */
  getAllObjects(): GameObject[] {
    const objects: GameObject[] = [];
    for (const cell of this.cells.values()) {
      objects.push(...cell.getAll());
    }
    return objects;
  }

  /**
   * Get all objects on a specific floor (y level)
   */
  getObjectsOnFloor(y: number): GameObject[] {
    const objects: GameObject[] = [];
    for (const cell of this.cells.values()) {
      if (cell.position.y === y) {
        objects.push(...cell.getAll());
      }
    }
    return objects;
  }

  /**
   * Get the bounds of all placed objects
   */
  getBounds(): { min: Grid3; max: Grid3 } | null {
    if (this.cells.size === 0) return null;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const cell of this.cells.values()) {
      const { x, y, z } = cell.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    return {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    };
  }

  /**
   * Get all unique floor levels
   */
  getFloorLevels(): number[] {
    const levels = new Set<number>();
    for (const cell of this.cells.values()) {
      levels.add(cell.position.y);
    }
    return Array.from(levels).sort((a, b) => a - b);
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.cells.clear();
    this.objectIndex.clear();
  }

  /**
   * Get total object count
   */
  get objectCount(): number {
    return this.objectIndex.size;
  }

  /**
   * Get total cell count
   */
  get cellCount(): number {
    return this.cells.size;
  }
}
