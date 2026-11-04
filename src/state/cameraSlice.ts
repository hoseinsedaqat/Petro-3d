import type { StateCreator } from 'zustand';
import type { AppState, CameraSlice } from './types';

export const createCameraSlice:StateCreator<AppState,[],[],CameraSlice>=(set)=>({
 focus:null,
 setFocus:(focus)=>set({focus}),
});

export type { CameraSlice } from './types';
