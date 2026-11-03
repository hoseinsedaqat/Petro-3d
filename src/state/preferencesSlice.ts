import type { StateCreator } from 'zustand';
import type { AppState, Language, PreferencesSlice } from './types';

function readLanguagePreference():Language {
 if(typeof localStorage==='undefined')return 'fa';
 try{return localStorage.getItem('pv-lang')==='en'?'en':'fa'}catch{return 'fa'}
}
function saveLanguagePreference(lang:Language){
 if(typeof localStorage==='undefined')return;
 try{localStorage.setItem('pv-lang',lang)}catch{/* Storage may be disabled; the session preference still works. */}
}

export const createPreferencesSlice:StateCreator<AppState,[],[],PreferencesSlice>=(set)=>({
 lang:readLanguagePreference(),night:false,quality:'medium',
 setLanguage:(lang)=>{saveLanguagePreference(lang);set({lang})},
 setPreference:(key,value)=>set({[key]:value} as Pick<AppState,typeof key>),
});

export type { PreferencesSlice } from './types';
