/**
 * Item catalog - defines all placeable items in the game
 */

import { SteelFrameVariant, IronFrameVariant } from '../engine';

export type ItemCategory = 'structural' | 'pipes' | 'cables' | 'devices' | 'logic';

export interface ItemVariant {
  id: string;
  name: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  subcategory?: string;
  variants: ItemVariant[];
  icon?: string;
}

export interface CatalogSubcategory {
  id: string;
  name: string;
  items: CatalogItem[];
}

export interface CatalogCategory {
  id: ItemCategory;
  name: string;
  icon: string;
  subcategories: CatalogSubcategory[];
}

// Define the full catalog
export const catalog: CatalogCategory[] = [
  {
    id: 'structural',
    name: 'Structural',
    icon: '▢',
    subcategories: [
      {
        id: 'frames',
        name: 'Frames',
        items: [
          {
            id: 'steel-frame',
            name: 'Steel Frame',
            category: 'structural',
            subcategory: 'frames',
            variants: [
              { id: SteelFrameVariant.Standard, name: 'Standard' },
              { id: SteelFrameVariant.Corner, name: 'Corner' },
              { id: SteelFrameVariant.Side, name: 'Side' },
              { id: SteelFrameVariant.CornerCut, name: 'Corner Cut' }
            ]
          },
          {
            id: 'iron-frame',
            name: 'Iron Frame',
            category: 'structural',
            subcategory: 'frames',
            variants: [
              { id: IronFrameVariant.Standard, name: 'Standard' }
            ]
          }
        ]
      },
      {
        id: 'walls',
        name: 'Walls',
        items: [
          {
            id: 'steel-wall',
            name: 'Steel Wall',
            category: 'structural',
            subcategory: 'walls',
            variants: [
              { id: 'StructureWall', name: 'Standard' },
              { id: 'StructureWallCorner', name: 'Corner' }
            ]
          },
          {
            id: 'iron-wall',
            name: 'Iron Wall',
            category: 'structural',
            subcategory: 'walls',
            variants: [
              { id: 'StructureWallIron', name: 'Standard' }
            ]
          }
        ]
      },
      {
        id: 'windows',
        name: 'Windows',
        items: [
          {
            id: 'window',
            name: 'Window',
            category: 'structural',
            subcategory: 'windows',
            variants: [
              { id: 'StructureWindow', name: 'Standard' }
            ]
          }
        ]
      },
      {
        id: 'doors',
        name: 'Doors',
        items: [
          {
            id: 'door',
            name: 'Door',
            category: 'structural',
            subcategory: 'doors',
            variants: [
              { id: 'StructureDoor', name: 'Standard' }
            ]
          },
          {
            id: 'airlock',
            name: 'Airlock',
            category: 'structural',
            subcategory: 'doors',
            variants: [
              { id: 'StructureAirlock', name: 'Standard' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'pipes',
    name: 'Pipes',
    icon: '◯',
    subcategories: [
      {
        id: 'gas-pipes',
        name: 'Gas Pipes',
        items: [
          {
            id: 'pipe-gas',
            name: 'Pipe (Gas)',
            category: 'pipes',
            subcategory: 'gas-pipes',
            variants: [
              { id: 'StructurePipeStraight', name: 'Straight' },
              { id: 'StructurePipeStraight3', name: 'Straight (3m)' },
              { id: 'StructurePipeStraight5', name: 'Straight (5m)' },
              { id: 'StructurePipeStraight10', name: 'Straight (10m)' },
              { id: 'StructurePipeCorner', name: 'Corner' },
              { id: 'StructurePipeTJunction', name: 'T-Junction' },
              { id: 'StructurePipeCrossJunction', name: 'Cross (3-Way)' },
              { id: 'StructurePipeCrossJunction4', name: 'Cross (4-Way)' },
              { id: 'StructurePipeCrossJunction5', name: 'Cross (5-Way)' },
              { id: 'StructurePipeCrossJunction6', name: 'Cross (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'liquid-pipes',
        name: 'Liquid Pipes',
        items: [
          {
            id: 'pipe-liquid',
            name: 'Pipe (Liquid)',
            category: 'pipes',
            subcategory: 'liquid-pipes',
            variants: [
              { id: 'StructurePipeLiquidStraight', name: 'Straight' },
              { id: 'StructurePipeLiquidStraight3', name: 'Straight (3m)' },
              { id: 'StructurePipeLiquidStraight5', name: 'Straight (5m)' },
              { id: 'StructurePipeLiquidStraight10', name: 'Straight (10m)' },
              { id: 'StructurePipeLiquidCorner', name: 'Corner' },
              { id: 'StructurePipeLiquidTJunction', name: 'T-Junction' },
              { id: 'StructurePipeLiquidCrossJunction', name: 'Cross (3-Way)' },
              { id: 'StructurePipeLiquidCrossJunction4', name: 'Cross (4-Way)' },
              { id: 'StructurePipeLiquidCrossJunction5', name: 'Cross (5-Way)' },
              { id: 'StructurePipeLiquidCrossJunction6', name: 'Cross (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'insulated-gas-pipes',
        name: 'Insulated Gas Pipes',
        items: [
          {
            id: 'pipe-insulated-gas',
            name: 'Insulated Pipe (Gas)',
            category: 'pipes',
            subcategory: 'insulated-gas-pipes',
            variants: [
              { id: 'StructureInsulatedPipeStraight', name: 'Straight' },
              { id: 'StructureInsulatedPipeStraight3', name: 'Straight (3m)' },
              { id: 'StructureInsulatedPipeStraight5', name: 'Straight (5m)' },
              { id: 'StructureInsulatedPipeStraight10', name: 'Straight (10m)' },
              { id: 'StructureInsulatedPipeCorner', name: 'Corner' },
              { id: 'StructureInsulatedPipeTJunction', name: 'T-Junction' },
              { id: 'StructureInsulatedPipeCrossJunction3', name: 'Cross (3-Way)' },
              { id: 'StructureInsulatedPipeCrossJunction4', name: 'Cross (4-Way)' },
              { id: 'StructureInsulatedPipeCrossJunction5', name: 'Cross (5-Way)' },
              { id: 'StructureInsulatedPipeCrossJunction6', name: 'Cross (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'insulated-liquid-pipes',
        name: 'Insulated Liquid Pipes',
        items: [
          {
            id: 'pipe-insulated-liquid',
            name: 'Insulated Pipe (Liquid)',
            category: 'pipes',
            subcategory: 'insulated-liquid-pipes',
            variants: [
              { id: 'StructureInsulatedPipeLiquidStraight', name: 'Straight' },
              { id: 'StructureInsulatedPipeLiquidStraight3', name: 'Straight (3m)' },
              { id: 'StructureInsulatedPipeLiquidStraight5', name: 'Straight (5m)' },
              { id: 'StructureInsulatedPipeLiquidStraight10', name: 'Straight (10m)' },
              { id: 'StructureInsulatedPipeLiquidCorner', name: 'Corner' },
              { id: 'StructureInsulatedPipeLiquidTJunction', name: 'T-Junction' },
              { id: 'StructureInsulatedPipeLiquidCrossJunction3', name: 'Cross (3-Way)' },
              { id: 'StructureInsulatedPipeLiquidCrossJunction4', name: 'Cross (4-Way)' },
              { id: 'StructureInsulatedPipeLiquidCrossJunction5', name: 'Cross (5-Way)' },
              { id: 'StructureInsulatedPipeLiquidCrossJunction6', name: 'Cross (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'chutes',
        name: 'Chutes',
        items: [
          {
            id: 'chute',
            name: 'Chute',
            category: 'pipes',
            subcategory: 'chutes',
            variants: [
              { id: 'StructureChuteStraight', name: 'Straight' },
              { id: 'StructureChuteStraight3', name: 'Straight (3m)' },
              { id: 'StructureChuteStraight5', name: 'Straight (5m)' },
              { id: 'StructureChuteStraight10', name: 'Straight (10m)' },
              { id: 'StructureChuteCorner', name: 'Corner' },
              { id: 'StructureChuteJunction', name: 'T-Junction' },
              { id: 'StructureChuteFlipFlopSplitter', name: 'Flip-Flop Splitter' },
              { id: 'StructureChuteOutlet', name: 'Outlet' },
              { id: 'StructureChuteInlet', name: 'Inlet' },
              { id: 'StructureChuteBin', name: 'Bin' },
              { id: 'StructureChuteExportBin', name: 'Export Bin' },
              { id: 'StructureChuteValve', name: 'Valve' },
              { id: 'StructureChuteOverflow', name: 'Overflow' },
              { id: 'StructureChuteWindow', name: 'Window' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'cables',
    name: 'Cables',
    icon: '⚡',
    subcategories: [
      {
        id: 'normal-cables',
        name: 'Normal Cables',
        items: [
          {
            id: 'cable',
            name: 'Cable',
            category: 'cables',
            subcategory: 'normal-cables',
            variants: [
              { id: 'StructureCableStraight', name: 'Straight' },
              { id: 'StructureCableCorner', name: 'Corner' },
              { id: 'StructureCableCorner3', name: 'Corner (3-Way)' },
              { id: 'StructureCableCorner4', name: 'Corner (4-Way)' },
              { id: 'StructureCableJunction', name: 'T-Junction' },
              { id: 'StructureCableJunction4', name: 'Junction (4-Way)' },
              { id: 'StructureCableJunction5', name: 'Junction (5-Way)' },
              { id: 'StructureCableJunction6', name: 'Junction (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'heavy-cables',
        name: 'Heavy Cables',
        items: [
          {
            id: 'heavy-cable',
            name: 'Heavy Cable',
            category: 'cables',
            subcategory: 'heavy-cables',
            variants: [
              { id: 'StructureCableStraightH', name: 'Straight' },
              { id: 'StructureCableCornerH', name: 'Corner' },
              { id: 'StructureCableCornerH3', name: 'Corner (3-Way)' },
              { id: 'StructureCableCornerH4', name: 'Corner (4-Way)' },
              { id: 'StructureCableJunctionH', name: 'T-Junction' },
              { id: 'StructureCableJunctionH4', name: 'Junction (4-Way)' },
              { id: 'StructureCableJunctionH5', name: 'Junction (5-Way)' },
              { id: 'StructureCableJunctionH6', name: 'Junction (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'super-heavy-cables',
        name: 'Super Heavy Cables',
        items: [
          {
            id: 'super-heavy-cable',
            name: 'Super Heavy Cable',
            category: 'cables',
            subcategory: 'super-heavy-cables',
            variants: [
              { id: 'StructureCableSuperHeavyStraight', name: 'Straight' },
              { id: 'StructureCableSuperHeavyStraight3', name: 'Straight (3m)' },
              { id: 'StructureCableSuperHeavyStraight5', name: 'Straight (5m)' },
              { id: 'StructureCableSuperHeavyStraight10', name: 'Straight (10m)' },
              { id: 'StructureCableSuperHeavyCorner', name: 'Corner' },
              { id: 'StructureCableSuperHeavyCorner3', name: 'Corner (3-Way)' },
              { id: 'StructureCableSuperHeavyCorner4', name: 'Corner (4-Way)' },
              { id: 'StructureCableSuperHeavyJunction', name: 'T-Junction' },
              { id: 'StructureCableSuperHeavyJunction4', name: 'Junction (4-Way)' },
              { id: 'StructureCableSuperHeavyJunction5', name: 'Junction (5-Way)' },
              { id: 'StructureCableSuperHeavyJunction6', name: 'Junction (6-Way)' }
            ]
          }
        ]
      },
      {
        id: 'cable-utilities',
        name: 'Cable Utilities',
        items: [
          {
            id: 'cable-fuse',
            name: 'Cable Fuse',
            category: 'cables',
            subcategory: 'cable-utilities',
            variants: [
              { id: 'StructureCableFuse1k', name: 'Fuse (1kW)' },
              { id: 'StructureCableFuse5k', name: 'Fuse (5kW)' },
              { id: 'StructureCableFuse50k', name: 'Fuse (50kW)' },
              { id: 'StructureCableFuse100k', name: 'Fuse (100kW)' },
              { id: 'StructureCableFuse500k', name: 'Fuse (500kW)' }
            ]
          },
          {
            id: 'cable-analyzer',
            name: 'Cable Analyzer',
            category: 'cables',
            subcategory: 'cable-utilities',
            variants: [
              { id: 'StructureCableAnalysizer', name: 'Standard' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'devices',
    name: 'Devices',
    icon: '⚙',
    subcategories: [
      {
        id: 'power',
        name: 'Power',
        items: [
          {
            id: 'solar-panel',
            name: 'Solar Panel',
            category: 'devices',
            subcategory: 'power',
            variants: [
              { id: 'SolarPanel', name: 'Standard' },
              { id: 'SolarPanelHeavy', name: 'Heavy' }
            ]
          },
          {
            id: 'battery',
            name: 'Battery',
            category: 'devices',
            subcategory: 'power',
            variants: [
              { id: 'BatterySmall', name: 'Small' },
              { id: 'BatteryLarge', name: 'Large' }
            ]
          }
        ]
      },
      {
        id: 'atmospherics',
        name: 'Atmospherics',
        items: [
          {
            id: 'pipe-analyzer',
            name: 'Pipe Analyzer',
            category: 'devices',
            subcategory: 'atmospherics',
            variants: [
              { id: 'PipeAnalyzer', name: 'Standard' }
            ]
          },
          {
            id: 'active-vent',
            name: 'Active Vent',
            category: 'devices',
            subcategory: 'atmospherics',
            variants: [
              { id: 'ActiveVent', name: 'Standard' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'logic',
    name: 'Logic',
    icon: '◈',
    subcategories: [
      {
        id: 'chips',
        name: 'Chips',
        items: [
          {
            id: 'logic-chip',
            name: 'Logic Chip',
            category: 'logic',
            subcategory: 'chips',
            variants: [
              { id: 'CircuitboardLogic', name: 'Standard' }
            ]
          }
        ]
      }
    ]
  }
];

// Helper functions
export function getCategoryById(id: ItemCategory): CatalogCategory | undefined {
  return catalog.find(c => c.id === id);
}

export function getItemById(itemId: string): CatalogItem | undefined {
  for (const category of catalog) {
    for (const subcategory of category.subcategories) {
      const item = subcategory.items.find(i => i.id === itemId);
      if (item) return item;
    }
  }
  return undefined;
}

export function searchItems(query: string): CatalogItem[] {
  const results: CatalogItem[] = [];
  const lowerQuery = query.toLowerCase();

  for (const category of catalog) {
    for (const subcategory of category.subcategories) {
      for (const item of subcategory.items) {
        if (item.name.toLowerCase().includes(lowerQuery)) {
          results.push(item);
        }
      }
    }
  }

  return results;
}
