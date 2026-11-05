import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useProgress } from '@react-three/drei';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Activity, Anchor, ArrowDownLeft, Bell, Box, Building2, Check, ChevronDown, CircleHelp, Clock3, Compass, Cpu, Factory, Gauge, GitBranch, Globe2, Layers3, LayoutDashboard, Maximize2, Moon, Pause, Play, Plus, Radio, RotateCcw, Search, Settings2, ShieldAlert, Ship, Sun, Truck, Users, Waves, X, Zap, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { AssetBoundary, SceneFallback, SceneReadySignal, World } from './scene/World';
import { ScenePerformanceProbe, type ScenePerformanceSample } from './scene/PerformanceProbe';
import { responsiveZoomForWidth } from './scene/responsiveZoom';
import { items, zones, type SiteItem, type SiteMode } from './data/site';
import { categoryName, inspectableItems, mainFunction, relatedItemsFor, statusName } from './data/interactions';
import { processStageAssets, processStages } from './data/process';
import { useStore } from './store';
import { translations } from './i18n/translations';
import './styles.css';
import './monitoring-theme.css';
import './scene-loading.css';
import './cinematic-tour.css';

type ToastNotice={id:number;title:string;detail:string;tone:'success'|'warning'|'error'};

const nav=[
 {id:'overview',icon:Compass},{id:'refinery',icon:Factory},{id:'storage',icon:Layers3},{id:'utilities',icon:Zap},{id:'truck',icon:Truck},{id:'marine',icon:Anchor},{id:'personnel',icon:Users},
] as const;
const dashboardSections:Record<string,{fa:string;en:string;descriptionFa:string;descriptionEn:string;position:[number,number,number]}>= {
 refinery:{fa:'واحدهای فرایندی',en:'Process units',descriptionFa:'برج‌ها، کوره‌ها، واحدهای تبدیل و تجهیزات مرتبط در محدوده فرایندی.',descriptionEn:'Columns, furnaces, conversion units and connected process equipment.',position:[-13,0,-8]},
 storage:{fa:'مخازن ذخیره‌سازی',en:'Tank farm',descriptionFa:'مخازن فرآورده و مخازن کروی گاز مایع؛ ظرفیت و سطح‌ها صرفاً نمایشی‌اند.',descriptionEn:'Product storage and LPG spheres; all capacities and levels are illustrative.',position:[17,0,-9]},
 utilities:{fa:'یوتیلیتی و آب',en:'Utilities',descriptionFa:'سامانه‌های آب، برق، بخار، آتش‌نشانی و خدمات پشتیبان.',descriptionEn:'Water, power, steam, firewater and supporting utility systems.',position:[-18,0,13]},
 truck:{fa:'پایانه جاده‌ای',en:'Road terminal',descriptionFa:'چرخه کامیون‌ها، جایگاه‌های بارگیری و فعالیت‌های لجستیکی نمایشی.',descriptionEn:'Illustrative truck cycles, loading bays and logistics activity.',position:[13,0,15]},
 marine:{fa:'پایانه دریایی',en:'Marine terminal',descriptionFa:'اسکله، کشتی و مسیر صادرات دریایی نمایشی.',descriptionEn:'Berth, vessel and illustrative marine export route.',position:[31,0,8]},
 personnel:{fa:'پرسنل سایت',en:'Site personnel',descriptionFa:'کارکنان نمایشی و فعالیت‌های تخصیص‌یافته در زون‌های مختلف سایت.',descriptionEn:'Simulated personnel and assigned activities across site zones.',position:[0,0,5]},
 control:{fa:'کنترل و مدیریت',en:'Control & admin',descriptionFa:'اتاق کنترل، آزمایشگاه و امکانات اداری مجتمع.',descriptionEn:'Central control room, laboratory and site administration facilities.',position:[-24,0,21]},
};
const mapPins:Record<string,{left:string;top:string}>={overview:{left:'52%',top:'55%'},refinery:{left:'56%',top:'28%'},storage:{left:'74%',top:'36%'},utilities:{left:'28%',top:'68%'},truck:{left:'67%',top:'77%'},marine:{left:'91%',top:'48%'},personnel:{left:'50%',top:'51%'},control:{left:'14%',top:'84%'}};
function sectionAssets(mode:string){
 if(mode==='overview'||mode==='all')return inspectableItems;
 if(mode==='personnel')return inspectableItems.filter(item=>item.kind==='worker');
 if(mode==='storage')return inspectableItems.filter(item=>item.kind==='tank'||item.kind==='sphere-tank');
 return inspectableItems.filter(item=>item.zone===mode);
}
function SectionOverview({mode,rtl,onSelect}:{mode:string;rtl:boolean;onSelect:(item:SiteItem)=>void}){
 const section=dashboardSections[mode],scoped=sectionAssets(mode),t=translations[rtl?'fa':'en'];
 if(!section)return null;
 const workers=scoped.filter(item=>item.kind==='worker').length;
 return <section className="section-overview-card" aria-live="polite">
  <div className="section-overview-heading"><span className="section-overview-icon"><LayoutDashboard size={16}/></span><span><small>{t.siteView}</small><b>{rtl?section.fa:section.en}</b></span><span className="section-demo-tag">{t.demoBadge}</span></div>
  <p>{rtl?section.descriptionFa:section.descriptionEn}</p>
  <div className="section-overview-metrics"><div><b>{scoped.length.toLocaleString(rtl?'fa-IR':'en-US')}</b><small>{t.assetsInScope}</small></div><div><b>{workers.toLocaleString(rtl?'fa-IR':'en-US')}</b><small>{t.demoPersonnel}</small></div></div>
  <div className="section-quick-assets"><span>{t.quickInspectionLabel}</span>{scoped.slice(0,3).map(item=><button type="button" key={item.id} onClick={()=>onSelect(item)}><b>{rtl?item.fa:item.en}</b><small>{item.id}</small></button>)}</div>
 </section>;
}
const tankAssets=items.filter(item=>item.kind==='tank'||item.kind==='sphere-tank');
const tankUtilization=Math.round(tankAssets.reduce((total,item)=>total+(item.fill??0),0)/Math.max(1,tankAssets.length));
const demoTruckCount=items.filter(item=>item.kind==='truck').length;
const demoPersonnelCount=items.filter(item=>item.kind==='worker').length;
function LiveVehicleProgress({rtl,forklift=false}:{rtl:boolean;forklift?:boolean}){
 const status=useStore(s=>s.trafficStatus);
 const title=rtl
  ?status.stage==='loading'?(forklift?'انتقال پالت به TR-027':'بارگیری پالت دوم'):status.stage==='clearing'?(forklift?'بازگشت به مسیر امن':'پاک‌سازی مسیر توسط لیفتراک'):(forklift?'انتظار در جایگاه امن':'حرکت کفی در مسیر یک‌طرفه')
  :status.stage==='loading'?(forklift?'Transferring pallet to TR-027':'Second pallet loading'):status.stage==='clearing'?(forklift?'Returning to safe lane':'Forklift clearing the lane'):(forklift?'Waiting in safe refuge':'Flatbed on one-way route');
 const detail=rtl
  ?status.stage==='loading'?'کامیون متوقف است؛ انتقال پالت در جریان است':status.stage==='clearing'?'حرکت کامیون تا پاک‌شدن محدوده متوقف می‌ماند':'کامیون در مسیر است؛ لیفتراک در محدوده امن انتظار می‌کشد'
  :status.stage==='loading'?'Truck is stopped while the pallet transfer is active':status.stage==='clearing'?'Truck holds until the forklift clears the lane':'Truck is moving; forklift waits in the safe refuge';
 const progress=Math.round(status.progress*100);
 return <div className="vehicle-progress"><div><span>{title}</span><b>{progress}%</b></div><div className="level-track" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{width:`${progress}%`}}/></div><small><Truck size={13}/>{detail}</small></div>;
}
function LiveTankerProgress({rtl}:{rtl:boolean}){
 const status=useStore(s=>s.tankerStatus);
 const title=rtl
  ?status.stage==='arriving'?'تانکر در مسیر ورود به جایگاه':status.stage==='loading'?'بارگیری تانکر در جایگاه ۰۱':'تانکر در حال خروج از جایگاه'
  :status.stage==='arriving'?'Tanker approaching loading bay':status.stage==='loading'?'Tanker loading at bay 01':'Tanker departing the bay';
 const detail=rtl
  ?status.stage==='arriving'?'ورود روی مسیر موجود؛ داده و زمان‌بندی نمایشی':status.stage==='loading'?'انتقال فرآورده از بازوی بالاسری · حجم شبیه‌سازی‌شده':'خروج به مسیر دسترسی سایت · چرخه‌ی نمایشی'
  :status.stage==='arriving'?'Using the existing access road · simulated cycle':status.stage==='loading'?'Product transfer from the top arm · simulated volume':'Leaving via the site access road · illustrative cycle';
 const progress=Math.round(status.progress*100);
 return <div className="vehicle-progress"><div><span>{title}</span><b>{progress}%</b></div><div className="level-track" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{width:`${progress}%`}}/></div><small><Truck size={13}/>{detail}</small></div>;
}
function InspectionReadout({item,rtl,onSelect}:{item:SiteItem;rtl:boolean;onSelect:(item:SiteItem)=>void}){
 const tanker=useStore(s=>s.tankerStatus),traffic=useStore(s=>s.trafficStatus);
 const zone=zones.find(value=>value.id===item.zone),[functionFa,functionEn]=mainFunction(item),related=relatedItemsFor(item),t=translations[rtl?'fa':'en'];
 const number=(value:number)=>Math.round(value).toLocaleString(rtl?'fa-IR':'en-US');
 const rows:{fa:string;en:string;valueFa:string;valueEn:string}[]=[];
 const add=(fa:string,en:string,valueFa:string|number,valueEn?:string|number)=>rows.push({fa,en,valueFa:String(valueFa),valueEn:String(valueEn??valueFa)});
 if(item.kind==='tank'||item.kind==='sphere-tank'){
  const capacity=Number((item.capacity??'0').replace(/,/g,'')),fill=item.fill??60;
  const productsFa=['نفتا','گازوئیل','نفت سفید','نفتا','گازوئیل','نفتا','نفت سفید','گازوئیل'],productsEn=['Naphtha','Diesel','Kerosene','Naphtha','Diesel','Naphtha','Kerosene','Diesel'],products=rtl?productsFa:productsEn;
  add(t.simulatedCapacity,'Simulated capacity',`${item.capacity??'—'} m³`);
  add(t.simulatedCurrentLevel,'Simulated current level',`${number(capacity*fill/100)} m³`);
  add(t.fillPercentage,'Fill percentage',`${number(fill)}%`);
  add(t.productType,'Product type',products[Math.max(0,Number(item.id.slice(-3))-101)]??(item.kind==='sphere-tank'?(rtl?'گاز مایع':'LPG'):(rtl?'فرآورده':'Product')));
 } else if(item.kind==='pump'){
  add(t.volumetricFlow,'Volumetric flow','186 m³/h');add(t.dischargePressure,'Discharge pressure','8.4 bar');add(t.motorSpeed,'Motor speed','1,480 rpm');
 } else if(item.kind==='pipeline'){
  add(t.simulatedFlow,'Simulated flow','124 m³/h');add(t.simulatedLinePressure,'Simulated line pressure','6.2 bar');add(t.routeState,'Route state','فعال · مفهومی','Active · conceptual');
 } else if(item.kind==='truck'){
  if(item.id==='TR-014'){
   const phaseFa=tanker.stage==='arriving'?'در مسیر ورود':tanker.stage==='loading'?'در حال بارگیری':'در حال خروج';
   const phaseEn=tanker.stage==='arriving'?'Approaching bay':tanker.stage==='loading'?'Loading at bay':'Departing bay';
   add('موقعیت فعلی','Current location',phaseFa,phaseEn);
   add('مقصد','Destination',tanker.stage==='departing'?'خروجی پایانه':'جایگاه بارگیری ۰۱',tanker.stage==='departing'?'Site exit':'Loading bay 01');
   add('فعالیت','Activity',phaseFa,phaseEn);
   add('وضعیت بارگیری','Loading status',tanker.stage==='loading'?`${number(tanker.progress*100)}٪`:'متوقف / انتقال فعال نیست',tanker.stage==='loading'?`${number(tanker.progress*100)}%`:'Not loading');
  }else{
   const stageFa=traffic.stage==='driving'?'حرکت در مسیر یک‌طرفه':traffic.stage==='loading'?'توقف و دریافت پالت':'پاک‌سازی و انتظار ایمن';
   const stageEn=traffic.stage==='driving'?'Driving on one-way loop':traffic.stage==='loading'?'Stopped for pallet transfer':'Clearing / safe hold';
   add('موقعیت فعلی','Current location',stageFa,stageEn);
   add('مقصد','Destination','مسیر حلقه‌ای پایانه','Terminal loop');add('فعالیت','Activity',stageFa,stageEn);
   add('وضعیت بارگیری','Loading status',traffic.stage==='loading'?`${number(traffic.progress*100)}٪`:'بار ثابت‌شده · بدون انتقال',traffic.stage==='loading'?`${number(traffic.progress*100)}%`:'Secured · no transfer');
  }
  add(t.vehicleId,'Vehicle ID',item.id);
 } else if(item.kind==='ship'){
  add(t.vesselName,'Vessel name',item.fa,item.en);add('اسکله','Berth','اسکله ۰۱','Berth 01');
  add('وضعیت بارگیری','Loading status','بارگیری دریایی نمایشی','Illustrative marine loading');
  add('پیشرفت محموله','Simulated cargo progress','۴۲٪','42%');
 } else if(item.kind==='worker'){
  add(t.department,'Department',item.departmentFa??'—',item.departmentEn??'—');
  add(t.jobPosition,'Job position',item.roleFa??'—',item.roleEn??'—');
  add(t.currentActivity,'Current activity',item.taskFa??'فعالیت میدانی',item.taskEn??'Field activity');
  add(t.assignedZone,'Assigned zone',zone?.fa??item.zone,zone?.en??item.zone);
 } else if(item.kind==='loading-bay'){
  const bay=item.id.slice(-1),assigned=bay==='1'?'TR-014':bay==='2'?'TR-027':'—';
  add(t.assignedVehicle,'Assigned vehicle',assigned);
  add(t.bayStatus,'Bay status',bay==='1'?'چرخه ورود و بارگیری نمایشی':'آماده/آزاد · وضعیت نمایشی',bay==='1'?'Illustrative arrival and loading cycle':'Ready / available · simulated');
  add(t.simulatedTransferRate,'Simulated transfer rate','124 m³/h');
 } else if(item.kind==='marine'){
  add(t.assignedVessel,'Assigned vessel','نفت‌کش آذر','MT Azar');add(t.berthState,'Berth state','در سرویس · نمایشی','In service · simulated');
 } else if(item.kind==='building'){
  add(t.accessState,'Access state','محدود به پرسنل','Staff-only');add(t.simulatedOccupancy,'Simulated occupancy','۴ نفر','4 people');
 } else if(item.kind==='cooling'){
  add(t.simulatedFanSpeed,'Simulated fan speed','720 rpm');add(t.simulatedOutletTemperature,'Simulated outlet temperature','34 °C');add(t.simulatedWaterFlow,'Simulated water flow','124 m³/h');
 } else {
  add(t.simulatedLoad,'Simulated load','74%');add(t.simulatedOperatingTemperature,'Simulated operating temperature','312 °C');add(t.systemState,'System state','پایدار · نمایشی','Stable · simulated');
 }

 return <section className="inspection-details">
  <div className="section-label">{t.inspectionPanel}</div>
  <div className="inspection-grid">
   <div><span>{t.equipmentId}</span><b>{item.id}</b></div>
   <div><span>{t.equipmentCategory}</span><b>{categoryName(item,rtl)} <small lang={rtl?'en':'fa'} dir={rtl?'ltr':'rtl'}>/ {categoryName(item,!rtl)}</small></b></div>
   <div><span>{t.industrialZone}</span><b>{zone?(rtl?zone.fa:zone.en):item.zone} <small lang={rtl?'en':'fa'} dir={rtl?'ltr':'rtl'}>/ {zone?(rtl?zone.en:zone.fa):item.zone}</small></b></div>
   <div><span>{t.operationalStatus}</span><b>{statusName(item,rtl)}</b></div>
  </div>
  <div className="inspection-copy"><span>{t.persianName}</span><b>{item.fa}</b><span>{t.englishName}</span><b lang="en" dir="ltr">{item.en}</b></div>
  <div className="inspection-copy function-copy"><span>{t.mainFunction} · {t.persian}</span><p>{functionFa}</p><span>{t.mainFunction} · EN</span><p lang="en" dir="ltr">{functionEn}</p></div>
  <div className="inspection-copy"><span>{t.descriptionFa}</span><p>{item.descriptionFa}</p><span>{t.descriptionEn}</span><p lang="en" dir="ltr">{item.descriptionEn}</p></div>
  <div className="inspection-reading-list"><div className="inspection-subhead"><b>{t.readingsActivity}</b><small>{t.allValuesSimulated}</small></div>
   {rows.map((row,index)=><div className="inspection-reading" key={`${row.en}-${index}`}><span>{rtl?row.fa:row.en}</span><b>{rtl?row.valueFa:row.valueEn}</b></div>)}
  </div>
  <div className="inspection-connections"><div className="inspection-subhead"><b>{t.connectedAssetsConceptual}</b><small>{t.illustrativeLinks}</small></div>
   {related.length?<div className="inspection-connection-list">{related.map(asset=><button type="button" key={asset.id} onClick={()=>onSelect(asset)} title={rtl?asset.fa:asset.en}><span className="connection-dot"/>{rtl?asset.fa:asset.en}<small>{asset.id}</small></button>)}</div>:<p className="inspection-empty">{t.noIllustrativeLinks}</p>}
  </div>
 </section>;
}
type SceneCanvasProps={quality:'low'|'medium'|'high';playing:boolean;assetsReady:boolean;performanceEnabled:boolean;onPerformanceSample:(sample:ScenePerformanceSample)=>void;onReady:()=>void;onPointerMissed:()=>void};
const SceneCanvas=memo(function SceneCanvas({quality,playing,assetsReady,performanceEnabled,onPerformanceSample,onReady,onPointerMissed}:SceneCanvasProps){
 return <Canvas frameloop={playing?'always':'demand'} shadows={quality!=='low'} fallback={<WebGLUnavailable onReady={onReady}/>} dpr={quality==='low'?.75:quality==='medium'?1:[1,1.3]} onPointerMissed={onPointerMissed} onCreated={({gl,scene})=>{gl.setClearColor('#c9d7d4',1);scene.background=new THREE.Color('#c9d7d4')}} orthographic camera={{position:[54,72,58],zoom:9.7,near:.1,far:300}} gl={{antialias:false,alpha:false,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.05}}>
  <ResponsiveOrthographicZoom/><SceneReadySignal onReady={onReady} ready={assetsReady}/>{performanceEnabled&&<ScenePerformanceProbe enabled onSample={onPerformanceSample}/>}<AssetBoundary fallback={(error)=><SceneFallback message={error}/>}><World loadHighDetail={quality!=='low'}/></AssetBoundary>
 </Canvas>;
});
/** Keep the whole refinery framed on narrow screens and bound wheel zoom so world-space labels cannot fill the viewport. */
function ResponsiveOrthographicZoom(){
 const {camera,size,invalidate}=useThree();
 const lastWidth=useRef(0);
 useLayoutEffect(()=>{
  if(!('isOrthographicCamera' in camera)||size.width<=0)return;
  if(lastWidth.current===0){
   camera.zoom=responsiveZoomForWidth(size.width);
  }else if(lastWidth.current!==size.width){
   camera.zoom=THREE.MathUtils.clamp(camera.zoom*size.width/lastWidth.current,3.2,14);
  }
  lastWidth.current=size.width;
  camera.updateProjectionMatrix();
  invalidate();
 },[camera,size.width,invalidate]);
 return null;
}
function SimulationClockReadout({rtl,className,label}:{rtl:boolean;className:string;label?:string}){
 const minutes=useStore(s=>s.simulationMinutes);
 const value=useMemo(()=>{
  const formatter=new Intl.NumberFormat(rtl?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false});
  return `${formatter.format(Math.floor(minutes/60))}:${formatter.format(minutes%60)}`;
 },[minutes,rtl]);
 return <b className={className} aria-label={label?`${label}: ${value}`:undefined}>{value}</b>;
}
function App(){
 const lang=useStore(s=>s.lang),quality=useStore(s=>s.quality),setPreference=useStore(s=>s.setPreference),setSimulation=useStore(s=>s.setSimulation),setUI=useStore(s=>s.setUI),setFocus=useStore(s=>s.setFocus),setLanguage=useStore(s=>s.setLanguage),selected=useStore(s=>s.selected),select=useStore(s=>s.select),mode=useStore(s=>s.mode),playing=useStore(s=>s.playing),speed=useStore(s=>s.speed),night=useStore(s=>s.night),flow=useStore(s=>s.flow),activeProcessStage=useStore(s=>s.activeProcessStage),search=useStore(s=>s.search),resetSimulation=useStore(s=>s.resetSimulation);
 const t=translations[lang];const rtl=lang==='fa',reduceMotion=Boolean(useReducedMotion()); const [help,setHelp]=useState(false); const [analytics,setAnalytics]=useState(false); const [mobileInspectorOpen,setMobileInspectorOpen]=useState(true); const [mobileMonitoringOpen,setMobileMonitoringOpen]=useState(false); const [settings,setSettings]=useState(false); const [tourActive,setTourActive]=useState(false); const [tourIndex,setTourIndex]=useState(0); const [notice,setNotice]=useState<ToastNotice|null>(null); const noticeTimer=useRef<number|undefined>(undefined),noticeSequence=useRef(0); const tourFlowBefore=useRef(false); const [sceneReady,setSceneReady]=useState(false); const [showLoading,setShowLoading]=useState(true); const [performanceDiagnostics]=useState(()=>new URLSearchParams(window.location.search).get('perf')==='1'); const [performanceSample,setPerformanceSample]=useState<ScenePerformanceSample|null>(null); const [longTaskStats,setLongTaskStats]=useState({count:0,maxDuration:0}); const {active:assetsLoading,progress:assetsProgress}=useProgress(); const assetsReady=!assetsLoading&&(assetsProgress>=100||quality==='low');
 const resetDemo=useCallback(()=>{setTourActive(false);resetSimulation();setNotice({id:++noticeSequence.current,title:t.resetComplete,detail:t.resetCompleteDetail,tone:'success'});if(noticeTimer.current)window.clearTimeout(noticeTimer.current);noticeTimer.current=window.setTimeout(()=>setNotice(null),4200)},[resetSimulation,t.resetComplete,t.resetCompleteDetail]);
 useEffect(()=>()=>{if(noticeTimer.current)window.clearTimeout(noticeTimer.current)},[]);
 // Keep the original loading overlay until all locally loaded scene assets are ready and a frame containing them has rendered.
 useEffect(()=>{if(!sceneReady)return;const timer=window.setTimeout(()=>setShowLoading(false),320);return()=>window.clearTimeout(timer)},[sceneReady]);
 useEffect(()=>{
  if(!performanceDiagnostics||typeof PerformanceObserver==='undefined')return;
  const observer=new PerformanceObserver(list=>{
   const tasks=list.getEntries();if(!tasks.length)return;
   setLongTaskStats(current=>({count:current.count+tasks.length,maxDuration:Math.max(current.maxDuration,...tasks.map(task=>task.duration))}));
  });
  try{observer.observe({entryTypes:['longtask']})}catch{observer.disconnect();return}
  return()=>observer.disconnect();
 },[performanceDiagnostics]);
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=rtl?'rtl':'ltr'},[lang,rtl]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.tagName==='INPUT')return;const current=useStore.getState();const focus=current.focus||[0,0,0];if(e.key==='Escape'){select(null);setUI('search','');setHelp(false);setSettings(false);setAnalytics(false);setMobileInspectorOpen(false);setMobileMonitoringOpen(false);return}if(e.key.toLowerCase()==='r'){resetDemo();return}if(e.key.toLowerCase()==='f'&&current.selected){setFocus([...current.selected.position]);return}const step=e.shiftKey?10:4;const move:Record<string,[number,number,number]>={w:[0,0,-step],ArrowUp:[0,0,-step],s:[0,0,step],ArrowDown:[0,0,step],a:[-step,0,0],ArrowLeft:[-step,0,0],d:[step,0,0],ArrowRight:[step,0,0]};if(move[e.key]||move[e.key.toLowerCase()]){e.preventDefault();const [dx,dy,dz]=move[e.key]||move[e.key.toLowerCase()];setFocus([focus[0]+dx,focus[1]+dy,focus[2]+dz]);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[select,setUI,setFocus,resetDemo]);
 useEffect(()=>{
  if(!playing)return;
  const timer=window.setInterval(()=>useStore.getState().advanceSimulationClock(),1000);
  return()=>window.clearInterval(timer);
 },[playing]);
 useEffect(()=>{if(!tourActive)return;const stage=processStages[tourIndex];if(!stage){setTourActive(false);setSimulation('flow',tourFlowBefore.current);return}setUI('activeProcessStage',stage.id);setUI('mode',stage.zone);setFocus([...stage.position]);setSimulation('flow',true);const timer=window.setTimeout(()=>{if(tourIndex===processStages.length-1){setSimulation('flow',tourFlowBefore.current);setTourActive(false)}else setTourIndex(index=>index+1)},5200);return()=>window.clearTimeout(timer)},[tourActive,tourIndex,setUI,setFocus,setSimulation]);
 const results=useMemo(()=>search.trim()?inspectableItems.filter(i=>(i.fa+i.en+i.id+i.kind).toLowerCase().includes(search.toLowerCase())).slice(0,6):[],[search]);
 const currentZone=selected?zones.find(z=>z.id===selected.zone):null;
 useEffect(()=>{if(selected){setMobileInspectorOpen(true);setMobileMonitoringOpen(false)}},[selected]);
 const jump=(id:SiteMode)=>{if(tourActive)stopTour();select(null);setUI('activeProcessStage',null);setUI('mode',id);const dest=zones.find(z=>z.id===id),section=dashboardSections[id];setFocus([...(dest?.position??section?.position??[0,0,0])]);setMobileInspectorOpen(true);setMobileMonitoringOpen(false)};
 const selectAsset=(item:SiteItem,preserveProcessStage=false)=>{if(tourActive)stopTour();if(!preserveProcessStage)setUI('activeProcessStage',null);const destination=item.kind==='worker'?'personnel':item.id==='PL-MARINE-01'?'marine':item.id==='PL-ROAD-01'||item.kind==='loading-bay'?'truck':item.zone;select(item);setUI('mode',destination);setFocus([...item.position]);setUI('search','');setMobileInspectorOpen(true);setMobileMonitoringOpen(false)};
 const focusProcessStage=(stageId:string)=>{if(tourActive)stopTour();const stage=processStages.find(value=>value.id===stageId);if(!stage)return;select(null);setUI('activeProcessStage',stage.id);setUI('mode',stage.zone);setSimulation('flow',true);setFocus([...stage.position]);setMobileInspectorOpen(true);setMobileMonitoringOpen(false)};
 const selectStageAsset=(item:SiteItem)=>selectAsset(item,true);
 const dismissInspector=()=>{select(null);setMobileInspectorOpen(false)};
 const toggleOperationsDrawer=()=>{setMobileInspectorOpen(open=>!open);setMobileMonitoringOpen(false)};
 const toggleMonitoringDrawer=()=>{setMobileMonitoringOpen(open=>!open);setMobileInspectorOpen(false)};
 const closeDrawers=()=>{setMobileInspectorOpen(false);setMobileMonitoringOpen(false)};
 const fullScreen=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
 const markSceneReady=useCallback(()=>setSceneReady(true),[]),clearSceneSelection=useCallback(()=>select(null),[select]),onPerformanceSample=useCallback((sample:ScenePerformanceSample)=>setPerformanceSample(sample),[]);
 const scopeCount=sectionAssets(mode).length,scopePercent=Math.max(8,Math.round(scopeCount/Math.max(1,inspectableItems.length)*100));
 const mapLabel=mode==='overview'?t.overviewTitle:dashboardSections[mode]?(rtl?dashboardSections[mode].fa:dashboardSections[mode].en):t.overviewTitle;
 const stopTour=()=>{if(tourActive)setSimulation('flow',tourFlowBefore.current);setTourActive(false)};
 const startTour=()=>{tourFlowBefore.current=useStore.getState().flow;select(null);setUI('search','');setTourIndex(0);setMobileInspectorOpen(false);setMobileMonitoringOpen(false);setUI('activeProcessStage',processStages[0].id);setUI('mode',processStages[0].zone);setFocus([...processStages[0].position]);setSimulation('flow',true);setTourActive(true)};
 return <div className={`app-shell ${night?'night':''}`} lang={lang} dir={rtl?'rtl':'ltr'}>
  <header className="topbar">
   <div className="brand-lockup"><div className="brand-mark"><Factory size={19}/><span/></div><div className="brand-name"><strong>PetroVista <b>3D</b></strong><small>{t.exploreUnderstandSimulate}</small></div></div>
   <div className="header-context"><span className="live-dot"/><span>{t.demo}</span><span className="header-divider"/><Clock3 size={14}/><SimulationClockReadout rtl={rtl} className="clock-value"/><span className="timezone">UTC+03:30</span></div>
   <div className="header-actions">
    <button className="icon-button drawer-toggle operations-drawer-toggle" onClick={toggleOperationsDrawer} title={t.operationsCenter} aria-label={t.operationsCenter} aria-pressed={mobileInspectorOpen}><PanelLeftOpen size={16}/></button>
    <button className="icon-button drawer-toggle monitoring-drawer-toggle" onClick={toggleMonitoringDrawer} title={t.siteMonitoring} aria-label={t.siteMonitoring} aria-pressed={mobileMonitoringOpen}><PanelRightOpen size={16}/></button>
    <div className="search-wrap"><Search size={16}/><input value={search} onChange={e=>setUI('search',e.target.value)} placeholder={t.search} aria-label={t.search}/>{search&&<button className="icon-button tiny" type="button" title={t.close} aria-label={t.close} onClick={()=>setUI('search','')}><X size={14}/></button>}
      <AnimatePresence>{search&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="search-results">{results.length?results.map(i=><button key={i.id} className="result-row" onClick={()=>selectAsset(i)}><span className="result-icon"><Box size={15}/></span><span><b>{rtl?i.fa:i.en}</b><small>{i.id} · <bdi lang={rtl?'en':'fa'} dir={rtl?'ltr':'rtl'}>{rtl?i.en:i.fa}</bdi></small></span><ArrowDownLeft size={14}/></button>):<div className="empty-results" role="status"><Search size={16}/><span>{t.noResults}</span></div>}</motion.div>}</AnimatePresence>
    </div>
    <button className="lang-toggle" onClick={()=>setLanguage(rtl?'en':'fa')} title={rtl?'تغییر زبان به انگلیسی':'Switch interface to Persian'} aria-label={rtl?'تغییر زبان به انگلیسی':'Switch interface to Persian'}><Globe2 size={15}/>{rtl?'EN':'فا'}</button>
    <button className="icon-button" title={t.help} aria-label={t.help} onClick={()=>setHelp(true)}><CircleHelp size={17}/></button>
    <button className="icon-button" title={t.settings} aria-label={t.settings} onClick={()=>setSettings(true)}><Settings2 size={16}/></button>
    <button className="icon-button" title={t.fullscreen} aria-label={t.fullscreen} onClick={fullScreen}><Maximize2 size={16}/></button>
   </div>
  </header>

  <main className="workspace">
   <div className="scene-wrap">
    <SceneCanvas quality={quality} playing={playing} assetsReady={assetsReady} performanceEnabled={performanceDiagnostics} onPerformanceSample={onPerformanceSample} onReady={markSceneReady} onPointerMissed={clearSceneSelection}/>
    {performanceDiagnostics&&<aside className="performance-diagnostics" lang={rtl?'fa':'en'} dir={rtl?'rtl':'ltr'} aria-label={rtl?'پایش عملکرد صحنه':'Scene performance diagnostics'}>
     <b><Cpu size={12}/>{rtl?'پایش زنده':'Live performance'} <small>?perf=1</small></b>
     <div><span>FPS</span><strong>{performanceSample?.fps??'—'}</strong><span>{rtl?'فراخوانی رسم':'draw calls'}</span><strong>{performanceSample?.drawCalls??'—'}</strong></div>
     <div><span>{rtl?'مثلث':'triangles'}</span><strong>{performanceSample?performanceSample.triangles.toLocaleString(rtl?'fa-IR':'en-US'):'—'}</strong><span>{rtl?'هندسه / بافت':'geometries / textures'}</span><strong>{performanceSample?`${performanceSample.geometries} / ${performanceSample.textures}`:'—'}</strong></div>
     <div><span>{rtl?'سایه':'shadows'}</span><strong>{quality==='low'?(rtl?'خاموش':'off'):`${quality==='high'?'2048':'1024'}px · ${playing?(quality==='high'?'20':'12')+'Hz':(rtl?'مکث':'paused')}`}</strong><span>{rtl?'کیفیت':'quality'}</span><strong>{quality.toUpperCase()}</strong></div>
     <small>{rtl?`${longTaskStats.count} مکث طولانی · بیشینه ${Math.round(longTaskStats.maxDuration)} ms`:`${longTaskStats.count} long tasks · max ${Math.round(longTaskStats.maxDuration)} ms`}</small>
    </aside>}
    <div className="scene-topline"><div className="breadcrumb"><span>PetroVista</span><span className="crumb-slash">/</span><b>{mode==='overview'?t.overviewTitle:dashboardSections[mode]?(rtl?dashboardSections[mode].fa:dashboardSections[mode].en):t[mode as keyof typeof t]||t.overviewTitle}</b></div><button className={`cinematic-tour-trigger ${tourActive?'active':''}`} onClick={tourActive?stopTour:startTour}><span className="tour-trigger-icon">{tourActive?<X size={13}/>:<Play size={13}/>}</span><span>{tourActive?(rtl?t.stopTour:'Stop tour'):(rtl?t.siteTour:'Guided site tour')}</span></button><div className="scene-badges"><span className="weather"><Sun size={14}/>{night?t.clearNight:t.clearDay}</span><span className="scenario-label"><span/> {t.demoScenario}</span></div></div>
    <AnimatePresence mode="wait">{tourActive&&<motion.div key={tourIndex} className="cinematic-tour-card" initial={{opacity:0,y:-10,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}} transition={{duration:reduceMotion?0:.28}}>
     <div className="cinematic-tour-meta"><span><i/> {t.guidedTour}</span><b>{(tourIndex+1).toLocaleString(rtl?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false})} <small>/ {processStages.length.toLocaleString(rtl?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false})}</small></b><button onClick={stopTour} aria-label={rtl?'پایان تور':'Stop tour'}><X size={14}/></button></div>
     <strong>{rtl?processStages[tourIndex].fa:processStages[tourIndex].en}</strong><p>{rtl?processStages[tourIndex].descriptionFa:processStages[tourIndex].descriptionEn}</p>
     <div className="cinematic-tour-progress"><i style={{width:`${((tourIndex+1)/processStages.length)*100}%`}}/></div>
     <small>{t.guidedInspection}</small>
    </motion.div>}</AnimatePresence>
    <div className="north-indicator" aria-label={t.northDirection}><span>{rtl?'ش':'N'}</span><div className="north-arrow"/><small>0°</small></div>
    <div className="mini-map"><div className="map-title"><span>{t.siteMap}</span><span className="map-live"/></div><div className="map-art"><div className="map-road road-a"/><div className="map-road road-b"/><div className="map-zone z1"/><div className="map-zone z2"/><div className="map-zone z3"/><div className="map-zone z4"/><div className="map-sea"/><span className="map-pin" style={mapPins[mode]??mapPins.overview}/></div><div className="map-footer"><span>{rtl?'۱۲۰۰ × ۹۰۰ متر':'1,200 × 900 m'}</span><span>{mapLabel}</span></div></div>
    <div className="scene-tools"><button onClick={()=>setFocus([0,0,0])} title={t.viewAll} aria-label={t.viewAll}><Compass size={16}/></button><button onClick={()=>setFocus(selected?[...selected.position]:[0,0,0])} title={t.focusSelection} aria-label={t.focusSelection}><Plus size={17}/></button><button onClick={fullScreen} title={t.fullscreen} aria-label={t.fullscreen}><Maximize2 size={15}/></button></div>
    <div className="scene-legend"><span><i className="legend-pipe"/> {t.pipeline}</span><span><i className="legend-flow"/> {t.demoFlow}</span><span><i className="legend-asset"/> {t.activeAsset}</span></div>
   </div>
   {(mobileMonitoringOpen||mobileInspectorOpen)&&<button className="drawer-scrim" type="button" aria-label={t.closePanels} onClick={closeDrawers}/>}
   <aside className={`left-rail ${mobileMonitoringOpen?'drawer-open':''}`}>
    <div className="rail-head"><span>{t.operationsNavigation}</span><span className="rail-head-code">{t.operationsCode}</span></div>
    <div className="rail-status-card" title={rtl?'نمایش دارایی‌های محدوده انتخاب‌شده؛ داده‌ها محلی و شبیه‌سازی‌شده‌اند':'Assets included in the active view; local simulated data'}>
     <div className="rail-status-top"><span>{t.activeViewScope}</span><span className="demo-badge"><i/>{t.demoBadge}</span></div>
     <div className="rail-status-main"><span className="rail-status-icon"><Activity size={17}/></span><span><b>{mode==='overview'?(rtl?'نمای کلی مجتمع':'Full-site overview'):dashboardSections[mode]?(rtl?dashboardSections[mode].fa:dashboardSections[mode].en):(rtl?'محدوده انتخاب‌شده':'Selected zone')}</b><small>{t.localAssetInventory}</small></span><b className="rail-unit-count">{scopeCount.toLocaleString(rtl?'fa-IR':'en-US')}<span>{t.assets}</span></b></div>
     <div className="rail-status-track"><i style={{width:`${scopePercent}%`}}/></div>
     <div className="rail-status-foot"><span>{t.viewScope}</span><b>{t.local}</b></div>
    </div>
    <nav aria-label={t.facilityNavigation}>{nav.map(({id,icon:Icon})=><button key={id} onClick={()=>jump(id)} className={`nav-item ${mode===id?'active':''}`} aria-current={mode===id?'page':undefined}><span className="nav-icon"><Icon size={17}/></span><span>{t[id as keyof typeof t]}</span>{mode===id&&<i className="nav-active-mark"/>}</button>)}</nav>
    <div className="rail-divider"/><div className="zones-label">{t.siteZones}</div>
    <div className="zone-list">{zones.slice(1).map((z,i)=>{const count=inspectableItems.filter(item=>item.zone===z.id).length;return <button key={z.id} onClick={()=>jump(z.id)} className={`zone-item ${mode===z.id?'selected':''}`} aria-current={mode===z.id?'location':undefined} title={rtl?`${z.fa} · ${count} دارایی نمایشی`:`${z.en} · ${count} simulated assets`}><span className={`zone-dot dot-${i%5}`}/><span>{rtl?z.fa:z.en}</span><small>{count.toLocaleString(rtl?'fa-IR':'en-US')}</small></button>})}</div>
    <div className="rail-spacer"/>
    <button className="rail-alert" type="button" onClick={()=>{const alarm=items.find(item=>item.id==='TK-103');if(alarm)selectAsset(alarm)}} title={rtl?'بازکردن جزئیات بازبینی نمایشی مخزن TK-103':'Open the simulated TK-103 review details'}><span className="alert-symbol"><ShieldAlert size={15}/></span><span className="alert-copy"><b>{t.alarmSummary}</b><small><strong>{rtl?'اولویت ۲':'Priority 2'} · TK-103</strong> · {t.scheduledReview}</small></span><span className="alert-count">{rtl?'۰۱':'01'}</span></button>
    <button className="user-card" onClick={()=>setHelp(true)}><div className="avatar">PV</div><span><b>{t.visitorMode}</b><small>{t.localProfile}</small></span><Settings2 size={15}/></button>
   </aside>
   <aside className={`inspector ${mobileInspectorOpen?'drawer-open':'mobile-dismissed'}`}>
    <div className="inspector-head"><div><div className="eyebrow">{selected?t.assetDetails:t.operationsCenter}</div><h2>{selected?(rtl?selected.fa:selected.en):mode==='overview'?t.overviewTitle:dashboardSections[mode]?(rtl?dashboardSections[mode].fa:dashboardSections[mode].en):t.overviewTitle}</h2></div><button className="icon-button close-inspector" onClick={dismissInspector} title={t.close}><X size={16}/></button></div>
    <AnimatePresence mode="wait" initial={false}>
     <motion.div key={selected?`asset-${selected.id}`:`view-${mode}`} className="inspector-content" initial={reduceMotion?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={reduceMotion?{opacity:0}:{opacity:0,y:-3}} transition={{duration:reduceMotion?0:.18,ease:[.22,1,.36,1]}}>
    {selected?<>
      <div className="asset-identity"><div className={`asset-glyph ${selected.kind}`}><AssetIcon kind={selected.kind}/></div><div><b>{rtl?selected.fa:selected.en}</b><small>{categoryName(selected,rtl)} · {selected.id}</small></div><span className="status-chip"><i/>{statusName(selected,rtl)}</span></div>
      <div className="asset-stat-row"><div><span>{t.asset}</span><b>{selected.id}</b></div><div><span>{t.zone}</span><b>{currentZone?(rtl?currentZone.fa:currentZone.en):'—'}</b></div></div>
      <InspectionReadout item={selected} rtl={rtl} onSelect={selectAsset}/>
      {selected.kind==='truck'&&selected.id==='TR-027'&&<LiveVehicleProgress rtl={rtl}/>}
      {selected.kind==='forklift'&&<LiveVehicleProgress rtl={rtl} forklift/>}
      {selected.kind==='truck'&&selected.id==='TR-014'&&<LiveTankerProgress rtl={rtl}/>}
      {selected.kind==='ship'&&<div className="vehicle-progress"><div><span>{rtl?'پیشرفت بارگیری نمایشی':'Simulated loading progress'}</span><b>42%</b></div><div className="level-track"><i style={{width:'42%'}}/></div><small><Waves size={13}/>{rtl?'اسکله صادراتی · وضعیت شبیه‌سازی‌شده':'Export berth · simulated state'}</small></div>}
      <button className="focus-button" onClick={()=>setFocus([...selected.position])}><Maximize2 size={15}/>{rtl?'تمرکز دوربین روی تجهیز':'Focus camera on asset'}<ArrowDownLeft size={14}/></button>
    </>:<>
      {mode!=='overview'&&<SectionOverview mode={mode} rtl={rtl} onSelect={selectAsset}/>}
      <div className="site-health" title={rtl?'شاخص وضعیت کلی، محاسبه و ارائه‌شده برای نمایش آزمایشی':'Illustrative site-health score; demo only'}><div className="health-ring"><div><strong>96</strong><small>/100</small></div></div><div><span className="health-label">{t.siteHealth}</span><b>{t.operationsStable}</b><small><i/> {t.updatedNow}</small></div></div>
      <div className="inspector-kpis"><Kpi icon={<Factory size={16}/>} label={t.active} value="18" meta={rtl?'از ۲۱ واحد':'of 21 units'} color="blue" tip={rtl?'واحدهای فعال در نمای آزمایشی؛ داده زنده نیست':'Active units in this simulated view; not live telemetry'}/><Kpi icon={<Truck size={16}/>} label={t.trucks} value={String(demoTruckCount).padStart(2,'0')} meta={rtl?'دو خودروی نمایشی':'simulated vehicles'} color="amber" tip={rtl?'دو خودروی نمایشی در پایانه جاده‌ای':'Two simulated road-terminal vehicles'}/><Kpi icon={<Gauge size={16}/>} label={t.storageKpi} value={`${tankUtilization}%`} meta={`${tankAssets.length} ${rtl?'مخزن نمایشی':'simulated tanks'}`} color="slate" tip={rtl?'میانگین سطح مخازن ذخیره؛ از داده‌های محلی نمایشی محاسبه شده':'Average tank fill derived from local simulated values'}/></div>
      <ProcessCyclePanel rtl={rtl} activeStageId={activeProcessStage} onSelectStage={focusProcessStage} onSelectAsset={selectStageAsset}/>
      <section className="utility-snapshot"><div className="section-row"><span className="section-label">{t.utilityBalance}</span><span className="instrument-source"><i/>{t.local}</span></div><div className="utility-metrics"><UtilityMetric label={t.power} value="18.6" unit="MW" fill={74} tip={rtl?'توان نمایشی، نه تله‌متری واقعی':'Illustrative power demand; not real telemetry'}/><UtilityMetric label={t.steam} value="42.1" unit="t/h" fill={61} tip={rtl?'دبی بخار نمایشی':'Illustrative steam flow'}/><UtilityMetric label={t.coolingWater} value="124" unit="m³/h" fill={48} tip={rtl?'دبی آب خنک‌کن نمایشی':'Illustrative cooling-water flow'}/></div></section>
      <section className="instrument-panel"><div className="section-row"><span className="section-label">{t.processInstruments}</span><span className="instrument-source"><i/>{t.demoBadge}</span></div><InstrumentRow tag="FIC-101" label={rtl?'دبی خوراک خام':'Crude charge flow'} value="82.4%" fill={82} tip={rtl?'دبی خوراک خام · مقدار نمایشی، بدون اتصال به ابزار واقعی':'Crude charge flow · illustrative demo reading, no live instrument connection'}/><InstrumentRow tag="TIC-204" label={rtl?'دمای خروجی کوره':'Furnace outlet temp'} value="352°C" fill={68} tip={rtl?'دمای خروجی کوره · مقدار نمایشی':'Furnace outlet temperature · illustrative demo reading'}/><InstrumentRow tag="PIC-207" label={rtl?'فشار برج تقطیر':'Column pressure'} value="1.42 bar" fill={54} tip={rtl?'فشار برج تقطیر · مقدار نمایشی':'Distillation column pressure · illustrative demo reading'}/></section>
      <section className="mini-chart-section" title={rtl?'روند ساختگی برای نمایش رابط؛ داده تاریخی واقعی نیست':'Illustrative demo trend, not real historical data'}><button className="chart-heading chart-open" onClick={()=>setAnalytics(true)}><div><span className="section-label">{t.throughputTrend}</span><b>42.8 <small>kt/day</small></b></div><span className="chart-change"><ArrowDownLeft size={12}/> 2.4%</span></button><MiniChart rtl={rtl}/></section>
      <section className="activity-section"><div className="section-row"><span className="section-label">{t.recentActivity}</span><button onClick={()=>setAnalytics(true)}>{t.viewAllActivity}</button></div><ActivityRow icon={<Truck size={14}/>} title={rtl?'کامیون TR-014 وارد جایگاه شد':'TR-014 entered loading bay'} time="08:39" color="amber"/><ActivityRow icon={<Check size={14}/>} title={rtl?'بازبینی ایمنی TK-103 ثبت شد':'TK-103 safety review logged'} time="08:26" color="slate"/><ActivityRow icon={<Anchor size={14}/>} title={rtl?'نفت‌کش آذر به اسکله رسید':'MT Azar arrived at berth'} time="08:12" color="blue"/></section>
      <div className="demo-callout"><div className="callout-icon"><Radio size={16}/></div><div><b>{t.interactiveDemo}</b><p>{rtl?'با انتخاب تجهیزات روی صحنه، وضعیت و داده‌های نمایشی را بررسی کنید.':'Select equipment in the scene to inspect simulated states and data.'}</p></div></div>
    </>}
     </motion.div>
    </AnimatePresence>
    <div className="inspector-foot"><span className="foot-dot"/>{rtl?'محیط نمایشی · بدون اتصال به سامانه زنده':'DEMO ENVIRONMENT · NO LIVE SYSTEM CONNECTION'}</div>
   </aside>
  </main>
  <footer className="bottom-bar">
   <div className="bottom-left"><span className={`bottom-state ${playing?'':'paused'}`}><i/> {playing?t.currentSimulation:t.simulationPaused}</span><span className="bottom-sep"/><span><Building2 size={14}/>{rtl?'۲۱ واحد':'21 units'}</span><span><Cpu size={14}/>{inspectableItems.length} {t.demoAssets}</span><span><Users size={14}/>{demoPersonnelCount} {t.personnelLabel}</span></div>
   <div className="bottom-controls"><button className={`flow-toggle ${flow?'enabled':''}`} onClick={()=>setSimulation('flow',!flow)} title={t.toggleProcessFlow} aria-pressed={flow}><span className="flow-toggle-icon"><Activity size={15}/></span>{flow?t.flowOn:t.flow}</button><div className="playback"><button aria-label={playing?t.pause:t.play} onClick={()=>setSimulation('playing',!playing)} title={playing?t.pause:t.play}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><button aria-label={t.reset} onClick={resetDemo} title={t.reset}><RotateCcw size={14}/></button><button className="speed-button" aria-label={rtl?`سرعت شبیه‌سازی ${speed} برابر`:`Simulation speed ${speed} times`} title={t.cycleSpeed} onClick={()=>setSimulation('speed',speed===.5?1:speed===1?2:speed===2?4:.5)}>{speed}×<ChevronDown size={12}/></button></div></div>
   <div className="bottom-right"><button className="mode-pill" aria-label={night?t.switchToDay:t.switchToNight} title={t.toggleLighting} aria-pressed={night} onClick={()=>setPreference('night',!night)}>{night?<Moon size={14}/>:<Sun size={14}/>} {night?t.night:t.day}</button><span className="bottom-sep"/><span className="time-label">{t.time}</span><SimulationClockReadout rtl={rtl} className="bottom-clock" label={t.time}/></div>
  </footer>
  <div className="toast-region" aria-live="polite" aria-atomic="true">
   <AnimatePresence initial={false}>{notice&&<motion.div key={notice.id} className={`toast-notice ${notice.tone}`} role="status" dir={rtl?'rtl':'ltr'} initial={{opacity:0,y:8,scale:.985}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:5,scale:.99}} transition={{duration:reduceMotion?0:.18,ease:[.22,1,.36,1]}}>
    <span className="toast-icon"><Check size={16}/></span><span className="toast-copy"><b>{notice.title}</b><small>{notice.detail}</small></span><button type="button" onClick={()=>setNotice(null)} title={t.dismissNotification} aria-label={t.dismissNotification}><X size={14}/></button>
   </motion.div>}</AnimatePresence>
  </div>
  <div className="right-zoom"><button onClick={()=>setFocus([0,0,0])} title={t.viewAll} aria-label={t.viewAll}><Compass size={14}/></button></div>
  <AnimatePresence>{showLoading&&<SceneLoadingOverlay sceneReady={sceneReady} rtl={rtl}/>}</AnimatePresence>
  <AnimatePresence>{settings&&<Modal title={t.displaySettings} onClose={()=>setSettings(false)}><div className="settings-panel"><p>{t.chooseSceneQuality}</p><div className="quality-options">{(['low','medium','high'] as const).map(level=><button key={level} type="button" className={quality===level?'selected':''} aria-pressed={quality===level} onClick={()=>setPreference('quality',level)}><b>{rtl?({low:t.low,medium:t.medium,high:t.high} as const)[level]:({low:t.low,medium:t.medium,high:t.high} as const)[level]}</b><small>{rtl?({low:t.lowDescription,medium:t.mediumDescription,high:t.highDescription} as const)[level]:({low:t.lowDescription,medium:t.mediumDescription,high:t.highDescription} as const)[level]}</small></button>)}</div><div className="settings-demo-note"><Radio size={15}/>{t.simulatedNoConnection}</div></div></Modal>}</AnimatePresence>
  <AnimatePresence>{help&&<Modal title={t.environmentGuide} onClose={()=>setHelp(false)}><div className="help-grid"><HelpItem icon={<Compass/>} title={t.navigateScene} text={t.navigateSceneHelp}/><HelpItem icon={<Box/>} title={t.inspectAssets} text={t.inspectAssetsHelp}/><HelpItem icon={<Activity/>} title={t.flow} text={t.processFlowHelp}/><HelpItem icon={<Radio/>} title={t.demoData} text={t.demoDataHelp}/></div></Modal>}</AnimatePresence>
  <AnimatePresence>{analytics&&<Modal title={t.demoAnalytics} onClose={()=>setAnalytics(false)}><div className="analytics-summary"><Kpi icon={<Gauge/>} label={t.storageKpi} value="64%" meta="± 3.2%" color="blue"/><Kpi icon={<Activity/>} label={t.throughput} value="42.8" meta="kt/day · demo" color="blue"/><Kpi icon={<Bell/>} label={t.alerts} value="01" meta={t.reviewRequired} color="amber"/></div><div className="analytics-utility-grid"><div><small>{t.powerDemand}</small><b>18.6 <i>MW</i></b><span>74% {t.demoLoad}</span></div><div><small>{t.processSteam}</small><b>42.1 <i>t/h</i></b><span>61% {t.demoLoad}</span></div><div><small>{t.coolingWater}</small><b>124 <i>m³/h</i></b><span>48% {t.demoLoad}</span></div><div><small>{t.alarmState}</small><b>{rtl?'۱ بازبینی':'01 review'}</b><span>{t.simulatedEvent}</span></div></div><div className="large-chart"><MiniChart rtl={rtl}/><div>{t.performanceIndex}</div></div></Modal>}</AnimatePresence>
 </div>;
}
function SceneLoadingOverlay({sceneReady,rtl}:{sceneReady:boolean;rtl:boolean}){
 const {progress:assetProgress}=useProgress();
 const progress=sceneReady?100:Math.min(94,Math.max(0,Math.round(assetProgress*.94)));
 const t=translations[rtl?'fa':'en'],reduceMotion=Boolean(useReducedMotion());
 const stages=[t.crudeFeed,t.distillation,t.conversion,t.utilitiesStage,t.storageExport];
 const status=progress<22?t.startingRuntime:progress<58?t.buildingAssets:progress<90?t.preparingScene:t.finishingFrame;
 return <motion.div className="scene-loading-overlay" role="status" aria-live="polite" lang={rtl?"fa":"en"} dir={rtl?"rtl":"ltr"} initial={{opacity:1}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduceMotion?0:.3}}>
  <div className="scene-loading-card">
   <div className="scene-loading-brand"><span className="scene-loading-mark">PV</span><div><b>PetroVista <i>3D</i></b><small>{t.refineryOperationsView}</small></div><span className="scene-demo-pill"><i/>{t.demoBadge}</span></div>
   <div className="scene-loading-title"><strong>{t.productionCycle}</strong><span>{t.fromReceivingToExport}</span></div>
   <div className="loader-refinery-art" aria-hidden="true"><svg viewBox="0 0 520 170" preserveAspectRatio="xMidYMid meet">
    <path className="loader-pipe" d="M25 130H493M58 130V93H197V130M192 130V110H337V130M335 130V88H463V130M72 93V61H135V93M225 110V54H268V110M393 88V45H438V88"/>
    <path className="loader-flow" d="M25 130H493M58 130V93H197V130M192 130V110H337V130M335 130V88H463V130"/>
    <circle className="loader-oil-pulse" r="3.4"><animateMotion dur="6.4s" repeatCount="indefinite" path="M25 130H58V93H197V130H225V110H337V130H335V88H393V45H438V88H463V130H493"/></circle>
    <circle className="loader-oil-pulse pulse-two" r="2.6"><animateMotion begin="2.1s" dur="6.4s" repeatCount="indefinite" path="M25 130H58V93H197V130H225V110H337V130H335V88H393V45H438V88H463V130H493"/></circle>
    <circle className="loader-water-pulse" r="2.5"><animateMotion dur="4.7s" repeatCount="indefinite" path="M282 130V111H299V99H311V130H363"/></circle>
    <path className="loader-vessel" d="M72 92V51q0-9 9-9h45q9 0 9 9v42M77 52h53M225 108V50q0-10 10-10h14q10 0 10 10v59M228 53h28M393 86V40q0-8 8-8h28q8 0 8 8v46M397 43h36"/>
    <path className="loader-platform" d="M65 62h77M218 59h58M387 47h50M65 72h77M218 68h58M387 56h50"/>
    <path className="loader-steel" d="M33 129V105q0-10 10-10h19v35M43 95V78h18v17M297 130V75h16v55M292 75h27M300 75V61h10M304 61V46"/>
    <path className="loader-vessel" d="M452 124h40l-5 8h-29zM459 123v-8h10v8M472 123v-5h8v5"/><path className="loader-platform" d="M454 134h39m-30 0v4m21-4v4"/>
    <rect className="loader-level fill-one" x="83" y="82" width="41" height="10" rx="2"/><rect className="loader-level fill-two" x="231" y="82" width="26" height="22" rx="2"/><rect className="loader-level fill-three" x="401" y="69" width="28" height="15" rx="2"/>
    <g className="loader-pump" transform="translate(304 101)"><circle r="6"/><path className="loader-rotor" d="M0 -4v8M-4 0h8"/></g><circle className="loader-light" cx="304" cy="43" r="3"/>
    <ellipse className="loader-vapor" cx="308" cy="33" rx="9" ry="6"/><ellipse className="loader-vapor vapor-two" cx="315" cy="26" rx="12" ry="7"/>
    <path className="loader-platform" d="M26 137h468M39 139v8m43-8v8m43-8v8m43-8v8m43-8v8m43-8v8m43-8v8m43-8v8m43-8v8m43-8v8"/>
   </svg></div>
   <div className="scene-cycle-steps" style={{'--loader-progress':`${progress/100}`} as CSSProperties}>{stages.map((stage,index)=><div className={`scene-cycle-step ${progress>=index*20+15?'reached':''} ${progress>=index*20+15&&progress<(index+1)*20+15?'current':''}`} key={stage}><i><span>{(index+1).toLocaleString(rtl?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false})}</span></i><small>{stage}</small></div>)}</div>
   <div className="scene-loading-status"><span className="loading-pulse"/><span>{status}</span><b>{progress.toLocaleString(rtl?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false})}%</b></div>
   <div className="scene-loading-progress" role="progressbar" aria-label={t.scenePreparation} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{width:`${progress}%`}}/></div>
   <div className="scene-loading-meta"><span>0</span><span>{t.sceneInitialization}</span><span>100%</span></div>
   <div className="scene-loading-foot"><i/>{t.illustrativeNoControl}</div>
  </div>
 </motion.div>;
}
function ProcessCyclePanel({rtl,activeStageId,onSelectStage,onSelectAsset}:{rtl:boolean;activeStageId:string|null;onSelectStage:(stageId:string)=>void;onSelectAsset:(item:SiteItem)=>void}){
 const t=translations[rtl?'fa':'en'];
 const active=processStages.find(stage=>stage.id===activeStageId)??null,connected=active?processStageAssets(active):[];
 return <section className="process-cycle-panel"><div className="section-row"><span className="section-label">{t.processPath}</span><span className="cycle-demo-label">{t.illustrativeDemo}</span></div>
  <div className="process-cycle-endpoints"><span>{rtl?processStages[0].fa:processStages[0].en}</span><ArrowDownLeft size={12}/><span>{rtl?processStages[processStages.length-1].fa:processStages[processStages.length-1].en}</span></div>
  <div className="process-cycle-list">{processStages.map((stage,index)=><button key={stage.id} className={`process-cycle-step ${activeStageId===stage.id?'active':''}`} aria-pressed={activeStageId===stage.id} onClick={()=>onSelectStage(stage.id)} title={t.selectStage}><span className="process-cycle-index">{(index+1).toLocaleString(rtl?'fa-IR':'en-US',{minimumIntegerDigits:2,useGrouping:false})}</span><span className="process-cycle-copy"><b>{rtl?stage.fa:stage.en}</b><small>{rtl?stage.startFa:stage.startEn}</small></span><span className="process-cycle-node"/></button>)}</div>
  {active&&<div className="process-stage-detail"><p>{rtl?active.descriptionFa:active.descriptionEn}</p><div className="process-stage-terminals"><span><small>{t.start}</small><b>{rtl?active.startFa:active.startEn}</b></span><ArrowDownLeft size={13}/><span><small>{t.end}</small><b>{rtl?active.endFa:active.endEn}</b></span></div><div className="process-stage-assets"><span>{t.connectedUnits}</span><div>{connected.map(item=><button type="button" key={item.id} onClick={()=>onSelectAsset(item)} title={rtl?item.fa:item.en}><b>{rtl?item.fa:item.en}</b><small>{item.id}</small></button>)}</div></div></div>}
  <div className="process-cycle-foot"><GitBranch size={12}/>{t.chooseProcess}</div>
 </section>;
}

