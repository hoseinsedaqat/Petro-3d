import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { items, type SiteItem } from '../data/site';
import { useStore } from '../store';
import { ProcessRefinery } from './ProcessSteelwork';
import { SphereTank } from './SphereTank';
import { CoolingBattery, CrudeReceiving, DesalterUnit, ElectricalSubstation, RefineryUnit, SulfurRecovery, WastewaterPlant } from './RefinerySections';
import { getWeatheredSteelMap } from './materials';

function ShorelineSeawall(){return <group>
 <Box position={[37.23,-.32,14]} scale={[.46,.72,48]} color="#626d69"/>
 <Box position={[37.23,.025,14]} scale={[.62,.09,48.5]} color="#858981"/>
 {Array.from({length:17},(_,i)=><Box key={`seawall-joint-${i}`} position={[37.472,-.31,-9.4+i*2.85]} scale={[.018,.6,.035]} color="#a19f93"/>)}
 <Box position={[37.23,-.71,14]} scale={[.58,.14,48.2]} color="#535e5a"/>
 </group>}
function SiteTerrain({night}:{night:boolean}){
 const geometry=useMemo(()=>{const land=new THREE.Shape();land.moveTo(-70,-50);land.lineTo(85,-50);land.lineTo(85,-38);land.lineTo(37,-38);land.lineTo(37,10);land.lineTo(85,10);land.lineTo(85,50);land.lineTo(-70,50);land.closePath();const surface=new THREE.ShapeGeometry(land,1);surface.rotateX(-Math.PI/2);surface.computeVertexNormals();return surface},[]);
 return <mesh geometry={geometry} position={[0,-.16,0]} receiveShadow><meshStandardMaterial color={night?'#253631':'#a6b19e'} roughness={1} side={THREE.DoubleSide}/></mesh>;
}
function WaterSurface({position,size,night}:{position:[number,number,number];size:[number,number];night:boolean}){
 const material=useMemo(()=>new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uNight:{value:0}},
  vertexShader:`uniform float uTime; varying vec2 vUv; varying float vWave; void main(){vUv=uv;vec3 p=position;float edge=min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y));float shoreFade=smoothstep(0.0,.055,edge);float a=sin(p.x*1.35+uTime*.85)*.035;float b=cos(p.y*1.12-uTime*.7)*.024;float c=sin((p.x+p.y)*.58+uTime*.42)*.018;float wave=(a+b+c)*shoreFade;p.z+=wave;vWave=wave;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader:`uniform float uTime; uniform float uNight; varying vec2 vUv; varying float vWave; void main(){float ripple=sin(vUv.x*46.0+sin(vUv.y*26.0+uTime*.42)*1.6+uTime*.9);float crosswave=cos(vUv.y*75.0-uTime*.74+sin(vUv.x*19.0)*.8);float glint=pow(max(0.0,ripple*crosswave),12.0)*.18;float depth=.5+.5*sin(vUv.x*8.0+vUv.y*5.0+uTime*.2);vec3 day=mix(vec3(.055,.20,.23),vec3(.16,.37,.38),depth);vec3 dark=mix(vec3(.008,.025,.045),vec3(.018,.075,.10),depth);vec3 color=mix(day,dark,uNight);color+=vec3(.34,.48,.42)*glint*(1.0-uNight*.35);color+=vec3(.035,.12,.16)*abs(vWave)*2.0;gl_FragColor=vec4(color,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  side:THREE.DoubleSide
 }),[]);
 useFrame((_,delta)=>{material.uniforms.uTime.value+=delta;material.uniforms.uNight.value=night?1:0});
 return <mesh position={position} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[size[0],size[1],112,112]}/><primitive object={material} attach="material"/></mesh>;
}
const floodlightSites:[number,number,number][]=[[-31,0,-22],[-19,0,3],[-1,0,8],[16,0,7],[28,0,6],[-18,0,16],[5,0,21],[35,0,-7],[35,0,24],[-17,0,22]];
function FloodlightMast({position,night}:{position:[number,number,number];night:boolean}){return <group position={position}>
 <Box position={[0,5.15,0]} scale={[.17,10.3,.17]} color="#637169"/><Box position={[0,.18,0]} scale={[.66,.36,.66]} color="#767a70"/>
 <Box position={[0,10.2,0]} scale={[1.55,.14,.14]} color="#707b73"/>
 {[-.52,.52].map((x,i)=><group key={i} position={[x,9.92,0]}>
  <Box position={[0,0,0]} scale={[.58,.24,.42]} color="#56635d"/>
  <mesh position={[0,-.14,.02]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.38,.22]}/><meshStandardMaterial color={night?'#fff2ce':'#aeb5a8'} emissive={night?'#ffc66e':'#000000'} emissiveIntensity={night?2.2:0} side={THREE.DoubleSide}/></mesh>
 </group>)}
 <mesh position={[0,10.55,0]}><sphereGeometry args={[.085,8,8]}/><meshStandardMaterial color="#b74736" emissive="#8d1e17" emissiveIntensity={night?1.4:.05}/></mesh>
 {night&&<pointLight position={[0,9.7,0]} color="#ffe4b3" intensity={34} distance={28} decay={2}/>}
 </group>}
function NightLighting({night}:{night:boolean}){return <group>{floodlightSites.map((position,i)=><FloodlightMast key={`floodlight-${i}`} position={position} night={night}/>)}</group>}
export class AssetBoundary extends Component<{fallback:(error:string)=>ReactNode;children:ReactNode},{failed:boolean;message:string}>{
 state={failed:false,message:''};
 static getDerivedStateFromError(error:Error){return {failed:true,message:error?.message||'Unknown 3D scene error'}}
 componentDidCatch(error:Error){console.error('PetroVista 3D runtime error:',error)}
 render(){return this.state.failed?this.props.fallback(this.state.message):this.props.children}
}
export function SceneFallback({message}:{message:string}){const fa=typeof document!=='undefined'&&document.documentElement.lang==='fa';const night=useStore(s=>s.night);return <>
 <color attach="background" args={[night?'#09121d':'#d6e0d5']}/><fog attach="fog" args={[night?'#09121d':'#d6e0d5',80,145]}/><ambientLight intensity={night?.2:1.25}/><directionalLight position={[-25,45,20]} intensity={night?.3:2} castShadow/>
 <NightLighting night={night}/>
 <SiteTerrain night={night}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-10,-.05,-8]}><planeGeometry args={[40,32]}/><meshStandardMaterial color="#a9aca0"/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[16,-.05,-8]}><planeGeometry args={[24,22]}/><meshStandardMaterial color="#b7b6a4"/></mesh>
 <WaterSurface position={[61.25,-.16,14]} size={[47.5,48]} night={night}/>
 <ShorelineSeawall/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[28.5,-.075,14]}><planeGeometry args={[11,38]}/><meshStandardMaterial color="#888c80" roughness={.92}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[34,.025,14]}><planeGeometry args={[6,38]}/><meshStandardMaterial color="#787b70" roughness={.88}/></mesh>
 {[-1,0,1].map((x,i)=><group key={`tower${i}`} position={[-13+x*5,0,-8]}><mesh position={[0,4.2,0]} castShadow><cylinderGeometry args={[.75,.95,8.4,20]}/><meshStandardMaterial color="#b9c1b6" metalness={.4} roughness={.5}/></mesh>{[1.4,3,5,7].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[1.08,1.08,.1,20]}/><meshStandardMaterial color="#d4b66f" metalness={.45}/></mesh>)}</group>)}
 <Flare item={items.find(x=>x.id==='FL-01')!}/>
 {Array.from({length:6},(_,i)=><group key={`tank${i}`} position={[12+(i%3)*5,0,-12+Math.floor(i/3)*8]}><mesh position={[0,1.4,0]} castShadow><cylinderGeometry args={[2,2,2.8,24]}/><meshStandardMaterial color="#aeb9ac" metalness={.35}/></mesh><mesh position={[0,2.83,0]}><cylinderGeometry args={[2,2,.12,24]}/><meshStandardMaterial color="#d3d0be"/></mesh></group>)}
 {items.filter(x=>x.kind==='sphere-tank').map(t=><SphereTank key={`fallback-${t.id}`} item={t}/>)}
 <Box position={[19.5,.34,-15.8]} scale={[22,.68,.38]} color="#777e73"/><Box position={[8.5,.34,-9]} scale={[.38,.68,13.2]} color="#777e73"/><Box position={[30.5,.34,-9]} scale={[.38,.68,13.2]} color="#777e73"/><Box position={[14,.34,-2.3]} scale={[11,.68,.38]} color="#777e73"/><Box position={[25,.34,-2.3]} scale={[11,.68,.38]} color="#777e73"/>
 <Pipe a={[7,1.35,-19.6]} b={[30,1.35,-19.6]} color="#bd6c51" radius={.15}/>{[9,15,21,27].map(x=><Pipe key={`fallback-lpg-${x}`} a={[x-1.55,1.35,-19.6]} b={[x-1.55,1.35,-21.2]} color="#bd6c51" radius={.1}/>)}
 <ProcessRefinery/><MainPipeway/><FacilityInterconnects/><ElectricalFeed/><FlowLines/>
 {items.filter(x=>x.id==='FCC-01'||x.id==='HDS-01').map(unit=><RefineryUnit key={`fallback-${unit.id}`} item={unit}/>)}
 <CrudeReceiving item={items.find(x=>x.id==='CRUDE-01')!}/><SulfurRecovery item={items.find(x=>x.id==='SRU-01')!}/><DesalterUnit item={items.find(x=>x.id==='DS-101')!}/><CoolingBattery item={items.find(x=>x.id==='CW-01')!}/><WastewaterPlant item={items.find(x=>x.id==='WWT-01')!}/><ElectricalSubstation item={items.find(x=>x.id==='SUB-01')!}/>
 {items.filter(x=>x.kind==='worker').map((person,i)=><WorkerFallback key={`fallback-${person.id}`} item={person} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/>)}
 <Building item={items.find(x=>x.id==='CCR-01')!} color="#697d72" size={[7,3.2,5]}/><Building item={items.find(x=>x.id==='LAB-01')!} color="#849389" size={[5,2.5,4]}/>
 <Building item={{...items.find(x=>x.id==='LAB-01')!,id:'WW-01',position:[-24,0,14],fa:'تصفیه‌خانه آب',en:'Water treatment',descriptionFa:'سامانه نمایشی تصفیه آب صنعتی.',descriptionEn:'Demo industrial water treatment facility.'}} color="#688178" size={[5,2.4,4]}/>
 <Building item={{...items.find(x=>x.id==='LAB-01')!,id:'FIRE-01',position:[-26,0,5],fa:'ایستگاه آتش‌نشانی',en:'Fire station'}} color="#8d6552" size={[5,2.3,3.5]}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-24,-.07,22]}><planeGeometry args={[20,12]}/><meshStandardMaterial color="#999d91"/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-25.8,-.03,25.85]}><planeGeometry args={[14.2,5.1]}/><meshStandardMaterial color="#555c57"/></mesh>
 {[-32.8,-30.45,-28.1,-25.75,-23.4,-21.05].map(x=><mesh key={`fallback-stall-${x}`} position={[x,.01,25.85]}><boxGeometry args={[.045,.02,4.55]}/><meshBasicMaterial color="#d8d0aa"/></mesh>)}
 {[-31.7,-29.35,-27,-24.65,-22.3,-19.95].map((x,i)=><CampusCar key={`fallback-car-${i}`} position={[x,.04,25.8]} color={['#5b716f','#c5c0ad','#87918b'][i%3]}/>)}
 {[[-31.4,17.3],[-30.5,23.8],[-17,17.6],[-17,21.8]].map(([x,z],i)=><CampusTree key={`fallback-tree-${i}`} position={[x,0,z]}/>)}
 <Box position={[-15.5,1.65,28.55]} scale={[5,.32,.45]} color="#536359"/><Box position={[-15.5,1.1,27.8]} scale={[4.15,.12,.13]} color="#d2bd78"/>
 <ShipFallback item={items.find(x=>x.id==='VES-08')!}/>
 {[-1,5,11,17,23,29].map(z=><group key={`port-bollard-${z}`} position={[36.72,.48,z]}><mesh><cylinderGeometry args={[.18,.22,.96,10]}/><meshStandardMaterial color="#4d5852" metalness={.45}/></mesh><mesh position={[0,.43,0]}><torusGeometry args={[.22,.045,6,14]}/><meshStandardMaterial color="#d0b774" metalness={.45}/></mesh></group>)}
 <MarineLoadingArm position={[32.2,0,4]} color="#c69d5d"/><MarineLoadingArm position={[32.2,0,18]} color="#d6d0bc"/>
 {[[-1,4],[5,8],[29,24],[23,20]].map(([start,end],i)=><Pipe key={`fallback-mooring-${i}`} a={[36.72,.95,start]} b={[38.2,1.48,end]} color="#39443e" radius={.045}/>)}
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,.02,7]}><planeGeometry args={[54,2.5]}/><meshStandardMaterial color="#404a46"/></mesh>
 <TruckTrafficSafety/>{[10,15,20].map(x=><group key={`fallback-truck-canopy-${x}`} position={[x,0,15]}><Box position={[0,3.3,0]} scale={[4,.25,5.4]} color="#b7aa84"/><Box position={[0,1.6,-2.2]} scale={[.16,3.2,.16]} color="#68776d"/><Box position={[0,1.6,2.2]} scale={[.16,3.2,.16]} color="#68776d"/></group>)}
 {items.filter(x=>x.kind==='truck').map((t,i)=><Truck key={`fallback-${t.id}`} item={t} index={i}/>)}
 <OrbitControls makeDefault target={[0,0,0]} minPolarAngle={.25} maxPolarAngle={Math.PI/2.12} minDistance={24} maxDistance={100}/>
 <Html center><div className="scene-crash-card"><strong>{fa?'حالت بازیابی صحنه':'Scene recovery mode'}</strong><span>{fa?'نمای ساده فعال است؛ خطای اصلی برای عیب‌یابی:':'Showing a lightweight fallback. Runtime error:'}</span><code>{message}</code></div></Html>
 </>}
