<script lang="ts">
  import { onMount } from 'svelte';
  import { Toolbar, LeftPanel, RightPanel, Canvas, Modal, RendererTest } from './ui';
  import {
    Project,
    PlaceObjectCommand,
    RemoveObjectCommand,
    createSteelFrame,
    createIronFrame,
    createSteelWall,
    createIronWall,
    createWindow,
    createDoor,
    createGasPipe,
    createLiquidPipe,
    createInsulatedGasPipe,
    createInsulatedLiquidPipe,
    createChute,
    createCable,
    createHeavyCable,
    createSuperHeavyCable,
    grid3,
    SteelFrameVariant,
    IronFrameVariant,
    SteelWallVariant,
    IronWallVariant,
    WindowVariant,
    DoorVariant,
    WallFace,
    GasPipeVariant,
    LiquidPipeVariant,
    InsulatedGasPipeVariant,
    InsulatedLiquidPipeVariant,
    ChuteVariant,
    CableVariant,
    HeavyCableVariant,
    SuperHeavyCableVariant,
    PaintColor,
    ObjectType,
    GridType,
    getGridTypeForObject,
    type GameObject,
    type Rotation,
    type ViewType,
    type SpriteManager,
    rotation,
    normalizeAngle,
    quickLoad,
    getStoredProjects,
    loadProject,
    saveProject as saveToStorage,
    initializeSprites
  } from './engine';
  import { getItemById } from './data';

  // Create project
  let project = Project.create('New Base');
  let grid = project.getGrid();
  let commands = project.getCommandStack();
  let currentProjectId: string | null = null;

  // Editor state
  let currentFloor = 0;
  let currentView: ViewType = 'top';
  let selectedItemId: string = 'steel-frame';
  let selectedVariantId: string = SteelFrameVariant.Standard;
  let currentRotation: Rotation = rotation();
  let selectedColor: PaintColor | null = null;
  let selectedFace: WallFace = WallFace.North; // For walls - which face to attach to
  let objects: GameObject[] = [];
  let belowFloorOpacity: number = 0; // Opacity for showing floor below current (0-1)

  // Face order for cycling through wall faces
  const FACE_ORDER: WallFace[] = [
    WallFace.North,
    WallFace.East,
    WallFace.South,
    WallFace.West,
    WallFace.Top,
    WallFace.Bottom
  ];

  // Modal state
  let showSaveModal = false;
  let showOpenModal = false;
  let saveProjectName = '';
  let storedProjectsList: Array<{ id: string; name: string; modified: string }> = [];

  // Sprite manager for rendering game sprites
  let spriteManager: SpriteManager | null = null;

  // Test mode (F2 to toggle)
  let showRendererTest = false;

  // Try to load last project on start
  function tryLoadLastProject() {
    const data = quickLoad();
    if (data) {
      project = Project.import(data);
      grid = project.getGrid();
      commands = project.getCommandStack();
      refreshObjects();
    }
  }

  // Update objects array when grid changes
  function refreshObjects() {
    objects = grid.getAllObjects();
  }

  // Get ObjectType from selected item ID for preview ghost
  function getPreviewType(itemId: string): ObjectType | null {
    switch (itemId) {
      case 'steel-frame':
      case 'iron-frame':
        return ObjectType.Frame;
      case 'steel-wall':
      case 'iron-wall':
      case 'window':
      case 'door':
      case 'airlock':
        return ObjectType.Wall;
      case 'pipe-gas':
      case 'pipe-liquid':
      case 'pipe-insulated-gas':
      case 'pipe-insulated-liquid':
        return ObjectType.Pipe;
      case 'cable':
      case 'heavy-cable':
      case 'super-heavy-cable':
        return ObjectType.Cable;
      case 'chute':
        return ObjectType.Chute;
      default:
        return null;
    }
  }

  // Reactive preview type - explicitly depend on selectedItemId
  $: previewType = getPreviewType(selectedItemId);

  // Derived grid type based on current preview object
  $: selectedGridType = previewType ? getGridTypeForObject(previewType) : GridType.Main;

  function handleCellClick(event: CustomEvent<{ gridX: number; gridY: number; gridZ: number }>) {
    const { gridX, gridY, gridZ } = event.detail;
    const position = grid3(gridX, gridY, gridZ);

    // Get the selected item from catalog
    const item = getItemById(selectedItemId);
    if (!item) return;

    // Create the appropriate object based on item type
    let newObject: GameObject | null = null;

    switch (selectedItemId) {
      // Frames
      case 'steel-frame':
        newObject = createSteelFrame(
          position,
          selectedVariantId as SteelFrameVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'iron-frame':
        newObject = createIronFrame(
          position,
          selectedVariantId as IronFrameVariant,
          currentRotation,
          selectedColor
        );
        break;

      // Walls
      case 'steel-wall':
        newObject = createSteelWall(
          position,
          selectedFace,
          selectedVariantId as SteelWallVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'iron-wall':
        newObject = createIronWall(
          position,
          selectedFace,
          selectedVariantId as IronWallVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'window':
        newObject = createWindow(
          position,
          selectedFace,
          selectedVariantId as WindowVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'door':
      case 'airlock':
        newObject = createDoor(
          position,
          selectedFace,
          selectedVariantId as DoorVariant,
          currentRotation,
          selectedColor
        );
        break;

      // Pipes
      case 'pipe-gas':
        newObject = createGasPipe(
          position,
          selectedVariantId as GasPipeVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'pipe-liquid':
        newObject = createLiquidPipe(
          position,
          selectedVariantId as LiquidPipeVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'pipe-insulated-gas':
        newObject = createInsulatedGasPipe(
          position,
          selectedVariantId as InsulatedGasPipeVariant,
          currentRotation,
          selectedColor
        );
        break;
      case 'pipe-insulated-liquid':
        newObject = createInsulatedLiquidPipe(
          position,
          selectedVariantId as InsulatedLiquidPipeVariant,
          currentRotation,
          selectedColor
        );
        break;

      // Chutes
      case 'chute':
        newObject = createChute(
          position,
          selectedVariantId as ChuteVariant,
          currentRotation,
          selectedColor
        );
        break;

      // Cables
      case 'cable':
        newObject = createCable(
          position,
          selectedVariantId as CableVariant,
          currentRotation
        );
        break;
      case 'heavy-cable':
        newObject = createHeavyCable(
          position,
          selectedVariantId as HeavyCableVariant,
          currentRotation
        );
        break;
      case 'super-heavy-cable':
        newObject = createSuperHeavyCable(
          position,
          selectedVariantId as SuperHeavyCableVariant,
          currentRotation
        );
        break;

      default:
        console.warn(`No factory for item: ${selectedItemId}`);
        return;
    }

    if (!newObject) return;

    // Execute place command
    const cmd = new PlaceObjectCommand(grid, newObject);
    commands.execute(cmd);

    refreshObjects();
  }

  function handleCellRightClick(event: CustomEvent<{ gridX: number; gridY: number; gridZ: number }>) {
    const { gridX, gridY, gridZ } = event.detail;
    const position = grid3(gridX, gridY, gridZ);

    // Get objects at this position
    const objectsAtPos = grid.getObjectsAt(position);

    // Remove the last placed object (most recent) at this position
    const objectToRemove = objectsAtPos[objectsAtPos.length - 1];

    if (objectToRemove) {
      const cmd = new RemoveObjectCommand(grid, objectToRemove.id, `Remove ${objectToRemove.variant}`);
      commands.execute(cmd);
      refreshObjects();
    }
  }

  function handleItemSelect(event: CustomEvent<{ itemId: string; variantId: string }>) {
    selectedItemId = event.detail.itemId;
    selectedVariantId = event.detail.variantId;
  }

  function handleColorSelect(color: string | null) {
    selectedColor = color as PaintColor | null;
  }

  function handleFloorChange(delta: number) {
    currentFloor += delta;
  }

  function handleUndo() {
    if (commands.undo()) {
      refreshObjects();
    }
  }

  function handleRedo() {
    if (commands.redo()) {
      refreshObjects();
    }
  }

  function handleNewProject() {
    if (project.isDirty) {
      if (!window.confirm('You have unsaved changes. Create new project anyway?')) {
        return;
      }
    }
    project = Project.create('New Base');
    grid = project.getGrid();
    commands = project.getCommandStack();
    currentProjectId = null;
    currentFloor = 0;
    refreshObjects();
  }

  function handleSaveProject() {
    saveProjectName = project.metadata.name;
    showSaveModal = true;
  }

  function confirmSave() {
    if (saveProjectName.trim()) {
      project.setMetadata({ name: saveProjectName.trim() });
    }

    const data = project.export();
    currentProjectId = saveToStorage(data, currentProjectId || undefined);
    project.markSaved();
    showSaveModal = false;
  }

  function handleOpenProject() {
    const projects = getStoredProjects();
    storedProjectsList = projects.map(p => ({
      id: p.id,
      name: p.name,
      modified: p.modified
    }));
    showOpenModal = true;
  }

  function selectProject(projectId: string) {
    const data = loadProject(projectId);
    if (data) {
      project = Project.import(data);
      grid = project.getGrid();
      commands = project.getCommandStack();
      currentProjectId = projectId;
      currentFloor = 0;
      refreshObjects();
    }
    showOpenModal = false;
  }

  function handleImportFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.stbase,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (project.isDirty) {
          if (!window.confirm('You have unsaved changes. Import anyway?')) {
            return;
          }
        }

        project = Project.import(data);
        grid = project.getGrid();
        commands = project.getCommandStack();
        currentProjectId = null; // Imported files get new ID on save
        currentFloor = 0;
        refreshObjects();
        alert(`Imported "${data.metadata.name}"`);
      } catch (err) {
        alert('Failed to import project. Make sure it\'s a valid project file.');
        console.error('Import error:', err);
      }
    };
    input.click();
  }

  function handleExportFile() {
    const data = project.export();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/x-stationeers-base' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.metadata.name.replace(/[^a-z0-9]/gi, '_')}.stbase`;
    a.click();

    URL.revokeObjectURL(url);
  }

  // Rotation keybinds (matching Stationeers)
  function handleKeyDown(event: KeyboardEvent) {
    let handled = true;

    switch (event.key) {
      // X axis - Insert/Delete
      case 'Insert':
        currentRotation = { ...currentRotation, x: normalizeAngle(currentRotation.x + 90) };
        break;
      case 'Delete':
        currentRotation = { ...currentRotation, x: normalizeAngle(currentRotation.x - 90) };
        break;

      // Y axis - Home/End
      case 'Home':
        currentRotation = { ...currentRotation, y: normalizeAngle(currentRotation.y + 90) };
        break;
      case 'End':
        currentRotation = { ...currentRotation, y: normalizeAngle(currentRotation.y - 90) };
        break;

      // Z axis - PageUp/PageDown
      case 'PageUp':
        currentRotation = { ...currentRotation, z: normalizeAngle(currentRotation.z + 90) };
        break;
      case 'PageDown':
        currentRotation = { ...currentRotation, z: normalizeAngle(currentRotation.z - 90) };
        break;

      // Undo/Redo/Save
      case 'z':
        if (event.ctrlKey) {
          handleUndo();
        } else {
          handled = false;
        }
        break;
      case 'y':
        if (event.ctrlKey) {
          handleRedo();
        } else {
          handled = false;
        }
        break;
      case 's':
        if (event.ctrlKey) {
          handleSaveProject();
        } else {
          handled = false;
        }
        break;

      // F2 - Toggle renderer test
      case 'F2':
        showRendererTest = !showRendererTest;
        break;

      // C - Cycle wall face (for wall/door/window placement)
      case 'c':
      case 'C':
        if (previewType === ObjectType.Wall) {
          const currentIndex = FACE_ORDER.indexOf(selectedFace);
          const direction = event.shiftKey ? -1 : 1;
          const newIndex = (currentIndex + direction + FACE_ORDER.length) % FACE_ORDER.length;
          selectedFace = FACE_ORDER[newIndex];
        } else {
          handled = false;
        }
        break;

      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    tryLoadLastProject();

    // Initialize sprite manager asynchronously
    initializeSprites()
      .then(manager => {
        spriteManager = manager;
        console.log('Sprites loaded');
      })
      .catch(() => {
        console.warn('Failed to load sprites, using fallback rendering');
      });

    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

{#if showRendererTest}
  <RendererTest />
  <div class="test-hint">Press F2 to return to Build Planner</div>
{:else}
  <main>
    <Toolbar
      floor={currentFloor}
      canUndo={commands.canUndo}
      canRedo={commands.canRedo}
      {currentView}
      on:floorUp={() => handleFloorChange(1)}
      on:floorDown={() => handleFloorChange(-1)}
      on:undo={handleUndo}
      on:redo={handleRedo}
      on:viewChange={(e) => currentView = e.detail}
      on:newProject={handleNewProject}
      on:openProject={handleOpenProject}
      on:saveProject={handleSaveProject}
      on:exportProject={handleExportFile}
    />

    <div class="workspace">
      <LeftPanel
        {selectedItemId}
        {selectedVariantId}
        on:itemSelect={handleItemSelect}
      />
      <Canvas
        {objects}
        {currentFloor}
        {currentView}
        {previewType}
        previewVariant={selectedVariantId}
        previewRotation={currentRotation}
        previewColor={selectedColor}
        previewFace={selectedFace}
        {selectedGridType}
        {spriteManager}
        {belowFloorOpacity}
        on:cellClick={handleCellClick}
        on:cellRightClick={handleCellRightClick}
      />
      <RightPanel
        {currentFloor}
        {currentRotation}
        {selectedColor}
        {belowFloorOpacity}
        selectedFace={previewType === ObjectType.Wall ? selectedFace : null}
        objectCount={objects.length}
        on:rotateX={(e) => currentRotation = { ...currentRotation, x: normalizeAngle(currentRotation.x + e.detail) }}
        on:rotateY={(e) => currentRotation = { ...currentRotation, y: normalizeAngle(currentRotation.y + e.detail) }}
        on:rotateZ={(e) => currentRotation = { ...currentRotation, z: normalizeAngle(currentRotation.z + e.detail) }}
        on:colorSelect={(e) => handleColorSelect(e.detail)}
        on:belowFloorOpacityChange={(e) => belowFloorOpacity = e.detail}
      />
    </div>
  </main>
{/if}

<!-- Save Project Modal -->
<Modal title="Save Project" show={showSaveModal} on:close={() => showSaveModal = false}>
  <div class="modal-form">
    <label>
      Project Name:
      <input
        type="text"
        bind:value={saveProjectName}
        on:keydown={(e) => e.key === 'Enter' && confirmSave()}
        autofocus
      />
    </label>
    <div class="modal-actions">
      <button class="btn-secondary" on:click={() => showSaveModal = false}>Cancel</button>
      <button class="btn-primary" on:click={confirmSave}>Save</button>
    </div>
  </div>
</Modal>

<!-- Open Project Modal -->
<Modal title="Open Project" show={showOpenModal} on:close={() => showOpenModal = false}>
  <div class="modal-form">
    {#if storedProjectsList.length === 0}
      <p>No saved projects found.</p>
    {:else}
      <ul class="project-list">
        {#each storedProjectsList as proj}
          <li>
            <button class="project-item" on:click={() => selectProject(proj.id)}>
              <span class="project-name">{proj.name}</span>
              <span class="project-date">{new Date(proj.modified).toLocaleDateString()}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="modal-actions">
      <button class="btn-secondary" on:click={handleImportFile}>Import from File...</button>
      <button class="btn-secondary" on:click={() => showOpenModal = false}>Cancel</button>
    </div>
  </div>
</Modal>

<style>
  .modal-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .modal-form label {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .modal-form input {
    padding: var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
  }

  .btn-primary {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-accent);
    border-radius: var(--radius-sm);
    font-weight: 500;
  }

  .btn-secondary {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .btn-primary:hover, .btn-secondary:hover {
    filter: brightness(1.1);
  }

  .project-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;
  }

  .project-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-xs);
    text-align: left;
  }

  .project-item:hover {
    background: var(--color-accent);
  }

  .project-name {
    font-weight: 500;
  }

  .project-date {
    color: var(--color-text-secondary);
    font-size: 0.9em;
  }

  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .workspace {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .test-hint {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background: rgba(0, 0, 0, 0.7);
    color: #888;
    border-radius: 4px;
    font-size: 12px;
  }
</style>
