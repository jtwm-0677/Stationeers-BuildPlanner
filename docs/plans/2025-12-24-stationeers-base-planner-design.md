# Stationeers Base Planner - Design Document

**Created:** 2025-12-24
**Status:** Approved
**Target Platform:** Browser (later Windows 11 standalone via Tauri)

## Reference Data Locations

**Decompiled Game Files:**
`C:\Development\Stationeers Stuff\Assembly.Csharp Decompiled\Assembly-CSharp`

**Game Installation:**
`C:\Program Files (x86)\Steam\steamapps\common\Stationeers`

**Game Data Files (readable XML):**
`...\rocketstation_Data\StreamingAssets\`
- `Language\english.xml` - Item/structure names and descriptions
- `Data\paints.xml` - Paint colors (12 colors)
- `Data\celestialbodies.xml` - Planet orbital data

**Community Map Data (MIT licensed):**
https://github.com/aproposmath/stationeers-deepmining-map
- `data/{planet}.json` - Spawn points, mining regions, ore types, POIs
- `data/{planet}_terrain.webp` - Terrain images (4000x4000)
- Planets: europa, lunar, mars, mimas, venus, vulcan

## Overview

A browser-based base planner for Stationeers that mirrors in-game construction. Users select a planet/spawn point, then place objects on a 3D grid viewed one floor at a time from orthographic views (top or 4 sides).

### Primary Goals (v1)
- Pre-planning bases and expansions
- Mirror in-game construction as closely as possible

### Future Goals
- Resource/power requirement calculations
- Build sharing (export/import)
- Learning tool for new players

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Svelte |
| Rendering | HTML5 Canvas 2D |
| State | Svelte stores |
| Storage | Browser localStorage + JSON file export |
| Future Desktop | Tauri (Windows 11) |

---

## Core Architecture

### Application Modules

- **Canvas Renderer** - HTML5 Canvas 2D for main grid view. Handles pan, zoom, cell rendering. Separate render layers for: grid lines, terrain reference, placed objects, selection highlights, UI overlays (warnings).

- **State Manager** - Svelte stores holding: current floor level, view orientation, placed objects, selected tool/item, terrain data. All state serializable to JSON.

- **Data Loader** - Loads pre-extracted game data (items, kits, variants, placement rules) from bundled JSON files.

- **Planet Manager** - Handles planet selection, spawn points, terrain height lookups.

### Grid System

The world is a 3D grid matching Stationeers' coordinate system.

**Cell Structure:**
Each cell (x, y, z) contains an **array of objects** (not single object). A cell can hold frame + pipes + cables + device simultaneously.

**Per-Object Properties:**
- Type (frame, pipe, cable, device, etc.)
- Subtype (iron frame, steel cable, etc.)
- Variant (from kit system)
- Face/slot (floor, ceiling, north wall, pipe slot 1, etc.)
- Rotation (3-axis)
- Color (paint system)
- Metadata

---

## Kit/Variant System

Stationeers uses a kit-based construction system where kits contain multiple buildable variants.

**Structure:**
```
Kit
├── name: "Kit (Steel Frames)"
├── variants:
│   ├── Variant 1
│   ├── Variant 2
│   └── ... (all shapes/types)
```

**Examples:**
- Steel Frame Kit → various frame shapes
- Wall Kit → wall, window, corner variants
- Atmospherics Kit → AC, filtration, regulator variants

**Data Source:**
All kit/variant definitions extracted from decompiled game files. No guessing - 100% coverage of in-game options.

**Confirmed Steel Frame Variants:**
| Prefab Name | Display Name |
|-------------|--------------|
| `StructureFrame` | Steel Frame |
| `StructureFrameCorner` | Steel Frame (Corner) |
| `StructureFrameSide` | Steel Frame (Side) |
| `StructureFrameCornerCut` | Steel Frame (Corner Cut) |

**Confirmed Iron Frame Variant:**
| Prefab Name | Display Name |
|-------------|--------------|
| `StructureFrameIron` | Iron Frame |

**Confirmed Paint Colors (12):**
Black, Blue, Brown, Green, Grey, Khaki, Orange, Pink, Purple, Red, White, Yellow

---

## View System

### Floor Navigation
- Single floor visible at a time
- **+/-** or **Up/Down** buttons to change floors
- No ghosting of adjacent floors (builds too complex)

### Orthographic Views
Selectable, one at a time:
- **Top** - X/Z plane at current Y level (straight down)
- **North/South/East/West** - Side views with slight downward angle (~15-20°)

Side views use a subtle isometric-style angle looking slightly down, providing better depth perception and visibility of floor placement. Toggle option available for pure orthographic (straight-on) if preferred.

View switching re-renders canvas with new projection. Selection and floor level persist.

---

## Placement & Interaction

### Placement Mode
1. Select item (kit variant) from palette
2. Mouse cursor shows placement preview snapped to grid
3. Preview updates rotation in real-time
4. Left-click places object
5. Item remains selected for continued placement
6. Right-click or Esc exits placement mode

### Rotation Controls (matching Stationeers)
| Keys | Axis |
|------|------|
| Ins / Del | First axis |
| Home / End | Second axis |
| PgUp / PgDn | Third axis |
| C | Cycle rotation presets |

### Selection Mode
1. Click occupied cell → popup shows all objects in cell
2. Click specific object to select it
3. Selected object highlights, details in Properties panel
4. Rotation keys modify selected object
5. Delete key removes selected object

### Placement Validation
Extracted from game files:
- Slot compatibility (what can occupy which face/slot)
- Connection rules (valid pipe/cable corners)
- Intersection rules (which types can coexist)
- Rotation constraints

Invalid placement → red preview with tooltip explaining why.

---

## Paint/Color System

Each pipe, cable, or chute has a `color` property:
- Default: unpainted (material color)
- Painted: game color palette

**UI Options:**
- Color picker in Properties panel for selected object
- Paint tool in toolbar - select color, click to apply

Networks visually distinct by color for system differentiation.

---

## Planet & Terrain System

### Planet Selection
- Dropdown to select planet (Vulcan, Europa, Mars, Moon, etc.)
- Planet map displays as overlay/reference
- Click map or enter coordinates for spawn point

### Terrain Data
- Height map per planet (extracted from game files)
- Building grid is flat overlay
- If object Y-level < terrain height → warning overlay
- Warnings panel lists: "Floor -1: 12 cells require mining"

### 1:1 Coordinate Display
- Real-time X/Z coordinate display matching in-game coordinates
- Coordinates update as user pans around map
- Placed structures show exact world position
- Spawn points use actual game coordinates (e.g., Mars Donut Flats: [1359.0, -315.0])
- 4000x4000 unit map scale matches game world

### Ore Deposit Overlay
- Mining regions displayed as colored polygon overlays on terrain
- Ore types labeled (e.g., "Iron Copper Silicon", "Gold Silver", "Silicon")
- Toggle ore layer visibility on/off
- Click region to see ore composition
- Color-coded by ore type for quick visual reference
- Helps plan base location relative to resources

### Data Sources
1. Community map data (primary - MIT licensed, actively maintained)
2. Game asset files (terrain heights if extractable)
3. Decompiled game files (validation/cross-reference)

---

## User Interface

### Layout Philosophy
- Professional appearance
- Maximum canvas space
- Collapsible and floating panels (not hover-triggered)

### Collapsible Panels

**Object Palette (left)**
- Categorized by kit type
- Expandable to show variants
- Search/filter bar
- Click to select for placement

**Properties Panel (right)**
- Shows selected object details
- Cell coordinates and object count for multi-object cells
- Per-object properties (type, rotation, color)
- Delete button per object

**Toolbar (top)**
- View selector (Top / N / S / E / W)
- Floor controls (+/- with level display)
- Tool modes (Place / Select / Delete)
- Undo / Redo
- Planet / spawn selector

### Floating Panels (optional)
- Minimap - floor overview, click to pan
- Layer list - quick floor jump with object counts
- Warnings - terrain conflict list

Panel positions and collapsed state saved to localStorage.

---

## Save/Load System

### Project File Format (.stbase)
```json
{
  "version": "1.0",
  "gameVersion": "0.2.xxxx",
  "planet": "vulcan",
  "spawnPoint": { "x": 0, "z": 0 },
  "name": "My Main Base",
  "created": "2025-12-24T...",
  "modified": "2025-12-24T...",
  "objects": [
    {
      "x": 0, "y": 0, "z": 0,
      "type": "steel_frame",
      "variant": "corner",
      "face": "floor",
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "color": null
    }
  ]
}
```

### Local Storage
- Auto-save every 60 seconds
- Last 5 auto-saves as recovery points
- Manual save updates current slot

### File Export/Import
- Export downloads `.stbase` file
- Import via file picker with validation
- Version compatibility warnings
- MIME type: `application/x-stationeers-base`

### Blueprint Print Export
Generate printable blueprint sheets with futuristic sci-fi aesthetic:

**Layout Options:**
- Single view (top or any side)
- Combined views (top + 2-4 sides arranged on sheet)
- Multi-floor compilation (stacked or grid layout)

**Included Information:**
- Project name and coordinates
- Planet and spawn point
- Floor level indicators
- Grid scale reference
- Material/item counts (frames, pipes, etc.)
- Dimension callouts
- Legend for object types

**Style:**
- Dark background with light grid lines (blueprint style)
- Authentic game fonts:
  - `3270-Regular.ttf` - Retro-terminal aesthetic for headers
  - `RobotoMono-Bold/Regular.ttf` - Technical data and labels
- Corner brackets and technical border decorations
- "Classified" / corporate logo watermark area (customizable)
- Export as PDF or high-res PNG

**Font Source:** `...\StreamingAssets\Fonts\`

### Multiple Projects
- Project list panel/modal
- New / Open / Save As / Delete

---

## Data Pipeline

### Development-Time Process
1. Parse decompiled C# files for item/kit/variant definitions
2. Extract placement rules, slot systems, connection logic
3. Pull paint colors, categories, metadata
4. Output structured JSON bundled with app

**Output Files:**
- `items.json` - All kits and variants with properties
- `rules.json` - Placement/connection validation
- `colors.json` - Paint color palette
- `planets.json` - Planet data with terrain heights

### User Experience
- Users download/open app with all data included
- No game file access required
- App version displays compatible game version
- Updates released when game data changes

---

## Implementation Phases

### Phase 1: Core Foundation
1. Svelte project setup with Canvas renderer
2. Grid system (pan, zoom, floor switching)
3. View switching (top + 4 sides)
4. **Steel frame placement** with full rotation
5. Selection and deletion (multi-object cells)
6. Local storage save/load
7. Minimal UI panels

### Phase 2: Data Integration
1. Explore decompiled files for kit/variant structure
2. Extract all steel frame variants
3. Build data extraction pipeline
4. Implement placement validation

### Phase 3: Planet & Terrain
1. Locate terrain data in game files
2. Planet selection UI
3. Spawn point selection
4. Terrain height warnings

### Phase 4: Expanded Content
1. Additional kit types (walls, devices)
2. Pipe and cable networks
3. Connection validation
4. Paint system

### Phase 5: Polish & Export
1. JSON file export/import
2. Undo/redo system
3. Minimap panel
4. Keyboard shortcut customization
5. Tauri wrapper for Windows 11

---

## Desktop App File Association (Tauri)

When building the Windows desktop app with Tauri, register the `.stbase` file extension so Windows displays "Stationeers Base Plan" as the file type.

**Tauri Configuration (`tauri.conf.json`):**
```json
{
  "bundle": {
    "fileAssociations": [{
      "ext": ["stbase"],
      "mimeType": "application/x-stationeers-base",
      "description": "Stationeers Base Plan"
    }]
  }
}
```

**Manual Windows Registry (for development/testing):**
```reg
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\.stbase]
@="StationeersBasePlan"