function ClickGroup({item,children,position}: {item?:SiteItem;children:React.ReactNode;position?:[number,number,number]}) {
 const selected=useStore(s=>s.selected); const select=useStore(s=>s.select); const hot=selected?.id===item?.id;
 return <group position={position} onClick={e=>{if(item){e.stopPropagation();select(item)}}} onPointerOver={e=>{if(item){e.stopPropagation();document.body.style.cursor='pointer'}}} onPointerOut={()=>{document.body.style.cursor='auto'}}>
  {item&&<mesh visible={false}><cylinderGeometry args={[2.8,2.8,8,8]}/><meshBasicMaterial transparent opacity={0}/></mesh>}{children}
  {hot&&<mesh position={[0,.07,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.2,2.38,48]}/><meshBasicMaterial color="#e4b66e" transparent opacity={.9}/></mesh>}
 </group>;
}
function Box({position,scale,color='#74857b',...props}:any){return <mesh position={position} scale={scale} castShadow receiveShadow {...props}><boxGeometry/><meshStandardMaterial color={color} roughness={.78}/></mesh>}
function Pipe({a,b,color='#b1844e',radius=.12,emissive}: {a:[number,number,number];b:[number,number,number];color?:string;radius?:number;emissive?:string}) {
 const [ax,ay,az]=a,[bx,by,bz]=b;
 const pose=useMemo(()=>{const start=new THREE.Vector3(ax,ay,az),end=new THREE.Vector3(bx,by,bz),direction=end.clone().sub(start),length=direction.length();return {position:start.add(end).multiplyScalar(.5),orientation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()),length}},[ax,ay,az,bx,by,bz]);
 return <group position={pose.position} quaternion={pose.orientation}>
  <mesh castShadow><cylinderGeometry args={[radius,radius,pose.length,10]}/><meshStandardMaterial color={color} emissive={emissive??'#000000'} emissiveIntensity={emissive?1.8:0} metalness={.55} roughness={.42}/></mesh>
  {pose.length<3&&[-1,1].map(side=><mesh key={side} position={[0,side*(pose.length/2-.12),0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius*1.45,radius*.2,6,16]}/><meshStandardMaterial color="#a3a799" metalness={.68} roughness={.4}/></mesh>)}
 </group>;
}
function Tank({item}: {item:SiteItem}) {
 const fill=item.fill??60; const color=item.id.endsWith('103')?'#8c765e':'#aab6a8';
 return <ClickGroup item={item} position={item.position}>
   <mesh position={[0,1.45,0]} castShadow receiveShadow><cylinderGeometry args={[2.15,2.15,2.9,32]}/><meshStandardMaterial color={color} map={getWeatheredSteelMap()} metalness={.35} roughness={.62}/></mesh>
   <mesh position={[0,2.92,0]} castShadow><cylinderGeometry args={[2.15,2.15,.13,32]}/><meshStandardMaterial color="#aeb7aa" metalness={.42}/></mesh>
   <mesh position={[0,2.92,0]} scale={[1,.14,1]} castShadow><sphereGeometry args={[2.13,32,14,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#b9c1b4" map={getWeatheredSteelMap()} metalness={.38} roughness={.62}/></mesh>
   <mesh position={[0,2.99,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.08,.055,8,32]}/><meshStandardMaterial color="#67766d" metalness={.55}/></mesh>
   <mesh position={[0,.08,0]}><cylinderGeometry args={[2.1,2.1,.12,32]}/><meshStandardMaterial color="#d7a965"/></mesh>
   <mesh position={[2.22,1.5,0]}><boxGeometry args={[.12,2.65,.16]}/><meshStandardMaterial color="#303b35"/></mesh>
   <mesh position={[2.23,.22+(fill/100)*1.25,0]} scale={[1,fill/100,1]}><boxGeometry args={[.1,2.5,.17]}/><meshStandardMaterial color={fill>80?'#d86f59':'#77b58e'} emissive={fill>80?'#4e160f':'#12251b'} emissiveIntensity={.5}/></mesh>
   <mesh position={[2.31,.2+(fill/100)*2.5,0]}><boxGeometry args={[.22,.12,.2]}/><meshStandardMaterial color={fill>80?'#d86f59':'#77b58e'} emissive={fill>80?'#4e160f':'#12251b'} emissiveIntensity={.5}/></mesh>
   <mesh position={[0,3.05,0]}><cylinderGeometry args={[.42,.42,.16,16]}/><meshStandardMaterial color="#758276"/></mesh>
   <mesh position={[-2.19,1.3,.15]}><cylinderGeometry args={[.055,.055,2.5,8]}/><meshStandardMaterial color="#d9d8c8"/></mesh>
   <mesh position={[-2.2,.12,.15]}><boxGeometry args={[.45,.12,.45]}/><meshStandardMaterial color="#68746b"/></mesh>
   {[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*Math.PI/2)*2.18,1.45,Math.sin(i*Math.PI/2)*2.18]}><cylinderGeometry args={[.045,.045,2.85,6]}/><meshStandardMaterial color="#ddd9c8"/></mesh>)}
   <mesh position={[0,.04,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.17,2.28,32]}/><meshStandardMaterial color="#8e9b8d"/></mesh>
 </ClickGroup>;
}
function Tower({item,scale=1}: {item:SiteItem;scale?:number}) {
 return <ClickGroup item={item} position={item.position}>
  <mesh position={[0,4.5*scale,0]} castShadow><cylinderGeometry args={[.82*scale,1.18*scale,9*scale,20]}/><meshStandardMaterial color="#b6bcb0" map={getWeatheredSteelMap()} metalness={.46} roughness={.58}/></mesh>
  {[1.2,2.4,4,6.3,8].map((y)=><group key={y}><mesh position={[0,y*scale,0]}><cylinderGeometry args={[1.18*scale,1.18*scale,.1,24]}/><meshStandardMaterial color="#65756d" metalness={.7}/></mesh><mesh position={[0,y*scale+.12,0]}><cylinderGeometry args={[1.45*scale,1.45*scale,.06,24]}/><meshStandardMaterial color="#d7b66c" metalness={.5}/></mesh></group>)}
  {[2.5,5.8,8.15].map(y=><group key={`catwalk-${y}`}>
    <mesh position={[0,y*scale,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.2*scale,1.72*scale,32]}/><meshStandardMaterial color="#303a36" side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,(y+.58)*scale,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.7*scale,.035,6,32]}/><meshStandardMaterial color="#d8c58e"/></mesh>
    {Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return <mesh key={i} position={[Math.cos(a)*1.7*scale,(y+.3)*scale,Math.sin(a)*1.7*scale]}><cylinderGeometry args={[.025,.025,.58*scale,6]}/><meshStandardMaterial color="#d8c58e"/></mesh>})}
  </group>)}
  <mesh position={[0,9.15*scale,0]}><cylinderGeometry args={[.3*scale,.55*scale,.45*scale,16]}/><meshStandardMaterial color="#a8b3a9" metalness={.6}/></mesh>
  {[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*Math.PI/2)*1.25*scale,4.5*scale,Math.sin(i*Math.PI/2)*1.25*scale]}><boxGeometry args={[.07,8.7*scale,.07]}/><meshStandardMaterial color="#d3bd8a"/></mesh>)}
  <mesh position={[1.18*scale,4.55*scale,0]}><boxGeometry args={[.075,8.1*scale,.075]}/><meshStandardMaterial color="#a6b4ad"/></mesh><mesh position={[1.82*scale,4.55*scale,0]}><boxGeometry args={[.075,8.1*scale,.075]}/><meshStandardMaterial color="#a6b4ad"/></mesh>
  {Array.from({length:20},(_,i)=><mesh key={`tower-rung-${i}`} position={[1.5*scale,.65*scale+i*.39*scale,0]}><boxGeometry args={[.62*scale,.055,.055]}/><meshStandardMaterial color="#a6b4ad"/></mesh>)}
  {[3,5.5,8].map(y=><mesh key={`tower-cage-${y}`} position={[1.46*scale,y*scale,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.43*scale,.035,6,18]}/><meshStandardMaterial color="#d1bd8a"/></mesh>)}
 </ClickGroup>;
}
function Furnace({item}: {item:SiteItem}) {
 return <ClickGroup item={item} position={item.position}>
  <Box position={[0,1.4,0]} scale={[3.3,2.8,2.7]} color="#77776d"/><Box position={[0,2.95,0]} scale={[3.5,.22,2.9]} color="#c69d5d"/>
  <Box position={[0,4.2,0]} scale={[1.15,2.5,1.1]} color="#58645d"/><mesh position={[0,2,.02]}><planeGeometry args={[1.3,1.45]}/><meshBasicMaterial color="#ff9a38" transparent opacity={.72}/></mesh>
  <mesh position={[1.4,3.2,0]}><cylinderGeometry args={[.23,.32,4,12]}/><meshStandardMaterial color="#5d655e" metalness={.6}/></mesh>
  {[0,1,2,3].map(i=><mesh key={i} position={[-1.25+i*.8,3,.0]}><boxGeometry args={[.08,2.1,.08]}/><meshStandardMaterial color="#d0c9b5"/></mesh>)}
 </ClickGroup>;
}
function CampusCar({position,color}:{position:[number,number,number];color:string}){return <group position={position}>
 <Box position={[0,.55,0]} scale={[1.55,.55,3.55]} color={color}/><Box position={[0,.92,-.18]} scale={[1.28,.62,1.62]} color="#aab8b3"/><Box position={[0,.93,.22]} scale={[1.31,.52,1.45]} color="#30474a"/>
 <Box position={[0,.42,1.8]} scale={[1.46,.2,.16]} color="#525957"/><Box position={[0,.42,-1.8]} scale={[1.46,.2,.16]} color="#525957"/>
 {[-1,1].map(side=><group key={side}>{[-1,1].map(end=><group key={end} position={[side*.78,.36,end*1.12]} rotation={[0,0,Math.PI/2]}><mesh><cylinderGeometry args={[.32,.32,.16,12]}/><meshStandardMaterial color="#303532" roughness={.9}/></mesh><mesh position={[0,side*.09,0]}><cylinderGeometry args={[.16,.16,.025,12]}/><meshStandardMaterial color="#aeb1a4" metalness={.6}/></mesh></group>)}<Box position={[side*.79,.72,-.12]} scale={[.14,.15,.3]} color={color}/></group>)}
 {[-1,1].map(side=><group key={`lamp-${side}`}><Box position={[side*.48,.59,1.81]} scale={[.28,.16,.035]} color="#ead9a0"/><Box position={[side*.5,.6,-1.82]} scale={[.26,.13,.035]} color="#a44c3f"/></group>)}
 </group>}
