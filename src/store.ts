import { create } from 'zustand';
import { createCameraSlice } from './state/cameraSlice';
import { createPreferencesSlice } from './state/preferencesSlice';
import { createSelectionSlice } from './state/selectionSlice';
import { createInitialSimulationState, createSimulationSlice } from './state/simulationSlice';
import { createUISlice } from './state/uiSlice';
import type { AppState } from './state/types';

/**
 * One Zustand subscription surface composed from explicit domain slices.
 * Static asset definitions remain in src/data; only user preferences are persisted.
 */
export const useStore=create<AppState>()((...args)=>{
 const [set]=args;
 return {
  ...createPreferencesSlice(...args),
  ...createSimulationSlice(...args),
  ...createUISlice(...args),
  ...createCameraSlice(...args),
  ...createSelectionSlice(...args),
  // Aggregate reset coordinates domains without persisting simulation, UI, camera or selection.
  resetSimulation:()=>set((state)=>({
   ...createInitialSimulationState(state.resetKey+1),
   mode:'overview',search:'',activeProcessStage:null,
   focus:[0,0,0],selected:null,hovered:null,previousFocus:null,
  })),
 };
});

export type { AppState, CameraFocus, Language, QualityLevel, SimulationSpeed, TankerStage, TankerStatus, TrafficStage, TrafficStatus } from './state/types';
