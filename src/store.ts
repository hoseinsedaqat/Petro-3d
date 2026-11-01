import { create } from 'zustand';
import { items, type SiteItem } from './data/site';

type State = { lang:'fa'|'en'; selected:SiteItem|null; mode:string; playing:boolean; speed:number; night:boolean; flow:boolean; search:string; quality:string; focus:[number,number,number]|null; resetKey:number; set:(key:string,value:any)=>void; select:(item:SiteItem|null)=>void; reset:()=>void };
export const useStore = create<State>((set)=>({
  lang:(localStorage.getItem('pv-lang') as 'fa'|'en')||'fa', selected:null, mode:'overview', playing:true, speed:1, night:false, flow:false, search:'', quality:'medium', focus:null, resetKey:0,
  set:(key,value)=>set({[key]:value} as Partial<State>),
  select:(selected)=>set({selected}),
  reset:()=>set((state)=>({selected:null,mode:'overview',playing:true,speed:1,flow:false,search:'',focus:[0,0,0],resetKey:state.resetKey+1})),
}));
export const findItem=(id:string)=>items.find(x=>x.id===id);
