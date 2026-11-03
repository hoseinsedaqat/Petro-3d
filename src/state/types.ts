import type { SiteItem, SiteMode } from '../data/site';

export type Language='fa'|'en';
export type QualityLevel='low'|'medium'|'high';
export type SimulationSpeed=.5|1|2|4;
export type TrafficStage='loading'|'clearing'|'driving';
export type TrafficStatus={stage:TrafficStage;progress:number};
export type TankerStage='arriving'|'loading'|'departing';
export type TankerStatus={stage:TankerStage;progress:number};
export type CameraFocus=[number,number,number]|null;

/** Shared state contract. Slice implementations live in separate domain modules. */
export type PreferencesSlice=Pick<AppState,'lang'|'night'|'quality'|'setLanguage'|'setPreference'>;
export type SimulationSlice=Pick<AppState,'playing'|'speed'|'flow'|'trafficStatus'|'tankerStatus'|'resetKey'|'simulationMinutes'|'advanceSimulationClock'|'setSimulation'>;
export type UISlice=Pick<AppState,'mode'|'search'|'activeProcessStage'|'setUI'>;
export type CameraSlice=Pick<AppState,'focus'|'setFocus'>;
export type SelectionSlice=Pick<AppState,'selected'|'hovered'|'previousFocus'|'select'|'setHovered'>;

export interface AppState {
 // User preferences
 lang:Language;
 night:boolean;
 quality:QualityLevel;
 setLanguage:(lang:Language)=>void;
 setPreference:<K extends 'night'|'quality'>(key:K,value:AppState[K])=>void;
 // Local process simulation
 playing:boolean;
 speed:SimulationSpeed;
 flow:boolean;
 trafficStatus:TrafficStatus;
 tankerStatus:TankerStatus;
 resetKey:number;
 simulationMinutes:number;
 advanceSimulationClock:()=>void;
 setSimulation:<K extends 'playing'|'speed'|'flow'|'trafficStatus'|'tankerStatus'>(key:K,value:AppState[K])=>void;
 resetSimulation:()=>void;
 // Interface/navigation state
 mode:SiteMode;
 search:string;
 activeProcessStage:string|null;
 setUI:<K extends 'mode'|'search'|'activeProcessStage'>(key:K,value:AppState[K])=>void;
 // Camera state
 focus:CameraFocus;
 setFocus:(focus:CameraFocus)=>void;
 // Object selection state
 selected:SiteItem|null;
 hovered:SiteItem|null;
 previousFocus:CameraFocus;
 select:(item:SiteItem|null)=>void;
 setHovered:(item:SiteItem|null)=>void;
}
