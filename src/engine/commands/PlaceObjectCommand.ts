/**
 * Command for placing objects in the grid
 */

import type { Command } from './Command';
import type { Grid } from '../grid/Grid';
import type { GameObject } from '../objects/types';

export class PlaceObjectCommand implements Command {
  private grid: Grid;
  private object: GameObject;
  private displaced: GameObject | null = null;
  readonly description: string;

  constructor(grid: Grid, object: GameObject) {
    this.grid = grid;
    this.object = object;
    this.description = `Place ${object.variant}`;
  }

  execute(): void {
    this.displaced = this.grid.place(this.object);
  }

  undo(): void {
    this.grid.remove(this.object.id);
    if (this.displaced) {
      this.grid.place(this.displaced);
    }
  }
}
