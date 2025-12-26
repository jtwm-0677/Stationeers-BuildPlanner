/**
 * Command for removing objects from the grid
 */

import type { Command } from './Command';
import type { Grid } from '../grid/Grid';
import type { GameObject } from '../objects/types';

export class RemoveObjectCommand implements Command {
  private grid: Grid;
  private objectId: string;
  private removed: GameObject | null = null;
  readonly description: string;

  constructor(grid: Grid, objectId: string, description?: string) {
    this.grid = grid;
    this.objectId = objectId;
    this.description = description || 'Remove object';
  }

  execute(): void {
    this.removed = this.grid.remove(this.objectId);
  }

  undo(): void {
    if (this.removed) {
      this.grid.place(this.removed);
    }
  }
}
