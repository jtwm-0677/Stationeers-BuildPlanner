# Sub-Grid System Implementation Plan

> **Status: Phases 1-4 COMPLETE, Phase 5 PENDING**

**Goal:** Implement 1:1 game-accurate grid system with 0.1m precision, dual-grid rendering, and collision/connection rules.

**Architecture:** Coordinate system uses 0.1m-per-unit (matching Stationeers Grid3). Objects declare their grid type (Main=20 units/2m for frames, Small=5 units/0.5m for pipes/cables/chutes). Canvas renders both grids with configurable visibility. Small-grid objects use round() snapping for intersection placement (25 positions per main cell), main-grid objects use floor() for cell placement.

**Tech Stack:** TypeScript, Svelte, Canvas 2D

**Reference:** `docs/plans/2025-12-25-subgrid-system-design.md`

---

## COMPLETED PHASES

### Phase 1: Core Grid System - COMPLETE

**Files Modified:**
- `src/engine/grid/types.ts` - Added GRID_PRECISION, MAIN_GRID (20), SMALL_GRID (5), helper functions
- `src/engine/objects/types.ts` - Added GridType enum, getGridTypeForObject()
- `src/engine/index.ts` - Exports for new types

**Key Constants:**
```typescript
GRID_PRECISION = 0.1   // meters per unit
MAIN_GRID = 20         // units per main grid cell (2.0m)
SMALL_GRID = 5         // units per small grid cell (0.5m)
```

### Phase 2: Project Format - COMPLETE

**Files Modified:**
- `src/data/maps.ts` - Real spawnpoint data for all 6 maps from game XML
- `src/engine/settings/types.ts` - GridDisplaySettings with visibility modes
- `src/engine/project/Project.ts` - v2.0 format with map/spawnpoint, migration support

**Map Data:** Mars, Moon, Mimas, Europa, Venus, Vulcan - all with actual spawnpoint coordinates

### Phase 3: Canvas Rendering - COMPLETE

**Files Modified:**
- `src/ui/Canvas.svelte` - Dual-grid rendering, object-type-aware sizing
- `src/App.svelte` - Grid type derivation from selected tool

**Key Implementation Details:**

1. **Unit/Cell Size Calculations:**
```typescript
const BASE_UNIT_SIZE = 32 / SMALL_GRID;  // ~6.4px per unit at zoom 1
$: unitSize = BASE_UNIT_SIZE * zoom;
$: smallCellSize = unitSize * SMALL_GRID;   // 32px at zoom 1
$: mainCellSize = unitSize * MAIN_GRID;     // 128px at zoom 1
```

2. **Snapping Logic (CRITICAL):**
- **Small grid (pipes/cables/chutes):** `Math.round()` for intersection snapping - allows 25 positions per main cell (0, 5, 10, 15, 20 on each axis)
- **Main grid (frames):** `Math.floor()` for cell snapping - object placed in cell containing cursor

3. **Object Positioning:**
- **Small grid objects:** Centered on grid intersection (offset by -cellSize/2)
- **Main grid objects:** Placed at cell corner (no offset)

4. **Grid Visibility:**
- Main grid: 'always' visible, minZoom 0.5
- Small grid: 'zoom-dependent', minZoom 1.0 (shows at zoom >= 1.0)

5. **Camera/Panning:** Uses unitSize for pixel-to-unit conversion

### Phase 4: Collision & Connection - COMPLETE

**Files Created:**
- `src/engine/collision/types.ts` - Collision rules, pipe network types
- `src/engine/collision/index.ts` - canPlace() function, conflict detection
- `src/engine/connections/types.ts` - Connection direction types, patterns
- `src/engine/connections/transformer.ts` - Variant auto-transformation logic
- `src/engine/connections/index.ts` - Module exports

**Files Modified:**
- `src/engine/objects/types.ts` - Split SlotType.Pipe into GasPipe/LiquidPipe
- `src/engine/objects/GameObject.ts` - Updated factory functions for new slot types
- `src/engine/index.ts` - Added collision and connections exports

**Key Implementation:**

1. **Separate Pipe Network Slots:**
```typescript
export enum SlotType {
  Structural = 'structural',
  Cable = 'cable',
  GasPipe = 'gasPipe',       // Gas network (regular + insulated)
  LiquidPipe = 'liquidPipe', // Liquid network (regular + insulated)
  Chute = 'chute',
  Device = 'device'
}
```

2. **Connection Patterns:**
- 6-directional system: ±X, ±Y, ±Z
- Base patterns for Straight, Corner, TJunction, Cross3-6
- Rotation-aware pattern matching

3. **Collision Rules:**
- All pipes block each other (gas/liquid/insulated - all conflict)
- Cables can cross pipes (only valid crossing case)
- Cables block other cables
- Chutes block pipes, cables, and other chutes
- Same-type pipes trigger variant transformation (calculateTransform)

---

## PENDING PHASES

### Phase 5: Polish - PENDING

**Tasks:**
- Grid Settings UI panel
- Map/Spawnpoint selection on new project
- Floor navigation using MAIN_GRID increments

---

## Verification Checklist

- [x] `npm run check` passes with no errors
- [x] `npm run build` succeeds
- [x] Main grid (2m) visible by default
- [x] Small grid (0.5m) visible at zoom >= 1.0
- [x] Frames snap to 20-unit grid (cell snapping with floor())
- [x] Pipes snap to 5-unit grid with 25 positions per main cell (intersection snapping with round())
- [x] Small-grid objects centered on intersections
- [x] Main-grid objects placed at cell corners
- [x] Panning sensitivity correct
- [x] Collision detection on placement (canPlace function)
- [x] Variant auto-transformation on overlay (calculateTransform)
- [x] Separate GasPipe/LiquidPipe slots for network coexistence
- [ ] Grid settings UI
- [ ] Map selection UI

---

*Plan version: 1.2 (Updated 2025-12-25 - Phase 4 Complete)*
