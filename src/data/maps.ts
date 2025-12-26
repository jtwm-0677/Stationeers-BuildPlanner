/**
 * Map and spawnpoint definitions for Stationeers worlds
 * Data extracted from game XML files
 */

import type { Grid3 } from '../engine';

export interface SpawnpointDefinition {
  id: string;
  name: string;
  coords: Grid3;        // In 0.1m units (Grid3)
  spawnRadius?: number; // In meters
}

export interface MapDefinition {
  id: string;
  name: string;
  difficulty: string;
  gravity: number;      // m/s^2 (negative = downward)
  spawnpoints: SpawnpointDefinition[];
}

/**
 * Convert meter coordinates to Grid3 units (0.1m per unit)
 */
function metersToUnits(x: number, y: number, z: number): Grid3 {
  return {
    x: x * 10,
    y: y * 10,
    z: z * 10
  };
}

/**
 * Available maps with real spawnpoint data from game
 */
export const MAPS: MapDefinition[] = [
  {
    id: 'Mars2',
    name: 'Mars',
    difficulty: 'Beginner',
    gravity: -3.7,
    spawnpoints: [
      { id: 'MarsSpawnCanyonOverlook', name: 'Canyon Overlook', coords: metersToUnits(-612, 0, 803), spawnRadius: 10 },
      { id: 'MarsSpawnButchersFlat', name: 'Butchers Flat', coords: metersToUnits(347, 0, -281), spawnRadius: 20 },
      { id: 'MarsSpawnFindersCanyon', name: 'Finders Canyon', coords: metersToUnits(-1405, 0, 32), spawnRadius: 15 },
      { id: 'MarsSpawnHellasCrags', name: 'Hellas Crags', coords: metersToUnits(-990, 0, -986), spawnRadius: 12 },
      { id: 'MarsSpawnDonutFlats', name: 'Donut Flats', coords: metersToUnits(1359, 0, -315), spawnRadius: 22 }
    ]
  },
  {
    id: 'Lunar',
    name: 'Moon',
    difficulty: 'Intermediate',
    gravity: -1.62,
    spawnpoints: [
      { id: 'LunarSpawnCraterVesper', name: 'Crater Vesper', coords: metersToUnits(1189, 0, 511), spawnRadius: 15 },
      { id: 'LunarSpawnMontesUmbrarum', name: 'Montes Umbrarum', coords: metersToUnits(-565, 0, 185), spawnRadius: 10 },
      { id: 'LunarSpawnCraterNox', name: 'Crater Nox', coords: metersToUnits(1065, 0, -830), spawnRadius: 12 },
      { id: 'LunarSpawnMonsArcanus', name: 'Mons Arcanus', coords: metersToUnits(-1302, 0, -705), spawnRadius: 16 }
    ]
  },
  {
    id: 'MimasHerschel',
    name: 'Mimas',
    difficulty: 'Intermediate',
    gravity: -0.97,
    spawnpoints: [
      { id: 'MimasSpawnCentralMesa', name: 'Central Mesa', coords: metersToUnits(584, 0, -632), spawnRadius: 18 },
      { id: 'MimasSpawnHarrietCrater', name: 'Harriet Crater', coords: metersToUnits(-852, 0, -542), spawnRadius: 13 },
      { id: 'MimasSpawnCraterField', name: 'Crater Field', coords: metersToUnits(352, 0, 498), spawnRadius: 12 },
      { id: 'MimasSpawnDustBowl', name: 'Dust Bowl', coords: metersToUnits(-1122, 0, 1161), spawnRadius: 16 }
    ]
  },
  {
    id: 'Europa3',
    name: 'Europa',
    difficulty: 'Challenging',
    gravity: -1.3,
    spawnpoints: [
      { id: 'EuropaSpawnIcyBasin', name: 'Icy Basin', coords: metersToUnits(145, 0, -503), spawnRadius: 20 },
      { id: 'EuropaSpawnGlacialChannel', name: 'Glacial Channel', coords: metersToUnits(1358, 0, -601), spawnRadius: 14 },
      { id: 'EuropaSpawnBalgatanPass', name: 'Balgatan Pass', coords: metersToUnits(-1076, 0, 445), spawnRadius: 16 },
      { id: 'EuropaSpawnFrigidHighlands', name: 'Frigid Highlands', coords: metersToUnits(-1424, 0, -602), spawnRadius: 13 },
      { id: 'EuropaSpawnTyreValley', name: 'Tyre Valley', coords: metersToUnits(1197, 0, 999), spawnRadius: 9 }
    ]
  },
  {
    id: 'Venus',
    name: 'Venus',
    difficulty: 'Extreme',
    gravity: -8.87,
    spawnpoints: [
      { id: 'VenusSpawnGaiaValley', name: 'Gaia Valley', coords: metersToUnits(361, 0, -940), spawnRadius: 15 },
      { id: 'VenusSpawnDaisyValley', name: 'Daisy Valley', coords: metersToUnits(-1309, 0, -406), spawnRadius: 10 },
      { id: 'VenusSpawnFaithValley', name: 'Faith Valley', coords: metersToUnits(-259, 0, 851), spawnRadius: 16 },
      { id: 'VenusSpawnDuskValley', name: 'Dusk Valley', coords: metersToUnits(793, 0, 36), spawnRadius: 14 }
    ]
  },
  {
    id: 'Vulcan2',
    name: 'Vulcan',
    difficulty: 'Extreme',
    gravity: -5.5,
    spawnpoints: [
      { id: 'VulcanSpawnVestaValley', name: 'Vesta Valley', coords: metersToUnits(-871, 0, -340), spawnRadius: 10 },
      { id: 'VulcanSpawnEtnasFury', name: 'Etnas Fury', coords: metersToUnits(31, 0, 481), spawnRadius: 10 },
      { id: 'VulcanSpawnIxionsDemise', name: 'Ixions Demise', coords: metersToUnits(998, 0, -634), spawnRadius: 9 },
      { id: 'VulcanSpawnTitusReach', name: 'Titus Reach', coords: metersToUnits(713, 0, 661), spawnRadius: 8 },
      { id: 'VulcanSpawnSerpentPlateau', name: 'Serpent Plateau', coords: metersToUnits(553, 0, -1014), spawnRadius: 8 },
      { id: 'VulcanSpawnKalimarOutlook', name: 'Kalimar Outlook', coords: metersToUnits(-170, 0, -550), spawnRadius: 10 },
      { id: 'VulcanSpawnTalonHeights', name: 'Talon Heights', coords: metersToUnits(-838, 0, 835), spawnRadius: 12 },
      { id: 'VulcanSpawnDusterPlateauNorth', name: 'Duster Plateau North', coords: metersToUnits(-687, 0, -894), spawnRadius: 10 },
      { id: 'VulcanSpawnCinderPeak', name: 'Cinder Peak', coords: metersToUnits(1275, 0, -1229), spawnRadius: 4 },
      { id: 'VulcanSpawnRedJunction', name: 'Red Junction', coords: metersToUnits(947, 0, -44), spawnRadius: 10 },
      { id: 'VulcanSpawnOrensTrack', name: 'Orens Track', coords: metersToUnits(1120, 0, 893), spawnRadius: 10 },
      { id: 'VulcanSpawnDogsfoot', name: 'Dogsfoot', coords: metersToUnits(-1252, 0, -788), spawnRadius: 10 }
    ]
  }
];

/**
 * Get map by ID
 */
export function getMapById(id: string): MapDefinition | undefined {
  return MAPS.find(m => m.id === id);
}

/**
 * Get spawnpoint by map and spawnpoint ID
 */
export function getSpawnpoint(mapId: string, spawnpointId: string): SpawnpointDefinition | undefined {
  const map = getMapById(mapId);
  return map?.spawnpoints.find(s => s.id === spawnpointId);
}

/**
 * Get first spawnpoint for a map (default spawn)
 */
export function getDefaultSpawnpoint(mapId: string): SpawnpointDefinition | undefined {
  const map = getMapById(mapId);
  return map?.spawnpoints[0];
}
