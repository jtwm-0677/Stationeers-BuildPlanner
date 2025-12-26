# Sub-Grid System Design

**Date**: 2025-12-25
**Status**: Approved
**Goal**: Implement 1:1 game-accurate grid system for Stationeers Build Planner

---

## Overview

The Build Planner requires a coordinate system that matches Stationeers exactly, enabling:
- Precise placement matching in-game behavior
- Future features: oremaps, spawnpoint markers, multi-base projects
- Architectural CAD-level accuracy

---

## 1. Coordinate System

### Core Specification

| Property | Value | Notes |
|----------|-------|-------|
| Base unit | 0.1m | Matches game's Grid3 internal precision |
| Main grid | 20 units (2.0m) | Frames, walls, structures |
| Small grid | 5 units (0.5m) | Pipes, cables, chutes |
| World origin | Game world origin | Coordinates match in-game exactly |

### Grid3 Type Changes

**Location**: `src/engine/grid/types.ts`

```typescript
// Constants
export const GRID_PRECISION = 0.1;    // meters per unit
export const MAIN_GRID = 20;          // units per main grid cell (2.0m)
export const SMALL_GRID = 5;          // units per small grid cell (0.5m)

// Grid3 remains integer-based
export interface Grid3 {
  x: number;  // units (1 unit = 0.1m)
  y: number;
  z: number;
}

// Helper functions
export function toWorldMeters(grid: Grid3): { x: number; y: number; z: number };
export function fromWorldMeters(x: number, y: number, z: number): Grid3;
export function snapToMainGrid(grid: Grid3): Grid3;
export function snapToSmallGrid(grid: Grid3): Grid3;
export function gridToMeters(units: number): number;
export function metersToGrid(meters: number): number;
```

---

## 2. Object Grid Types

### GridType Enum

```typescript
export enum GridType {
  Main = 'main',      // 20-unit increments
  Small = 'small'     // 5-unit increments
}
```

### Object Type Mapping

| ObjectType | GridType | Snap Increment | Notes |
|------------|----------|----------------|-------|
| Frame | Main | 20 units (2m) | |
| Wall | Main | 20 units (2m) | |
| Pipe | Small | 5 units (0.5m) | |
| Cable | Small | 5 units (0.5m) | |
| Chute | Small | 5 units (0.5m) | |
| Device | Main | 20 units (2m) | *Future: migrate to Small* |

### Future Expansion

**End goal**: All non-structural objects use Small grid. Document this for future implementation.

---

## 3. Collision & Connection Rules

### Core Rule

**Only ONE prefab type per sub-grid position.**

### Collision Matrix

| Item A | Item B | Same Position | Adjacent Connection |
|--------|--------|---------------|---------------------|
| Gas Pipe | Gas Pipe | Connect | Connect (endpoints meet) |
| Gas Pipe | Liquid Pipe | **BLOCK** | No interaction |
| Gas Pipe | Insulated Gas Pipe | **BLOCK** | No interaction |
| Gas Pipe | Cable | OK if crossing/corner | No interaction |
| Gas Pipe | Chute | **BLOCK** | No interaction |
| Liquid Pipe | Liquid Pipe | Connect | Connect (endpoints meet) |
| Cable | Cable (same type) | Connect | Connect |
| Cable | Cable (diff type) | **BLOCK** | Connect + **WARN** |
| Chute | Chute | Connect | Connect |
| Chute | Pipe/Cable | **BLOCK** | No interaction |

### Pipe + Cable Coexistence Rules

- **Perpendicular crossing**: OK
- **Corner-to-corner**: OK
- **Parallel run**: **BLOCK**

### Implementation

```typescript
function canPlace(newObject: GameObject, position: Grid3): PlacementResult;
function getConnections(object: GameObject): ConnectionInfo[];
function getWarnings(object: GameObject): Warning[];

interface PlacementResult {
  allowed: boolean;
  reason?: string;
  wouldTransform?: boolean;  // Would merge with existing
}
```

---

## 4. Variant Auto-Transformation

### Behavior

Placing a matching pipe/cable type on an existing piece transforms it to accommodate new connections.

### Example

1. Straight gas pipe at (10, 0, 5), connections: East-West
2. User places corner gas pipe at same position, pointing South
3. System detects: same type, overlapping
4. Result: Transform to T-junction with East-West-South connections

### Connection Point Model

