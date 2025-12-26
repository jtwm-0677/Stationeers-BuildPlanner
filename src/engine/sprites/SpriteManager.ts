/**
 * Sprite Manager - loads and manages game sprites
 */

import {
  type LoadedSprite,
  type SpriteDefinition,
  ALL_SPRITES
} from './types';

/**
 * Manages loading and caching of sprite images
 */
export class SpriteManager {
  private sprites: Map<string, LoadedSprite> = new Map();
  private loadPromises: Map<string, Promise<LoadedSprite>> = new Map();
  private basePath: string;

  constructor(basePath: string = '/sprites') {
    this.basePath = basePath;
  }

  /**
   * Load a single sprite
   */
  private loadSprite(definition: SpriteDefinition): Promise<LoadedSprite> {
    const key = definition.variant;

    // Return cached promise if already loading
    const existingPromise = this.loadPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Return cached sprite if already loaded
    const existing = this.sprites.get(key);
    if (existing?.loaded) {
      return Promise.resolve(existing);
    }

    // Create new load promise
    const promise = new Promise<LoadedSprite>((resolve, reject) => {
      const img = new Image();
      const sprite: LoadedSprite = {
        image: img,
        width: 0,
        height: 0,
        loaded: false
      };

      img.onload = () => {
        sprite.width = img.naturalWidth;
        sprite.height = img.naturalHeight;
        sprite.loaded = true;
        this.sprites.set(key, sprite);
        resolve(sprite);
      };

      img.onerror = () => {
        console.warn(`Failed to load sprite: ${definition.path}`);
        reject(new Error(`Failed to load sprite: ${definition.path}`));
      };

      // Construct path: basePath/category/filename
      img.src = `${this.basePath}/${definition.category}/${definition.path}`;
    });

    this.loadPromises.set(key, promise);
    return promise;
  }

  /**
   * Preload all sprites
   */
  async preloadAll(): Promise<void> {
    const promises = ALL_SPRITES.map(def => this.loadSprite(def).catch(() => null));
    await Promise.all(promises);
    console.log(`Loaded ${this.sprites.size} sprites`);
  }

  /**
   * Preload sprites for a specific category
   */
  async preloadCategory(definitions: SpriteDefinition[]): Promise<void> {
    const promises = definitions.map(def => this.loadSprite(def).catch(() => null));
    await Promise.all(promises);
  }

  /**
   * Get a loaded sprite by variant name
   */
  getSprite(variant: string): LoadedSprite | null {
    return this.sprites.get(variant) || null;
  }

  /**
   * Check if a sprite is loaded
   */
  hasSprite(variant: string): boolean {
    const sprite = this.sprites.get(variant);
    return sprite?.loaded ?? false;
  }

  /**
   * Get all loaded sprite variant names
   */
  getLoadedVariants(): string[] {
    return Array.from(this.sprites.keys()).filter(key =>
      this.sprites.get(key)?.loaded
    );
  }
}

// Global sprite manager instance
let globalSpriteManager: SpriteManager | null = null;

/**
 * Get or create the global sprite manager
 */
export function getSpriteManager(): SpriteManager {
  if (!globalSpriteManager) {
    globalSpriteManager = new SpriteManager();
  }
  return globalSpriteManager;
}

/**
 * Initialize sprite manager and preload all sprites
 */
export async function initializeSprites(): Promise<SpriteManager> {
  const manager = getSpriteManager();
  await manager.preloadAll();
  return manager;
}
