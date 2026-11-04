import type { StateCreator } from 'zustand';
import type { AppState, SimulationSlice } from './types';

const initialTrafficStatus={stage:'loading',progress:0} as const;
const initialTankerStatus={stage:'arriving',progress:0} as const;

type SimulationValues=Pick<AppState,'playing'|'speed'|'flow'|'trafficStatus'|'tankerStatus'|'resetKey'|'simulationMinutes'>;

/** Reproducible local demo baseline; no network or persisted operational values. */
export function createInitialSimulationState(resetKey=0):SimulationValues {
 return {
  // Start with rendering on demand; the visitor can opt into continuous vehicle/scene animation.
  // This avoids an expensive full-scene animation loop on first load, especially on mobile GPUs.
  playing:false,speed:1,flow:false,
  trafficStatus:{...initialTrafficStatus},tankerStatus:{...initialTankerStatus},
  resetKey,simulationMinutes:8*60+42,
 };
}

export const createSimulationSlice:StateCreator<AppState,[],[],SimulationSlice>=(set)=>({
 ...createInitialSimulationState(),
 advanceSimulationClock:()=>set((state)=>state.playing?{simulationMinutes:(state.simulationMinutes+Math.max(1,Math.round(state.speed*2)))%1440}:{}),
 setSimulation:(key,value)=>set({[key]:value} as Pick<AppState,typeof key>),
});

export type { SimulationSlice } from './types';