```typescript
type ConnectionDir = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

interface VariantConnectionMap {
  [variantName: string]: ConnectionDir[];
}

// Example entries
const PIPE_CONNECTIONS: VariantConnectionMap = {
  'StructurePipeStraight': ['east', 'west'],
  'StructurePipeCorner': ['east', 'south'],
  'StructurePipeTJunction': ['east', 'west', 'south'],
  'StructurePipeCrossJunction': ['east', 'west', 'north', 'south'],
  // ... all variants with rotation accounted for
};
```

### Transformation Logic

```typescript
function transformVariant(
  existing: GameObject,
  newPlacement: GameObject
): GameObject | null {
  // 1. Verify same type (gas+gas, liquid+liquid, etc.)
  if (!isSameNetworkType(existing, newPlacement)) return null;

  // 2. Get connection points (accounting for rotation)
  const existingConnections = getConnectionPoints(existing);
  const newConnections = getConnectionPoints(newPlacement);

  // 3. Merge connection sets
  const merged = mergeConnections(existingConnections, newConnections);

  // 4. Find matching variant
  const newVariant = findVariantForConnections(merged, existing.type);

  // 5. Return transformed object
  return {
    ...existing,
    variant: newVariant.variant,
    rotation: newVariant.rotation
  };
}
```

---

## 5. Canvas Rendering

### Grid Layers

1. **Main grid**: Lines every 20 units, thicker stroke
2. **Small grid**: Lines every 5 units, faint stroke (conditional visibility)

### Grid Display Settings

```typescript
interface GridDisplaySettings {
  mainGrid: GridLayerSettings;
  smallGrid: GridLayerSettings;
}

interface GridLayerSettings {
  visibility: 'always' | 'never' | 'zoom-dependent' | 'context-dependent';
  minZoom: number;
  color: string;
  opacity: number;
  lineWidth: number;
}
```

### Default Settings

| Setting | Main Grid | Small Grid |
|---------|-----------|------------|
| Visibility | always | context-dependent |
| Min Zoom | 0.5 | 1.5 |
| Color | #2a3a4a | #1a2a3a |
| Opacity | 1.0 | 0.6 |
| Line Width | 1 | 1 |

### Context-Dependent Logic

```typescript
function shouldShowSmallGrid(): boolean {
  const placingSmallGridObject =
    selectedObjectType &&
    getGridTypeForObject(selectedObjectType) === GridType.Small;

  if (gridSettings.smallGrid.visibility === 'always') return true;
  if (gridSettings.smallGrid.visibility === 'never') return false;
  if (gridSettings.smallGrid.visibility === 'zoom-dependent') {
    return zoom >= gridSettings.smallGrid.minZoom;
  }
  // context-dependent
  return placingSmallGridObject && zoom >= gridSettings.smallGrid.minZoom;
}
```

### User Customization

Grid settings exposed in UI:
- Visibility mode dropdown per grid
- Zoom threshold slider
- Color picker
- Opacity slider
- Line width slider

Settings stored in localStorage (user preference, not per-project).

---

## 6. Project Format v2.0

### Metadata Additions

```typescript
interface ProjectMetadata {
  name: string;
  version: string;           // "2.0"
  created: string;
  modified: string;
  map: string;               // "mars", "moon", etc.
  spawnpoint: string;        // Spawnpoint identifier
  spawnCoords: Grid3;        // World coordinates of spawnpoint
}
```

### Full Export Format

```json
{
  "version": "2.0",
  "metadata": {
    "name": "My Mars Base",
    "created": "2025-12-25T12:00:00Z",
    "modified": "2025-12-25T14:30:00Z",
    "map": "mars",
    "spawnpoint": "landing_pad_alpha",
    "spawnCoords": { "x": 1000, "y": 0, "z": 2500 }
  },
  "objects": [
    {
      "id": "abc123",
      "type": "frame",
      "variant": "StructureFrame",
      "position": { "x": 1020, "y": 0, "z": 2520 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "color": null,
      "gridType": "main"
    }
  ],
  "settings": {
    "gridDisplay": {
      "mainGrid": { "visibility": "always", "color": "#2a3a4a" },
      "smallGrid": { "visibility": "context-dependent", "color": "#1a2a3a" }
    }
  }
}
```

---

## 7. Migration Strategy

### Version Detection

```typescript
function detectVersion(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'version' in data) {
    return (data as { version: string }).version;
  }
  return '1.0';  // Legacy format
}
```

### Migration: v1 → v2

