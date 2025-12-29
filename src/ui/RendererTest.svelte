<script lang="ts">
  import { onMount } from 'svelte';
  import { getOrthographicRenderer, type ViewAngle } from '../engine';

  // Test GLB path - using a local test file or URL
  let glbUrl = '';
  let glbFileName = '';  // Track filename for saving
  let selectedView: ViewAngle = 'top';
  let renderedImage: string = '';
  let allViews: Record<ViewAngle, string> = {} as any;
  let isLoading = false;
  let error: string | null = null;
  let renderSize = 128;

  // Checkboxes for selecting which views to save
  let selectedForSave: Record<ViewAngle, boolean> = {
    top: false,
    front: false,
    back: false,
    left: false,
    right: false,
    bottom: false
  };

  const views: ViewAngle[] = ['top', 'front', 'back', 'left', 'right', 'bottom'];

  async function renderSingle() {
    if (!glbUrl) {
      error = 'Please enter a GLB URL or file path';
      return;
    }

    isLoading = true;
    error = null;

    try {
      const renderer = getOrthographicRenderer();
      renderedImage = await renderer.renderSingleView(glbUrl, selectedView, {
        size: renderSize,
        backgroundColor: null  // Transparent
      });
    } catch (e) {
      error = `Failed to render: ${e}`;
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  async function renderAll() {
    if (!glbUrl) {
      error = 'Please enter a GLB URL or file path';
      return;
    }

    isLoading = true;
    error = null;

    try {
      const renderer = getOrthographicRenderer();
      allViews = await renderer.renderAllViews(glbUrl, {
        size: renderSize,
        backgroundColor: null  // Transparent
      });
      // Reset selection
      for (const view of views) {
        selectedForSave[view] = false;
      }
    } catch (e) {
      error = `Failed to render: ${e}`;
      console.error(e);
    } finally {
      isLoading = false;
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      glbUrl = URL.createObjectURL(file);
      // Extract filename without extension for saving
      glbFileName = file.name.replace(/\.glb$/i, '');
    }
  }

  function selectAll() {
    for (const view of views) {
      selectedForSave[view] = true;
    }
    selectedForSave = selectedForSave;  // Trigger reactivity
  }

  function selectNone() {
    for (const view of views) {
      selectedForSave[view] = false;
    }
    selectedForSave = selectedForSave;  // Trigger reactivity
  }

  function getSelectedCount(): number {
    return views.filter(v => selectedForSave[v]).length;
  }

  function saveSelected() {
    const baseName = glbFileName || 'render';

    for (const view of views) {
      if (selectedForSave[view] && allViews[view]) {
        downloadImage(allViews[view], `${baseName}_${view}.png`);
      }
    }
  }

  function saveSingle() {
    if (renderedImage) {
      const baseName = glbFileName || 'render';
      downloadImage(renderedImage, `${baseName}_${selectedView}.png`);
    }
  }

  function downloadImage(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="renderer-test">
  <h2>GLB Orthographic Renderer</h2>

  <div class="controls">
    <div class="input-group">
      <label>
        GLB URL:
        <input type="text" bind:value={glbUrl} placeholder="Enter GLB URL or use file picker" />
      </label>
      <label>
        Or select file:
        <input type="file" accept=".glb" on:change={handleFileSelect} />
      </label>
    </div>

    <div class="input-group">
      <label>
        View:
        <select bind:value={selectedView}>
          {#each views as view}
            <option value={view}>{view}</option>
          {/each}
        </select>
      </label>

      <label>
        Size:
        <input type="number" bind:value={renderSize} min="32" max="512" step="32" />
      </label>
    </div>

    <div class="buttons">
      <button on:click={renderSingle} disabled={isLoading}>
        {isLoading ? 'Rendering...' : 'Render Single View'}
      </button>
      <button on:click={renderAll} disabled={isLoading}>
        {isLoading ? 'Rendering...' : 'Render All Views'}
      </button>
    </div>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if renderedImage}
    <div class="result">
      <div class="result-header">
        <h3>Single View: {selectedView}</h3>
        <button class="save-btn" on:click={saveSingle}>Save Image</button>
      </div>
      <img src={renderedImage} alt="{selectedView} view" />
    </div>
  {/if}

  {#if Object.keys(allViews).length > 0}
    <div class="result">
      <div class="result-header">
        <h3>All Views</h3>
        <div class="save-controls">
          <button class="small-btn" on:click={selectAll}>Select All</button>
          <button class="small-btn" on:click={selectNone}>Select None</button>
          <button
            class="save-btn"
            on:click={saveSelected}
            disabled={getSelectedCount() === 0}
          >
            Save Selected ({getSelectedCount()})
          </button>
        </div>
      </div>
      <div class="views-grid">
        {#each views as view}
          <div class="view-item" class:selected={selectedForSave[view]}>
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={selectedForSave[view]}
              />
              <span class="view-name">{view}</span>
            </label>
            <img
              src={allViews[view]}
              alt="{view} view"
              on:click={() => selectedForSave[view] = !selectedForSave[view]}
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if glbFileName}
    <div class="filename-hint">Current file: {glbFileName}</div>
  {/if}
</div>

<style>
  .renderer-test {
    padding: 20px;
    background: #1a1a2e;
    color: #eee;
    min-height: 100vh;
  }

  h2 {
    margin-bottom: 20px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
    max-width: 600px;
  }

  .input-group {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  input[type="text"], input[type="number"], select {
    padding: 8px;
    background: #2a2a4e;
    border: 1px solid #444;
    border-radius: 4px;
    color: #eee;
    min-width: 200px;
  }

  input[type="file"] {
    padding: 8px;
  }

  .buttons {
    display: flex;
    gap: 10px;
  }

  button {
    padding: 10px 20px;
    background: #4a4a8e;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #5a5a9e;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #ff6b6b;
    padding: 10px;
    background: rgba(255, 107, 107, 0.1);
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .result {
    margin-top: 20px;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
  }

  .result-header h3 {
    margin: 0;
  }

  .save-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .save-btn {
    background: #2e8b57;
  }

  .save-btn:hover:not(:disabled) {
    background: #3ea76d;
  }

  .small-btn {
    padding: 6px 12px;
    font-size: 12px;
    background: #3a3a5e;
  }

  .result img {
    border: 1px solid #444;
    background: repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px;
    cursor: pointer;
  }

  .views-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    max-width: 600px;
  }

  .view-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 8px;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: border-color 0.2s;
  }

  .view-item.selected {
    border-color: #2e8b57;
    background: rgba(46, 139, 87, 0.1);
  }

  .view-item img {
    transition: transform 0.1s;
  }

  .view-item img:hover {
    transform: scale(1.05);
  }

  .checkbox-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .view-name {
    text-transform: capitalize;
    font-size: 12px;
    color: #888;
  }

  .filename-hint {
    margin-top: 20px;
    padding: 8px 12px;
    background: #2a2a4e;
    border-radius: 4px;
    font-size: 12px;
    color: #888;
    display: inline-block;
  }
</style>
