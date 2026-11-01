import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Anchor, ArrowDownLeft, Bell, Box, Building2, Check, ChevronDown, CircleHelp, Clock3, Compass, Cpu, Factory, Gauge, Globe2, Layers3, Maximize2, Moon, Pause, Play, Plus, Radio, RotateCcw, Search, Settings2, ShieldAlert, Ship, Sun, Truck, Users, Waves, X, Zap } from 'lucide-react';
import { AssetBoundary, SceneFallback, SceneReadySignal, World } from './scene/World';
import { items, zones, type SiteItem } from './data/site';
import { useStore } from './store';
import { translations } from './i18n/translations';
import './styles.css';
import './monitoring-theme.css';
import './scene-loading.css';

const nav=[
 {id:'overview',icon:Compass},{id:'refinery',icon:Factory},{id:'storage',icon:Layers3},{id:'utilities',icon:Zap},{id:'truck',icon:Truck},{id:'marine',icon:Anchor},{id:'personnel',icon:Users},
];
function App(){
 const lang=useStore(s=>s.lang),quality=useStore(s=>s.quality),set=useStore(s=>s.set),selected=useStore(s=>s.selected),select=useStore(s=>s.select),mode=useStore(s=>s.mode),playing=useStore(s=>s.playing),speed=useStore(s=>s.speed),night=useStore(s=>s.night),flow=useStore(s=>s.flow),reset=useStore(s=>s.reset),resetKey=useStore(s=>s.resetKey);
 const t=translations[lang];const rtl=lang==='fa'; const [query,setQuery]=useState(''); const [help,setHelp]=useState(false); const [analytics,setAnalytics]=useState(false); const [clock,setClock]=useState(8*60+42); const {active:assetsLoading,progress:assetProgress}=useProgress(); const [sceneReady,setSceneReady]=useState(false); const [showLoading,setShowLoading]=useState(true);
 useEffect(()=>{if(!sceneReady||assetsLoading)return;const timer=window.setTimeout(()=>setShowLoading(false),550);return()=>window.clearTimeout(timer)},[sceneReady,assetsLoading]);
 const shownProgress=assetsLoading?Math.max(1,Math.min(99,Math.round(assetProgress))):sceneReady?100:Math.max(3,Math.round(assetProgress));
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=rtl?'rtl':'ltr';localStorage.setItem('pv-lang',lang)},[lang,rtl]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.tagName==='INPUT')return;const current=useStore.getState();const focus=current.focus||[0,0,0];if(e.key==='Escape'){select(null);set('search','');setHelp(false);return}if(e.key.toLowerCase()==='r'){reset();return}if(e.key.toLowerCase()==='f'&&current.selected){set('focus',[...current.selected.position]);return}const step=e.shiftKey?10:4;const move:Record<string,[number,number,number]>={w:[0,0,-step],ArrowUp:[0,0,-step],s:[0,0,step],ArrowDown:[0,0,step],a:[-step,0,0],ArrowLeft:[-step,0,0],d:[step,0,0],ArrowRight:[step,0,0]};if(move[e.key]||move[e.key.toLowerCase()]){e.preventDefault();const [dx,dy,dz]=move[e.key]||move[e.key.toLowerCase()];set('focus',[focus[0]+dx,focus[1]+dy,focus[2]+dz]);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[select,set,reset]);
 useEffect(()=>{const timer=setInterval(()=>{if(useStore.getState().playing)setClock(v=>(v+Math.max(1,Math.round(useStore.getState().speed*2)))%1440)},1000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{if(resetKey)setClock(8*60+42)},[resetKey]);
 const results=useMemo(()=>query.trim()?items.filter(i=>(i.fa+i.en+i.id+i.kind).toLowerCase().includes(query.toLowerCase())).slice(0,6):[],[query]);
 const currentZone=selected?zones.find(z=>z.id===selected.zone):null;
 const jump=(id:string)=>{set('mode',id);const dest=zones.find(z=>z.id===id);if(dest)set('focus',[...dest.position]);if(id==='overview')select(null)};
 const selectAsset=(item:SiteItem)=>{select(item);set('focus',[...item.position]);setQuery('')};
 const fullScreen=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
 const clockText=`${String(Math.floor(clock/60)).padStart(2,'0')}:${String(clock%60).padStart(2,'0')}`;
 return <div className={`app-shell ${night?'night':''}`} dir={rtl?'rtl':'ltr'}>
  <header className="topbar">
   <div className="brand-lockup"><div className="brand-mark"><Factory size={19}/><span/></div><div className="brand-name"><strong>PetroVista <b>3D</b></strong><small>EXPLORE · UNDERSTAND · SIMULATE</small></div></div>
   <div className="header-context"><span className="live-dot"/><span>{t.demo}</span><span className="header-divider"/><Clock3 size={14}/><b className="clock-value">{clockText}</b><span className="timezone">UTC+03:30</span></div>
   <div className="header-actions">
    <div className="search-wrap"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/>{query&&<button className="icon-button tiny" onClick={()=>setQuery('')}><X size={14}/></button>}
      <AnimatePresence>{query&&<motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="search-results">{results.length?results.map(i=><button key={i.id} className="result-row" onClick={()=>selectAsset(i)}><span className="result-icon"><Box size={15}/></span><span><b>{rtl?i.fa:i.en}</b><small>{i.id} · {rtl?i.en:i.fa}</small></span><ArrowDownLeft size={14}/></button>):<div className="empty-results">{t.noResults}</div>}</motion.div>}</AnimatePresence>
    </div>
    <button className="lang-toggle" onClick={()=>set('lang',rtl?'en':'fa')}><Globe2 size={15}/>{rtl?'EN':'فا'}</button>
    <button className="icon-button" title={t.help} onClick={()=>setHelp(true)}><CircleHelp size={17}/></button>
    <button className="icon-button" title="Fullscreen" onClick={fullScreen}><Maximize2 size={16}/></button>
   </div>
  </header>

  <main className="workspace">
   <div className="scene-wrap">
    <Canvas shadows fallback={<div className="webgl-fallback">{rtl?'مرورگر شما WebGL را فعال نکرده؛ شتاب‌دهی سخت‌افزاری مرورگر را روشن کنید.':'WebGL is unavailable. Enable browser hardware acceleration and reload.'}</div>} dpr={quality==='low'?1:quality==='medium'?1.2:[1,1.5]} onCreated={()=>setSceneReady(true)} onPointerMissed={()=>select(null)} orthographic camera={{position:[54,72,58],zoom:10.5,near:.1,far:300}} gl={{antialias:false,alpha:false,powerPreference:'high-performance'}}>
     <SceneReadySignal onReady={()=>setSceneReady(true)}/><AssetBoundary fallback={(error)=><SceneFallback message={error}/>}><World/></AssetBoundary>
    </Canvas>
    <div className="scene-topline"><div className="breadcrumb"><span>PetroVista</span><span className="crumb-slash">/</span><b>{mode==='overview'?t.overviewTitle:t[mode as keyof typeof t]||t.overviewTitle}</b></div><div className="scene-badges"><span className="weather"><Sun size={14}/>{night?'22° · Clear night':'28° · Clear'}</span><span className="scenario-label"><span/> DEMO SCENARIO 01</span></div></div>
    <div className="north-indicator"><span>N</span><div className="north-arrow"/><small>0°</small></div>
    <div className="mini-map"><div className="map-title"><span>{rtl?'نقشه سایت':'SITE MAP'}</span><span className="map-live"/></div><div className="map-art"><div className="map-road road-a"/><div className="map-road road-b"/><div className="map-zone z1"/><div className="map-zone z2"/><div className="map-zone z3"/><div className="map-zone z4"/><div className="map-sea"/><span className="map-pin"/></div><div className="map-footer"><span>1200 × 900 m</span><span>{rtl?'نمای کلی':'OVERVIEW'}</span></div></div>
    <div className="scene-tools"><button onClick={()=>set('focus',[0,0,0])} title={t.viewAll}><Compass size={16}/></button><button onClick={()=>set('focus',selected?[...selected.position]:[0,0,0])} title={rtl?'تمرکز روی انتخاب':'Focus selection'}><Plus size={17}/></button><button onClick={fullScreen} title="Fullscreen"><Maximize2 size={15}/></button></div>
    <div className="scene-legend"><span><i className="legend-pipe"/> {rtl?'خط لوله':'Pipeline'}</span><span><i className="legend-flow"/> {rtl?'جریان نمایشی':'Demo flow'}</span><span><i className="legend-asset"/> {rtl?'تجهیز فعال':'Active asset'}</span></div>
   </div>
   <aside className="left-rail">
    <div className="rail-head"><span>{rtl?'پایش و ناوبری سایت':'SITE MONITORING'}</span><span className="rail-head-code">PV / OPS</span></div>
    <div className="rail-status-card">
     <div className="rail-status-top"><span>{rtl?'خلاصه وضعیت':'SITE TELEMETRY'}</span><span className="demo-badge"><i/>{rtl?'نمایشی':'DEMO'}</span></div>
     <div className="rail-status-main"><span className="rail-status-icon"><Activity size={17}/></span><span><b>{rtl?'پایش محلی فعال':'Local monitor active'}</b><small>{rtl?'بدون اتصال به PLC':'No PLC connection'}</small></span><b className="rail-unit-count">18<span>/21</span></b></div>
     <div className="rail-status-track"><i/></div>
     <div className="rail-status-foot"><span>{rtl?'واحدهای پایدار · داده نمایشی':'UNITS IN DEMO VIEW'}</span><b>{clockText} <small>LOC</small></b></div>
    </div>
    <nav aria-label={rtl?'ناوبری مجتمع':'Facility navigation'}>{nav.map(({id,icon:Icon})=><button key={id} onClick={()=>jump(id)} className={`nav-item ${mode===id?'active':''}`}><span className="nav-icon"><Icon size={17}/></span><span>{t[id as keyof typeof t]}</span>{mode===id&&<i className="nav-active-mark"/>}</button>)}</nav>
    <div className="rail-divider"/><div className="zones-label">{rtl?'محدوده‌های سایت':'SITE ZONES'}</div>
    <div className="zone-list">{zones.slice(1,6).map((z,i)=><button key={z.id} onClick={()=>jump(z.id)} className={`zone-item ${mode===z.id?'selected':''}`}><span className={`zone-dot dot-${i}`}/><span>{rtl?z.fa:z.en}</span><small>{['08','12','06','04','02'][i]}</small></button>)}</div>
    <div className="rail-spacer"/>
    <div className="rail-alert"><span className="alert-symbol"><ShieldAlert size={15}/></span><span className="alert-copy"><b>{rtl?'خلاصه هشدارها':'ALARM SUMMARY'}</b><small><strong>P2 · TK-103</strong>{rtl?' · بازبینی برنامه‌ریزی‌شده':' · scheduled review'}</small></span><span className="alert-count">01</span></div>
    <button className="user-card" onClick={()=>setHelp(true)}><div className="avatar">PV</div><span><b>{rtl?'حالت بازدیدکننده':'Demo operator'}</b><small>{rtl?'پروفایل محلی':'Local session'}</small></span><Settings2 size={15}/></button>
   </aside>
   <aside className="inspector">
    <div className="inspector-head"><div><div className="eyebrow">{selected?rtl?'جزئیات تجهیز':'ASSET DETAILS':rtl?'مرکز عملیات':'OPERATIONS CENTER'}</div><h2>{selected?(rtl?selected.fa:selected.en):t.overviewTitle}</h2></div><button className="icon-button close-inspector" onClick={()=>select(null)} title={t.close}><X size={16}/></button></div>
    {selected?<>
      <div className="asset-identity"><div className={`asset-glyph ${selected.kind}`}><AssetIcon kind={selected.kind}/></div><div><b>{rtl?selected.fa:selected.en}</b><small>{selected.kind.toUpperCase()} · {selected.id}</small></div><span className="status-chip"><i/>{rtl?selected.status:'Operational'}</span></div>
      <div className="asset-stat-row"><div><span>{t.asset}</span><b>{selected.id}</b></div><div><span>{t.zone}</span><b>{currentZone?(rtl?currentZone.fa:currentZone.en):'—'}</b></div></div>
      {['tank','sphere-tank'].includes(selected.kind)&&<div className="tank-level-card"><div className="tank-card-top"><span>{t.fill}</span><b>{selected.fill}%</b></div><div className="level-track"><i style={{width:`${selected.fill}%`}}/></div><div className="capacity-line"><span>{t.capacity}</span><b>{selected.capacity} m³</b></div><div className="capacity-line"><span>{rtl?'موجودی شبیه‌سازی‌شده':'Simulated inventory'}</span><b>{Math.round(Number(selected.capacity?.replace(',',''))*(selected.fill||0)/100).toLocaleString()} m³</b></div></div>}
      {selected.kind==='truck'&&selected.id==='TR-014'&&<div className="vehicle-progress"><div><span>{t.loading}</span><b>67%</b></div><div className="level-track"><i style={{width:'67%'}}/></div><small><Truck size={13}/>{rtl?'بارگیری تانکر · جایگاه ۰۱ · داده نمایشی':'Road tanker · bay 01 · simulated volume'}</small></div>}
      {selected.kind==='truck'&&selected.id==='TR-027'&&<div className="vehicle-progress"><div><span>{rtl?'بارگیری بشکه‌ها':'Drum pallet loading'}</span><b>67%</b></div><div className="level-track"><i style={{width:'67%'}}/></div><small><Truck size={13}/>{rtl?'۴ از ۶ بشکه روی کفی · پالت دوم در حال انتقال':'4 of 6 drums on flatbed · second pallet transferring'}</small></div>}
      {selected.kind==='forklift'&&<div className="vehicle-progress"><div><span>{rtl?'انتقال پالت نمایشی':'Simulated pallet transfer'}</span><b>50%</b></div><div className="level-track"><i style={{width:'50%'}}/></div><small><Truck size={13}/>{rtl?'پالت دوم · دو بشکه · مقصد: TR-027':'Second pallet · two drums · destination: TR-027'}</small></div>}
      {selected.kind==='ship'&&<div className="vehicle-progress"><div><span>{rtl?'پیشرفت بارگیری نمایشی':'Demo loading progress'}</span><b>42%</b></div><div className="level-track"><i style={{width:'42%'}}/></div><small><Waves size={13}/>{rtl?'اسکله صادراتی · مخزن‌بندی مستقل':'Export berth · dedicated marine system'}</small></div>}
      {selected.kind==='worker'&&<div className="asset-stat-row worker-stats"><div><span>{rtl?'نقش شغلی':'ROLE'}</span><b>{rtl?selected.roleFa:selected.roleEn}</b></div><div><span>{rtl?'واحد سازمانی':'DEPARTMENT'}</span><b>{rtl?selected.departmentFa:selected.departmentEn}</b></div></div>}
      {selected.kind==='worker'&&<div className="worker-task"><Users size={14}/><span><small>{rtl?'فعالیت نمایشی':'SIMULATED TASK'}</small><b>{rtl?selected.taskFa:selected.taskEn}</b></span></div>}
      <section className="info-section"><div className="section-label">{t.about}</div><p>{rtl?selected.descriptionFa:selected.descriptionEn}</p></section>
      <section className="info-section"><div className="section-label">{t.connected}</div><div className="connection-chip"><span className="connection-dot"/>{['tank','sphere-tank'].includes(selected.kind)?(rtl?'خط لوله فرآورده · P-301A':'Product line · P-301A'):selected.kind==='ship'?(rtl?'بازوی بارگیری دریایی · اسکله ۰۱':'Marine loading arm · Berth 01'):selected.kind==='forklift'?(rtl?'پالت بشکه · کفی TR-027':'Drum pallet · flatbed TR-027'):selected.id==='TR-027'?(rtl?'پالت بشکه · لیفتراک FL-027':'Drum pallet · forklift FL-027'):(rtl?'هدر بارگیری تانکر · جایگاه ۰۱':'Tanker loading header · bay 01')}</div><div className="connection-chip"><span className="connection-dot muted"/>{selected.kind==='forklift'||selected.id==='TR-027'?(rtl?'مسیر جابه‌جایی محموله · نمایشی':'Simulated cargo-handling route'):(rtl?'سامانه کنترل مرکزی':'Central control system')}</div></section>
      <div className="sim-note"><Activity size={14}/><span>{rtl?'تمام داده‌ها و وضعیت‌ها نمایشی و شبیه‌سازی‌شده هستند.':'All figures and statuses are simulated demo data.'}</span></div>
      <button className="focus-button" onClick={()=>set('focus',[...selected.position])}><Maximize2 size={15}/>{rtl?'تمرکز دوربین روی تجهیز':'Focus camera on asset'}<ArrowDownLeft size={14}/></button>
    </>:<>
      <div className="site-health"><div className="health-ring"><div><strong>96</strong><small>/100</small></div></div><div><span className="health-label">{rtl?'وضعیت کلی مجتمع':'SITE HEALTH'}</span><b>{rtl?'عملیات پایدار':'Operations stable'}</b><small><i/> {rtl?'آخرین بروزرسانی همین حالا':'Updated just now'}</small></div></div>
      <div className="inspector-kpis"><Kpi icon={<Factory size={16}/>} label={t.active} value="18" meta={rtl?'از ۲۱ واحد':'of 21 units'} color="blue"/><Kpi icon={<Truck size={16}/>} label={t.trucks} value="02" meta={rtl?'۲ جایگاه آزاد':'2 bays available'} color="amber"/><Kpi icon={<Gauge size={16}/>} label={t.storageKpi} value="64%" meta={rtl?'۸ مخزن پایش‌شده':'8 monitored tanks'} color="slate"/></div>
      <section className="instrument-panel"><div className="section-row"><span className="section-label">{rtl?'نشانگرهای نمایشی':'DEMO INSTRUMENTS'}</span><span className="instrument-source"><i/>{rtl?'محلی':'LOCAL'}</span></div><InstrumentRow tag="FIC-101" label={rtl?'دبی خوراک خام':'Crude charge flow'} value="82.4%" fill={82}/><InstrumentRow tag="TIC-204" label={rtl?'دمای خروجی کوره':'Furnace outlet temp'} value="352°C" fill={68}/><InstrumentRow tag="PIC-207" label={rtl?'فشار برج تقطیر':'Column pressure'} value="1.42 bar" fill={54}/></section>
      <section className="mini-chart-section"><button className="chart-heading chart-open" onClick={()=>setAnalytics(true)}><div><span className="section-label">{rtl?'روند نمایشی تولید':'DEMO THROUGHPUT'}</span><b>42.8 <small>kt/day</small></b></div><span className="chart-change"><ArrowDownLeft size={12}/> 2.4%</span></button><MiniChart/></section>
      <section className="activity-section"><div className="section-row"><span className="section-label">{rtl?'فعالیت‌های اخیر':'RECENT ACTIVITY'}</span><button>{rtl?'مشاهده همه':'View all'}</button></div><ActivityRow icon={<Truck size={14}/>} title={rtl?'کامیون TR-014 وارد جایگاه شد':'TR-014 entered loading bay'} time="08:39" color="amber"/><ActivityRow icon={<Check size={14}/>} title={rtl?'بازبینی ایمنی TK-103 ثبت شد':'TK-103 safety review logged'} time="08:26" color="slate"/><ActivityRow icon={<Anchor size={14}/>} title={rtl?'نفت‌کش آذر به اسکله رسید':'MT Azar arrived at berth'} time="08:12" color="blue"/></section>
      <div className="demo-callout"><div className="callout-icon"><Radio size={16}/></div><div><b>{rtl?'محیط شبیه‌سازی تعاملی':'Interactive demo environment'}</b><p>{rtl?'با انتخاب تجهیزات روی صحنه، وضعیت و داده‌های نمایشی را بررسی کنید.':'Select equipment in the scene to inspect simulated states and data.'}</p></div></div>
    </>}
    <div className="inspector-foot"><span className="foot-dot"/>{rtl?'محیط نمایشی · بدون اتصال به سامانه واقعی':'DEMO ENVIRONMENT · NO LIVE SYSTEM CONNECTION'}</div>
   </aside>
  </main>
  <footer className="bottom-bar">
   <div className="bottom-left"><span className="bottom-state"><i/> {rtl?'شبیه‌سازی فعال':'SIMULATION ACTIVE'}</span><span className="bottom-sep"/><span><Building2 size={14}/>{rtl?'۲۱ واحد':'21 units'}</span><span><Cpu size={14}/>{rtl?'۵۲ تجهیز':'52 assets'}</span><span><Users size={14}/>{rtl?'۱۲ نفر':'12 personnel'}</span></div>
   <div className="bottom-controls"><button className={`flow-toggle ${flow?'enabled':''}`} onClick={()=>set('flow',!flow)}><span className="flow-toggle-icon"><Activity size={15}/></span>{flow?t.flowOn:t.flow}</button><div className="playback"><button onClick={()=>set('playing',!playing)} title={playing?t.pause:t.play}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><button onClick={reset} title={t.reset}><RotateCcw size={14}/></button><button className="speed-button" onClick={()=>set('speed',speed===.5?1:speed===1?2:speed===2?4:.5)}>{speed}×<ChevronDown size={12}/></button></div></div>
   <div className="bottom-right"><button className="mode-pill" onClick={()=>set('night',!night)}>{night?<Moon size={14}/>:<Sun size={14}/>} {night?t.night:t.day}</button><span className="bottom-sep"/><span className="time-label">{t.time}</span><b className="bottom-clock">{clockText}</b></div>
  </footer>
  <div className="right-zoom"><button onClick={()=>set('quality',useStore.getState().quality==='high'?'medium':useStore.getState().quality==='medium'?'low':'high')}><Settings2 size={14}/></button><div className="zoom-line"/><button onClick={()=>set('focus',[0,0,0])}><Compass size={14}/></button></div>
  <AnimatePresence>{showLoading&&<SceneLoading progress={shownProgress} rtl={rtl}/>}</AnimatePresence>
  <AnimatePresence>{help&&<Modal title={rtl?'راهنمای محیط':'Environment guide'} onClose={()=>setHelp(false)}><div className="help-grid"><HelpItem icon={<Compass/>} title={rtl?'حرکت در صحنه':'Navigate the scene'} text={rtl?'برای جابه‌جایی کلیک و بکشید؛ اسکرول برای زوم و راست‌کلیک برای چرخش.':'Drag to pan, scroll to zoom, and right-drag to rotate.'}/><HelpItem icon={<Box/>} title={rtl?'بازرسی تجهیزات':'Inspect assets'} text={rtl?'روی مخزن، واحد یا وسیله نقلیه کلیک کنید تا پنل جزئیات باز شود.':'Click a tank, unit, or vehicle to open its detail panel.'}/><HelpItem icon={<Activity/>} title={rtl?'جریان فرآیند':'Process flow'} text={rtl?'جریان نمایشی را برای دنبال کردن مسیر مفهومی پالایش فعال کنید.':'Turn on process flow to follow the illustrative refinery path.'}/><HelpItem icon={<Radio/>} title={rtl?'داده‌های نمایشی':'Demo data'} text={rtl?'همه مقادیر، وضعیت‌ها و فعالیت‌ها صرفاً نمایشی هستند.':'All values, statuses, and activities are simulated.'}/></div></Modal>}</AnimatePresence>
  <AnimatePresence>{analytics&&<Modal title={rtl?'تحلیل عملکرد نمایشی':'Demo performance analytics'} onClose={()=>setAnalytics(false)}><div className="analytics-summary"><Kpi icon={<Gauge/>} label={t.storageKpi} value="64%" meta="± 3.2%" color="blue"/><Kpi icon={<Activity/>} label={rtl?'نرخ فرآورش':'Throughput'} value="42.8" meta="kt/day · demo" color="blue"/><Kpi icon={<Bell/>} label={t.alerts} value="01" meta={rtl?'نیازمند بازبینی':'Review required'} color="amber"/></div><div className="large-chart"><MiniChart/><div>{rtl?'نمودار شاخص نمایشی ـ ۲۴ ساعت گذشته':'Illustrative performance index · last 24 hours'}</div></div></Modal>}</AnimatePresence>
 </div>;
}
function SceneLoading({progress,rtl}:{progress:number;rtl:boolean}){
 return <motion.div className="scene-loading-overlay" role="status" aria-live="polite" dir={rtl?'rtl':'ltr'} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.25}}>
  <div className="scene-loading-card">
   <div className="scene-loading-brand"><span><Factory size={23}/></span><div><b>PetroVista <i>3D</i></b><small>{rtl?'محیط نمایشی پالایشگاه':'REFINERY SITE VISUALIZATION'}</small></div></div>
   <div className="scene-loading-copy"><strong>{rtl?'در حال آماده‌سازی صحنه سه‌بعدی':'Preparing the 3D site'}</strong><span>{rtl?'بارگذاری مدل‌ها، بافت‌ها و محیط':'Loading models, materials and environment'}</span></div>
   <div className="scene-loading-progress" role="progressbar" aria-label={rtl?'پیشرفت بارگذاری صحنه':'Scene loading progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{width:`${progress}%`}}/></div>
   <div className="scene-loading-meta"><span>{rtl?'پیشرفت بارگذاری':'SCENE INITIALIZATION'}</span><b>{progress}%</b></div>
   <div className="scene-loading-foot"><i/>{rtl?'همه داده‌ها و وضعیت‌ها نمایشی هستند':'Illustrative data · no live control connection'}</div>
  </div>
 </motion.div>;
}
function AssetIcon({kind}:{kind:string}){if(kind==='worker')return <Users size={20}/>;if(kind==='tank'||kind==='sphere-tank')return <Layers3 size={20}/>;if(kind==='truck'||kind==='forklift')return <Truck size={20}/>;if(kind==='ship'||kind==='marine')return <Ship size={20}/>;if(kind==='process'||kind==='furnace')return <Factory size={20}/>;if(kind==='building')return <Building2 size={20}/>;if(kind==='cooling')return <Waves size={20}/>;return <Cpu size={20}/>}
function Kpi({icon,label,value,meta,color}:{icon:React.ReactNode;label:string;value:string;meta:string;color:string}){return <div className={`kpi-card ${color}`}><div className="kpi-icon">{icon}</div><span>{label}</span><b>{value}</b><small>{meta}</small></div>}
function InstrumentRow({tag,label,value,fill}:{tag:string;label:string;value:string;fill:number}){return <div className="instrument-row"><div className="instrument-main"><span className="instrument-tag">{tag}</span><span className="instrument-name">{label}</span><b>{value}</b></div><div className="instrument-meter" role="meter" aria-label={`${tag} ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill}><i style={{width:`${fill}%`}}/></div></div>}
function MiniChart(){return <div className="mini-chart"><div className="chart-grid"><i/><i/><i/></div><svg viewBox="0 0 320 84" preserveAspectRatio="none"><defs><linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#55b8d3" stopOpacity=".24"/><stop offset="1" stopColor="#55b8d3" stopOpacity="0"/></linearGradient></defs><path d="M0 59 C20 56,25 40,42 47 S63 61,80 40 S103 46,121 33 S145 44,163 28 S182 42,202 24 S226 34,244 20 S267 38,283 18 S306 21,320 9 V84 H0Z" fill="url(#chartfill)"/><path d="M0 59 C20 56,25 40,42 47 S63 61,80 40 S103 46,121 33 S145 44,163 28 S182 42,202 24 S226 34,244 20 S267 38,283 18 S306 21,320 9" fill="none" stroke="#55b8d3" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span></div></div>}
function ActivityRow({icon,title,time,color}:{icon:React.ReactNode;title:string;time:string;color:string}){return <div className="activity-row"><span className={`activity-icon ${color}`}>{icon}</span><b>{title}</b><small>{time}</small></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}><motion.div className="modal-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-button" onClick={onClose}><X size={16}/></button></div>{children}</motion.div></motion.div>}
function HelpItem({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="help-item"><span>{icon}</span><div><b>{title}</b><p>{text}</p></div></div>}
export default App;