[HKEY_CLASSES_ROOT\StationeersBasePlan]
@="Stationeers Base Plan"

[HKEY_CLASSES_ROOT\StationeersBasePlan\DefaultIcon]
@="%SystemRoot%\\System32\\shell32.dll,1"
```

The Tauri installer will handle this automatically during installation.

---

## Future: In-Game Mod (BepInEx)

After the web-based and Windows desktop applications are complete, explore porting the build planner as an in-game mod for Stationeers.

### Mod Framework
- **BepInEx** - Unity mod loader/injector framework
- **StationeersLaunchpad** - Community mod launcher for Stationeers
- Both support Stationeers modding

### Potential Features
- In-game overlay showing planned builds as ghost objects
- Toggle between "plan mode" and normal gameplay
- Import `.stbase` files directly into game
- Real-time validation against actual game state
- One-click placement of planned structures (if resources available)
- Side-by-side comparison: plan vs actual build

### Technical Considerations
- Unity C# environment (different from web/Tauri TypeScript)
- May need to rewrite core logic in C# or use a shared data format
- Hook into game's placement system for validation
- Render ghost objects using game's existing preview system
- Access game's inventory for resource checking

### Research Required
- BepInEx plugin structure for Stationeers
- Game's internal placement/preview APIs
- How other Stationeers mods handle UI overlays
- StationeersLaunchpad integration requirements

### Development Order
1. Complete web-based editor (current)
2. Complete Windows desktop app (Tauri)
3. Research BepInEx/Stationeers modding
4. Prototype in-game ghost rendering
5. Full mod implementation

---

## First Milestone

**Steel frame placement on working grid with:**
- Pan, zoom, floor switching
- All 5 orthographic views
- Full rotation controls (Ins/Del, Home/End, PgUp/PgDn, C)
- Multi-object cell selection
- Local storage persistence
- Minimal functional UI

Testing against live game instance for validation.
