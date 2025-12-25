# Stationeers Game Data Reference

**Last Updated:** 2025-12-24
**Game Version:** Current as of Dec 2024

This document consolidates all game data research for the Build Planner project.

---

## Data Source Locations

### Decompiled Code
`C:\Development\Stationeers Stuff\Assembly.Csharp Decompiled\Assembly-CSharp`

Key files:
- `Assets\Scripts\Objects\IConstructionKit.cs` - Kit interface
- `Assets\Scripts\Objects\Constructor.cs` - Single-variant kit
- `Assets\Scripts\Objects\MultiConstructor.cs` - Multi-variant kit
- `Assets\Scripts\Objects\Structure.cs` - Base structure class
- `Assets\Scripts\Objects\BuildState.cs` - Build stage definitions
- `Objects\Structures\Frame.cs` - Frame structure class

### Decompiled Assets
`C:\Development\Stationeers Stuff\resources`

Contains textures, fonts, models, prefabs, etc.

### Game Installation
`C:\Program Files (x86)\Steam\steamapps\common\Stationeers`

### Game Data Files (Readable XML)
`...\rocketstation_Data\StreamingAssets\`

| File | Contents |
|------|----------|
| `Language\english.xml` | Item/structure names, descriptions |
| `Data\paints.xml` | Paint spray can recipes (color list) |
| `Data\celestialbodies.xml` | Planet orbital data |
| `Worlds\` | Per-planet world settings |

### Community Map Data (MIT Licensed)
https://github.com/aproposmath/stationeers-deepmining-map

| File Pattern | Contents |
|--------------|----------|
| `data/{planet}.json` | Spawn points, mining regions, ore types, POIs |
| `data/{planet}_terrain.webp` | Terrain images (4000x4000) |

Planets available: europa, lunar, mars, mimas, venus, vulcan

---

## Kit/Variant System

### Class Hierarchy

```
Thing (base)
  └── DynamicThing
      └── Item
          └── Stackable (implements IConstructionKit)
              ├── Constructor (single-variant kit)
              ├── MultiConstructor (multi-variant kit)
              └── DynamicThingConstructor
```

### IConstructionKit Interface

```csharp
public interface IConstructionKit
{
    string GetPrefabName();
    string GetFallbackName();
    List<Thing> GetConstructedPrefabs();
}
```

### Constructor (Single-Variant Kit)

```csharp
public class Constructor : Stackable, IConstructionKit
{
    public Structure BuildStructure;  // Single structure to build
    public int QuantityUsed = 1;      // Kits consumed per build
}
```

### MultiConstructor (Multi-Variant Kit)

```csharp
public class MultiConstructor : Stackable, IConstructionKit
{
    public List<Structure> Constructables;  // Multiple variants
    public int LastSelectedIndex;           // Last selected variant

