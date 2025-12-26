/**
 * Cell - represents a single grid position that can contain multiple objects
 */

import type { Grid3 } from './types';
import type { GameObject } from '../objects/types';
import { SlotType } from '../objects/types';
import { objectsConflict } from '../objects/GameObject';

/**
 * A cell in the grid that can hold multiple objects in different slots
 */
export class Cell {
  readonly position: Grid3;
  private objects: Map<SlotType, GameObject> = new Map();

  constructor(position: Grid3) {
    this.position = { ...position };
  }

  /**
   * Check if an object can be placed in this cell
   */
  canPlace(obj: GameObject): boolean {
    const existing = this.objects.get(obj.slot);
    if (!existing) return true;
    return !objectsConflict(existing, obj);
  }

  /**
   * Place an object in this cell
   * Returns the displaced object if any
   */
  place(obj: GameObject): GameObject | null {
    const existing = this.objects.get(obj.slot) || null;
    this.objects.set(obj.slot, obj);
    return existing;
  }

  /**
   * Remove an object by slot type
   */
  removeBySlot(slot: SlotType): GameObject | null {
    const obj = this.objects.get(slot) || null;
    this.objects.delete(slot);
    return obj;
  }

  /**
   * Remove a specific object by ID
   */
  removeById(id: string): GameObject | null {
    for (const [slot, obj] of this.objects) {
      if (obj.id === id) {
        this.objects.delete(slot);
        return obj;
      }
    }
    return null;
  }

  /**
   * Get object in a specific slot
   */
  getBySlot(slot: SlotType): GameObject | null {
    return this.objects.get(slot) || null;
  }

  /**
   * Get object by ID
   */
  getById(id: string): GameObject | null {
    for (const obj of this.objects.values()) {
      if (obj.id === id) return obj;
    }
    return null;
  }

  /**
   * Get all objects in this cell
   */
  getAll(): GameObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Check if cell is empty
   */
  isEmpty(): boolean {
    return this.objects.size === 0;
  }

  /**
   * Get count of objects
   */
  get count(): number {
    return this.objects.size;
  }
}
