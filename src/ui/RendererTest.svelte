<script lang="ts">
  import { onMount } from 'svelte';
  import { getOrthographicRenderer, type ViewAngle } from '../engine';

  // Test GLB path - using a local test file or URL
  let glbUrl = '';
  let selectedView: ViewAngle = 'top';
  let renderedImage: string = '';
  let allViews: Record<ViewAngle, string> = {} as any;
  let isLoading = false;
  let error: string | null = null;
  let renderSize = 128;

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
        backgroundColor: '#1a1a2e'
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
        backgroundColor: '#1a1a2e'
      });
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
    }
  }
</script>

<div class="renderer-test">
  <h2>GLB Orthographic Renderer Test</h2>

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
      <h3>Single View: {selectedView}</h3>
      <img src={renderedImage} alt="{selectedView} view" />
    </div>
  {/if}

  {#if Object.keys(allViews).length > 0}
    <div class="result">
      <h3>All Views</h3>
      <div class="views-grid">
        {#each views as view}
          <div class="view-item">
            <span>{view}</span>
            <img src={allViews[view]} alt="{view} view" />
          </div>
        {/each}
      </div>
    </div>
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

  .result img {
    border: 1px solid #444;
    background: #1a1a2e;
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
  }

  .view-item span {
    text-transform: capitalize;
    font-size: 12px;
    color: #888;
  }
</style>