function UtilityMetric({label,value,unit,fill,tip}:{label:string;value:string;unit:string;fill:number;tip?:string}){return <div className="utility-metric" title={tip}><div><span>{label}</span><b>{value}<small> {unit}</small></b></div><i><span style={{width:`${fill}%`}}/></i></div>}

function WebGLUnavailable({onReady}:{onReady:()=>void}){
 const rtl=useStore(s=>s.lang==='fa');
 useEffect(()=>{onReady()},[onReady]);
 return <div className="webgl-fallback" role="status" lang={rtl?'fa':'en'} dir={rtl?'rtl':'ltr'}>
  <div className="webgl-fallback-card">
   <span className="webgl-fallback-mark" aria-hidden="true">PV</span>
   <strong>{rtl?'نمای سه‌بعدی در دسترس نیست':'3D scene is unavailable'}</strong>
   <p>{rtl?'مرورگر WebGL را فعال نکرده است. پشتیبانی WebGL و شتاب‌دهی سخت‌افزاری را بررسی و صفحه را دوباره بارگذاری کنید.':'WebGL is disabled or unavailable. Check browser WebGL support and hardware acceleration, then reload the page.'}</p>
   <button type="button" onClick={()=>window.location.reload()}>{rtl?'بارگذاری دوباره':'Reload scene'}</button>
  </div>
 </div>;
}
function AssetIcon({kind}:{kind:string}){if(kind==='worker')return <Users size={20}/>;if(kind==='tank'||kind==='sphere-tank')return <Layers3 size={20}/>;if(kind==='truck'||kind==='forklift')return <Truck size={20}/>;if(kind==='ship'||kind==='marine')return <Ship size={20}/>;if(kind==='process'||kind==='furnace')return <Factory size={20}/>;if(kind==='building')return <Building2 size={20}/>;if(kind==='cooling')return <Waves size={20}/>;return <Cpu size={20}/>}
function Kpi({icon,label,value,meta,color,tip}:{icon:React.ReactNode;label:string;value:string;meta:string;color:string;tip?:string}){return <div className={`kpi-card ${color}`} title={tip} aria-label={`${label}: ${value}. ${tip??meta}`}><div className="kpi-icon">{icon}</div><span>{label}</span><b>{value}</b><small>{meta}</small></div>}
function InstrumentRow({tag,label,value,fill,tip}:{tag:string;label:string;value:string;fill:number;tip?:string}){return <div className="instrument-row" title={tip??`${tag} · ${label}: ${value} · simulated demo reading`}><div className="instrument-main"><span className="instrument-tag">{tag}</span><span className="instrument-name">{label}</span><b>{value}</b></div><div className="instrument-meter" role="meter" aria-label={`${tag} ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill}><i style={{width:`${fill}%`}}/></div></div>}
function MiniChart({rtl}:{rtl:boolean}){const t=translations[rtl?'fa':'en'];const ticks=rtl?['۰۰:۰۰','۰۶:۰۰','۱۲:۰۰','۱۸:۰۰',t.now]:['00:00','06:00','12:00','18:00',t.now];return <div className="mini-chart" lang={rtl?'fa':'en'} dir="ltr"><div className="chart-grid"><i/><i/><i/></div><svg viewBox="0 0 320 84" preserveAspectRatio="none"><defs><linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#55b8d3" stopOpacity=".24"/><stop offset="1" stopColor="#55b8d3" stopOpacity="0"/></linearGradient></defs><path d="M0 59 C20 56,25 40,42 47 S63 61,80 40 S103 46,121 33 S145 44,163 28 S182 42,202 24 S226 34,244 20 S267 38,283 18 S306 21,320 9 V84 H0Z" fill="url(#chartfill)"/><path d="M0 59 C20 56,25 40,42 47 S63 61,80 40 S103 46,121 33 S145 44,163 28 S182 42,202 24 S226 34,244 20 S267 38,283 18 S306 21,320 9" fill="none" stroke="#55b8d3" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x">{ticks.map(tick=><span key={tick}>{tick}</span>)}</div></div>}
function ActivityRow({icon,title,time,color}:{icon:React.ReactNode;title:string;time:string;color:string}){return <div className="activity-row"><span className={`activity-icon ${color}`}>{icon}</span><b>{title}</b><small>{time}</small></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){const closeLabel=translations[useStore(s=>s.lang)].close,reduceMotion=Boolean(useReducedMotion()),duration=reduceMotion?0:.18;return <motion.div className="modal-backdrop" initial={reduceMotion?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration}} onClick={onClose}><motion.div className="modal-card" initial={reduceMotion?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}} transition={{duration,ease:[.22,1,.36,1]}} onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-button" type="button" title={closeLabel} aria-label={closeLabel} onClick={onClose}><X size={16}/></button></div>{children}</motion.div></motion.div>}
function HelpItem({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="help-item"><span>{icon}</span><div><b>{title}</b><p>{text}</p></div></div>}
export default App;
