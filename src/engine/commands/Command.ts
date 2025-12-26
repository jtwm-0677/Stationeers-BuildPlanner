/**
 * Command pattern for undo/redo support
 */

/**
 * Base command interface
 */
export interface Command {
  /** Execute the command */
  execute(): void;

  /** Undo the command */
  undo(): void;

  /** Human-readable description for UI */
  description: string;
}

/**
 * Composite command that groups multiple commands
 */
export class CompositeCommand implements Command {
  private commands: Command[];
  readonly description: string;

  constructor(commands: Command[], description: string) {
    this.commands = commands;
    this.description = description;
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
