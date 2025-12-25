# Application Architecture

**Created:** 2025-12-24
**Stack:** Svelte + Vite + TypeScript
**Future:** Tauri for Windows 11 standalone

---

## Core Principles

1. **Engine-UI Separation** - Core logic has zero framework dependencies
2. **Type Safety** - TypeScript throughout, no `any` types
3. **Command Pattern** - All actions are undoable from day one
4. **Layered Rendering** - Canvas layers for performance
5. **Reactive State** - Svelte stores wrap engine state

---

## Directory Structure

```
src/
├── engine/                 # ZERO framework dependencies
│   ├── grid/
│   │   ├── Grid.ts         # 3D grid management
│   │   ├── Cell.ts         # Cell contents (multi-object)
│   │   └── types.ts        # Grid3, coordinates
│   │
│   ├── objects/
│   │   ├── GameObject.ts   # Base object interface
│   │   ├── Frame.ts        # Frame object type
│   │   └── types.ts        # Object enums, interfaces
│   │
│   ├── commands/
│   │   ├── Command.ts      # Command interface
│   │   ├── CommandStack.ts # Undo/redo stack
│   │   ├── PlaceObject.ts  # Place object command
│   │   ├── DeleteObject.ts # Delete object command
│   │   └── RotateObject.ts # Rotate object command
│   │
│   ├── project/
│   │   ├── Project.ts      # Project state container
│   │   ├── serialization.ts# Save/load logic
│   │   └── types.ts        # Project interfaces
│   │
│   ├── validation/
│   │   ├── Validator.ts    # Placement validation
│   │   └── rules.ts        # Validation rules
│   │
│   └── index.ts            # Public engine API
│
├── ui/
│   ├── canvas/
│   │   ├── CanvasManager.svelte  # Manages all canvas layers
│   │   ├── TerrainLayer.ts       # Layer 0: terrain/map
│   │   ├── GridLayer.ts          # Layer 1: grid lines
│   │   ├── ObjectsLayer.ts       # Layer 2: placed objects
│   │   └── OverlayLayer.ts       # Layer 3: selection, preview
│   │
│   ├── panels/
│   │   ├── ObjectPalette.svelte  # Left panel - object selection
│   │   ├── Properties.svelte     # Right panel - object details
│   │   ├── Minimap.svelte        # Floating - overview
│   │   └── Warnings.svelte       # Floating - terrain warnings
│   │
│   ├── toolbar/
│   │   ├── Toolbar.svelte        # Top toolbar container
│   │   ├── ViewSelector.svelte   # Top/N/S/E/W buttons
│   │   ├── FloorControls.svelte  # +/- floor navigation
│   │   └── ToolModes.svelte      # Place/Select/Delete
│   │
│   └── common/
│       ├── Button.svelte
│       ├── Panel.svelte          # Collapsible panel wrapper
│       └── FloatingPanel.svelte  # Draggable floating panel
│
├── stores/
│   ├── project.ts          # Wraps engine Project
│   ├── viewport.ts         # Pan, zoom, view orientation, floor
│   ├── selection.ts        # Selected objects
│   ├── placement.ts        # Current tool, object type, rotation
│   └── ui.ts               # Panel states, preferences
│
├── data/
│   ├── frames.json         # Frame definitions
│   ├── colors.json         # Paint colors
│   └── planets/
│       ├── mars.json       # Spawn points, terrain
│       ├── vulcan.json
│       └── ...
│
├── utils/
│   ├── constants.ts        # Grid size, etc.
│   ├── math.ts             # Vector, rotation helpers
│   └── storage.ts          # localStorage helpers
│
├── App.svelte              # Root component
├── main.ts                 # Entry point
└── app.css                 # Global styles
```

---

## Canvas Layer System

Four stacked HTML5 canvases for optimal redraw performance:

| Layer | Name | Redraws When | Content |
|-------|------|--------------|---------|
| 0 | Terrain | Planet/spawn changes | Map image, ore regions |
| 1 | Grid | Zoom changes | Grid lines, coordinates |
| 2 | Objects | Object changes | All placed structures |
| 3 | Overlay | Mouse move, selection | Preview, selection highlight, warnings |