function CampusTree({position}:{position:[number,number,number]}){return <group position={position}><mesh position={[0,.85,0]} castShadow><cylinderGeometry args={[.13,.2,1.7,8]}/><meshStandardMaterial color="#665443" roughness={1}/></mesh><mesh position={[0,2.05,0]} castShadow><sphereGeometry args={[1,10,9]}/><meshStandardMaterial color="#617957" roughness={1}/></mesh><mesh position={[.52,2.25,.06]} castShadow><sphereGeometry args={[.62,9,8]}/><meshStandardMaterial color="#718a61" roughness={1}/></mesh><mesh position={[-.45,1.97,-.12]} castShadow><sphereGeometry args={[.6,9,8]}/><meshStandardMaterial color="#536f52" roughness={1}/></mesh></group>}
function MarineLoadingArm({position,color}:{position:[number,number,number];color:string}){return <group position={position}>
 <Box position={[0,.24,0]} scale={[2.1,.34,2.8]} color="#6e786f"/>
 {[-.82,.82].map(x=><Box key={x} position={[x,1.65,-.72]} scale={[.14,3.05,.14]} color="#64736a"/>)}
 <Box position={[0,3.22,-.72]} scale={[1.9,.14,.16]} color="#768176"/>
 <Pipe a={[0,1.35,-.72]} b={[0,3.85,-.72]} color="#879188" radius={.13}/>
 <Pipe a={[-.75,1.15,-.72]} b={[0,3.8,-.72]} color="#c1ad76" radius={.07}/>
 <Pipe a={[0,3.85,-.72]} b={[2.1,3.85,.82]} color={color} radius={.16}/>
 <Pipe a={[2.1,3.85,.82]} b={[4.65,2.78,2.72]} color={color} radius={.16}/>
 <Pipe a={[4.65,2.78,2.72]} b={[4.65,2.13,2.72]} color={color} radius={.13}/>
 <Pipe a={[.45,1.95,-.72]} b={[.45,3.85,-.72]} color="#94a1a2" radius={.08}/>
 <Pipe a={[.45,3.85,-.72]} b={[2.35,3.85,.82]} color="#94a1a2" radius={.08}/>
 <Pipe a={[2.35,3.85,.82]} b={[4.65,2.82,2.72]} color="#94a1a2" radius={.08}/>
 <Pipe a={[4.65,2.82,2.72]} b={[4.65,2.2,2.72]} color="#94a1a2" radius={.07}/>
 <Pipe a={[1.55,2.2,.42]} b={[2.75,3.55,1.31]} color="#c2b17c" radius={.065}/>
 <mesh position={[2.1,3.85,.82]}><sphereGeometry args={[.25,12,10]}/><meshStandardMaterial color="#a6aaa0" metalness={.6}/></mesh>
 <mesh position={[4.65,2.78,2.72]}><sphereGeometry args={[.22,12,10]}/><meshStandardMaterial color="#a6aaa0" metalness={.6}/></mesh>
 <Box position={[4.65,1.8,2.72]} scale={[.6,.12,.72]} color="#c7b276"/>
 </group>}
function Building({item, color='#7c8980', size=[5,2.5,4]}:{item:SiteItem;color?:string;size?:[number,number,number]}) {
 const night=useStore(s=>s.night);const front=size[2]/2+.045;const columns=Math.max(3,Math.floor(size[0]/1.35));const spacing=size[0]/(columns+1);
 return <ClickGroup item={item} position={item.position}>
   <Box position={[0,.12,0]} scale={[size[0]+.38,.24,size[2]+.38]} color="#636c63"/>
   <Box position={[0,size[1]/2,0]} scale={size} color={color}/>
   <Box position={[0,size[1]-.12,0]} scale={[size[0]+.18,.2,size[2]+.18]} color="#a5a697"/>
   <Box position={[0,size[1]+.08,0]} scale={[size[0]+.52,.18,size[2]+.52]} color="#b19a6b"/>
   {/* Recessed entrance and a repeated glazed facade with clear mullions */}
   <Box position={[0,.79,front+.025]} scale={[1.18,1.5,.09]} color="#253b3a"/>
   <Box position={[0,1.5,front+.08]} scale={[1.38,.13,.32]} color="#c1a86f"/>
   <Box position={[0,.13,front+.31]} scale={[1.72,.26,.64]} color="#9a9b8c"/>
   {[.98,Math.min(2.16,size[1]-.5)].map((y,row)=><group key={row}>
    {Array.from({length:columns},(_,i)=>{const x=(i-(columns-1)/2)*spacing;if(row===0&&Math.abs(x)<.9)return null;return <group key={i}><mesh position={[x,y,front+.035]}><boxGeometry args={[Math.min(.86,spacing*.76),.68,.055]}/><meshStandardMaterial color="#233a3b" roughness={.32}/></mesh><mesh position={[x,y,front+.068]}><boxGeometry args={[Math.min(.72,spacing*.64),.51,.026]}/><meshStandardMaterial color={night?'#f3d8a4':row?'#9db2ad':'#91aaa2'} emissive={night?'#db9348':'#58766d'} emissiveIntensity={night?.95:.12} roughness={.28}/></mesh></group>})}
   </group>)}
   {[-1,1].map(i=><Box key={`rib-${i}`} position={[i*(size[0]/2-.16),size[1]/2,0]} scale={[.12,size[1],size[2]+.08]} color="#59685f"/>)}
   {/* Roof plant: screened ventilation units, ducts, and a small flue */}
   {[-1,1].map(i=><group key={`hvac-${i}`} position={[i*size[0]*.27,size[1]+.22,-size[2]*.14]}><Box position={[0,.22,0]} scale={[.92,.42,.72]} color="#737f76"/><Box position={[0,.46,0]} scale={[1,.08,.8]} color="#a9aa9e"/><mesh position={[0,.49,0]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[.21,.21,.035,16]}/><meshStandardMaterial color="#4d5c54"/></mesh></group>)}
   <mesh position={[size[0]/2-.38,size[1]+.46,-size[2]/2+.42]}><cylinderGeometry args={[.12,.16,.85,10]}/><meshStandardMaterial color="#78857b" metalness={.28}/></mesh>
   <Box position={[0,size[1]+.27,-size[2]/2-.25]} scale={[size[0]+.25,.3,.18]} color="#878c7e"/>
 </ClickGroup>;
}
function FlareFire(){
 const outer=useRef<THREE.Group>(null),core=useRef<THREE.Group>(null),embers=useRef<(THREE.Mesh|null)[]>([]);const phase=useRef(0);const night=useStore(s=>s.night);
 const outerProfile=useMemo(()=>[[0,0],[.11,.08],[.25,.2],[.38,.38],[.35,.57],[.28,.78],[.25,1.02],[.16,1.32],[.1,1.58],[.035,1.82],[0,1.9]].map(([r,y])=>new THREE.Vector2(r,y)),[]);
 const coreProfile=useMemo(()=>[[0,0],[.09,.08],[.18,.2],[.2,.34],[.14,.52],[.11,.72],[.06,.9],[.025,1.08],[0,1.16]].map(([r,y])=>new THREE.Vector2(r,y)),[]);
 useFrame((_,delta)=>{phase.current+=delta;const t=phase.current;if(outer.current){outer.current.scale.set(.9+Math.sin(t*9)*.07,.88+Math.sin(t*13)*.1,.91+Math.cos(t*7)*.06);outer.current.rotation.z=Math.sin(t*2.2)*.045;outer.current.position.x=Math.sin(t*1.3)*.055}if(core.current){core.current.scale.set(.94+Math.sin(t*12+.8)*.09,.94+Math.sin(t*15)*.1,.92+Math.cos(t*10)*.07)}embers.current.forEach((ember,i)=>{if(!ember)return;const rise=(t*.42+i*.31)%1;ember.position.set(Math.sin(t*2.3+i*2.1)*(.1+rise*.18),12.26+rise*1.7,Math.cos(t*1.9+i)*(.08+rise*.12));ember.scale.setScalar(.035*(1-rise))})});
 return <>
  <mesh position={[0,12.04,0]}><sphereGeometry args={[.24,12,10]}/><meshBasicMaterial color="#ffb047" toneMapped={false}/></mesh>
  <group ref={outer} position={[0,12.03,0]}>
   <mesh><latheGeometry args={[outerProfile,20]}/><meshBasicMaterial color="#ed4d12" transparent opacity={.78} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
   <mesh position={[.08,.08,.02]} scale={[.65,.88,.68]}><latheGeometry args={[outerProfile,16]}/><meshBasicMaterial color="#ff7b1b" transparent opacity={.62} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
  </group>
  <group ref={core} position={[0,12.05,0]}>
   <mesh><latheGeometry args={[coreProfile,18]}/><meshBasicMaterial color="#ffd36a" transparent opacity={.96} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
   <mesh position={[0,.05,0]} scale={[.52,.62,.52]}><latheGeometry args={[coreProfile,16]}/><meshBasicMaterial color="#fff2bb" transparent opacity={.88} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
  </group>
  {Array.from({length:5},(_,i)=><mesh key={`flare-ember-${i}`} ref={el=>{embers.current[i]=el}}><sphereGeometry args={[1,7,6]}/><meshBasicMaterial color={i%2?'#ff9c35':'#ffd26a'} toneMapped={false}/></mesh>)}
  <pointLight position={[0,12.45,.1]} color="#ff842d" intensity={night?46:2.5} distance={night?26:8} decay={2}/>
 </>;
}
function Flare({item}:{item:SiteItem}) {
 return <ClickGroup item={item} position={item.position}>
   <mesh position={[0,6,0]} castShadow><cylinderGeometry args={[.28,.5,12,16]}/><meshStandardMaterial color="#d3d0c2" metalness={.38} roughness={.6}/></mesh>
   {/* High-visibility weathered red/white stack bands and lightning rings */}
   {[1.8,5.8,9.8].map(y=><mesh key={`paint-${y}`} position={[0,y,0]}><cylinderGeometry args={[.5-y*.018,.5-y*.018,1.15,16]}/><meshStandardMaterial color="#a84e3f" roughness={.68}/></mesh>)}
   {[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*Math.PI/2)*.7,6,Math.sin(i*Math.PI/2)*.7]}><cylinderGeometry args={[.06,.06,12,6]}/><meshStandardMaterial color="#d1b875"/></mesh>)}
   {[0,1,2,3].map(i=><mesh key={`x${i}`} position={[0,1+i*2.7,0]} rotation={[0,i%2?Math.PI/4:-Math.PI/4,Math.PI/2]}><cylinderGeometry args={[.04,.04,1.8,6]}/><meshStandardMaterial color="#d1b875"/></mesh>)}
   {[4,8].map(y=><group key={`flare-deck-${y}`}><mesh position={[0,y,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.4,1.25,28]}/><meshStandardMaterial color="#303a36" side={THREE.DoubleSide}/></mesh><mesh position={[0,y+.55,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.22,.035,6,28]}/><meshStandardMaterial color="#d8c58e"/></mesh>{Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return <mesh key={i} position={[Math.cos(a)*1.22,y+.27,Math.sin(a)*1.22]}><cylinderGeometry args={[.025,.025,.52,6]}/><meshStandardMaterial color="#d8c58e"/></mesh>})}</group>)}
   <mesh position={[.54,6,0]}><boxGeometry args={[.055,10.4,.055]}/><meshStandardMaterial color="#dbc995"/></mesh>
   {Array.from({length:25},(_,i)=><mesh key={`flare-rung-${i}`} position={[.82,.8+i*.42,0]}><boxGeometry args={[.4,.045,.05]}/><meshStandardMaterial color="#dbc995"/></mesh>)}
   <FlareFire/>
 </ClickGroup>;
}
const truckRoute:[number,number][]=[[10,14],[23,14],[23,23],[6,23],[6,14]];
function routePoint(progress:number){const distance=(progress%1)*truckRoute.length,index=Math.floor(distance),part=distance-index,a=truckRoute[index],b=truckRoute[(index+1)%truckRoute.length];return {x:a[0]+(b[0]-a[0])*part,z:a[1]+(b[1]-a[1])*part,dx:b[0]-a[0],dz:b[1]-a[1]}}
function TruckTrafficSafety(){const night=useStore(s=>s.night);return <group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[16.5,-.026,14]}><planeGeometry args={[13.2,4.5]}/><meshStandardMaterial color="#414a47" roughness={.94}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[23,-.026,18.5]}><planeGeometry args={[4.5,9]}/><meshStandardMaterial color="#414a47" roughness={.94}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[14.5,-.026,23]}><planeGeometry args={[17,4.5]}/><meshStandardMaterial color="#414a47" roughness={.94}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[6,-.026,18.5]}><planeGeometry args={[4.5,9]}/><meshStandardMaterial color="#414a47" roughness={.94}/></mesh>
 {/* Continuous marked pedestrian route, physically guarded from the one-way truck loop. */}
 <mesh rotation={[-Math.PI/2,0,0]} position={[15,-.008,9.8]}><planeGeometry args={[20,1.8]}/><meshStandardMaterial color="#747d73" roughness={.9}/></mesh>
 {[8.95,10.65].map(z=><Box key={`walk-edge-${z}`} position={[15,.018,z]} scale={[20,.035,.07]} color="#dfd4a6"/>)}
 <Box position={[15,.38,11.65]} scale={[17.6,.76,.24]} color="#5e6965"/><Box position={[15,.81,11.65]} scale={[17.6,.1,.1]} color="#d4b878"/>
 {Array.from({length:10},(_,i)=>{const x=6.5+i*1.9;return <Box key={`walk-post-${i}`} position={[x,.47,11.65]} scale={[.12,.94,.32]} color="#68746f"/>})}
 {[4.2,25.8].map(x=><group key={`walk-lamp-${x}`}><Box position={[x,1.7,9.8]} scale={[.12,3.4,.12]} color="#596862"/><Box position={[x,3.42,9.8]} scale={[.7,.12,.18]} color="#b6a06d"/><mesh position={[x,3.34,9.8]}><sphereGeometry args={[.11,8,8]}/><meshStandardMaterial color={night?'#fff1c8':'#a8ad9c'} emissive={night?'#ffca76':'#000000'} emissiveIntensity={night?1.8:0}/></mesh>{night&&<pointLight position={[x,3.1,9.8]} color="#ffe0ac" intensity={3.2} distance={10} decay={2}/>}</group>)}
 {[11.5,12.5,13.5].map(z=><Box key={`bay-guide-${z}`} position={[16.5,.007,z]} scale={[13,.02,.07]} color={z===12.5?'#d6bb71':'#d3d0b9'}/>)}
 </group>}
