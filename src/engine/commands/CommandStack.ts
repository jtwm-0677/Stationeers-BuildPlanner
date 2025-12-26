/**
 * CommandStack - manages undo/redo history
 */

import type { Command } from './Command';

export interface CommandStackState {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  historyLength: number;
  currentIndex: number;
}

/**
 * Manages command history for undo/redo
 */
export class CommandStack {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistory: number;
  private onChange: ((state: CommandStackState) => void) | null = null;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  /**
   * Set callback for state changes
   */
  setOnChange(callback: (state: CommandStackState) => void): void {
    this.onChange = callback;
  }

  /**
   * Execute a command and add to history
   */
  execute(command: Command): void {
    command.execute();

    // Remove any redo history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new command
    this.history.push(command);
    this.currentIndex++;

    // Trim history if too long
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }

    this.notifyChange();
  }

  /**
   * Undo the last command
   */
  undo(): boolean {
    if (!this.canUndo) return false;

    this.history[this.currentIndex].undo();
    this.currentIndex--;

    this.notifyChange();
    return true;
  }

  /**
   * Redo the next command
   */
  redo(): boolean {
    if (!this.canRedo) return false;

    this.currentIndex++;
    this.history[this.currentIndex].execute();

    this.notifyChange();
    return true;
  }

  /**
   * Check if undo is available
   */
  get canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get description of command that would be undone
   */
  get undoDescription(): string | null {
    if (!this.canUndo) return null;
    return this.history[this.currentIndex].description;
  }

  /**
   * Get description of command that would be redone
   */
  get redoDescription(): string | null {
    if (!this.canRedo) return null;
    return this.history[this.currentIndex + 1].description;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.notifyChange();
  }

  /**
   * Get current state
   */
  getState(): CommandStackState {
    return {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoDescription: this.undoDescription,
      redoDescription: this.redoDescription,
      historyLength: this.history.length,
      currentIndex: this.currentIndex
    };
  }

  private notifyChange(): void {
    if (this.onChange) {
      this.onChange(this.getState());
    }
  }
}
