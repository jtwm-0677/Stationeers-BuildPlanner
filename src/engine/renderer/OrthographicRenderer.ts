/**
 * OrthographicRenderer - Renders GLB models from orthographic views (top, front, side)
 * Uses three.js to load GLB files and render them to 2D images
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type ViewAngle = 'top' | 'front' | 'back' | 'left' | 'right' | 'bottom';

export interface RenderOptions {
  /** Output image size in pixels (square) */
  size?: number;
  /** Background color (null for transparent) */
  backgroundColor?: string | null;
  /** Padding around the model (0-1, percentage of size) */
  padding?: number;
}

export interface RenderedViews {
  top: string;      // Data URL
  front: string;
  back: string;
  left: string;
  right: string;
  bottom: string;
}

const DEFAULT_OPTIONS: Required<RenderOptions> = {
  size: 128,
  backgroundColor: null,
  padding: 0.02  // Minimal padding - model fills most of frame
};

/**
 * Camera configurations for each view angle
 */
const CAMERA_CONFIGS: Record<ViewAngle, { position: THREE.Vector3; up: THREE.Vector3 }> = {
  top: {
    position: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, -1)
  },
  bottom: {
    position: new THREE.Vector3(0, -1, 0),
    up: new THREE.Vector3(0, 0, 1)
  },
  front: {
    position: new THREE.Vector3(0, 0, 1),
    up: new THREE.Vector3(0, 1, 0)
  },
  back: {
    position: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0)
  },
  left: {
    position: new THREE.Vector3(-1, 0, 0),
    up: new THREE.Vector3(0, 1, 0)
  },
  right: {
    position: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0)
  }
};

export class OrthographicRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private loader: GLTFLoader;
  private canvas: HTMLCanvasElement;

  // Cache for loaded models
  private modelCache: Map<string, THREE.Group> = new Map();

  constructor() {
    // Create offscreen canvas
    this.canvas = document.createElement('canvas');

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize orthographic camera (will be adjusted per render)
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    // Initialize loader
    this.loader = new GLTFLoader();

    // Add lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional lights from multiple angles for good coverage
    const directions = [
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(0, -1, 0)
    ];

    directions.forEach((dir, i) => {
      const light = new THREE.DirectionalLight(0xffffff, i === 2 ? 0.2 : 0.4);
      light.position.copy(dir.normalize().multiplyScalar(10));
      this.scene.add(light);
    });
  }

  /**
   * Load a GLB model from URL or file path
   */
  async loadModel(url: string): Promise<THREE.Group> {
    // Check cache
    if (this.modelCache.has(url)) {
      return this.modelCache.get(url)!.clone();
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Center the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          // Cache the original
          this.modelCache.set(url, model.clone());

          resolve(model);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load GLB: ${error}`));
        }
      );
    });
  }

  /**
   * Render a model from a specific view angle
   */
  renderView(
    model: THREE.Group,
    view: ViewAngle,
    options: RenderOptions = {}
  ): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Set canvas size
    this.canvas.width = opts.size;
    this.canvas.height = opts.size;
    this.renderer.setSize(opts.size, opts.size);

    // Clear scene and add model
    this.scene.children
      .filter(c => c.type === 'Group')
      .forEach(c => this.scene.remove(c));
    this.scene.add(model);

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model);
    const boxSize = box.getSize(new THREE.Vector3());

    // Get the relevant dimensions for this view (exclude the depth axis)
    let viewWidth: number, viewHeight: number;
    switch (view) {
      case 'top':
      case 'bottom':
        viewWidth = boxSize.x;
        viewHeight = boxSize.z;
        break;
      case 'front':
      case 'back':
        viewWidth = boxSize.x;
        viewHeight = boxSize.y;
        break;
      case 'left':
      case 'right':
        viewWidth = boxSize.z;
        viewHeight = boxSize.y;
        break;
    }

    // Use the larger of width/height to ensure model fits
    const maxViewDim = Math.max(viewWidth, viewHeight);

    // Configure camera for this view
    const config = CAMERA_CONFIGS[view];
    const frustumSize = maxViewDim * (1 + opts.padding * 2);
    const aspect = 1; // Square output

    // Calculate the depth dimension for camera positioning
    const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);

    this.camera.left = -frustumSize / 2;
    this.camera.right = frustumSize / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.near = 0.1;
    this.camera.far = maxDim * 10;
    this.camera.position.copy(config.position.clone().multiplyScalar(maxDim * 2));
    this.camera.up.copy(config.up);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    // Set background
    if (opts.backgroundColor) {
      this.scene.background = new THREE.Color(opts.backgroundColor);
    } else {
      this.scene.background = null;
    }

    // Render
    this.renderer.render(this.scene, this.camera);

    // Return as data URL
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Render all standard views of a model
   */
  async renderAllViews(
    modelUrl: string,
    options: RenderOptions = {}
  ): Promise<RenderedViews> {
    const model = await this.loadModel(modelUrl);

    return {
      top: this.renderView(model, 'top', options),
      front: this.renderView(model, 'front', options),
      back: this.renderView(model, 'back', options),
      left: this.renderView(model, 'left', options),
      right: this.renderView(model, 'right', options),
      bottom: this.renderView(model, 'bottom', options)
    };
  }

  /**
   * Render a single view of a model
   */
  async renderSingleView(
    modelUrl: string,
    view: ViewAngle,
    options: RenderOptions = {}
  ): Promise<string> {
    const model = await this.loadModel(modelUrl);
    return this.renderView(model, view, options);
  }

  /**
   * Render a model with custom rotation (for showing rotated placement)
   */
  async renderWithRotation(
    modelUrl: string,
    view: ViewAngle,
    rotation: { x: number; y: number; z: number },
    options: RenderOptions = {}
  ): Promise<string> {
    const model = await this.loadModel(modelUrl);

    // Apply rotation (in degrees)
    model.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z)
    );

    return this.renderView(model, view, options);
  }

  /**
   * Clear the model cache
   */
  clearCache(): void {
    this.modelCache.clear();
  }

  /**
   * Dispose of renderer resources
   */
  dispose(): void {
    this.renderer.dispose();
    this.modelCache.clear();
  }
}

// Singleton instance
let rendererInstance: OrthographicRenderer | null = null;

export function getOrthographicRenderer(): OrthographicRenderer {
  if (!rendererInstance) {
    rendererInstance = new OrthographicRenderer();
  }
  return rendererInstance;
}
