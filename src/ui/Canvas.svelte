<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { GameObject, ViewType, GridDisplaySettings, SpriteManager } from '../engine';
  import {
    ObjectType,
    SteelFrameVariant,
    IronFrameVariant,
    WallFace,
    GridType,
    getGridTypeForObject,
    MAIN_GRID,
    SMALL_GRID,
    DEFAULT_GRID_SETTINGS,
    MATERIAL_TINTS
  } from '../engine';

  const dispatch = createEventDispatcher<{
    cellClick: { gridX: number; gridY: number; gridZ: number };
    cellRightClick: { gridX: number; gridY: number; gridZ: number };
  }>();

  // Props
  export let objects: GameObject[] = [];
  export let currentFloor: number = 0;
  export let currentView: ViewType = 'top';

  // Preview ghost props
  export let previewType: ObjectType | null = null;
  export let previewVariant: string | null = null;
  export let previewRotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  export let previewColor: string | null = null;
  export let previewFace: WallFace | null = null; // For wall preview

  // Grid display settings
  export let gridSettings: GridDisplaySettings = DEFAULT_GRID_SETTINGS;
  export let selectedGridType: GridType = GridType.Main;

  // Sprite manager for rendering game sprites
  export let spriteManager: SpriteManager | null = null;

  // Opacity for showing the floor below the current floor (0 = hidden, 1 = full)
  export let belowFloorOpacity: number = 0;

  let containerEl: HTMLDivElement;
  let terrainCanvas: HTMLCanvasElement;
  let gridCanvas: HTMLCanvasElement;
  let objectCanvas: HTMLCanvasElement;
  let overlayCanvas: HTMLCanvasElement;

  // Cached canvas contexts
  let gridCtx: CanvasRenderingContext2D | null = null;
  let objectCtx: CanvasRenderingContext2D | null = null;
  let overlayCtx: CanvasRenderingContext2D | null = null;

  // Hover position for preview ghost (in screen coords, null when not hovering)
  let hoverScreenX: number | null = null;
  let hoverScreenY: number | null = null;

  // Export canvas refs for future use (terrain overlay, selection highlight)
  export function getCanvases() {
    return { terrainCanvas, gridCanvas, objectCanvas, overlayCanvas };
  }

  // Canvas dimensions
  let width = 800;
  let height = 600;
  let lastWidth = 0;
  let lastHeight = 0;

  // Grid/zoom settings
  // Base size: 1 small grid cell (0.5m = 5 units) = 32px at zoom 1
  const BASE_UNIT_SIZE = 32 / SMALL_GRID;  // pixels per 0.1m unit at zoom 1
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;
  let zoom = 1;

  // Cell sizes at current zoom (in pixels)
  $: unitSize = BASE_UNIT_SIZE * zoom;                    // pixels per 0.1m unit
  $: smallCellSize = unitSize * SMALL_GRID;               // pixels per 0.5m cell
  $: mainCellSize = unitSize * MAIN_GRID;                 // pixels per 2m cell
  // Legacy alias for compatibility
  $: cellSize = mainCellSize;

  // Camera offset (center of view in grid coords)
  let cameraX = 0;
  let cameraY = 0;

  // Panning state
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartCameraX = 0;
  let panStartCameraY = 0;

  // Dirty flags for optimized rendering
  let gridDirty = true;
  let objectsDirty = true;
  let overlayDirty = true;
  let frameRequested = false;

  // Get origin position in screen coords (camera uses unitSize since coords are in 0.1m units)
  $: originScreenX = Math.floor(width / 2) - (cameraX * unitSize);
  $: originScreenY = Math.floor(height / 2) - (cameraY * unitSize);

  // Mark grid dirty when camera/zoom/settings changes
  $: if (zoom || cameraX || cameraY || gridSettings) {
    gridDirty = true;
    objectsDirty = true;
    scheduleRedraw();
  }

  // Mark objects dirty when objects, view, or floor opacity changes
  $: {
    // Reference all values to track changes
    objects;
    currentFloor;
    currentView;
    belowFloorOpacity;
    objectsDirty = true;
    scheduleRedraw();
  }

  // Mark overlay dirty when preview props or grid type change
  $: if (selectedGridType) {
    gridDirty = true;
    overlayDirty = true;
    scheduleRedraw();
  }

  // Mark overlay dirty when preview props change
  $: if (previewType || previewVariant || previewRotation || previewColor || previewFace) {
    overlayDirty = true;
    scheduleRedraw();
  }

  function scheduleRedraw() {
    if (!frameRequested && gridCanvas) {
      frameRequested = true;
      requestAnimationFrame(redraw);
    }
  }

  onMount(() => {
    // Cache contexts once
    gridCtx = gridCanvas?.getContext('2d') || null;
    objectCtx = objectCanvas?.getContext('2d') || null;
    overlayCtx = overlayCanvas?.getContext('2d') || null;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0 && (w !== width || h !== height)) {
          width = w;
          height = h;
          gridDirty = true;
          objectsDirty = true;
          scheduleRedraw();
        }
      }
    });

    resizeObserver.observe(containerEl);

    // Initial draw
    requestAnimationFrame(() => {
      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          width = Math.floor(rect.width);
          height = Math.floor(rect.height);
          gridDirty = true;
          objectsDirty = true;
          scheduleRedraw();
        }
      }
    });

    return () => resizeObserver.disconnect();
  });

  function redraw() {
    frameRequested = false;

    // Only resize canvas if dimensions changed
    if (width !== lastWidth || height !== lastHeight) {
      if (gridCanvas) {
        gridCanvas.width = width;
        gridCanvas.height = height;
      }
      if (objectCanvas) {
        objectCanvas.width = width;
        objectCanvas.height = height;
      }
      if (overlayCanvas) {
        overlayCanvas.width = width;
        overlayCanvas.height = height;
      }
      lastWidth = width;
      lastHeight = height;
      // Re-get contexts after resize
      gridCtx = gridCanvas?.getContext('2d') || null;
      objectCtx = objectCanvas?.getContext('2d') || null;
      overlayCtx = overlayCanvas?.getContext('2d') || null;
      gridDirty = true;
      objectsDirty = true;
      overlayDirty = true;
    }

    if (gridDirty) {
      drawGrid();
      gridDirty = false;
    }
    if (objectsDirty) {
      drawObjects();
      objectsDirty = false;
    }
    if (overlayDirty) {
      drawOverlay();
      overlayDirty = false;
    }
  }

  function shouldShowMainGrid(): boolean {
    const settings = gridSettings.mainGrid;
    if (settings.visibility === 'always') return true;
    if (settings.visibility === 'never') return false;
    if (settings.visibility === 'zoom-dependent') {
      return zoom >= settings.minZoom;
    }
    // context-dependent - always show main grid
    return zoom >= settings.minZoom;
  }

  function shouldShowSmallGrid(): boolean {
    const settings = gridSettings.smallGrid;
    if (settings.visibility === 'always') return true;
    if (settings.visibility === 'never') return false;
    if (settings.visibility === 'zoom-dependent') {
      return zoom >= settings.minZoom;
    }
    // context-dependent - show when placing small-grid objects
    const placingSmallGrid = selectedGridType === GridType.Small;
    return placingSmallGrid && zoom >= settings.minZoom;
  }

  function drawGrid() {
    if (!gridCtx) return;

    // Clear canvas
    gridCtx.fillStyle = '#12121f';
    gridCtx.fillRect(0, 0, width, height);

    const ctx = gridCtx;

    // Draw small grid first (underneath)
    if (shouldShowSmallGrid()) {
      const settings = gridSettings.smallGrid;
      ctx.strokeStyle = settings.color;
      ctx.lineWidth = settings.lineWidth;
      ctx.globalAlpha = settings.opacity;

      const offsetX = ((originScreenX % smallCellSize) + smallCellSize) % smallCellSize;
      const offsetY = ((originScreenY % smallCellSize) + smallCellSize) % smallCellSize;

      for (let x = offsetX; x <= width; x += smallCellSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }

      for (let y = offsetY; y <= height; y += smallCellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
    }

    // Draw main grid on top
    if (shouldShowMainGrid()) {
      const settings = gridSettings.mainGrid;
      ctx.strokeStyle = settings.color;
      ctx.lineWidth = settings.lineWidth;
      ctx.globalAlpha = settings.opacity;

      const offsetX = ((originScreenX % mainCellSize) + mainCellSize) % mainCellSize;
      const offsetY = ((originScreenY % mainCellSize) + mainCellSize) % mainCellSize;

      for (let x = offsetX; x <= width; x += mainCellSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }

      for (let y = offsetY; y <= height; y += mainCellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;

    // Origin marker
    if (originScreenX >= 0 && originScreenX <= width &&
        originScreenY >= 0 && originScreenY <= height) {
      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(originScreenX, originScreenY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originScreenX - 6, originScreenY);
      ctx.lineTo(originScreenX + 6, originScreenY);
      ctx.moveTo(originScreenX, originScreenY - 6);
      ctx.lineTo(originScreenX, originScreenY + 6);
      ctx.stroke();
    }
  }

  /**
   * Get the view projection for the current view
   * Returns: which object axis maps to screen X, screen Y, and which axis is the slice
   */
  function getViewProjection(): {
    filterAxis: 'x' | 'y' | 'z';
    screenXAxis: 'x' | 'y' | 'z';
    screenYAxis: 'x' | 'y' | 'z';
    flipX: boolean;
    flipY: boolean;
  } {
    switch (currentView) {
      case 'top':
        // Looking down: X-Z plane, Y is floor
        return { filterAxis: 'y', screenXAxis: 'x', screenYAxis: 'z', flipX: false, flipY: false };
      case 'north':
        // Looking south (from +Z): X-Y plane, Z is depth
        return { filterAxis: 'z', screenXAxis: 'x', screenYAxis: 'y', flipX: false, flipY: true };
      case 'south':
        // Looking north (from -Z): X-Y plane, Z is depth
        return { filterAxis: 'z', screenXAxis: 'x', screenYAxis: 'y', flipX: true, flipY: true };
      case 'east':
        // Looking west (from +X): Z-Y plane, X is depth
        return { filterAxis: 'x', screenXAxis: 'z', screenYAxis: 'y', flipX: true, flipY: true };
      case 'west':
        // Looking east (from -X): Z-Y plane, X is depth
        return { filterAxis: 'x', screenXAxis: 'z', screenYAxis: 'y', flipX: false, flipY: true };
      default:
        return { filterAxis: 'y', screenXAxis: 'x', screenYAxis: 'z', flipX: false, flipY: false };
    }
  }

  function drawObjects() {
    if (!objectCtx) return;

    // Clear canvas
    objectCtx.clearRect(0, 0, width, height);

    const ctx = objectCtx;
    const proj = getViewProjection();

    // Draw the floor below first if opacity > 0 (only for top-down view)
    if (belowFloorOpacity > 0 && currentView === 'top') {
      const belowFloor = currentFloor - 1; // One floor below (floor indices are 0, 1, 2...)

      const belowObjects = objects.filter(obj => obj.position[proj.filterAxis] === belowFloor);

      ctx.save();
      ctx.globalAlpha = belowFloorOpacity;

      for (const obj of belowObjects) {
        let gridX = obj.position[proj.screenXAxis];
        let gridY = obj.position[proj.screenYAxis];

        if (proj.flipX) gridX = -gridX;
        if (proj.flipY) gridY = -gridY;

        const objGridType = getGridTypeForObject(obj.type);
        const objCellSize = objGridType === GridType.Small ? smallCellSize : mainCellSize;

        const baseX = originScreenX + (gridX * unitSize);
        const baseY = originScreenY + (gridY * unitSize);
        const screenX = objGridType === GridType.Small ? baseX - objCellSize / 2 : baseX;
        const screenY = objGridType === GridType.Small ? baseY - objCellSize / 2 : baseY;

        if (screenX < -objCellSize || screenX > width + objCellSize ||
            screenY < -objCellSize || screenY > height + objCellSize) {
          continue;
        }

        drawObject(ctx, obj, screenX, screenY, objCellSize);
      }

      ctx.restore();
    }

    // Filter objects on current slice (floor/depth depending on view)
    const sliceObjects = objects.filter(obj => obj.position[proj.filterAxis] === currentFloor);

    for (const obj of sliceObjects) {
      // Get screen coordinates based on view projection
      // Positions are in 0.1m units, so multiply by unitSize
      let gridX = obj.position[proj.screenXAxis];
      let gridY = obj.position[proj.screenYAxis];

      if (proj.flipX) gridX = -gridX;
      if (proj.flipY) gridY = -gridY;

      // Get visual size based on object's grid type
      const objGridType = getGridTypeForObject(obj.type);
      const objCellSize = objGridType === GridType.Small ? smallCellSize : mainCellSize;

      // Calculate screen position - center small grid objects on their position
      // (pipes are at grid intersections, not cell centers)
      const baseX = originScreenX + (gridX * unitSize);
      const baseY = originScreenY + (gridY * unitSize);
      const screenX = objGridType === GridType.Small ? baseX - objCellSize / 2 : baseX;
      const screenY = objGridType === GridType.Small ? baseY - objCellSize / 2 : baseY;

      // Skip if off screen
      if (screenX < -objCellSize || screenX > width + objCellSize ||
          screenY < -objCellSize || screenY > height + objCellSize) {
        continue;
      }

      drawObject(ctx, obj, screenX, screenY, objCellSize);
    }
  }

  /**
   * Try to draw an object using its sprite image
   * Returns true if sprite was drawn, false if fallback needed
   *
   * NOTE: Currently disabled - game icons are isometric 3D views,
   * not suitable for 2D top-down/side-view planner. Using procedural
   * rendering instead until proper 2D sprites are created.
   */
  function tryDrawSprite(_ctx: CanvasRenderingContext2D, _obj: GameObject, _x: number, _y: number, _objCellSize: number): boolean {
    // Disabled - use procedural rendering for now
    return false;

    /* Original sprite rendering code - kept for future use with proper sprites
    if (!spriteManager) return false;

    const sprite = spriteManager.getSprite(obj.variant);
    if (!sprite || !sprite.loaded) return false;

    const centerX = x + objCellSize / 2;
    const centerY = y + objCellSize / 2;

    ctx.save();

    // Translate to center, rotate, then draw centered
    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation.y * Math.PI) / 180);

    // Draw sprite centered at origin (which is now at centerX, centerY)
    const drawSize = objCellSize * 0.95; // Slightly smaller to show grid
    ctx.drawImage(
      sprite.image,
      -drawSize / 2,
      -drawSize / 2,
      drawSize,
      drawSize
    );

    ctx.restore();
    return true;
    */
  }

  function drawObject(ctx: CanvasRenderingContext2D, obj: GameObject, x: number, y: number, objCellSize: number) {
    // Try to draw using sprite first
    if (tryDrawSprite(ctx, obj, x, y, objCellSize)) {
      return;
    }

    // Fallback to procedural drawing
    const padding = 2 * zoom;
    const size = objCellSize - padding * 2;
    const centerX = x + objCellSize / 2;
    const centerY = y + objCellSize / 2;

    // Route to appropriate draw function based on object type
    switch (obj.type) {
      case ObjectType.Frame:
        drawFrame(ctx, obj, x, y, padding, size, objCellSize);
        break;
      case ObjectType.Pipe:
        drawPipe(ctx, obj, x, y, centerX, centerY, objCellSize);
        break;
      case ObjectType.Cable:
        drawCable(ctx, obj, x, y, centerX, centerY, objCellSize);
        break;
      case ObjectType.Chute:
        drawChute(ctx, obj, x, y, padding, size, objCellSize);
        break;
      case ObjectType.Wall:
        drawWall(ctx, obj, x, y, padding, size, objCellSize);
        break;
      default:
        // Fallback - gray square
        ctx.fillStyle = '#666666';
        ctx.fillRect(x + padding, y + padding, size, size);
    }
  }

  function drawFrame(ctx: CanvasRenderingContext2D, obj: GameObject, x: number, y: number, padding: number, size: number, objCellSize: number) {
    const centerX = x + objCellSize / 2;
    const centerY = y + objCellSize / 2;
    const isIron = obj.variant.startsWith('StructureFrameIron');

    // Try sprite-based rendering first
    if (spriteManager) {
      const sprite = spriteManager.getSprite(obj.variant);
      if (sprite && sprite.loaded) {
        ctx.save();

        // Move to center for rotation
        ctx.translate(centerX, centerY);
        ctx.rotate((obj.rotation.y * Math.PI) / 180);

        // Draw the sprite centered (0.98 = fine border around frame)
        const drawSize = objCellSize * 0.98;
        ctx.drawImage(
          sprite.image,
          -drawSize / 2,
          -drawSize / 2,
          drawSize,
          drawSize
        );

        // Apply material tint with multiply blend mode
        ctx.globalCompositeOperation = 'multiply';
        const tintColor = obj.color
          ? getPaintColor(obj.color)
          : (isIron ? MATERIAL_TINTS.iron : MATERIAL_TINTS.steel);
        ctx.fillStyle = tintColor;
        ctx.fillRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);

        ctx.restore();
        return;
      }
    }

    // Fallback to procedural rendering if no sprite available
    let fillColor = '#5a8a5a'; // Default green for steel frames
    let strokeColor = '#3a6a3a';

    if (isIron) {
      fillColor = '#8a7a5a';
      strokeColor = '#6a5a3a';
    }

    // Apply paint color if set
    if (obj.color) {
      fillColor = getPaintColor(obj.color);
      strokeColor = darkenColor(fillColor);
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1, 2 * zoom);

    const halfSize = size / 2;

    // Draw based on variant
    if (obj.variant === SteelFrameVariant.Standard ||
        obj.variant === IronFrameVariant.Standard) {
      // Standard frame - square (rotation doesn't matter)
      ctx.fillRect(x + padding, y + padding, size, size);
      ctx.strokeRect(x + padding, y + padding, size, size);
    } else if (obj.variant === SteelFrameVariant.Corner) {
      // Corner - L shape, rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-halfSize, -halfSize);
      ctx.lineTo(halfSize, -halfSize);
      ctx.lineTo(halfSize, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, halfSize);
      ctx.lineTo(-halfSize, halfSize);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (obj.variant === SteelFrameVariant.Side) {
      // Side - half, rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.fillRect(-halfSize, -halfSize, size, halfSize);
      ctx.strokeRect(-halfSize, -halfSize, size, halfSize);
      ctx.restore();
    } else if (obj.variant === SteelFrameVariant.CornerCut) {
      // Corner cut - square with corner cut off, rotates
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-halfSize, -halfSize);
      ctx.lineTo(halfSize, -halfSize);
      ctx.lineTo(halfSize, halfSize);
      ctx.lineTo(0, halfSize);
      ctx.lineTo(-halfSize, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      // Default square
      ctx.fillRect(x + padding, y + padding, size, size);
      ctx.strokeRect(x + padding, y + padding, size, size);
    }
  }

  /**
   * Draw a wall/panel based on current view and which face it's attached to
   * - Top view: Top/Bottom faces as fills, N/S/E/W faces as edge lines
   * - Side views: Show walls visible from that angle
   */
  function drawWall(ctx: CanvasRenderingContext2D, obj: GameObject, x: number, y: number, padding: number, size: number, objCellSize: number) {
    const face = obj.face;
    if (!face) return; // No face specified, can't render

    // Determine wall color based on variant
    const isIron = obj.variant.includes('Iron');
    const isWindow = obj.variant.includes('Window');
    const isDoor = obj.variant.includes('Door') || obj.variant.includes('Airlock');

    let fillColor: string;
    let strokeColor: string;

    if (isWindow) {
      fillColor = '#6090b0'; // Blue-ish for glass
      strokeColor = '#4070a0';
    } else if (isDoor) {
      fillColor = '#707080'; // Gray for doors
      strokeColor = '#505060';
    } else if (isIron) {
      fillColor = '#8a7a5a'; // Brown for iron
      strokeColor = '#6a5a3a';
    } else {
      fillColor = '#707a80'; // Steel gray
      strokeColor = '#505a60';
    }

    // Apply paint color if set
    if (obj.color) {
      fillColor = getPaintColor(obj.color);
      strokeColor = darkenColor(fillColor);
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1, 2 * zoom);

    const wallThickness = objCellSize * 0.12; // Thin line for wall edges

    // Determine how to render based on current view and wall face
    const proj = getViewProjection();

    // Check if this wall face is visible/relevant for current view
    const faceVisibility = getWallFaceVisibility(face, currentView);

    if (faceVisibility === 'fill') {
      // Wall fills the cell (floor/ceiling in top view, or back wall in side view)
      ctx.fillRect(x + padding, y + padding, size, size);
      ctx.strokeRect(x + padding, y + padding, size, size);

      // Add a pattern for doors/windows
      if (isWindow) {
        ctx.fillStyle = 'rgba(100, 180, 220, 0.3)';
        ctx.fillRect(x + padding + size * 0.2, y + padding + size * 0.2, size * 0.6, size * 0.6);
      } else if (isDoor) {
        ctx.strokeStyle = '#404050';
        ctx.beginPath();
        ctx.moveTo(x + objCellSize / 2, y + padding);
        ctx.lineTo(x + objCellSize / 2, y + padding + size);
        ctx.stroke();
        ctx.strokeStyle = strokeColor;
      }
    } else if (faceVisibility === 'edge') {
      // Wall renders as line on edge of cell
      const edge = getWallEdgePosition(face, currentView);

      switch (edge) {
        case 'top':
          ctx.fillRect(x, y, objCellSize, wallThickness);
          break;
        case 'bottom':
          ctx.fillRect(x, y + objCellSize - wallThickness, objCellSize, wallThickness);
          break;
        case 'left':
          ctx.fillRect(x, y, wallThickness, objCellSize);
          break;
        case 'right':
          ctx.fillRect(x + objCellSize - wallThickness, y, wallThickness, objCellSize);
          break;
      }
    }
    // If faceVisibility === 'hidden', don't render at all
  }

  /**
   * Determine how a wall face should be rendered in the current view
   * Returns: 'fill' (full cell), 'edge' (line on edge), or 'hidden'
   */
  function getWallFaceVisibility(face: WallFace, view: ViewType): 'fill' | 'edge' | 'hidden' {
    switch (view) {
      case 'top':
        // Looking down - Top/Bottom are fills, N/S/E/W are edges
        if (face === WallFace.Top || face === WallFace.Bottom) return 'fill';
        return 'edge';

      case 'north':
        // Looking from +Z towards -Z (south)
        if (face === WallFace.South) return 'fill'; // Back wall visible
        if (face === WallFace.North) return 'hidden'; // Front wall behind us
        if (face === WallFace.Top || face === WallFace.Bottom) return 'edge';
        if (face === WallFace.East || face === WallFace.West) return 'edge';
        return 'hidden';

      case 'south':
        // Looking from -Z towards +Z (north)
        if (face === WallFace.North) return 'fill';
        if (face === WallFace.South) return 'hidden';
        if (face === WallFace.Top || face === WallFace.Bottom) return 'edge';
        if (face === WallFace.East || face === WallFace.West) return 'edge';
        return 'hidden';

      case 'east':
        // Looking from +X towards -X (west)
        if (face === WallFace.West) return 'fill';
        if (face === WallFace.East) return 'hidden';
        if (face === WallFace.Top || face === WallFace.Bottom) return 'edge';
        if (face === WallFace.North || face === WallFace.South) return 'edge';
        return 'hidden';

      case 'west':
        // Looking from -X towards +X (east)
        if (face === WallFace.East) return 'fill';
        if (face === WallFace.West) return 'hidden';
        if (face === WallFace.Top || face === WallFace.Bottom) return 'edge';
        if (face === WallFace.North || face === WallFace.South) return 'edge';
        return 'hidden';

      default:
        return 'hidden';
    }
  }

  /**
   * Get which edge of the cell a wall should be drawn on
   */
  function getWallEdgePosition(face: WallFace, view: ViewType): 'top' | 'bottom' | 'left' | 'right' {
    switch (view) {
      case 'top':
        // Top view: N=top, S=bottom, E=right, W=left
        if (face === WallFace.North) return 'top';
        if (face === WallFace.South) return 'bottom';
        if (face === WallFace.East) return 'right';
        if (face === WallFace.West) return 'left';
        break;

      case 'north':
        // North view (looking south): E=left (flipped), W=right, Top=top, Bottom=bottom
        if (face === WallFace.East) return 'left';
        if (face === WallFace.West) return 'right';
        if (face === WallFace.Top) return 'top';
        if (face === WallFace.Bottom) return 'bottom';
        break;

      case 'south':
        // South view (looking north): E=right, W=left, Top=top, Bottom=bottom
        if (face === WallFace.East) return 'right';
        if (face === WallFace.West) return 'left';
        if (face === WallFace.Top) return 'top';
        if (face === WallFace.Bottom) return 'bottom';
        break;

      case 'east':
        // East view (looking west): N=right, S=left, Top=top, Bottom=bottom
        if (face === WallFace.North) return 'right';
        if (face === WallFace.South) return 'left';
        if (face === WallFace.Top) return 'top';
        if (face === WallFace.Bottom) return 'bottom';
        break;

      case 'west':
        // West view (looking east): N=left, S=right, Top=top, Bottom=bottom
        if (face === WallFace.North) return 'left';
        if (face === WallFace.South) return 'right';
        if (face === WallFace.Top) return 'top';
        if (face === WallFace.Bottom) return 'bottom';
        break;
    }
    return 'top'; // Default fallback
  }

  function drawPipe(ctx: CanvasRenderingContext2D, obj: GameObject, x: number, y: number, centerX: number, centerY: number, objCellSize: number) {
    const pipeRadius = objCellSize * 0.25;
    const isLiquid = obj.variant.includes('Liquid');
    const isInsulated = obj.variant.includes('Insulated');
    const length = getObjectLength(obj.variant);

    // Distinct colors: Gas = orange/copper, Liquid = cyan/blue, Insulated = darker versions
    let fillColor: string;
    let strokeColor: string;

    if (isLiquid) {
      // Liquid pipes: cyan/teal
      fillColor = isInsulated ? '#306080' : '#40b0d0';
      strokeColor = isInsulated ? '#204060' : '#2090b0';
    } else {
      // Gas pipes: orange/copper
      fillColor = isInsulated ? '#806040' : '#d09050';
      strokeColor = isInsulated ? '#604030' : '#a07040';
    }

    // Apply paint color if set
    if (obj.color) {
      fillColor = getPaintColor(obj.color);
      strokeColor = darkenColor(fillColor);
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1, 2 * zoom);

    // Draw connection stubs based on variant
    const stubWidth = pipeRadius * 1.2;

    if (obj.variant.includes('Straight')) {
      // Multi-cell straight pipe - use view-aware direction
      const dir = getObjectScreenDirection(obj.rotation);

      if (dir.isDepth) {
        // Object extends into depth - draw as circle (cross-section)
        ctx.beginPath();
        ctx.arc(centerX, centerY, pipeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (length === 1) {
        // Single cell - draw based on neighbors or rotation
        const autoOrient = getAutoOrientation(obj.position, obj.slot);
        const isHorizontal = autoOrient === 'horizontal' ||
          (autoOrient === null && (obj.rotation.y === 0 || obj.rotation.y === 180));

        ctx.beginPath();
        ctx.arc(centerX, centerY, pipeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Draw stubs based on orientation
        if (isHorizontal) {
          ctx.fillRect(x, centerY - stubWidth / 2, objCellSize, stubWidth);
          ctx.strokeRect(x, centerY - stubWidth / 2, objCellSize, stubWidth);
        } else {
          ctx.fillRect(centerX - stubWidth / 2, y, stubWidth, objCellSize);
          ctx.strokeRect(centerX - stubWidth / 2, y, stubWidth, objCellSize);
        }
      } else {
        // Object extends across screen - draw full length
        const totalLength = objCellSize * length;
        let startX = x;
        let startY = y;

        if (dir.dx < 0) startX = x - (length - 1) * objCellSize;
        if (dir.dy < 0) startY = y - (length - 1) * objCellSize;

        if (dir.dx !== 0) {
          // Horizontal pipe
          ctx.fillRect(startX, centerY - stubWidth / 2, totalLength, stubWidth);
          ctx.strokeRect(startX, centerY - stubWidth / 2, totalLength, stubWidth);
          ctx.beginPath();
          ctx.arc(startX + pipeRadius, centerY, pipeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(startX + totalLength - pipeRadius, centerY, pipeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Vertical pipe
          ctx.fillRect(centerX - stubWidth / 2, startY, stubWidth, totalLength);
          ctx.strokeRect(centerX - stubWidth / 2, startY, stubWidth, totalLength);
          ctx.beginPath();
          ctx.arc(centerX, startY + pipeRadius, pipeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(centerX, startY + totalLength - pipeRadius, pipeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    } else if (obj.variant.includes('Corner')) {
      // Corner pipe - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      // Draw center circle
      ctx.beginPath();
      ctx.arc(0, 0, pipeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Two stubs: right and down (relative to rotation)
      ctx.fillRect(0, -stubWidth / 2, objCellSize / 2, stubWidth);
      ctx.fillRect(-stubWidth / 2, 0, stubWidth, objCellSize / 2);
      ctx.restore();
    } else if (obj.variant.includes('TJunction')) {
      // T-Junction - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      // Draw center circle
      ctx.beginPath();
      ctx.arc(0, 0, pipeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Three stubs: left, right, down (relative to rotation)
      ctx.fillRect(-objCellSize / 2, -stubWidth / 2, objCellSize, stubWidth);
      ctx.fillRect(-stubWidth / 2, 0, stubWidth, objCellSize / 2);
      ctx.restore();
    } else if (obj.variant.includes('Cross')) {
      // Cross junction - 4+ way, rotation less important but still apply
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      // Draw center circle
      ctx.beginPath();
      ctx.arc(0, 0, pipeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Four stubs
      ctx.fillRect(-objCellSize / 2, -stubWidth / 2, objCellSize, stubWidth);
      ctx.fillRect(-stubWidth / 2, -objCellSize / 2, stubWidth, objCellSize);
      ctx.restore();
    } else {
      // Default: single cell - draw based on neighbors or rotation
      // Check for neighbors to auto-connect
      const autoOrient = getAutoOrientation(obj.position, obj.slot);
      const isHorizontal = autoOrient === 'horizontal' ||
        (autoOrient === null && (obj.rotation.y === 0 || obj.rotation.y === 180));

      ctx.beginPath();
      ctx.arc(centerX, centerY, pipeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Draw stubs based on orientation
      if (isHorizontal) {
        // Horizontal
        ctx.fillRect(x, centerY - stubWidth / 2, objCellSize, stubWidth);
        ctx.strokeRect(x, centerY - stubWidth / 2, objCellSize, stubWidth);
      } else {
        // Vertical
        ctx.fillRect(centerX - stubWidth / 2, y, stubWidth, objCellSize);
        ctx.strokeRect(centerX - stubWidth / 2, y, stubWidth, objCellSize);
      }
    }
  }

  // Helper to draw parallel stripe on heavy/super-heavy cables
  function drawCableStripe(
    ctx: CanvasRenderingContext2D,
    stripeColor: string,
    thickness: number,
    path: { type: 'line', x1: number, y1: number, x2: number, y2: number } |
          { type: 'corner', cx: number, cy: number, radius: number, rotation: number } |
          { type: 'circle', cx: number, cy: number, radius: number }
  ) {
    ctx.save();
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = thickness * 0.2;
    ctx.lineCap = 'butt';
    const dashSize = thickness * 0.6;
    ctx.setLineDash([dashSize, dashSize]);

    if (path.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(path.x1, path.y1);
      ctx.lineTo(path.x2, path.y2);
      ctx.stroke();
    } else if (path.type === 'corner') {
      ctx.translate(path.cx, path.cy);
      ctx.rotate((path.rotation * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(path.radius, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, path.radius);
      ctx.stroke();
    } else if (path.type === 'circle') {
      // For depth view - draw X pattern on the node
      ctx.setLineDash([]);
      ctx.lineWidth = thickness * 0.15;
      ctx.beginPath();
      ctx.moveTo(path.cx - path.radius * 0.5, path.cy - path.radius * 0.5);
      ctx.lineTo(path.cx + path.radius * 0.5, path.cy + path.radius * 0.5);
      ctx.moveTo(path.cx + path.radius * 0.5, path.cy - path.radius * 0.5);
      ctx.lineTo(path.cx - path.radius * 0.5, path.cy + path.radius * 0.5);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawCable(ctx: CanvasRenderingContext2D, obj: GameObject, x: number, y: number, centerX: number, centerY: number, objCellSize: number) {
    // Determine cable tier by variant name
    const isSuperHeavy = obj.variant.includes('SuperHeavy');
    const isHeavy = obj.variant.includes('H') && !isSuperHeavy;
    const length = getObjectLength(obj.variant);

    // Cable thickness based on tier
    const thickness = isSuperHeavy ? objCellSize * 0.28 : isHeavy ? objCellSize * 0.22 : objCellSize * 0.12;

    // All cables are red by default - tiers distinguished by thickness and stripes
    let strokeColor = '#c04040';

    // Stripe color: white for super-heavy, black for heavy
    const stripeColor = isSuperHeavy ? '#ffffff' : isHeavy ? '#000000' : null;

    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineWidth = thickness;

    // Draw based on variant pattern
    if (obj.variant.includes('Straight')) {
      // Multi-cell straight cable - use view-aware direction
      const dir = getObjectScreenDirection(obj.rotation);

      if (dir.isDepth) {
        // Object extends into depth - draw as node (cross-section)
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, thickness * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Draw stripe pattern on depth node
        if (stripeColor) {
          drawCableStripe(ctx, stripeColor, thickness, { type: 'circle', cx: centerX, cy: centerY, radius: thickness * 0.8 });
        }
      } else if (length === 1) {
        // Single cell - draw based on neighbors or rotation
        const autoOrient = getAutoOrientation(obj.position, obj.slot);
        const isHorizontal = autoOrient === 'horizontal' ||
          (autoOrient === null && (obj.rotation.y === 0 || obj.rotation.y === 180));

        if (isHorizontal) {
          ctx.beginPath();
          ctx.moveTo(x, centerY);
          ctx.lineTo(x + objCellSize, centerY);
          ctx.stroke();
          if (stripeColor) {
            drawCableStripe(ctx, stripeColor, thickness, { type: 'line', x1: x, y1: centerY, x2: x + objCellSize, y2: centerY });
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(centerX, y);
          ctx.lineTo(centerX, y + objCellSize);
          ctx.stroke();
          if (stripeColor) {
            drawCableStripe(ctx, stripeColor, thickness, { type: 'line', x1: centerX, y1: y, x2: centerX, y2: y + objCellSize });
          }
        }
        // Draw center node
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, thickness * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Object extends across screen - draw full length
        const totalLength = objCellSize * length;
        let startX = x;
        let startY = y;

        if (dir.dx < 0) startX = x - (length - 1) * objCellSize;
        if (dir.dy < 0) startY = y - (length - 1) * objCellSize;

        if (dir.dx !== 0) {
          // Horizontal cable
          ctx.beginPath();
          ctx.moveTo(startX, centerY);
          ctx.lineTo(startX + totalLength, centerY);
          ctx.stroke();
          if (stripeColor) {
            drawCableStripe(ctx, stripeColor, thickness, { type: 'line', x1: startX, y1: centerY, x2: startX + totalLength, y2: centerY });
          }
          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(startX + thickness / 2, centerY, thickness * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(startX + totalLength - thickness / 2, centerY, thickness * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Vertical cable
          ctx.beginPath();
          ctx.moveTo(centerX, startY);
          ctx.lineTo(centerX, startY + totalLength);
          ctx.stroke();
          if (stripeColor) {
            drawCableStripe(ctx, stripeColor, thickness, { type: 'line', x1: centerX, y1: startY, x2: centerX, y2: startY + totalLength });
          }
          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(centerX, startY + thickness / 2, thickness * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(centerX, startY + totalLength - thickness / 2, thickness * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (obj.variant.includes('Corner') && !obj.variant.includes('Corner3') && !obj.variant.includes('Corner4')) {
      // Corner cable - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(objCellSize / 2, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, objCellSize / 2);
      ctx.stroke();
      ctx.restore();
      // Draw stripe on corner
      if (stripeColor) {
        drawCableStripe(ctx, stripeColor, thickness, { type: 'corner', cx: centerX, cy: centerY, radius: objCellSize / 2, rotation: obj.rotation.y });
      }
      // Draw center node
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, thickness * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.variant.includes('Junction') || obj.variant.includes('Corner3') || obj.variant.includes('Corner4')) {
      // T or cross junction - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-objCellSize / 2, 0);
      ctx.lineTo(objCellSize / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, objCellSize / 2);
      ctx.stroke();
      ctx.restore();
      // Draw stripes on junction arms (parallel dashed)
      if (stripeColor) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((obj.rotation.y * Math.PI) / 180);
        ctx.strokeStyle = stripeColor;
        ctx.lineWidth = thickness * 0.2;
        ctx.lineCap = 'butt';
        const dashSize = thickness * 0.6;
        ctx.setLineDash([dashSize, dashSize]);
        // Horizontal arm
        ctx.beginPath();
        ctx.moveTo(-objCellSize / 2, 0);
        ctx.lineTo(objCellSize / 2, 0);
        ctx.stroke();
        // Vertical arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, objCellSize / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      // Draw center node
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, thickness * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default: single cell - draw based on neighbors or rotation
      const autoOrient = getAutoOrientation(obj.position, obj.slot);
      const isHorizontal = autoOrient === 'horizontal' ||
        (autoOrient === null && (obj.rotation.y === 0 || obj.rotation.y === 180));

      if (isHorizontal) {
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x + objCellSize, centerY);
        ctx.stroke();
        if (stripeColor) {
          drawCableStripe(ctx, stripeColor, thickness, { type: 'line', x1: x, y1: centerY, x2: x + objCellSize, y2: centerY });
        }
      } else {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y + objCellSize);
        ctx.stroke();
        if (stripeColor) {
          drawCableStripe(ctx, stripeColor, thickness, { type: 'line', x1: centerX, y1: y, x2: centerX, y2: y + objCellSize });
        }
      }
      // Draw center node
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, thickness * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawChute(ctx: CanvasRenderingContext2D, obj: GameObject, x: number, y: number, padding: number, size: number, objCellSize: number) {
    const centerX = x + objCellSize / 2;
    const centerY = y + objCellSize / 2;
    const length = getObjectLength(obj.variant);

    // Chutes: brownish/tan color
    let fillColor = '#a08060';
    let strokeColor = '#806040';

    // Apply paint color if set
    if (obj.color) {
      fillColor = getPaintColor(obj.color);
      strokeColor = darkenColor(fillColor);
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1, 2 * zoom);

    const chuteWidth = objCellSize * 0.4;

    if (obj.variant.includes('Straight')) {
      // Multi-cell straight chute - use view-aware direction
      const dir = getObjectScreenDirection(obj.rotation);

      if (dir.isDepth) {
        // Object extends into depth - draw as square (cross-section)
        ctx.fillRect(centerX - chuteWidth / 2, centerY - chuteWidth / 2, chuteWidth, chuteWidth);
        ctx.strokeRect(centerX - chuteWidth / 2, centerY - chuteWidth / 2, chuteWidth, chuteWidth);
      } else if (length === 1) {
        // Single cell - draw based on neighbors or rotation
        const autoOrient = getAutoOrientation(obj.position, obj.slot);
        const isHorizontal = autoOrient === 'horizontal' ||
          (autoOrient === null && (obj.rotation.y === 0 || obj.rotation.y === 180));

        if (isHorizontal) {
          // Horizontal chute
          ctx.fillRect(x, centerY - chuteWidth / 2, objCellSize, chuteWidth);
          ctx.strokeRect(x, centerY - chuteWidth / 2, objCellSize, chuteWidth);
        } else {
          // Vertical chute
          ctx.fillRect(centerX - chuteWidth / 2, y, chuteWidth, objCellSize);
          ctx.strokeRect(centerX - chuteWidth / 2, y, chuteWidth, objCellSize);
        }
      } else {
        // Object extends across screen - draw full length
        const totalLength = objCellSize * length;
        let startX = x;
        let startY = y;

        if (dir.dx < 0) startX = x - (length - 1) * objCellSize;
        if (dir.dy < 0) startY = y - (length - 1) * objCellSize;

        if (dir.dx !== 0) {
          // Horizontal chute
          ctx.fillRect(startX, centerY - chuteWidth / 2, totalLength, chuteWidth);
          ctx.strokeRect(startX, centerY - chuteWidth / 2, totalLength, chuteWidth);
          ctx.beginPath();
          ctx.arc(startX + chuteWidth / 2, centerY, chuteWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(startX + totalLength - chuteWidth / 2, centerY, chuteWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Vertical chute
          ctx.fillRect(centerX - chuteWidth / 2, startY, chuteWidth, totalLength);
          ctx.strokeRect(centerX - chuteWidth / 2, startY, chuteWidth, totalLength);
          ctx.beginPath();
          ctx.arc(centerX, startY + chuteWidth / 2, chuteWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(centerX, startY + totalLength - chuteWidth / 2, chuteWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    } else if (obj.variant.includes('Corner')) {
      // L-shaped chute - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-chuteWidth / 2, -objCellSize / 2);
      ctx.lineTo(chuteWidth / 2, -objCellSize / 2);
      ctx.lineTo(chuteWidth / 2, -chuteWidth / 2);
      ctx.lineTo(objCellSize / 2, -chuteWidth / 2);
      ctx.lineTo(objCellSize / 2, chuteWidth / 2);
      ctx.lineTo(-chuteWidth / 2, chuteWidth / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (obj.variant.includes('Junction') || obj.variant.includes('FlipFlop')) {
      // T-shaped junction - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      // Vertical part
      ctx.fillRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      ctx.strokeRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      // Horizontal branch (right side)
      ctx.fillRect(0, -chuteWidth / 2, objCellSize / 2, chuteWidth);
      ctx.strokeRect(0, -chuteWidth / 2, objCellSize / 2, chuteWidth);
      // Center indicator for FlipFlop
      if (obj.variant.includes('FlipFlop')) {
        ctx.beginPath();
        ctx.moveTo(-chuteWidth / 4, -chuteWidth / 4);
        ctx.lineTo(chuteWidth / 4, 0);
        ctx.lineTo(-chuteWidth / 4, chuteWidth / 4);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    } else if (obj.variant.includes('Valve')) {
      // Valve - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.fillRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      ctx.strokeRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      // Valve handle (horizontal bar)
      ctx.fillRect(-chuteWidth, -2, chuteWidth * 2, 4);
      ctx.strokeRect(-chuteWidth, -2, chuteWidth * 2, 4);
      ctx.restore();
    } else if (obj.variant.includes('Overflow')) {
      // Overflow - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.fillRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      ctx.strokeRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      // Overflow arrows pointing outward
      ctx.beginPath();
      ctx.moveTo(0, -chuteWidth / 2);
      ctx.lineTo(-chuteWidth / 3, -chuteWidth / 4);
      ctx.moveTo(0, -chuteWidth / 2);
      ctx.lineTo(chuteWidth / 3, -chuteWidth / 4);
      ctx.stroke();
      ctx.restore();
    } else if (obj.variant.includes('Window')) {
      // Window - rotates based on Y rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation.y * Math.PI) / 180);
      ctx.fillRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      ctx.strokeRect(-chuteWidth / 2, -objCellSize / 2, chuteWidth, objCellSize);
      // Window rectangle
      ctx.fillStyle = '#6090a0';
      ctx.fillRect(-chuteWidth / 3, -chuteWidth / 3, chuteWidth * 0.66, chuteWidth * 0.66);
      ctx.strokeRect(-chuteWidth / 3, -chuteWidth / 3, chuteWidth * 0.66, chuteWidth * 0.66);
      ctx.fillStyle = fillColor;
      ctx.restore();
    } else if (obj.variant.includes('Bin') || obj.variant.includes('Outlet') || obj.variant.includes('Inlet')) {
      // Box shape with opening indicator
      ctx.fillRect(x + padding * 2, y + padding * 2, size - padding * 2, size - padding * 2);
      ctx.strokeRect(x + padding * 2, y + padding * 2, size - padding * 2, size - padding * 2);
      // Inner circle/opening
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      // Direction arrow for inlet/outlet
      if (obj.variant.includes('Inlet')) {
        ctx.beginPath();
        ctx.moveTo(centerX, y + padding * 3);
        ctx.lineTo(centerX, centerY - size * 0.1);
        ctx.stroke();
      } else if (obj.variant.includes('Outlet')) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + size * 0.1);
        ctx.lineTo(centerX, y + size - padding);
        ctx.stroke();
      }
    } else {
      // Default: rectangle
      ctx.fillRect(x + padding, y + padding, size, size);
      ctx.strokeRect(x + padding, y + padding, size, size);
    }
  }

  function getPaintColor(color: string): string {
    const colors: Record<string, string> = {
      black: '#333333',
      blue: '#4a7ab8',
      brown: '#8b5a2b',
      green: '#4a8a4a',
      grey: '#7a7a7a',
      khaki: '#b8a870',
      orange: '#d87030',
      pink: '#d870a0',
      purple: '#8a50a0',
      red: '#c04040',
      white: '#e8e8e8',
      yellow: '#d8c030'
    };
    return colors[color] || '#5a8a5a';
  }

  function darkenColor(hex: string): string {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Parse variant name to get object length in cells
   * e.g., StructurePipeStraight5 -> 5, StructureChuteStraight10 -> 10
   */
  function getObjectLength(variant: string): number {
    // Check for multi-cell variants ending in 3, 5, or 10
    const match = variant.match(/Straight(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 1;
  }

  /**
   * Get the world-space direction vector for multi-cell objects based on rotation
   * Returns which 3D axis the object extends along
   */
  function getObjectWorldDirection(rotation: { x: number; y: number; z: number }): { axis: 'x' | 'y' | 'z'; sign: 1 | -1 } {
    const yRot = rotation.y;
    // Y rotation controls horizontal direction
    // 0° = extends along +X, 90° = extends along +Z
    // 180° = extends along -X, 270° = extends along -Z
    switch (yRot) {
      case 0:
        return { axis: 'x', sign: 1 };
      case 90:
        return { axis: 'z', sign: 1 };
      case 180:
        return { axis: 'x', sign: -1 };
      case 270:
        return { axis: 'z', sign: -1 };
      default:
        return { axis: 'x', sign: 1 };
    }
  }

  /**
   * Get the screen-space direction for multi-cell objects based on rotation AND current view
   * Returns screen direction (dx, dy) and whether object extends into depth (not visible in this view)
   */
  function getObjectScreenDirection(rotation: { x: number; y: number; z: number }): { dx: number; dy: number; isDepth: boolean } {
    const worldDir = getObjectWorldDirection(rotation);
    const proj = getViewProjection();

    // If the object extends along the filter axis (depth), it's not visible as multi-cell
    if (worldDir.axis === proj.filterAxis) {
      return { dx: 0, dy: 0, isDepth: true };
    }

    // Map world axis to screen axis
    let dx = 0;
    let dy = 0;

    if (worldDir.axis === proj.screenXAxis) {
      dx = worldDir.sign;
      if (proj.flipX) dx = -dx;
    } else if (worldDir.axis === proj.screenYAxis) {
      dy = worldDir.sign;
      if (proj.flipY) dy = -dy;
    }

    return { dx, dy, isDepth: false };
  }

  // Keep old function for overlay (which always uses top view logic for preview)
  function getObjectDirection(rotation: { x: number; y: number; z: number }): { dx: number; dy: number } {
    const yRot = rotation.y;
    switch (yRot) {
      case 0:
        return { dx: 1, dy: 0 };
      case 90:
        return { dx: 0, dy: 1 };
      case 180:
        return { dx: -1, dy: 0 };
      case 270:
        return { dx: 0, dy: -1 };
      default:
        return { dx: 1, dy: 0 };
    }
  }

  /**
   * Check for compatible neighbors around a position for auto-connection
   * Returns which directions (in screen space) have compatible connections
   */
  function getNeighborConnections(
    position: { x: number; y: number; z: number },
    slot: string
  ): { left: boolean; right: boolean; up: boolean; down: boolean } {
    const proj = getViewProjection();
    const connections = { left: false, right: false, up: false, down: false };

    for (const obj of objects) {
      // Must be same slot type (pipe with pipe, cable with cable, etc.)
      if (obj.slot !== slot) continue;

      // Must be on same depth slice
      if (obj.position[proj.filterAxis] !== position[proj.filterAxis]) continue;

      // Calculate the screen offset from position to neighbor
      let offsetX = obj.position[proj.screenXAxis] - (position as any)[proj.screenXAxis];
      let offsetY = obj.position[proj.screenYAxis] - (position as any)[proj.screenYAxis];

      if (proj.flipX) offsetX = -offsetX;
      if (proj.flipY) offsetY = -offsetY;

      // Check for adjacent
      if (offsetX === 1 && offsetY === 0) connections.right = true;
      if (offsetX === -1 && offsetY === 0) connections.left = true;
      if (offsetX === 0 && offsetY === 1) connections.down = true;
      if (offsetX === 0 && offsetY === -1) connections.up = true;
    }

    return connections;
  }

  /**
   * Determine best orientation for a single-cell straight object based on neighbors
   * Returns 'horizontal', 'vertical', or null (use default rotation)
   */
  function getAutoOrientation(
    position: { x: number; y: number; z: number },
    slot: string
  ): 'horizontal' | 'vertical' | null {
    const neighbors = getNeighborConnections(position, slot);
    const hasHorizontal = neighbors.left || neighbors.right;
    const hasVertical = neighbors.up || neighbors.down;

    if (hasHorizontal && !hasVertical) return 'horizontal';
    if (hasVertical && !hasHorizontal) return 'vertical';
    // If both or neither, return null to use default rotation
    return null;
  }

  /**
   * Draw the overlay layer (preview ghost, selection highlights, etc.)
   */
  function drawOverlay() {
    if (!overlayCtx) return;

    // Clear overlay
    overlayCtx.clearRect(0, 0, width, height);

    // Draw preview ghost if we have hover position and a preview type
    if (hoverScreenX !== null && hoverScreenY !== null && previewType && previewVariant) {
      // Get the grid type for this object type
      const previewGridType = getGridTypeForObject(previewType);
      const previewCellSize = previewGridType === GridType.Small ? smallCellSize : mainCellSize;
      const gridStep = previewGridType === GridType.Small ? SMALL_GRID : MAIN_GRID;

      // Convert screen coordinates directly to units (0.1m increments)
      const unitsX = (hoverScreenX - originScreenX) / unitSize;
      const unitsY = (hoverScreenY - originScreenY) / unitSize;

      // Snap to appropriate grid
      // Small grid: use round() for intersection snapping (25 positions per main cell)
      // Main grid: use floor() for cell snapping (frames occupy cells)
      const snapFn = previewGridType === GridType.Small ? Math.round : Math.floor;
      const snappedGridX = snapFn(unitsX / gridStep) * gridStep;
      const snappedGridY = snapFn(unitsY / gridStep) * gridStep;

      // Screen position for drawing
      // Small grid objects (pipes) are centered on grid intersections
      // Main grid objects (frames) are placed at cell corners
      const baseScreenX = originScreenX + (snappedGridX * unitSize);
      const baseScreenY = originScreenY + (snappedGridY * unitSize);
      const snappedX = previewGridType === GridType.Small ? baseScreenX - previewCellSize / 2 : baseScreenX;
      const snappedY = previewGridType === GridType.Small ? baseScreenY - previewCellSize / 2 : baseScreenY;

      // Apply view projection to get 3D coordinates
      const proj = getViewProjection();
      let screen2dX = snappedGridX;
      let screen2dY = snappedGridY;

      // Unflip if needed (inverse of what rendering does)
      if (proj.flipX) screen2dX = -screen2dX;
      if (proj.flipY) screen2dY = -screen2dY;

      // Map to 3D coordinates based on view
      const ghostPosition = { x: 0, y: 0, z: 0 };
      ghostPosition[proj.filterAxis as 'x' | 'y' | 'z'] = currentFloor;
      ghostPosition[proj.screenXAxis as 'x' | 'y' | 'z'] = screen2dX;
      ghostPosition[proj.screenYAxis as 'x' | 'y' | 'z'] = screen2dY;

      // Determine slot type based on preview type
      let ghostSlot: string = 'structural';
      if (previewType === ObjectType.Pipe) ghostSlot = 'pipe';
      else if (previewType === ObjectType.Cable) ghostSlot = 'cable';
      else if (previewType === ObjectType.Chute) ghostSlot = 'chute';

      // Draw ghost with transparency
      overlayCtx.save();
      overlayCtx.globalAlpha = 0.5;

      // Create a temporary object for drawing with actual grid position
      const ghostObj: GameObject = {
        id: 'preview',
        type: previewType,
        variant: previewVariant,
        position: ghostPosition,
        rotation: previewRotation,
        color: previewColor as any,
        collisionType: 0,
        slot: ghostSlot as any,
        face: previewType === ObjectType.Wall ? previewFace ?? undefined : undefined
      };

      drawObject(overlayCtx, ghostObj, snappedX, snappedY, previewCellSize);

      overlayCtx.restore();

      // Draw grid cell highlight(s) based on object length
      const length = getObjectLength(previewVariant);
      const dir = getObjectDirection(previewRotation);

      overlayCtx.strokeStyle = '#00ff00';
      overlayCtx.lineWidth = 2;

      if (length === 1) {
        // Single cell highlight
        overlayCtx.strokeRect(snappedX + 1, snappedY + 1, previewCellSize - 2, previewCellSize - 2);
      } else {
        // Multi-cell highlight
        let startX = snappedX;
        let startY = snappedY;

        if (dir.dx < 0) startX = snappedX - (length - 1) * previewCellSize;
        if (dir.dy < 0) startY = snappedY - (length - 1) * previewCellSize;

        const highlightWidth = dir.dx !== 0 ? previewCellSize * length : previewCellSize;
        const highlightHeight = dir.dy !== 0 ? previewCellSize * length : previewCellSize;

        overlayCtx.strokeRect(startX + 1, startY + 1, highlightWidth - 2, highlightHeight - 2);
      }
    }
  }

  /**
   * Convert screen coordinates to 2D grid position (for zoom centering)
   */
  function screenToGrid2D(screenX: number, screenY: number): { x: number; y: number } {
    const x = Math.floor((screenX - originScreenX) / cellSize);
    const y = Math.floor((screenY - originScreenY) / cellSize);
    return { x, y };
  }

  /**
   * Convert screen coordinates to 3D grid coordinates based on current view
   * Snaps to the appropriate grid based on selected grid type
   * Small grid: round() for intersection snapping (pipes at grid lines)
   * Main grid: floor() for cell snapping (frames occupy cells)
   */
  function screenToGrid3D(screenX: number, screenY: number): { gridX: number; gridY: number; gridZ: number } {
    const proj = getViewProjection();

    // Get the grid step size based on selected grid type
    const gridStep = selectedGridType === GridType.Small ? SMALL_GRID : MAIN_GRID;

    // Convert screen to units (0.1m), then snap to grid
    const unitsX = (screenX - originScreenX) / unitSize;
    const unitsY = (screenY - originScreenY) / unitSize;

    // Small grid uses round() (intersection), main grid uses floor() (cell)
    const snapFn = selectedGridType === GridType.Small ? Math.round : Math.floor;
    let grid2dX = snapFn(unitsX / gridStep) * gridStep;
    let grid2dY = snapFn(unitsY / gridStep) * gridStep;

    // Unflip if needed
    if (proj.flipX) grid2dX = -grid2dX;
    if (proj.flipY) grid2dY = -grid2dY;

    // Map back to 3D coordinates
    const result = { gridX: 0, gridY: 0, gridZ: 0 };

    // The filter axis gets the currentFloor value
    result[`grid${proj.filterAxis.toUpperCase()}` as 'gridX' | 'gridY' | 'gridZ'] = currentFloor;

    // The screen X axis maps to its corresponding 3D axis
    result[`grid${proj.screenXAxis.toUpperCase()}` as 'gridX' | 'gridY' | 'gridZ'] = grid2dX;

    // The screen Y axis maps to its corresponding 3D axis
    result[`grid${proj.screenYAxis.toUpperCase()}` as 'gridX' | 'gridY' | 'gridZ'] = grid2dY;

    return result;
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();

    const rect = containerEl.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Get grid position under cursor before zoom
    const gridBefore = screenToGrid2D(mouseX, mouseY);

    // Adjust zoom
    const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomDelta));

    if (newZoom !== zoom) {
      zoom = newZoom;

      // Adjust camera to keep the grid position under cursor
      // This makes zoom feel centered on the mouse
      const newUnitSize = BASE_UNIT_SIZE * zoom;
      const newOriginX = mouseX - (gridBefore.x * newUnitSize);
      const newOriginY = mouseY - (gridBefore.y * newUnitSize);

      cameraX = (Math.floor(width / 2) - newOriginX) / newUnitSize;
      cameraY = (Math.floor(height / 2) - newOriginY) / newUnitSize;
    }
  }

  function handleClick(event: MouseEvent) {
    // Don't place if we were panning
    if (isPanning) return;

    const rect = containerEl.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    const coords = screenToGrid3D(screenX, screenY);

    dispatch('cellClick', coords);
  }

  function handleMouseDown(event: MouseEvent) {
    // Middle mouse button (button 1)
    if (event.button === 1) {
      event.preventDefault();
      isPanning = true;
      panStartX = event.clientX;
      panStartY = event.clientY;
      panStartCameraX = cameraX;
      panStartCameraY = cameraY;
      containerEl.style.cursor = 'grabbing';
    }
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = containerEl.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Update hover position for preview ghost
    if (hoverScreenX !== screenX || hoverScreenY !== screenY) {
      hoverScreenX = screenX;
      hoverScreenY = screenY;
      overlayDirty = true;
      scheduleRedraw();
    }

    if (!isPanning) return;

    const deltaX = event.clientX - panStartX;
    const deltaY = event.clientY - panStartY;

    // Convert pixel delta to units (camera is in 0.1m units)
    const newCameraX = panStartCameraX - (deltaX / unitSize);
    const newCameraY = panStartCameraY - (deltaY / unitSize);

    // Only update if camera actually moved (reduces reactive triggers)
    if (newCameraX !== cameraX || newCameraY !== cameraY) {
      cameraX = newCameraX;
      cameraY = newCameraY;
    }
  }

  function handleMouseUp(event: MouseEvent) {
    if (event.button === 1 && isPanning) {
      isPanning = false;
      containerEl.style.cursor = 'crosshair';
    }
  }

  function handleMouseLeave() {
    if (isPanning) {
      isPanning = false;
      containerEl.style.cursor = 'crosshair';
    }

    // Clear hover position to hide preview ghost
    if (hoverScreenX !== null || hoverScreenY !== null) {
      hoverScreenX = null;
      hoverScreenY = null;
      overlayDirty = true;
      scheduleRedraw();
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();

    const rect = containerEl.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    const coords = screenToGrid3D(screenX, screenY);

    dispatch('cellRightClick', coords);
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  class="canvas-container"
  bind:this={containerEl}
  on:click={handleClick}
  on:wheel={handleWheel}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseLeave}
  on:contextmenu={handleContextMenu}
  on:keydown={() => {}}
  role="application"
  tabindex="0"
>
  <canvas
    bind:this={terrainCanvas}
    {width}
    {height}
    class="canvas-layer terrain-layer"
  ></canvas>
  <canvas
    bind:this={gridCanvas}
    {width}
    {height}
    class="canvas-layer grid-layer"
  ></canvas>
  <canvas
    bind:this={objectCanvas}
    {width}
    {height}
    class="canvas-layer object-layer"
  ></canvas>
  <canvas
    bind:this={overlayCanvas}
    {width}
    {height}
    class="canvas-layer overlay-layer"
  ></canvas>
</div>

<style>
  .canvas-container {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: #0d0d1a;
    overflow: hidden;
    cursor: crosshair;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
  }

  .terrain-layer {
    z-index: 1;
  }

  .grid-layer {
    z-index: 2;
  }

  .object-layer {
    z-index: 3;
  }

  .overlay-layer {
    z-index: 4;
    pointer-events: none;
  }
</style>