```typescript
function migrateV1ToV2(oldData: LegacyProjectData): ProjectData {
  // 1. Create backup
  const backup = JSON.stringify(oldData);
  const backupKey = `backup_${oldData.metadata.name}_${Date.now()}`;
  localStorage.setItem(backupKey, backup);

  // 2. Initialize new structure
  const newData: ProjectData = {
    version: "2.0",
    metadata: {
      ...oldData.metadata,
      version: "2.0",
      map: "unknown",
      spawnpoint: "origin",
      spawnCoords: { x: 0, y: 0, z: 0 }
    },
    objects: [],
    settings: getDefaultSettings()
  };

  // 3. Convert positions (1 old unit = 2m = 20 new units)
  for (const obj of oldData.objects) {
    newData.objects.push({
      ...obj,
      position: {
        x: obj.position.x * MAIN_GRID,
        y: obj.position.y * MAIN_GRID,
        z: obj.position.z * MAIN_GRID
      },
      gridType: getGridTypeForObject(obj.type)
    });
  }

  return newData;
}
```

### User Flow

1. Load file → detect version
2. If legacy: show modal "Migrate to v2.0?"
3. Inform: backup created, set map/spawnpoint after
4. User confirms → migrate and load
5. Prompt to select map/spawnpoint

---

## 8. Map & Spawnpoint Catalog

### Data Structures

```typescript
interface MapDefinition {
  id: string;
  name: string;
  planet: string;
  spawnpoints: SpawnpointDefinition[];
}

interface SpawnpointDefinition {
  id: string;
  name: string;
  coords: Grid3;
  description?: string;
}
```

### Location

`src/data/maps.ts`

### Initial Catalog

```typescript
export const MAPS: MapDefinition[] = [
  {
    id: 'mars',
    name: 'Mars',
    planet: 'Mars',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
      // Additional spawnpoints from game data research
    ]
  },
  {
    id: 'moon',
    name: 'Moon',
    planet: 'Moon',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
    ]
  },
  {
    id: 'europa',
    name: 'Europa',
    planet: 'Europa',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
    ]
  },
  {
    id: 'venus',
    name: 'Venus',
    planet: 'Venus',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
    ]
  },
  {
    id: 'vulcan',
    name: 'Vulcan',
    planet: 'Vulcan',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
    ]
  },
  {
    id: 'loulan',
    name: 'Loulan',
    planet: 'Loulan',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
    ]
  },
  {
    id: 'mimas',
    name: 'Mimas',
    planet: 'Mimas',
    spawnpoints: [
      { id: 'origin', name: 'Origin', coords: { x: 0, y: 0, z: 0 } }
    ]
  }
];
```

**Note**: Spawnpoint coordinates to be populated from game data research.

---

## 9. Implementation Order

### Phase 1: Core Grid System
1. Grid3 constants and helper functions
2. GridType enum and object mapping
3. Update Canvas cell size calculations
4. Update placement snapping logic

### Phase 2: Project Format
5. Project format v2.0 structure
6. Migration logic with backup
7. Map/spawnpoint catalog (placeholder data)

### Phase 3: Rendering
8. Dual-grid rendering (main + small)
9. Grid display settings
10. Settings UI in RightPanel

### Phase 4: Collision & Connection
11. Collision validation (canPlace)
12. Connection point definitions per variant
13. Variant auto-transformation logic
14. Warning system (cable type mixing)

### Phase 5: Polish
15. Map/spawnpoint selection UI
16. Populate spawnpoint coordinates from game data
17. Testing and refinement

---

## 10. Future Considerations

### Documented for Future Implementation

1. **Multi-base projects**: Option 2 from spawnpoint discussion - single project containing multiple bases at different spawnpoints
2. **Device small-grid**: Migrate devices from Main to Small grid
3. **Oremap integration**: Overlay terrain/ore data using world coordinates
4. **Native builds**: Windows/Linux desktop applications using same coordinate system

### Cross-Platform Notes

All coordinate and grid logic must be platform-agnostic:
- No web-specific APIs in core engine
- Settings persistence abstracted (localStorage for web, file for native)
- Canvas rendering abstracted for potential native renderer

---

## Appendix A: Coordinate Examples

### Frame at World Origin
- World position: (0m, 0m, 0m)
- Grid3: { x: 0, y: 0, z: 0 }
- Occupies: 20x20x20 unit cube

### Pipe One Small-Grid Step East
- World position: (0.5m, 0m, 0m)
- Grid3: { x: 5, y: 0, z: 0 }
- Occupies: 5x5x5 unit cube

### Frame at Mars Spawnpoint
- Spawnpoint coords: { x: 1000, y: 0, z: 2500 }
- Frame one cell east: { x: 1020, y: 0, z: 2500 }
- World position: (102m, 0m, 250m)

---

*Document version: 1.0*
*Last updated: 2025-12-25*
