import type { StateCreator } from 'zustand';
import type { AppState, UISlice } from './types';

export const createUISlice:StateCreator<AppState,[],[],UISlice>=(set)=>({
 mode:'overview',search:'',activeProcessStage:null,
 setUI:(key,value)=>set({[key]:value} as Pick<AppState,typeof key>),
});

export type { UISlice } from './types';