Each layer is a separate `<canvas>` element, absolutely positioned and stacked via z-index.

---

## Command Pattern

Every state-changing action is a Command:

```typescript
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

class PlaceObjectCommand implements Command {
  constructor(
    private grid: Grid,
    private object: GameObject,
    private position: Grid3
  ) {}

  execute() {
    this.grid.place(this.object, this.position);
  }

  undo() {
    this.grid.remove(this.position, this.object.id);
  }

  description = "Place object";
}
```

**CommandStack** manages history:
- `execute(command)` - Run and push to history
- `undo()` - Pop and undo last command
- `redo()` - Re-execute from redo stack
- Configurable history limit (default: 100)

---

## State Management

**Engine state** (in `engine/`):
- `Project` - Grid, objects, metadata
- Immutable operations, returns new state
- No Svelte dependencies

**UI state** (in `stores/`):
- Svelte stores wrap engine state
- Subscribe to trigger reactivity
- Thin layer - logic stays in engine

```typescript
// stores/project.ts
import { writable } from 'svelte/store';
import { Project } from '../engine';

function createProjectStore() {
  const { subscribe, set, update } = writable<Project>(new Project());

  return {
    subscribe,
    placeObject: (obj, pos) => update(p => {
      const cmd = new PlaceObjectCommand(p.grid, obj, pos);
      p.commands.execute(cmd);
      return p;
    }),
    undo: () => update(p => { p.commands.undo(); return p; }),
    redo: () => update(p => { p.commands.redo(); return p; }),
    // ...
  };
}

export const project = createProjectStore();
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Input                           │
│  (click, keypress, drag)                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Svelte Component                        │
│  (CanvasManager, Toolbar, etc.)                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Svelte Store                           │
│  (project, viewport, selection)                             │
│  - Validates input                                          │
│  - Creates Command                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                        Engine                               │
│  - Executes Command                                         │
│  - Updates Grid/Project state                               │
│  - Returns validation result                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Store Subscription                        │
│  - Triggers Svelte reactivity                               │
│  - Components re-render                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Canvas Redraw                            │
│  - Only affected layers redraw                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Interfaces

```typescript
// Grid position
interface Grid3 {
  x: number;
  y: number;  // Floor level
  z: number;
}

// Rotation (Euler angles in degrees, 90° increments)
interface Rotation {
  x: number;  // 0, 90, 180, 270
  y: number;
  z: number;
}

// Base game object
interface GameObject {
  id: string;
  type: ObjectType;
  variant: string;
  position: Grid3;
  rotation: Rotation;
  color: string | null;
}

// Cell contents
interface Cell {
  position: Grid3;
  structural: GameObject | null;  // Frame, wall, etc.
  cable: GameObject | null;
  pipe: GameObject | null;
  chute: GameObject | null;
  device: GameObject | null;
}

// Project save format
interface ProjectData {
  version: string;
  gameVersion: string;
  planet: string;
  spawnPoint: { x: number; z: number };
  name: string;
  created: string;
  modified: string;
  objects: GameObject[];
}
```

---

## Tauri Considerations

The `engine/` module has zero web dependencies:
- No DOM access
- No Svelte imports
- Pure TypeScript

This means Tauri integration requires only:
1. Wrap `engine/` with Tauri commands (if needed)
2. Replace localStorage with Tauri fs API
3. Add native file dialogs

The UI layer remains Svelte - Tauri renders it in a webview.

---

## Phase 1 Scope

For initial implementation:

**Include:**
- Grid system (Grid, Cell)
- Frame objects only
- Place/Delete/Rotate commands
- CommandStack (undo/redo)
- Canvas layers 1-3 (skip terrain for now)
- Basic toolbar (view, floor, tools)
- Object palette (frames only)
- Properties panel (basic)
- localStorage save/load

**Defer:**
- Terrain layer (Phase 3)
- Pipe/cable/device objects (Phase 4)
- Paint system (Phase 4)
- Minimap panel (Phase 5)
- Blueprint export (Phase 5)
