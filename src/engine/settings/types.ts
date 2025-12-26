/**
 * Grid display settings types
 */

export type GridVisibility = 'always' | 'never' | 'zoom-dependent' | 'context-dependent';

export interface GridLayerSettings {
  visibility: GridVisibility;
  minZoom: number;
  color: string;
  opacity: number;
  lineWidth: number;
}

export interface GridDisplaySettings {
  mainGrid: GridLayerSettings;
  smallGrid: GridLayerSettings;
}

/**
 * Default grid display settings
 */
export const DEFAULT_GRID_SETTINGS: GridDisplaySettings = {
  mainGrid: {
    visibility: 'always',
    minZoom: 0.5,
    color: '#2a3a4a',
    opacity: 1.0,
    lineWidth: 1
  },
  smallGrid: {
    visibility: 'zoom-dependent',
    minZoom: 1.0,
    color: '#1a2a3a',
    opacity: 0.5,
    lineWidth: 1
  }
};

/**
 * Load grid settings from localStorage
 */
export function loadGridSettings(): GridDisplaySettings {
  try {
    const stored = localStorage.getItem('gridDisplaySettings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load grid settings:', e);
  }
  return { ...DEFAULT_GRID_SETTINGS };
}

/**
 * Save grid settings to localStorage
 */
export function saveGridSettings(settings: GridDisplaySettings): void {
  try {
    localStorage.setItem('gridDisplaySettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save grid settings:', e);
  }
}
