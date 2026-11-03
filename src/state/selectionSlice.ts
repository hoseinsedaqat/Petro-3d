import type { StateCreator } from 'zustand';
import type { AppState, SelectionSlice } from './types';

export const createSelectionSlice:StateCreator<AppState,[],[],SelectionSlice>=(set)=>({
 selected:null,hovered:null,previousFocus:null,
 setHovered:(hovered)=>set({hovered}),
 select:(selected)=>set((state)=>{
  if(!selected)return {selected:null,hovered:null,focus:state.selected?(state.previousFocus??[0,0,0]):state.focus,previousFocus:null};
  const previousFocus=state.selected?state.previousFocus:(state.focus??[0,0,0]);
  return {selected,hovered:null,previousFocus,focus:[...selected.position] as [number,number,number]};
 }),
});

export type { SelectionSlice } from './types';
