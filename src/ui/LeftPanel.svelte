<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    catalog,
    searchItems,
    type ItemCategory,
    type CatalogItem
  } from '../data/catalog';

  const dispatch = createEventDispatcher<{
    itemSelect: { itemId: string; variantId: string };
  }>();

  // Props
  export let selectedItemId: string = '';
  export let selectedVariantId: string = '';

  // State
  let activeCategory: ItemCategory = 'structural';
  let searchQuery = '';
  let expandedSubcategories: Set<string> = new Set(['frames']); // Default expanded

  // Get current category data
  $: currentCategory = catalog.find(c => c.id === activeCategory);

  // Search results
  $: searchResults = searchQuery.length >= 2 ? searchItems(searchQuery) : [];
  $: isSearching = searchQuery.length >= 2;

  // Get selected item data
  $: selectedItem = selectedItemId ? findItem(selectedItemId) : null;

  function findItem(itemId: string): CatalogItem | null {
    for (const category of catalog) {
      for (const subcategory of category.subcategories) {
        const item = subcategory.items.find(i => i.id === itemId);
        if (item) return item;
      }
    }
    return null;
  }

  function toggleSubcategory(subcategoryId: string) {
    if (expandedSubcategories.has(subcategoryId)) {
      expandedSubcategories.delete(subcategoryId);
    } else {
      expandedSubcategories.add(subcategoryId);
    }
    expandedSubcategories = expandedSubcategories; // Trigger reactivity
  }

  function selectItem(item: CatalogItem) {
    const defaultVariant = item.variants[0]?.id || '';
    dispatch('itemSelect', { itemId: item.id, variantId: defaultVariant });
  }

  function selectVariant(variantId: string) {
    dispatch('itemSelect', { itemId: selectedItemId, variantId });
  }

  function handleSearchItemClick(item: CatalogItem) {
    // Switch to the item's category and select it
    activeCategory = item.category;
    if (item.subcategory) {
      expandedSubcategories.add(item.subcategory);
      expandedSubcategories = expandedSubcategories;
    }
    selectItem(item);
    searchQuery = ''; // Clear search
  }
</script>

<aside class="left-panel">
  <!-- Category Tabs -->
  <div class="category-tabs">
    {#each catalog as category}
      <button
        class="tab"
        class:active={activeCategory === category.id}
        title={category.name}
        on:click={() => activeCategory = category.id}
      >
        <span class="tab-icon">{category.icon}</span>
      </button>
    {/each}
  </div>

  <!-- Search -->
  <div class="search-container">
    <input
      type="text"
      class="search-input"
      placeholder="Search items..."
      bind:value={searchQuery}
    />
    {#if searchQuery}
      <button class="search-clear" on:click={() => searchQuery = ''}>✕</button>
    {/if}
  </div>

  <!-- Search Results -->
  {#if isSearching}
    <div class="search-results">
      {#if searchResults.length === 0}
        <div class="no-results">No items found</div>
      {:else}
        {#each searchResults as item}
          <button
            class="search-result-item"
            on:click={() => handleSearchItemClick(item)}
          >
            <span class="item-name">{item.name}</span>
            <span class="item-category">{item.category}</span>
          </button>
        {/each}
      {/if}
    </div>
  {:else}
    <!-- Tree View -->
    <div class="tree-view">
      {#if currentCategory}
        {#each currentCategory.subcategories as subcategory}
          <div class="tree-node">
            <button
              class="tree-header"
              on:click={() => toggleSubcategory(subcategory.id)}
            >
              <span class="tree-toggle">
                {expandedSubcategories.has(subcategory.id) ? '▼' : '▶'}
              </span>
              <span class="tree-label">{subcategory.name}</span>
            </button>

            {#if expandedSubcategories.has(subcategory.id)}
              <div class="tree-children">
                {#each subcategory.items as item}
                  <button
                    class="tree-item"
                    class:selected={selectedItemId === item.id}
                    on:click={() => selectItem(item)}
                  >
                    {item.name}
                    {#if item.variants.length > 1}
                      <span class="variant-count">({item.variants.length})</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Variants (when item is selected) -->
    {#if selectedItem && selectedItem.variants.length > 0}
      <div class="variants-section">
        <h3 class="section-heading">Variants</h3>
        <div class="variants-list">
          {#each selectedItem.variants as variant}
            <button
              class="variant-item"
              class:active={selectedVariantId === variant.id}
              on:click={() => selectVariant(variant.id)}
            >
              {variant.name}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</aside>

<style>
  .left-panel {
    width: 220px;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Category Tabs */
  .category-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-primary);
  }

  .tab {
    flex: 1;
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tab:hover {
    background: var(--color-bg-tertiary);
  }

  .tab.active {
    background: var(--color-bg-secondary);
    border-bottom-color: var(--color-accent);
  }

  .tab-icon {
    font-size: 16px;
  }

  /* Search */
  .search-container {
    padding: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    padding-right: 28px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 13px;
  }

  .search-input::placeholder {
    color: var(--color-text-secondary);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 12px;
    padding: 2px;
  }

  .search-clear:hover {
    color: var(--color-text-primary);
  }

  /* Search Results */
  .search-results {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
  }

  .no-results {
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--spacing-md);
    font-size: 13px;
  }

  .search-result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border: none;
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-xs);
    cursor: pointer;
    text-align: left;
  }

  .search-result-item:hover {
    background: var(--color-accent);
  }

  .item-name {
    font-size: 13px;
  }

  .item-category {
    font-size: 11px;
    color: var(--color-text-secondary);
    text-transform: capitalize;
  }

  /* Tree View */
  .tree-view {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
  }

  .tree-node {
    margin-bottom: var(--spacing-xs);
  }

  .tree-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 500;
  }

  .tree-header:hover {
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .tree-toggle {
    font-size: 10px;
    width: 12px;
    color: var(--color-text-secondary);
  }

  .tree-children {
    padding-left: 20px;
  }

  .tree-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text-primary);
    font-size: 13px;
    border-radius: var(--radius-sm);
  }

  .tree-item:hover {
    background: var(--color-bg-tertiary);
  }

  .tree-item.selected {
    background: var(--color-accent);
  }

  .variant-count {
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .tree-item.selected .variant-count {
    color: inherit;
    opacity: 0.8;
  }

  /* Variants Section */
  .variants-section {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-sm);
  }

  .section-heading {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
    font-weight: 500;
  }

  .variants-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .variant-item {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
    font-size: 13px;
  }

  .variant-item:hover {
    background: var(--color-accent);
  }

  .variant-item.active {
    background: var(--color-accent);
  }
</style>