function Truck({item,index}:{item:SiteItem;index:number}) {
 const ref=useRef<THREE.Group>(null);const wheelRefs=useRef<THREE.Mesh[]>([]);const progress=useRef(index*.47);const previousReset=useRef(useStore.getState().resetKey);const playing=useStore(s=>s.playing);const speed=useStore(s=>s.speed);const night=useStore(s=>s.night);const resetKey=useStore(s=>s.resetKey);const select=useStore(s=>s.select);const selected=useStore(s=>s.selected);
 useFrame((_,delta)=>{if(!ref.current)return;if(resetKey!==previousReset.current){progress.current=index*.47;previousReset.current=resetKey;}if(!playing)return;
  const candidate=(progress.current+delta*.024*speed)%1,next=routePoint(candidate);const blocked=items.some(person=>person.kind==='worker'&&Math.hypot(person.position[0]-next.x,person.position[2]-next.z)<3.8);
  if(!blocked)progress.current=candidate;const pose=routePoint(progress.current);ref.current.position.set(pose.x,.22,pose.z);ref.current.rotation.y=Math.atan2(-pose.dx,-pose.dz);wheelRefs.current.forEach(w=>w&&(w.rotation.x-=delta*speed*4));
 });
 const tanker=index===0,initialPose=routePoint(index*.47);
 return <group ref={ref} position={[initialPose.x,.22,initialPose.z]} rotation={[0,Math.atan2(-initialPose.dx,-initialPose.dz),0]} onClick={e=>{e.stopPropagation();select(item)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}>
  <mesh position={[0,1.05,.1]}><boxGeometry args={[2.6,2.2,5.9]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  {selected?.id===item.id&&<mesh position={[0,.035,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.45,2.65,32]}/><meshBasicMaterial color="#e4b66e"/></mesh>}
  {/* Box-section chassis, cross-members, fuel tank and a sprung cab */}
  <Box position={[0,.68,.35]} scale={[1.34,.34,5.05]} color="#394642"/>
  {[-1.45,-.35,.75,1.85].map(z=><Box key={`crossmember-${z}`} position={[0,.53,z]} scale={[1.62,.12,.16]} color="#53615d"/>)}
  <Box position={[0,.83,-1.26]} scale={[1.52,.2,.28]} color="#7c887e"/>
  {/* cab nose, dark glazing, door frames, mirrors, grille, lamps and impact bumper */}
  <Box position={[0,1.27,-1.48]} scale={[1.55,1.22,1.42]} color={index?'#526c70':'#4f6b60'}/>
  <Box position={[0,1.57,-2.205]} scale={[1.16,.56,.045]} color="#29434a"/>
  {[-1,1].map(side=><group key={`cab-side-${side}`}>
   <Box position={[side*.79,1.49,-1.55]} scale={[.04,.52,.64]} color="#34505a"/>
   <Box position={[side*.79,1.02,-1.48]} scale={[.04,.62,.72]} color={index?'#526c70':'#4f6b60'}/>
   <Box position={[side*.81,1.08,-1.31]} scale={[.055,.045,.12]} color="#c0b07d"/>
   <Pipe a={[side*.78,1.65,-1.88]} b={[side*1.01,1.82,-2.05]} color="#687672" radius={.035}/>
   <Box position={[side*1.05,1.81,-2.05]} scale={[.28,.18,.08]} color="#33444a"/>
  </group>)}
  <Box position={[0,.91,-2.24]} scale={[.9,.32,.08]} color="#293431"/>
  {[-.32,-.16,0,.16,.32].map(x=><Box key={`grille-${x}`} position={[x,.92,-2.29]} scale={[.045,.25,.025]} color="#aab4aa"/>)}
  {[-.55,.55].map(x=><group key={`headlamp-${x}`}><Box position={[x,1.15,-2.29]} scale={[.23,.18,.09]} color="#d9c78d"/><mesh position={[x,1.15,-2.345]} rotation={[0,Math.PI,0]}><planeGeometry args={[.19,.12]}/><meshBasicMaterial color={night?'#fff0bf':'#d9cfaa'} toneMapped={false}/></mesh>{night&&<pointLight position={[x,1.1,-2.38]} color="#ffe7b1" intensity={2.1} distance={7} decay={2}/>}<Box position={[x,.57,-2.34]} scale={[.55,.18,.3]} color="#687670"/></group>)}
  <Box position={[0,.58,-2.39]} scale={[1.9,.18,.24]} color="#7b8178"/>
  <Box position={[0,1.89,-1.02]} scale={[1.56,.1,.12]} color="#c1ac76"/>
  {/* Fuel tank, side steps, rear lamps and three axle sets */}
  <Box position={[sideValue(index),.62,-.48]} scale={[.34,.42,.62]} color="#a4a99d"/>
  {[-1,1].map(side=><group key={`side-step-${side}`}><Box position={[side*.78,.53,-.99]} scale={[.18,.1,.56]} color="#9da49a"/><Box position={[side*.8,.37,-1.04]} scale={[.21,.07,.44]} color="#343d39"/></group>)}
  {[-1.38,.45,1.72].map((z,axle)=>[-1,1].map((side,si)=>{const n=axle*2+si;return <group key={`wheel-${n}`}>
   <mesh ref={el=>{if(el)wheelRefs.current[n]=el}} position={[side*.86,.37,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.34,.34,.2,16]}/><meshStandardMaterial color="#222927" roughness={.94}/></mesh>
   <mesh position={[side*.975,.37,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.15,.15,.035,12]}/><meshStandardMaterial color="#a6aaa0" metalness={.52}/></mesh>
   <mesh position={[side*1.0,.37,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.055,.055,.045,10]}/><meshStandardMaterial color="#5c6863" metalness={.52}/></mesh>
  </group>}))}
  {tanker?<group>
   {/* Polished horizontal road tanker, saddles, circumferential weld seams, top manway and service ladder */}
   <Box position={[0,.91,.78]} scale={[1.45,.2,3.72]} color="#66716c"/>
   {[-.54,1.02,2.06].map(z=><group key={`tank-saddle-${z}`}><Box position={[0,1.04,z]} scale={[1.32,.16,.18]} color="#4f5d58"/><Box position={[0,1.16,z]} scale={[1.24,.1,.12]} color="#89938a"/></group>)}
   <mesh position={[0,1.34,.82]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.66,.68,3.62,24,2,false]}/><meshStandardMaterial color="#aeb8ae" metalness={.62} roughness={.31}/></mesh>
   {[-.87,-.55,-.23,.09,.41,1.37,1.69,2.01,2.33,2.55].map(z=><mesh key={`tank-seam-${z}`} position={[0,1.34,z]}><torusGeometry args={[.655,.027,6,20]}/><meshStandardMaterial color="#d1d0c1" metalness={.68} roughness={.34}/></mesh>)}
   <Box position={[0,2.03,.82]} scale={[.42,.08,.55]} color="#818d85"/>
   <mesh position={[0,2.11,.82]}><cylinderGeometry args={[.18,.18,.12,12]}/><meshStandardMaterial color="#c2b98e" metalness={.46}/></mesh>
   <Box position={[0,2.18,.82]} scale={[.28,.045,.28]} color="#596760"/>
   <Box position={[0,1.4,2.66]} scale={[1.12,.18,.12]} color="#727d75"/>
   <Box position={[0,.62,2.91]} scale={[1.65,.18,.18]} color="#90978b"/>
   {[-1,1].map(side=><group key={`tank-ladder-${side}`}>
    <Box position={[side*.67,1.34,1.95]} scale={[.055,.94,.055]} color="#d3c08c"/>
    <Box position={[side*.67,1.34,2.57]} scale={[.055,.94,.055]} color="#d3c08c"/>
    {[.92,1.12,1.32,1.52,1.72].map(y=><Box key={y} position={[side*.67,y,2.26]} scale={[.07,.045,.68]} color="#d3c08c"/>)}
   </group>)}
   <Box position={[0,.58,2.98]} scale={[1.85,.16,.2]} color="#bd6d4d"/>
  </group>:<group>
   {/* Flatbed with timbered deck, steel headboard, six oil drums and ratchet tie-down straps */}
   <Box position={[0,.98,.75]} scale={[1.9,.28,3.65]} color="#67736d"/>
   {[-.84,.84].map(x=><Box key={`bed-rail-${x}`} position={[x,1.2,.75]} scale={[.09,.16,3.45]} color="#acb0a2"/>)}
   {[-.63,-.43,-.23,-.03,.17,.37,.57,.77,.97,1.17,1.37,1.57,1.77,1.97,2.17].map(z=><Box key={`deck-rib-${z}`} position={[0,1.14,z]} scale={[1.74,.035,.045]} color="#a79b79"/>)}
   <Box position={[0,1.72,-1.08]} scale={[1.86,1.22,.16]} color="#69746e"/>
   {[-.55,.55].map(x=><Box key={`headboard-mesh-${x}`} position={[x,1.75,-.98]} scale={[.055,1.08,.045]} color="#c0b27f"/>)}
   {[-.4,.4].map((x,xi)=>[.02,.82,1.62].map((z,zi)=>{const drumColor=['#9e7043','#b18a4d','#647a7d','#a26b49','#8b9a8d','#ba8e4e'][(xi*3+zi)%6];return <group key={`oil-drum-${xi}-${zi}`}>
    <Box position={[x,1.15,z]} scale={[.49,.08,.52]} color="#786d54"/>
    <mesh position={[x,1.52,z]} castShadow><cylinderGeometry args={[.22,.22,.68,18]}/><meshStandardMaterial color={drumColor} metalness={.38} roughness={.56}/></mesh>
    {[1.29,1.51,1.74].map(y=><mesh key={y} position={[x,y,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.217,.018,5,16]}/><meshStandardMaterial color="#d2c9ae" metalness={.48} roughness={.44}/></mesh>)}
    <mesh position={[x,1.87,z]}><cylinderGeometry args={[.17,.17,.035,14]}/><meshStandardMaterial color="#737e77" metalness={.48}/></mesh>
    <mesh position={[x+.075,1.895,z-.035]}><cylinderGeometry args={[.025,.025,.025,8]}/><meshStandardMaterial color="#b7ae8f" metalness={.42}/></mesh>
   </group>}))}
   {[.42,1.22,2.02].map(z=><group key={`load-strap-${z}`}><Box position={[0,1.94,z]} scale={[1.86,.055,.075]} color="#353c3b"/><Box position={[-.91,1.55,z]} scale={[.055,.78,.075]} color="#353c3b"/><Box position={[.91,1.55,z]} scale={[.055,.78,.075]} color="#353c3b"/><Box position={[-.98,1.38,z]} scale={[.16,.12,.12]} color="#bd9658"/><Box position={[.98,1.38,z]} scale={[.16,.12,.12]} color="#bd9658"/></group>)}
   <Box position={[0,.66,2.77]} scale={[1.78,.2,.2]} color="#bd6d4d"/>
   <Box position={[0,.78,-1.1]} scale={[1.82,.16,.14]} color="#b79d60"/>
  </group>}
  {/* Rear lamps and conspicuity tape */}
  {[-.68,.68].map(x=><group key={`rear-light-${x}`}><Box position={[x,.94,2.98]} scale={[.22,.3,.06]} color="#c95542"/><Box position={[x,.55,2.99]} scale={[.24,.18,.065]} color="#e3bf65"/></group>)}
 </group>;
}
function sideValue(index:number){return index===0?-.75:.75}
const shipModelUrl=`${import.meta.env.BASE_URL}models/ships/oil-tanker.glb`;
const workerModelUrl=`${import.meta.env.BASE_URL}models/workers/cesium-man.glb`;
useGLTF.preload(shipModelUrl);
useGLTF.preload(workerModelUrl);
function Ship({item}:{item:SiteItem}) {
 const ref=useRef<THREE.Group>(null); const playing=useStore(s=>s.playing);const phase=useRef(0);const gltf=useGLTF(shipModelUrl);
 const model=useMemo(()=>gltf.scene.clone(true),[gltf.scene]);
 useEffect(()=>{model.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];const tuned=materials.map(source=>{const material=source.clone() as THREE.MeshStandardMaterial;if(material.name==='Material.002'){material.color.set('#314b45');material.roughness=.72;material.metalness=.2;}return material;});mesh.material=Array.isArray(mesh.material)?tuned:tuned[0];}})},[model]);
 useFrame((_,delta)=>{if(ref.current&&playing){phase.current+=delta;ref.current.position.y=.16+Math.sin(phase.current*.8)*.09;ref.current.rotation.z=Math.sin(phase.current*.45)*.012}});
 return <ClickGroup item={item} position={item.position}><group ref={ref}>
   <Center top><primitive object={model} scale={.2}/></Center>
   <mesh position={[0,1.9,0]}><boxGeometry args={[4.8,6.2,34]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
   <pointLight position={[0,2,-8]} color="#e9c77d" intensity={1.5} distance={8}/>
  </group></ClickGroup>;
}
function Worker({item,color,index}:{item:SiteItem;color:string;index:number}) {
 const actorRoot=useRef<THREE.Group>(null);const playing=useStore(s=>s.playing);const speed=useStore(s=>s.speed);const gltf=useGLTF(workerModelUrl);const phase=useRef(index*Math.PI/2.7);
 const actor=useMemo(()=>cloneSkinned(gltf.scene),[gltf.scene]);const {actions,mixer}=useAnimations(gltf.animations,actorRoot);
 const walksInDemo=['OP-014','MT-021','UT-003','LD-014','MR-008'].includes(item.id);
 const helmet=['#e9e3d4','#d8aa46','#dd8149','#e9e3d4','#d8aa46','#e9e3d4','#d8aa46','#e9e3d4'][index%8];
 useEffect(()=>{const cycle=Object.values(actions).find(Boolean);if(cycle&&walksInDemo){cycle.reset();cycle.time=(index*.31)%Math.max(.1,cycle.getClip().duration);cycle.play()}return()=>{cycle?.fadeOut(.12)}},[actions,index,walksInDemo]);
 useEffect(()=>{mixer.timeScale=playing&&walksInDemo?Math.max(.15,speed*.42):0},[mixer,playing,speed,walksInDemo]);
 useFrame((_,delta)=>{const root=actorRoot.current;if(!root)return;if(!playing||!walksInDemo){root.position.x=0;root.position.z=0;return;}phase.current+=delta*.32*speed;const x=Math.sin(phase.current)*.42,z=Math.sin(phase.current*.5)*.2;root.position.set(x,0,z);root.rotation.y=Math.atan2(Math.cos(phase.current)*.13,Math.cos(phase.current*.5)*.05);});
 return <ClickGroup item={item} position={item.position}>
  <group ref={actorRoot} scale={1.04}>
   <primitive object={actor}/>
   {/* PPE follows the individual worker: high-visibility vest, silver retroreflective tape, helmet, boots and personal gas monitor. */}
   <mesh position={[0,.94,.13]} castShadow><cylinderGeometry args={[.2,.24,.43,12]}/><meshStandardMaterial color={color} roughness={.72}/></mesh>
   {[.79,1.06].map(y=><mesh key={`reflect-${y}`} position={[0,y,.135]}><cylinderGeometry args={[.235,.235,.045,12]}/><meshStandardMaterial color="#d8d8cd" metalness={.22} roughness={.36}/></mesh>)}
   {[-.095,.095].map(x=><mesh key={`tape-${x}`} position={[x,.95,.244]}><boxGeometry args={[.035,.31,.025]}/><meshStandardMaterial color="#dddcd0" metalness={.18}/></mesh>)}
   <mesh position={[0,1.43,0]} castShadow><sphereGeometry args={[.18,16,10,0,Math.PI*2,0,Math.PI*.52]}/><meshStandardMaterial color={helmet} roughness={.55}/></mesh>
   <mesh position={[0,1.425,0]} castShadow><cylinderGeometry args={[.205,.205,.035,16]}/><meshStandardMaterial color={helmet} roughness={.55}/></mesh>
   <mesh position={[.17,1.08,.15]} castShadow><boxGeometry args={[.105,.17,.085]}/><meshStandardMaterial color="#303a42" roughness={.72}/></mesh>
   <mesh position={[.17,1.19,.15]}><cylinderGeometry args={[.018,.018,.12,8]}/><meshStandardMaterial color="#87939b" metalness={.5}/></mesh>
   <mesh position={[-.045,.99,.26]}><boxGeometry args={[.095,.11,.045]}/><meshStandardMaterial color="#2a343b"/></mesh>
   <mesh position={[-.045,.99,.288]}><boxGeometry args={[.052,.058,.012]}/><meshBasicMaterial color="#edb95f"/></mesh>
   {/* A field engineer carries an inspection tablet; maintenance carries a compact hand tool. */}
   {['EN-006','CR-002','LD-014'].includes(item.id)&&<group position={[-.2,.73,.28]} rotation={[.12,0,-.16]}><mesh castShadow><boxGeometry args={[.31,.39,.045]}/><meshStandardMaterial color="#27333a" metalness={.32} roughness={.42}/></mesh><mesh position={[0,0,.027]}><boxGeometry args={[.25,.31,.012]}/><meshStandardMaterial color="#527d8b" emissive="#244b5a" emissiveIntensity={.22}/></mesh><mesh position={[0,-.18,.038]}><boxGeometry args={[.11,.018,.01]}/><meshStandardMaterial color="#b9c6c4"/></mesh></group>}
   {item.id==='MT-021'&&<group position={[.28,.65,.23]} rotation={[0,0,-.4]}><Pipe a={[0,-.17,0]} b={[0,.18,0]} color="#9aa4a8" radius={.035}/><Pipe a={[-.12,.18,0]} b={[.12,.18,0]} color="#c2b27d" radius={.035}/></group>}
   <mesh position={[-.07,.12,.015]} castShadow><boxGeometry args={[.17,.14,.29]}/><meshStandardMaterial color="#343a3e" roughness={.9}/></mesh>
   <mesh position={[.07,.12,.015]} castShadow><boxGeometry args={[.17,.14,.29]}/><meshStandardMaterial color="#343a3e" roughness={.9}/></mesh>
  </group>
 </ClickGroup>;
}
function WorkerFallback({item,color}:{item:SiteItem;color:string}){return <ClickGroup item={item} position={item.position}>
 <mesh position={[0,.83,0]}><boxGeometry args={[.85,1.85,.85]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {/* Tailored workwear, articulated limbs, reflective PPE and work boots; a locally built fallback, not a cylinder-person. */}
 <mesh position={[0,.98,0]} castShadow><cylinderGeometry args={[.22,.28,.53,12]}/><meshStandardMaterial color="#38444b" roughness={.82}/></mesh>
 <mesh position={[0,.99,.145]} castShadow><boxGeometry args={[.4,.48,.08]}/><meshStandardMaterial color={color} roughness={.72}/></mesh>
 {[.82,1.1].map(y=><mesh key={y} position={[0,y,.2]}><boxGeometry args={[.38,.05,.035]}/><meshStandardMaterial color="#deddd0" metalness={.2}/></mesh>)}
 {[-.1,.1].map(x=><mesh key={x} position={[x,.98,.21]}><boxGeometry args={[.035,.33,.03]}/><meshStandardMaterial color="#e4e0cf" metalness={.2}/></mesh>)}
 <mesh position={[0,1.42,0]} castShadow><sphereGeometry args={[.16,14,10]}/><meshStandardMaterial color="#c69b79" roughness={.86}/></mesh>
 <mesh position={[0,1.58,0]} castShadow><sphereGeometry args={[.19,16,10,0,Math.PI*2,0,Math.PI*.52]}/><meshStandardMaterial color="#e0b04f" roughness={.55}/></mesh>
 <mesh position={[0,1.56,0]}><cylinderGeometry args={[.21,.21,.04,16]}/><meshStandardMaterial color="#d8a33f"/></mesh>
 {[-.37,.37].map(x=><group key={x}><Pipe a={[x*.58,1.15,0]} b={[x,.72,0]} color="#52616a" radius={.09}/><mesh position={[x,.7,.015]}><sphereGeometry args={[.09,10,8]}/><meshStandardMaterial color="#37434b"/></mesh><Pipe a={[x,.68,0]} b={[x*1.05,.26,.02]} color="#36424a" radius={.085}/><mesh position={[x*1.05,.13,.08]} castShadow><boxGeometry args={[.2,.17,.36]}/><meshStandardMaterial color="#30373b" roughness={.9}/></mesh></group>)}
 {[-1,1].map(side=><group key={side}><Pipe a={[side*.2,1.15,0]} b={[side*.34,.88,.07]} color="#38444b" radius={.075}/><mesh position={[side*.34,.87,.08]}><sphereGeometry args={[.075,9,8]}/><meshStandardMaterial color="#c69b79"/></mesh></group>)}
 <mesh position={[.2,.9,.18]}><boxGeometry args={[.12,.18,.11]}/><meshStandardMaterial color="#303a42"/></mesh>
 <mesh position={[-.16,.78,.22]}><boxGeometry args={[.25,.28,.055]}/><meshStandardMaterial color="#27333a" metalness={.28}/></mesh>
 </ClickGroup>}
function TankerHull(){
 const geometry=useMemo(()=>{
  const stations=[[-17,.08,.72,1.65],[-15,.72,.12,1.82],[-11,1.55,-.18,2],[-7,1.9,-.38,2.05],[7,1.9,-.38,2.05],[11,1.55,-.18,2],[15,.82,.12,1.85],[17,.12,.78,1.7]] as const;
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];const profile=(w:number,b:number,d:number)=>[[0,b],[w*.72,b+.12],[w,b+.48],[w,d-.08],[-w,d-.08],[-w,b+.48],[-w*.72,b+.12]];
  stations.forEach(([z,w,b,d])=>profile(w,b,d).forEach(([x,y])=>{positions.push(x,y,z);const low=y<.28;colors.push(...(low?[.48,.24,.19]:y>d-.25?[.34,.38,.35]:[.13,.22,.21]));}));
  for(let s=0;s<stations.length-1;s++)for(let p=0;p<7;p++){const a=s*7+p,b=s*7+(p+1)%7,c=(s+1)*7+p,d=(s+1)*7+(p+1)%7;indices.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[]);
 return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors side={THREE.DoubleSide} metalness={.24} roughness={.72}/></mesh>;
}
function ShipFallback({item}:{item:SiteItem}){return <ClickGroup item={item} position={item.position}>
 <mesh position={[0,1.8,0]}><boxGeometry args={[4.8,5.8,34]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 <TankerHull/>
 {/* Continuous cargo deck with hatch domes, longitudinal oil lines and visible loading manifolds */}
 <mesh position={[0,1.86,0]} castShadow><boxGeometry args={[3.35,.12,27]}/><meshStandardMaterial color="#555b51" metalness={.3} roughness={.78}/></mesh>
 {[-12,-8,-4,0,4,8,12].map((z,i)=><group key={`hatch-${i}`} position={[0,0,z]}><mesh position={[0,2.02,0]}><cylinderGeometry args={[.46,.48,.22,16]}/><meshStandardMaterial color="#b8b9ac" metalness={.38} roughness={.55}/></mesh><mesh position={[0,2.16,0]} scale={[1,.26,1]}><sphereGeometry args={[.45,16,10,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#c4c4b6" metalness={.35} roughness={.52}/></mesh><mesh position={[0,2.04,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.47,.035,6,20]}/><meshStandardMaterial color="#b68c55" metalness={.55}/></mesh></group>)}
 <Pipe a={[-.75,2.35,-13]} b={[-.75,2.35,12]} color="#9f7545" radius={.11}/><Pipe a={[.75,2.35,-13]} b={[.75,2.35,12]} color="#789594" radius={.1}/>
 {[-1,1].map(side=><group key={side}>
  <Box position={[side*1.72,2.22,0]} scale={[.07,.7,26]} color="#d2bd83"/>
  {Array.from({length:17},(_,i)=><Box key={i} position={[side*1.72,2.16,-12.5+i*1.55]} scale={[.09,.58,.09]} color="#d2bd83"/>)}
  <Box position={[side*1.72,2.54,0]} scale={[.07,.07,26]} color="#d2bd83"/>
 </group>)}
 {/* Aft accommodation block, bridge glazing, funnel and navigation mast */}
 <Box position={[0,3.05,12.4]} scale={[2.8,2.55,3.25]} color="#e0ded0"/>
 <Box position={[0,3.68,14.06]} scale={[2.25,.88,.055]} color="#28444a"/>
 {[-.72,0,.72].map(x=><mesh key={x} position={[x,3.67,14.1]}><boxGeometry args={[.055,.84,.035]}/><meshStandardMaterial color="#b7c1b8" metalness={.3}/></mesh>)}
 <Box position={[0,4.38,12.4]} scale={[2.1,.18,2.5]} color="#a9aa9d"/>
 <mesh position={[.72,4.2,10.95]}><cylinderGeometry args={[.2,.28,1.2,12]}/><meshStandardMaterial color="#ac5344"/></mesh>
 <mesh position={[-.65,5,12.6]}><cylinderGeometry args={[.035,.045,1.25,8]}/><meshStandardMaterial color="#c7bb8d"/></mesh>
 <mesh position={[-.65,5.65,12.6]}><torusGeometry args={[.28,.035,6,16]}/><meshStandardMaterial color="#c7bb8d"/></mesh>
 {/* Bow mast, anchor pockets, stern fenders and mooring points */}
 <mesh position={[0,3,-14.4]}><cylinderGeometry args={[.055,.07,2.7,8]}/><meshStandardMaterial color="#d0c08c"/></mesh>
 {[-1,1].map(side=><group key={`anchor-${side}`}><mesh position={[side*1.37,.52,-14.2]}><torusGeometry args={[.22,.07,8,16]}/><meshStandardMaterial color="#9da398" metalness={.48}/></mesh><mesh position={[side*1.55,1.15,13]}><cylinderGeometry args={[.13,.16,.42,10]}/><meshStandardMaterial color="#bf744c" metalness={.4}/></mesh></group>)}
 <mesh position={[0,.04,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.05,2.22,48]}/><meshBasicMaterial color="#e2bc74"/></mesh>
 </ClickGroup>}

function PipelinePath({points,color,radius=.1,emissive}:{points:[number,number,number][];color:string;radius?:number;emissive?:boolean}){return <>
 {points.slice(0,-1).map((point,i)=><Pipe key={`pipe-segment-${i}`} a={point} b={points[i+1]} color={color} radius={radius} emissive={emissive?color:undefined}/>)}
 {points.slice(1,-1).map((point,i)=><mesh key={`pipe-elbow-${i}`} position={point} castShadow><sphereGeometry args={[radius*1.04,10,8]}/><meshStandardMaterial color={color} emissive={emissive?color:'#000000'} emissiveIntensity={emissive?1.8:0} metalness={.46} roughness={.42}/></mesh>)}
 </>}
function ValveWheel({position,color}:{position:[number,number,number];color:string}){return <group position={position}>
 <mesh position={[0,.14,0]} castShadow><cylinderGeometry args={[.18,.18,.28,12]}/><meshStandardMaterial color={color} metalness={.55} roughness={.4}/></mesh>
 <mesh position={[0,.42,0]}><cylinderGeometry args={[.035,.035,.32,8]}/><meshStandardMaterial color="#a7aaa0" metalness={.6}/></mesh>
 <mesh position={[0,.58,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.21,.035,6,16]}/><meshStandardMaterial color="#d0b777" metalness={.48}/></mesh>
 <mesh position={[0,.58,0]}><cylinderGeometry args={[.035,.035,.37,8]}/><meshStandardMaterial color="#d0b777" metalness={.48}/></mesh>
 </group>}
function CableTrayRun({x1,x2,y,z,width,signal=false}:{x1:number;x2:number;y:number;z:number;width:number;signal?:boolean}){
 const span=x2-x1,steps=Math.ceil(span/1.25),supports=Math.ceil(span/5),colors=signal?['#425a68','#3e4955','#9a8253','#66747b']:['#282e32','#30383d','#746b5a','#3b4449'];
 return <group>
  <Box position={[(x1+x2)/2,y,z-width/2]} scale={[span,.08,.07]} color="#69757a"/><Box position={[(x1+x2)/2,y,z+width/2]} scale={[span,.08,.07]} color="#69757a"/>
  {Array.from({length:steps+1},(_,i)=>{const x=x1+span*i/steps;return <Box key={`ladder-rung-${i}`} position={[x,y-.06,z]} scale={[.055,.06,width-.12]} color="#9aa096"/>})}
  {Array.from({length:supports+1},(_,i)=>{const x=x1+span*i/supports;return <group key={`ladder-support-${i}`}>{[-1,1].map(side=><Box key={side} position={[x,(5.05+y)/2,z+side*width*.43]} scale={[.09,y-5.05,.09]} color="#606d72"/>)}<Box position={[x,y-.14,z]} scale={[.12,.08,width+.12]} color="#79858a"/></group>})}
  {colors.map((color,i)=>{const offset=(i-(colors.length-1)/2)*width*.18;return <Pipe key={`cable-${i}`} a={[x1,y+.065,z+offset]} b={[x2,y+.065,z+offset]} color={color} radius={signal ? 0.022 : 0.038}/>})}
  {Array.from({length:supports+1},(_,i)=>{const x=x1+span*i/supports;return <group key={`cable-cleat-${i}`}><Box position={[x,y+.1,z-width*.36]} scale={[.1,.08,.07]} color="#b8ab84"/><Box position={[x,y+.1,z+width*.36]} scale={[.1,.08,.07]} color="#b8ab84"/></group>})}
 </group>
}
function ElectricalFeed(){
 const offsets=[-.13,0,.13],colors=['#30363a','#4b5357','#646b68'];
 return <group>
  {/* Buried feeder route leaves the rack, runs inland along the north utility corridor, then enters the relocated switchyard. */}
  <Box position={[30.6,.07,4]} scale={[1.45,.14,.8]} color="#777f78"/>
  <Box position={[31.2,.07,-8]} scale={[.86,.14,24.8]} color="#777f78"/>
  <Box position={[36.1,.07,-20]} scale={[9.8,.14,.86]} color="#777f78"/>
  {offsets.map((offset,i)=><group key={`electrical-feeder-${i}`}>
   <Pipe a={[30,6.1,4+offset]} b={[30,.24,4+offset]} color={colors[i]} radius={.055}/>
   <Pipe a={[30,.24,4+offset]} b={[31.2,.24,4+offset]} color={colors[i]} radius={.055}/>
   <Pipe a={[31.2+offset,.24,4]} b={[31.2+offset,.24,-20]} color={colors[i]} radius={.055}/>
   <Pipe a={[31.2,.24,-20+offset]} b={[41,.24,-20+offset]} color={colors[i]} radius={.055}/>
  </group>)}
  {[[31.2,4],[31.2,-2],[31.2,-8],[31.2,-14],[31.2,-20],[34.5,-20]].map(([x,z],i)=><group key={`electrical-handhole-${i}`}><Box position={[x,.17,z]} scale={[.82,.28,.82]} color="#646e69"/><Box position={[x,.325,z]} scale={[.7,.055,.7]} color="#a69e81"/><Box position={[x,.36,z]} scale={[.18,.025,.08]} color="#3c4542"/></group>)}
 </group>
}
function MainPipeway(){
 const sections=useMemo(()=>[[-31,-26,-21,-16,-11,-6],[10,15,20,25,30]],[]);
 const lines=[
  {z:2.03,y:3.45,r:.15,color:'#96764e'},{z:2.72,y:3.45,r:.11,color:'#8b6250'},
  {z:2.03,y:4.4,r:.12,color:'#7193a3'},{z:2.72,y:4.4,r:.095,color:'#ad9569'},
  {z:2.03,y:5.35,r:.09,color:'#a8b2b3'},{z:2.72,y:5.35,r:.075,color:'#718594'},
 ];
 return <group>
  {/* Ground-level rack sections stop clear of HDS; a trussed high-level crossover bridges the unit without support columns through equipment. */}
  {sections.map((section,sx)=><group key={`rack-section-${sx}`}>
   {section.map((x,i)=><group key={`rack-bent-${x}`}>
    {[1.45,4.75].map(z=><group key={z}><Box position={[x,2.8,z]} scale={[.2,5.6,.2]} color="#69757b"/><Box position={[x,.12,z]} scale={[.58,.24,.58]} color="#85887f"/></group>)}
    {[3.15,4.1,5.05].map(y=><Box key={y} position={[x,y,3.1]} scale={[.22,.16,3.65]} color="#8a918c"/>)}
    {i<section.length-1&&[1.45,4.75].map(z=><group key={`brace-${z}`}><Pipe a={[x,.55,z]} b={[section[i+1],3.05,z]} color="#65737a" radius={.055}/><Pipe a={[x,3.05,z]} b={[section[i+1],.55,z]} color="#65737a" radius={.055}/></group>)}
    {i<section.length-1&&[3.15,4.1,5.05].map(y=><Box key={`girder-${y}`} position={[(x+section[i+1])/2,y,1.45]} scale={[section[i+1]-x,.14,.16]} color="#75828a"/>)}
    {i<section.length-1&&[3.15,4.1,5.05].map(y=><Box key={`girder-r-${y}`} position={[(x+section[i+1])/2,y,4.75]} scale={[section[i+1]-x,.14,.16]} color="#75828a"/>)}
   </group>)}
  </group>)}
  {/* Six grouped process/utility headers. Two outside hot lines use a deliberate lateral expansion offset. */}
  {lines.map((line,i)=>{const bridgeY=12.1+Math.floor(i/2)*1.15;const points:[number,number,number][]=i===5?
   [[-31,line.y,line.z],[-25,line.y,line.z],[-25,line.y,3.65],[-19,line.y,3.65],[-19,line.y,line.z],[-6,line.y,line.z],[-6,bridgeY,line.z],[10,bridgeY,line.z],[10,line.y,line.z],[30,line.y,line.z]]:
   [[-31,line.y,line.z],[-6,line.y,line.z],[-6,bridgeY,line.z],[10,bridgeY,line.z],[10,line.y,line.z],[30,line.y,line.z]];
   return <group key={`rack-line-${i}`}><PipelinePath points={points} color={line.color} radius={line.r}/>
    {[-31,-26,-21,-16,-11,-6,10,15,20,25,30].map((x,j)=><group key={`shoe-${j}`}><Box position={[x,line.y-line.r-.09,line.z]} scale={[.45,.1,.28]} color="#b3a174"/>{j%2===0&&j>0&&j<10&&<mesh position={[x,line.y,line.z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[line.r*1.45,.027,5,12]}/><meshStandardMaterial color="#c2b99a" metalness={.55}/></mesh>}</group>)}
    {i===5&&[-25,-19].map(x=><Box key={`expansion-shoe-${x}`} position={[x,line.y-line.r-.09,3.65]} scale={[.45,.1,.28]} color="#b3a174"/>)}
   </group>})}
  {/* Four-leg steel portal and cross-braced truss clear the HDS equipment envelope. */}
  {[-6,10].map(x=><group key={`high-portal-${x}`}>{[1.45,4.75].map(z=><Box key={z} position={[x,7.8,z]} scale={[.28,15.6,.28]} color="#69757b"/>)}{[11.45,15.25].map(y=><Box key={y} position={[x,y,3.1]} scale={[.32,.2,3.8]} color="#89928d"/>)}</group>)}
  {[1.45,4.75].map(z=><group key={`high-truss-${z}`}><Box position={[2,11.45,z]} scale={[16,.2,.2]} color="#75828a"/><Box position={[2,15.25,z]} scale={[16,.2,.2]} color="#75828a"/><Pipe a={[-6,11.55,z]} b={[10,15.15,z]} color="#69777e" radius={.09}/><Pipe a={[-6,15.15,z]} b={[10,11.55,z]} color="#69777e" radius={.09}/></group>)}
  {[11.8,12.95,14.1].map(y=><Box key={`high-cross-${y}`} position={[2,y,3.1]} scale={[16,.14,3.5]} color="#7d898f"/>)}
  {/* Independent cable tray and inspection walkways on the two accessible rack wings. */}
  {[-18.5,20].map((x,i)=><group key={`access-walk-${i}`}>
   <mesh rotation={[-Math.PI/2,0,0]} position={[x,2.96,5.35]}><planeGeometry args={[i?20:25,.82]}/><meshStandardMaterial color="#667279" metalness={.28} roughness={.74} side={THREE.DoubleSide}/></mesh>
   {Array.from({length:i?11:13},(_,n)=>{const px=(i?10: -31)+n*2;return <group key={n}><Box position={[px,3.52,4.93]} scale={[.07,1.1,.07]} color="#d1b777"/><Box position={[px,3.52,5.77]} scale={[.07,1.1,.07]} color="#d1b777"/></group>})}
   <Box position={[x,4.03,4.93]} scale={[i?20:25,.08,.08]} color="#d1b777"/><Box position={[x,4.03,5.77]} scale={[i?20:25,.08,.08]} color="#d1b777"/>
  </group>)}
  {sections.map((section,i)=><group key={`rack-electrical-${i}`}>
   <CableTrayRun x1={section[0]} x2={section[section.length-1]} y={6.1} z={4} width={.62}/>
   <CableTrayRun x1={section[0]} x2={section[section.length-1]} y={6.88} z={4.36} width={.32} signal/>
  </group>)}
 </group>
}
function FacilityInterconnects(){return <group>
 {/* Feed: crude receiving -> electrostatic desalter -> atmospheric section. */}
 <PipelinePath points={[[-31,1.7,-7],[-31,3.45,-7],[-31,3.45,2.03],[-23,3.45,2.03]]} color="#96764e" radius={.14}/>
 <PipelinePath points={[[-23,3.45,2.03],[-23,3.45,-3],[-23,1.55,-3]]} color="#96764e" radius={.12}/>
 <PipelinePath points={[[-23,3.45,2.03],[-12,3.45,2.03],[-12,3.45,-8],[-12,1.8,-9]]} color="#96764e" radius={.12}/>
 {/* Atmospheric residue and conversion charge, raised to the middle rack tier before dropping to FCC and HDS. */}
 <PipelinePath points={[[-12,3.45,-8],[-12,3.45,2.03],[-12,4.4,2.03],[-6,4.4,2.03],[-6,13.25,2.03],[2,13.25,2.03],[2,13.25,-13],[2,2,-14]]} color="#9b644c" radius={.13}/>
 <PipelinePath points={[[2.5,13.25,2.03],[2.5,13.25,.5],[2.5,4.4,.5],[2.5,1.8,.5]]} color="#877254" radius={.1}/>
 {/* Cooling-water supply/return, elevated on the outer utility bay with risers into HDS. */}
 <PipelinePath points={[[-19,1.15,13],[-19,2.95,13],[-19,2.95,6.25],[2.5,2.95,6.25],[2.5,2.95,.5],[2.5,1.55,.5]]} color="#688ca2" radius={.105}/>
 <PipelinePath points={[[-18,1.1,13],[-18,2.35,13],[-18,2.35,6.72],[3,2.35,6.72],[3,2.35,.5],[3,1.35,.5]]} color="#8199a1" radius={.08}/>
 {[-16,-11,-6,-1,2].map(x=><group key={`utility-pipe-bent-${x}`}><Box position={[x,1.55,6.05]} scale={[.14,3.1,.14]} color="#69767c"/><Box position={[x,1.55,6.95]} scale={[.14,3.1,.14]} color="#69767c"/><Box position={[x,2.1,6.5]} scale={[.16,.12,1.08]} color="#89928d"/><Box position={[x,2.7,6.5]} scale={[.16,.12,1.08]} color="#89928d"/></group>)}
 {/* Dedicated product manifold between HDS, tank farm and separate road/marine export branches. */}
 <PipelinePath points={[[2.5,2.1,.5],[8.9,2.1,.5],[8.9,4.4,.5],[8.9,4.4,2.72],[10,4.4,2.72],[10,4.4,-9],[10,1.25,-9],[29,1.25,-9]]} color="#ae8651" radius={.115}/>
 {Array.from({length:8},(_,i)=>{const x=12+(i%4)*5,z=i<4?-10.85:-7.15;return <group key={`tank-branch-${i}`}><PipelinePath points={[[x,1.25,-9],[x,1.25,z],[x,1.65,z]]} color="#ae8651" radius={.075}/><ValveWheel position={[x,1.1,-9]} color="#777e7a"/></group>})}
 {/* Independent road-tanker loading header and three metered drop legs; not tied to marine loading arms. */}
 <PipelinePath points={[[10,1.25,-9],[9.1,1.25,-9],[9.1,4.15,-9],[9.1,4.15,9],[10,4.15,9],[10,3,9],[10,3,15],[20,3,15]]} color="#8d7053" radius={.105}/>
 {[10,15,20].map(x=><group key={`road-drop-${x}`}><PipelinePath points={[[x,3,15],[x,3,14],[x,2.55,14]]} color="#b59a68" radius={.075}/><ValveWheel position={[x,2.1,14]} color="#767d7e"/><mesh position={[x,2.55,14]}><torusGeometry args={[.18,.045,6,12]}/><meshStandardMaterial color="#d0c2a1" metalness={.35}/></mesh></group>)}
 {/* Separate marine export lines run along the quay to both articulated loading arms. */}
 <PipelinePath points={[[29,1.25,-9],[32.2,1.25,-9],[32.2,1.25,18]]} color="#a87848" radius={.13}/>
 <PipelinePath points={[[29,1.95,-9],[32.65,1.95,-9],[32.65,1.95,18]]} color="#94a1a2" radius={.085}/>
 {Array.from({length:8},(_,i)=>{const z=-8+i*3.7;return <group key={`berth-pipe-support-${i}`}><Box position={[31.86,.95,z]} scale={[.12,1.9,.12]} color="#69767c"/><Box position={[33.02,.95,z]} scale={[.12,1.9,.12]} color="#69767c"/><Box position={[32.44,1.1,z]} scale={[1.25,.12,.16]} color="#89928d"/><Box position={[32.44,1.8,z]} scale={[1.25,.1,.14]} color="#89928d"/></group>})}
 {[4,18].map(z=><group key={`marine-drop-${z}`}><PipelinePath points={[[32.2,1.25,z],[32.2,1.25,z-.72],[32.2,1.35,z-.72]]} color="#a87848" radius={.12}/><PipelinePath points={[[32.65,1.95,z],[32.65,1.95,z-.72]]} color="#94a1a2" radius={.08}/><ValveWheel position={[32.2,1.65,z-.72]} color="#777f80"/></group>)}
 {/* Manual isolation points and compact flange pairs at the process tie-ins. */}
 <ValveWheel position={[-31,1.4,-7]} color="#7e7060"/><ValveWheel position={[-23,1.25,-3]} color="#7e7060"/><ValveWheel position={[-12,1.45,-9]} color="#7e7060"/>
 </group>}
const processFlowRoutes:{color:string;points:[number,number,number][]}[]=[
 {color:'#ffc16b',points:[[-31,1.7,-7],[-31,3.45,-7],[-31,3.45,2.03],[-23,3.45,2.03],[-12,3.45,2.03],[-12,3.45,-8],[-12,1.8,-9]]},
 {color:'#ffc16b',points:[[-23,3.45,2.03],[-23,3.45,-3],[-23,1.55,-3]]},
 {color:'#78d7cf',points:[[-12,1.8,-9],[-12,3.45,-8],[-12,3.45,2.03],[-12,4.4,2.03],[-6,4.4,2.03],[-6,13.25,2.03],[2,13.25,2.03],[2,13.25,-13],[2,2,-14]]},
 {color:'#f2bf67',points:[[-6,13.25,2.03],[2,13.25,2.03],[2.5,13.25,2.03],[2.5,13.25,.5],[2.5,4.4,.5],[2.5,1.8,.5]]},
 {color:'#e9a765',points:[[2.5,1.8,.5],[2.5,2.1,.5],[8.9,2.1,.5],[8.9,4.4,.5],[8.9,4.4,2.72],[10,4.4,2.72],[10,4.4,-9],[10,1.25,-9],[29,1.25,-9]]},
 {color:'#84c9dc',points:[[10,1.25,-9],[9.1,1.25,-9],[9.1,4.15,-9],[9.1,4.15,9],[10,4.15,9],[10,3,9],[10,3,15],[20,3,15]]},
 {color:'#d9c394',points:[[29,1.25,-9],[32.2,1.25,-9],[32.2,1.25,18]]},
];
function FlowLines(){const flow=useStore(s=>s.flow);if(!flow)return null;return <group>
 {processFlowRoutes.map((route,i)=><group key={`flow-route-${i}`}>
  <PipelinePath points={route.points} color={route.color} radius={.019} emissive/>
  <FlowPulse points={route.points} color={route.color} delay={i*.13}/><FlowPulse points={route.points} color={route.color} delay={(i*.13+.53)%1}/>
 </group>)}
 </group>}
function FlowPulse({points,color,delay}:{points:[number,number,number][];color:string;delay:number}){
 const ref=useRef<THREE.Group>(null);const progress=useRef(delay);const playing=useStore(s=>s.playing);const speed=useStore(s=>s.speed);
 const route=useMemo(()=>{const starts:THREE.Vector3[]=[],ends:THREE.Vector3[]=[],directions:THREE.Vector3[]=[],lengths:number[]=[];let total=0;for(let i=0;i<points.length-1;i++){const a=new THREE.Vector3(...points[i]),b=new THREE.Vector3(...points[i+1]),length=a.distanceTo(b);starts.push(a);ends.push(b);directions.push(b.clone().sub(a).normalize());lengths.push(length);total+=length}return {starts,ends,directions,lengths,total}},[points]);
 useFrame((_,delta)=>{if(!ref.current)return;if(playing)progress.current=(progress.current+delta*.11*speed)%1;let remaining=progress.current*route.total;let segment=0;while(segment<route.lengths.length-1&&remaining>route.lengths[segment]){remaining-=route.lengths[segment];segment++}const t=route.lengths[segment]?remaining/route.lengths[segment]:0;ref.current.position.lerpVectors(route.starts[segment],route.ends[segment],t);ref.current.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),route.directions[segment]);const pulse=1+Math.sin(progress.current*Math.PI*8)*.14;ref.current.scale.setScalar(pulse)});
 return <group ref={ref}><mesh><sphereGeometry args={[.115,12,10]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh><mesh><sphereGeometry args={[.19,10,8]}/><meshBasicMaterial color={color} transparent opacity={.18} depthWrite={false} toneMapped={false}/></mesh><mesh position={[0,.23,0]}><coneGeometry args={[.12,.24,9]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh></group>
}

function FocusCamera({controlsRef}:{controlsRef:React.RefObject<any>}){const focus=useStore(s=>s.focus);const {camera}=useThree();const previous=useRef<[number,number,number]|null>(null);const desired=useRef<THREE.Vector3|null>(null);const desiredCamera=useRef<THREE.Vector3|null>(null);useFrame(()=>{if(focus&&focus!==previous.current){const controls=controlsRef.current;const current=controls?.target||new THREE.Vector3(0,0,0);const delta=new THREE.Vector3(...focus).sub(current);desired.current=new THREE.Vector3(...focus);desiredCamera.current=camera.position.clone().add(delta);previous.current=focus;}if(desired.current&&controlsRef.current){controlsRef.current.target.lerp(desired.current,.12);if(desiredCamera.current)camera.position.lerp(desiredCamera.current,.12);controlsRef.current.update();if(controlsRef.current.target.distanceTo(desired.current)<.08){desired.current=null;desiredCamera.current=null;}}});return null;}

export function World(){
 const controlsRef=useRef<any>(null);const night=useStore(s=>s.night);const quality=useStore(s=>s.quality); const mode=useStore(s=>s.mode); const filtered=useMemo(()=>items.filter(x=>mode==='overview'||mode==='all'||x.zone===mode||(mode==='storage'&&['tank','sphere-tank'].includes(x.kind))||(mode==='refinery'&&['process','furnace','flare'].includes(x.kind))),[mode]);
 return <>
  <color attach="background" args={[night?'#09121d':'#d6e0d5']}/><fog attach="fog" args={[night?'#09121d':'#d6e0d5',80,145]}/>
  <ambientLight intensity={night?.2:1.15}/><directionalLight position={[-30,55,22]} intensity={night?.32:2.3} castShadow={quality!=='low'} shadow-mapSize={quality==='high'?[2048,2048]:[1024,1024]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60}/><NightLighting night={night}/>
  <SiteTerrain night={night}/>
  {/* Raised, fenced industrial plot like a miniature engineering diorama */}
  <Box position={[8,.015,-29]} scale={[84,.24,.42]} color="#48534e"/><Box position={[1,.015,29]} scale={[70,.24,.42]} color="#48534e"/>
  <Box position={[-34,.015,0]} scale={[.42,.24,58]} color="#48534e"/>
  {Array.from({length:22},(_,i)=>{const x=-33+i*4;return <group key={`fence-${i}`}><Box position={[x,.52,-28.65]} scale={[.09,.95,.09]} color="#69776e"/>{x<=35&&![4,5].includes(i)&&<Box position={[x,.52,28.65]} scale={[.09,.95,.09]} color="#69776e"/>}</group>})}
  {Array.from({length:15},(_,i)=><Box key={`west-fence-${i}`} position={[-33.78,.52,-27+i*3.85]} scale={[.09,.95,.09]} color="#69776e"/>)}
  {/* site edge and zone paving */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-10,-.08,-7]}><planeGeometry args={[42,34]}/><meshStandardMaterial color={night?'#394541':'#9da79c'}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[16,-.075,-9]}><planeGeometry args={[24,22]}/><meshStandardMaterial color={night?'#3d4540':'#aaa995'}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[15,-.07,16]}><planeGeometry args={[28,17]}/><meshStandardMaterial color={night?'#343f3b':'#919a8d'}/></mesh>
  {/* Company campus: paved forecourt, marked visitor parking, planted edge and secure vehicle gate */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-24,-.075,22]}><planeGeometry args={[20,12]}/><meshStandardMaterial color={night?'#39423e':'#999d91'} roughness={.94}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-25.8,-.035,25.85]}><planeGeometry args={[14.2,5.1]}/><meshStandardMaterial color={night?'#222b29':'#555c57'} roughness={.94}/></mesh>
  {Array.from({length:6},(_,i)=><mesh key={`parking-line-${i}`} position={[-32.8+i*2.35,.012,25.85]}><boxGeometry args={[.045,.025,4.55]}/><meshBasicMaterial color="#d8d0aa"/></mesh>)}
  {[-31.7,-29.35,-27,-24.65,-22.3,-19.95].map((x,i)=><CampusCar key={`campus-car-${i}`} position={[x,.04,25.8]} color={['#5b716f','#c5c0ad','#87918b'][i%3]}/>)}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-15.45,-.025,25.8]}><planeGeometry args={[2.7,6.5]}/><meshStandardMaterial color="#555c57"/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-17.3,-.02,23.75]}><planeGeometry args={[3.8,1.8]}/><meshStandardMaterial color="#555c57"/></mesh>
  {[-31.8,-16.4].map(x=><group key={`landscape-edge-${x}`}>{[17.3,21.8,25.2].map((z,i)=><CampusTree key={i} position={[x,0,z]}/>)}</group>)}
  <group position={[-24,.08,16.8]}><Box position={[0,.38,0]} scale={[8.1,.72,.38]} color="#64795a"/><Box position={[0,.77,0]} scale={[8.35,.08,.5]} color="#788b63"/></group>
  {/* Steel gate frame and striped lifting barrier at the southern campus entrance */}
  {[-18,-13].map(x=><Box key={`gate-post-${x}`} position={[x,1.65,28.55]} scale={[.48,3.3,.48]} color="#536359"/>)}
  <Box position={[-15.5,3.24,28.55]} scale={[5.2,.42,.55]} color="#8c9a8d"/>
  <Box position={[-15.5,3.25,28.24]} scale={[4.1,.32,.055]} color="#b99d64"/>
  <Box position={[-15.5,1.1,27.8]} scale={[4.15,.12,.13]} color="#d2bd78" rotation={[0,0,-.02]}/>
  {[-17.1,-16.3,-15.5,-14.7,-13.9].map(x=><Box key={`barrier-mark-${x}`} position={[x,1.1,27.8]} scale={[.35,.14,.15]} color="#c34e3f" rotation={[0,0,-.02]}/>)}
  {[[-31.4,17.3],[-30.5,23.8],[-17,17.6],[-17,21.8]].map(([x,z],i)=><CampusTree key={`campus-tree-${i}`} position={[x,0,z]}/>)}
  {/* Road network */}
  {[[-1,0,4,2.3],[0,7,2.3,44],[1,13,2.5,26],[-15,0,2.2,23]].map((r,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[r[0],-.035,r[1]]}><planeGeometry args={[r[3],r[2]]}/><meshStandardMaterial color="#414b47"/></mesh>)}
  {Array.from({length:10},(_,i)=><mesh key={'dash'+i} rotation={[-Math.PI/2,0,0]} position={[-20+i*4,.005,7]}><planeGeometry args={[2,.12]}/><meshBasicMaterial color="#d8cf9d"/></mesh>)}
  {/* Water + quay */}
  {/* Bounded port basin with paved shoreline and a broad loading quay */}
  <WaterSurface position={[61.25,-.16,14]} size={[47.5,48]} night={night}/>
 <ShorelineSeawall/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[28.5,-.075,14]}><planeGeometry args={[11,38]}/><meshStandardMaterial color={night?'#343f3b':'#888c80'} roughness={.92}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[34,.025,14]}><planeGeometry args={[6,38]}/><meshStandardMaterial color="#787b70" roughness={.88}/></mesh>
  {/* Hard shoreline edge keeps the expanded harbor water out of the land plate. */}
  {[-1,5,11,17,23,29].map(z=><group key={z} position={[36.72,.48,z]}><mesh><cylinderGeometry args={[.18,.22,.96,10]}/><meshStandardMaterial color="#4d5852" metalness={.45}/></mesh><mesh position={[0,.43,0]}><torusGeometry args={[.22,.045,6,14]}/><meshStandardMaterial color="#d0b774" metalness={.45}/></mesh></group>)}
  {[-1,1].map(side=><group key={side}>{[7,13,19,25].map(z=><mesh key={z} position={[34+side*2.35,.03,z]}><boxGeometry args={[.045,.045,5.3]}/><meshBasicMaterial color="#d0c4a0"/></mesh>)}</group>)}
  {[[-1,4],[5,8],[29,24],[23,20]].map(([start,end],i)=><Pipe key={`mooring-line-${i}`} a={[36.72,.95,start]} b={[38.2,1.48,end]} color="#39443e" radius={.045}/>)}
  {/* Administration */}
  <Building item={items.find(x=>x.id==='CCR-01')!} color="#697d72" size={[7,3.2,5]}/><Building item={items.find(x=>x.id==='LAB-01')!} color="#849389" size={[5,2.5,4]}/>
   {/* Process vessels, pipe racks, furnace and flare */}
  <Tower item={items[0]} scale={1.06}/><Tower item={items[1]} scale={.78}/><Furnace item={items[2]}/><Flare item={items[3]}/><ProcessRefinery/><MainPipeway/><FacilityInterconnects/><ElectricalFeed/>
  {filtered.filter(x=>x.id==='FCC-01'||x.id==='HDS-01').map(unit=><RefineryUnit key={unit.id} item={unit}/>)}
  {filtered.filter(x=>x.id==='DS-101').map(unit=><DesalterUnit key={unit.id} item={unit}/>)}
  {filtered.filter(x=>x.id==='CRUDE-01').map(unit=><CrudeReceiving key={unit.id} item={unit}/>)}
  {filtered.filter(x=>x.id==='SRU-01').map(unit=><SulfurRecovery key={unit.id} item={unit}/>)}
  {[[-9,-3],[-7,-2],[-8,-1],[-5,-4],[-2,-2],[1,-5],[2,-1]].map(([x,z],i)=><group key={i} position={[x,0,z]}><mesh position={[0,2.1,0]}><cylinderGeometry args={[.48,.5,4.2,12]}/><meshStandardMaterial color={i%2?'#8e9b90':'#b5b9aa'} metalness={.5}/></mesh><mesh position={[0,4.2,0]}><cylinderGeometry args={[.7,.7,.12,12]}/><meshStandardMaterial color="#c9ad6a"/></mesh><mesh position={[0,.8,0]}><cylinderGeometry args={[.7,.7,.12,12]}/><meshStandardMaterial color="#747e72"/></mesh></group>)}
  <FlowLines/>
  {/* tank farm */}
  {filtered.filter(x=>x.kind==='tank').map(t=><Tank key={t.id} item={t}/>)}
  {filtered.filter(x=>x.kind==='sphere-tank').map(t=><SphereTank key={t.id} item={t}/>)}
  {/* Secondary containment dyke and a dedicated LPG transfer header */}
  <Box position={[19.5,.34,-15.8]} scale={[22,.68,.38]} color="#777e73"/><Box position={[8.5,.34,-9]} scale={[.38,.68,13.2]} color="#777e73"/><Box position={[30.5,.34,-9]} scale={[.38,.68,13.2]} color="#777e73"/>
  <Box position={[14,.34,-2.3]} scale={[11,.68,.38]} color="#777e73"/><Box position={[25,.34,-2.3]} scale={[11,.68,.38]} color="#777e73"/>
  <Pipe a={[7,1.35,-19.6]} b={[30,1.35,-19.6]} color="#bd6c51" radius={.15}/>
  {[9,15,21,27].map(x=><group key={`lpg-branch-${x}`}><Pipe a={[x-1.55,1.35,-19.6]} b={[x-1.55,1.35,-21.2]} color="#bd6c51" radius={.11}/><Pipe a={[x-1.55,1.35,-21.2]} b={[x-1.55,2.7,-21.2]} color="#bd6c51" radius={.09}/></group>)}
  {/* Utilities */}
  <CoolingBattery item={items.find(x=>x.id==='CW-01')!}/>
  <WastewaterPlant item={items.find(x=>x.id==='WWT-01')!}/>
  <ElectricalSubstation item={items.find(x=>x.id==='SUB-01')!}/>
  <ClickGroup item={items.find(x=>x.id==='P-301A')} position={items.find(x=>x.id==='P-301A')!.position}><Box position={[0,.8,0]} scale={[3,1.6,2]} color="#777f74"/><mesh position={[0,1.75,0]}><cylinderGeometry args={[.62,.62,.3,16]}/><meshStandardMaterial color="#c69d5d" metalness={.5}/></mesh>{[-1,1].map(x=><mesh key={x} position={[x*1.1,.9,0]}><cylinderGeometry args={[.48,.48,.6,16]}/><meshStandardMaterial color="#52665d"/></mesh>)}</ClickGroup>
  <Building item={{...items.find(x=>x.id==='LAB-01')!,id:'WW-01',position:[-24,0,14],fa:'تصفیه‌خانه آب',en:'Water treatment',descriptionFa:'سامانه نمایشی تصفیه آب صنعتی.',descriptionEn:'Demo industrial water treatment facility.'}} color="#688178" size={[5,2.4,4]}/>
  <Building item={{...items.find(x=>x.id==='LAB-01')!,id:'FIRE-01',position:[-26,0,5],fa:'ایستگاه آتش‌نشانی',en:'Fire station'}} color="#8d6552" size={[5,2.3,3.5]}/>
  <TruckTrafficSafety/>
  {/* truck terminal gates and canopies */}
  {[10,15,20].map(x=><group key={x} position={[x,0,15]}><Box position={[0,3.3,0]} scale={[4,.25,5.4]} color="#b7aa84"/><Box position={[0,1.6,-2.2]} scale={[.16,3.2,.16]} color="#68776d"/><Box position={[0,1.6,2.2]} scale={[.16,3.2,.16]} color="#68776d"/></group>)}
  {items.filter(x=>x.kind==='truck').map((t,i)=><Truck key={t.id} item={t} index={i}/>)}
  {/* ship, loading arm connecting to jetty */}
  <AssetBoundary fallback={(_error)=> <ShipFallback item={items.find(x=>x.id==='VES-08')!}/>}><Suspense fallback={<ShipFallback item={items.find(x=>x.id==='VES-08')!}/>}><Ship item={items.find(x=>x.id==='VES-08')!}/></Suspense></AssetBoundary>
  <MarineLoadingArm position={[32.2,0,4]} color="#c69d5d"/><MarineLoadingArm position={[32.2,0,18]} color="#d6d0bc"/>
  {items.filter(x=>x.kind==='worker').map((person,i)=><AssetBoundary key={person.id} fallback={()=> <WorkerFallback item={person} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/>}><Suspense fallback={<WorkerFallback item={person} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/>}><Worker item={person} index={i} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/></Suspense></AssetBoundary>)}
  {mode==='personnel'&&items.map((it)=><mesh key={'pin'+it.id} position={[it.position[0],4,it.position[2]]}><sphereGeometry args={[.35,10,10]}/><meshBasicMaterial color="#f4cb79"/></mesh>)}
  <OrbitControls ref={controlsRef} makeDefault target={[0,0,0]} minPolarAngle={.25} maxPolarAngle={Math.PI/2.12} minDistance={24} maxDistance={100} enableDamping dampingFactor={.08} />
  <FocusCamera controlsRef={controlsRef}/>
 </>;
}
