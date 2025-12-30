<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    colorSelect: string | null;
    belowFloorOpacityChange: number;
  }>();

  export let currentFloor: number = 0;
  export let currentRotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  export let objectCount: number = 0;
  export let selectedColor: string | null = null;
  export let belowFloorOpacity: number = 0;
  export let selectedFace: string | null = null;

  const colors = [
    { name: 'black', hex: '#333333' },
    { name: 'blue', hex: '#4a7ab8' },
    { name: 'brown', hex: '#8b5a2b' },
    { name: 'green', hex: '#4a8a4a' },
    { name: 'grey', hex: '#7a7a7a' },
    { name: 'khaki', hex: '#b8a870' },
    { name: 'orange', hex: '#d87030' },
    { name: 'pink', hex: '#d870a0' },
    { name: 'purple', hex: '#8a50a0' },
    { name: 'red', hex: '#c04040' },
    { name: 'white', hex: '#e8e8e8' },
    { name: 'yellow', hex: '#d8c030' }
  ];
</script>

<aside class="panel right-panel">
  <section class="panel-section">
    <h3 class="panel-heading">Properties</h3>
    <div class="property-list">
      <div class="property-row">
        <span class="property-label">Position</span>
        <span class="property-value mono">(0, 0, 0)</span>
      </div>
      <div class="property-row">
        <span class="property-label">Rotation</span>
        <span class="property-value mono">{currentRotation.x}° / {currentRotation.y}° / {currentRotation.z}°</span>
      </div>
      <div class="property-row">
        <span class="property-label">Color</span>
        <span class="property-value">{selectedColor ? selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1) : 'None'}</span>
      </div>
    </div>
  </section>

  <section class="panel-section">
    <h3 class="panel-heading">Rotation</h3>
    <div class="rotation-controls">
      <div class="rotation-axis">
        <span>X (Ins/Del)</span>
        <div class="rotation-buttons">
          <button title="Rotate X-" on:click={() => dispatch('rotateX', -90)}>-</button>
          <span class="mono rotation-value">{currentRotation.x}°</span>
          <button title="Rotate X+" on:click={() => dispatch('rotateX', 90)}>+</button>
        </div>
      </div>
      <div class="rotation-axis">
        <span>Y (Home/End)</span>
        <div class="rotation-buttons">
          <button title="Rotate Y-" on:click={() => dispatch('rotateY', -90)}>-</button>
          <span class="mono rotation-value">{currentRotation.y}°</span>
          <button title="Rotate Y+" on:click={() => dispatch('rotateY', 90)}>+</button>
        </div>
      </div>
      <div class="rotation-axis">
        <span>Z (PgUp/PgDn)</span>
        <div class="rotation-buttons">
          <button title="Rotate Z-" on:click={() => dispatch('rotateZ', -90)}>-</button>
          <span class="mono rotation-value">{currentRotation.z}°</span>
          <button title="Rotate Z+" on:click={() => dispatch('rotateZ', 90)}>+</button>
        </div>
      </div>
    </div>
  </section>

  <section class="panel-section">
    <h3 class="panel-heading">Colors</h3>
    <div class="color-palette">
      <button
        class="color-swatch no-color"
        class:active={selectedColor === null}
        title="No color"
        on:click={() => dispatch('colorSelect', null)}
      >✕</button>
      {#each colors as color}
        <button
          class="color-swatch"
          class:active={selectedColor === color.name}
          style="background: {color.hex}"
          title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
          on:click={() => dispatch('colorSelect', color.name)}
        ></button>
      {/each}
    </div>
  </section>

  <section class="panel-section">
    <h3 class="panel-heading">Floor View</h3>
    <div class="floor-controls">
      <div class="floor-row">
        <span class="floor-label">Current Floor</span>
        <span class="floor-value mono">{currentFloor}</span>
      </div>
      <div class="floor-row">
        <span class="floor-label">Below Floor Opacity</span>
        <span class="floor-value mono">{Math.round(belowFloorOpacity * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={belowFloorOpacity}
        on:input={(e) => dispatch('belowFloorOpacityChange', parseFloat(e.currentTarget.value))}
        class="opacity-slider"
      />
    </div>
  </section>

  <section class="panel-section">
    <h3 class="panel-heading">Info</h3>
    <div class="info-list">
      <div class="info-row">
        <span class="info-label">Objects</span>
        <span class="info-value mono">{objectCount}</span>
      </div>
      {#if selectedFace}
        <div class="info-row">
          <span class="info-label">Face (C)</span>
          <span class="info-value">{selectedFace.charAt(0).toUpperCase() + selectedFace.slice(1)}</span>
        </div>
      {/if}
    </div>
  </section>
</aside>

<style>
  .right-panel {
    width: 220px;
    background: var(--color-bg-secondary);
    border-left: 1px solid var(--color-border);
    overflow-y: auto;
  }

  .panel-section {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .panel-heading {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .property-list,
  .info-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .property-row,
  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }

  .property-label,
  .info-label {
    color: var(--color-text-secondary);
  }

  .rotation-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .rotation-axis {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    font-size: 12px;
  }

  .rotation-buttons {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .rotation-buttons button {
    width: 28px;
    height: 28px;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .rotation-buttons button:hover {
    background: var(--color-accent);
  }

  .rotation-value {
    min-width: 40px;
    text-align: center;
  }

  .color-palette {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-xs);
  }

  .color-swatch {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-sm);
    border: 2px solid transparent;
  }

  .color-swatch:hover {
    border-color: var(--color-accent);
  }

  .color-swatch.active {
    border-color: var(--color-accent);
    box-shadow: 0 0 4px var(--color-accent);
  }

  .color-swatch.no-color {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .floor-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .floor-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }

  .floor-label {
    color: var(--color-text-secondary);
  }

  .opacity-slider {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    cursor: pointer;
  }

  .opacity-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: var(--color-accent);
    border-radius: 50%;
    cursor: pointer;
  }

  .opacity-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: var(--color-accent);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>
