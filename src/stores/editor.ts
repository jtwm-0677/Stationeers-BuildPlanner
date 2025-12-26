/**
 * Editor store - manages editor state (tools, selection, view)
 */

import { writable, derived } from 'svelte/store';
import { rotation, type Rotation, PaintColor, SteelFrameVariant } from '../engine';

// Tool types
export type Tool = 'place' | 'select' | 'delete' | 'paint';

// View modes
export type ViewMode = 'top' | 'north' | 'south' | 'east' | 'west';

// Object kit types
export type ObjectKit = 'steel-frame' | 'iron-frame';

// Editor state
interface EditorState {
  tool: Tool;
  view: ViewMode;
  floor: number;
  kit: ObjectKit;
  variant: string;
  rotation: Rotation;
  color: PaintColor | null;
  selectedIds: string[];
  showGrid: boolean;
  showOreOverlay: boolean;
}

const initialState: EditorState = {
  tool: 'place',
  view: 'top',
  floor: 0,
  kit: 'steel-frame',
  variant: SteelFrameVariant.Standard,
  rotation: rotation(),
  color: null,
  selectedIds: [],
  showGrid: true,
  showOreOverlay: false
};

const editorState = writable<EditorState>(initialState);

export const editor = {
  subscribe: editorState.subscribe,

  setTool(tool: Tool) {
    editorState.update(s => ({ ...s, tool }));
  },

  setView(view: ViewMode) {
    editorState.update(s => ({ ...s, view }));
  },

  setFloor(floor: number) {
    editorState.update(s => ({ ...s, floor }));
  },

  floorUp() {
    editorState.update(s => ({ ...s, floor: s.floor + 1 }));
  },

  floorDown() {
    editorState.update(s => ({ ...s, floor: s.floor - 1 }));
  },

  setKit(kit: ObjectKit) {
    editorState.update(s => ({ ...s, kit }));
  },

  setVariant(variant: string) {
    editorState.update(s => ({ ...s, variant }));
  },

  setRotation(rot: Rotation) {
    editorState.update(s => ({ ...s, rotation: rot }));
  },

  rotateAxis(axis: 'x' | 'y' | 'z', direction: 1 | -1) {
    editorState.update(s => ({
      ...s,
      rotation: {
        ...s.rotation,
        [axis]: ((s.rotation[axis] + direction * 90) % 360 + 360) % 360
      }
    }));
  },

  setColor(color: PaintColor | null) {
    editorState.update(s => ({ ...s, color }));
  },

  select(ids: string[]) {
    editorState.update(s => ({ ...s, selectedIds: ids }));
  },

  clearSelection() {
    editorState.update(s => ({ ...s, selectedIds: [] }));
  },

  toggleGrid() {
    editorState.update(s => ({ ...s, showGrid: !s.showGrid }));
  },

  toggleOreOverlay() {
    editorState.update(s => ({ ...s, showOreOverlay: !s.showOreOverlay }));
  }
};

// Derived stores for convenience
export const currentTool = derived(editorState, $s => $s.tool);
export const currentFloor = derived(editorState, $s => $s.floor);
export const currentView = derived(editorState, $s => $s.view);
export const currentRotation = derived(editorState, $s => $s.rotation);
export const selectedIds = derived(editorState, $s => $s.selectedIds);
