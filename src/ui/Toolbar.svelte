<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    undo: void;
    redo: void;
    floorUp: void;
    floorDown: void;
    viewChange: 'top' | 'north' | 'south' | 'east' | 'west';
    newProject: void;
    openProject: void;
    saveProject: void;
    exportProject: void;
  }>();

  export let floor: number = 0;
  export let canUndo: boolean = false;
  export let canRedo: boolean = false;
  export let currentView: 'top' | 'north' | 'south' | 'east' | 'west' = 'top';

  const views = [
    { id: 'top', label: 'Top', shortcut: 'T' },
    { id: 'north', label: 'N', shortcut: 'North' },
    { id: 'south', label: 'S', shortcut: 'South' },
    { id: 'east', label: 'E', shortcut: 'East' },
    { id: 'west', label: 'W', shortcut: 'West' }
  ] as const;
</script>

<header class="toolbar">
  <div class="toolbar-left">
    <button class="btn-icon" title="New Project" on:click={() => dispatch('newProject')}>
      <span>New</span>
    </button>
    <button class="btn-icon" title="Open Project" on:click={() => dispatch('openProject')}>
      <span>Open</span>
    </button>
    <button class="btn-icon" title="Save Project (Ctrl+S)" on:click={() => dispatch('saveProject')}>
      <span>Save</span>
    </button>
    <button class="btn-icon" title="Export to File" on:click={() => dispatch('exportProject')}>
      <span>Export</span>
    </button>
  </div>

  <div class="toolbar-center">
    <div class="view-selector">
      {#each views as view}
        <button
          class="view-btn"
          class:active={currentView === view.id}
          title={view.shortcut}
          on:click={() => dispatch('viewChange', view.id)}
        >
          {view.label}
        </button>
      {/each}
    </div>

    <div class="separator"></div>

    <button
      class="btn-icon"
      title="Undo (Ctrl+Z)"
      disabled={!canUndo}
      on:click={() => dispatch('undo')}
    >
      <span>Undo</span>
    </button>
    <button
      class="btn-icon"
      title="Redo (Ctrl+Y)"
      disabled={!canRedo}
      on:click={() => dispatch('redo')}
    >
      <span>Redo</span>
    </button>
  </div>

  <div class="toolbar-right">
    <span class="floor-display">Floor: {floor}</span>
    <button class="btn-icon" title="Floor Up" on:click={() => dispatch('floorUp')}>+</button>
    <button class="btn-icon" title="Floor Down" on:click={() => dispatch('floorDown')}>-</button>
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .btn-icon {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    transition: background 0.15s;
  }

  .btn-icon:hover:not(:disabled) {
    background: var(--color-accent);
  }

  .btn-icon:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .floor-display {
    font-family: var(--font-mono);
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .view-selector {
    display: flex;
    background: var(--color-bg-primary);
    border-radius: var(--radius-sm);
    padding: 2px;
    gap: 2px;
  }

  .view-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: transparent;
    border-radius: var(--radius-sm);
    font-size: 12px;
    min-width: 32px;
    transition: all 0.15s;
  }

  .view-btn:hover {
    background: var(--color-bg-tertiary);
  }

  .view-btn.active {
    background: var(--color-accent);
  }

  .separator {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 var(--spacing-sm);
  }
</style>