    public void Construct(Grid3 localPosition, Quaternion targetRotation,
                         int optionIndex, ...);  // optionIndex selects variant
}
```

### Key Insight
Variants are stored as `List<Structure>`. Player selects by index. Each variant may require different material quantities via `BuildStates[0].Tool.EntryQuantity`.

---

## Frame Variants

### Steel Frames (Kit: ItemSteelFrames)

| Prefab Name | Display Name | Notes |
|-------------|--------------|-------|
| `StructureFrame` | Steel Frame | Basic flat frame |
| `StructureFrameCorner` | Steel Frame (Corner) | L-shaped corner piece |
| `StructureFrameSide` | Steel Frame (Side) | Edge/side piece |
| `StructureFrameCornerCut` | Steel Frame (Corner Cut) | Angled corner cut |

### Iron Frames (Kit: ItemIronFrames)

| Prefab Name | Display Name | Notes |
|-------------|--------------|-------|
| `StructureFrameIron` | Iron Frame | Single variant only |

### Construction Requirements
- Steel frames: `ItemSteelSheets` + `ItemWeldingTorch`
- Iron frames: `ItemIronSheets` + `ItemWeldingTorch`

---

## Paint Colors

12 colors available via spray cans:

| Color | Spray Can Prefab |
|-------|------------------|
| Black | `ItemSprayCanBlack` |
| Blue | `ItemSprayCanBlue` |
| Brown | `ItemSprayCanBrown` |
| Green | `ItemSprayCanGreen` |
| Grey | `ItemSprayCanGrey` |
| Khaki | `ItemSprayCanKhaki` |
| Orange | `ItemSprayCanOrange` |
| Pink | `ItemSprayCanPink` |
| Purple | `ItemSprayCanPurple` |
| Red | `ItemSprayCanRed` |
| White | `ItemSprayCanWhite` |
| Yellow | `ItemSprayCanYellow` |

Source: `Data\paints.xml`

---

## Planets & Spawn Points

### Available Worlds

| World | Map Data | Playable |
|-------|----------|----------|
| Mars | mars.json | Yes |
| Moon (Lunar) | lunar.json | Yes |
| Europa | europa.json | Yes |
| Vulcan | vulcan.json | Yes |
| Mimas | mimas.json | Yes |
| Venus | venus.json | Yes |

### Mars Spawn Points

| Location | Coordinates [X, Z] |
|----------|-------------------|
| Donut Flats | [1359.0, -315.0] |
| Canyon Overlook | [-612.0, 803.0] |
| Butchers Flat | [347.0, -281.0] |
| Finders Canyon | [-1405.0, 32.0] |
| Hellas Crags | [-990.0, -986.0] |

### Vulcan Spawn Points

| Location | Coordinates [X, Z] |
|----------|-------------------|
| Vesta Valley | [-871.0, -340.0] |
| Etnas Fury | [31.0, 481.0] |
| Ixions Demise | [998.0, -634.0] |
| Titus Reach | [713.0, 661.0] |
| *(8 more...)* | |

### Coordinate System
- Map size: 4000 x 4000 units
- Coordinates are 1:1 with in-game world coordinates
- Origin at map center

---

## Ore/Mining Data

Mining regions stored in planet JSON files with:
- Polygon geometry (TopoJSON format)
- Ore type name (e.g., "Iron Copper Silicon", "Gold Silver")
- Color hex code for visualization
- DN (classification value)

### Example Ore Types
- Silicon
- Gold Silver
- Iron Copper Silicon
- *(varies by planet)*

---

## Fonts

### Game Installation Fonts
`...\StreamingAssets\Fonts\`

| Font | Style | Use Case |
|------|-------|----------|
| `3270-Regular.ttf` | IBM terminal retro | Headers, titles |
| `RobotoMono-Regular.ttf` | Monospace | Technical data |
| `RobotoMono-Bold.ttf` | Monospace bold | Labels, emphasis |
| `MiSans-Normal.ttf` | Sans-serif | CJK support |

### Decompiled Assets
Additional fonts may be available in `C:\Development\Stationeers Stuff\resources`

---

## TODO: Research Needed

### Placement Rules & Slot System
- [ ] How are slots/faces defined per structure?
- [ ] What determines valid placement positions?
- [ ] How do frames interact with other object types?
- [ ] Source file: likely `Structure.cs` or related

### Rotation/Orientation System
- [ ] How are rotations stored? (Quaternion, Euler, enum?)
- [ ] What are valid rotation increments?
- [ ] How does the C key "cycle" work?
- [ ] Source file: `FrameOrientation.cs` only has Portrait/Landscape

### Pipe/Cable Connection Rules
- [ ] How do pipes validate corner connections?
- [ ] What defines valid junction configurations?
- [ ] How are networks tracked?
- [ ] Source files: likely in `Assets\Scripts\Objects\Pipes\`

### Wall Variants
- [ ] Extract full list of wall kit variants
- [ ] Window types
- [ ] Door types

### Device Variants
- [ ] Atmospherics kit variants
- [ ] Storage kit variants
- [ ] Other kit mappings

---

## Testing Configuration

**Preferred test location:** Mars - Donut Flats [1359.0, -315.0]

---

## Version Notes

This data extracted from game version current as of December 2024. May need updates when game patches release new content.
