import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { items, type SiteItem } from '../data/site';
import { useStore } from '../store';
import { ProcessRefinery } from './ProcessSteelwork';
import { SphereTank } from './SphereTank';
import { CoolingBattery, CrudeReceiving, DesalterUnit, ElectricalSubstation, EquipmentTag, RefineryUnit, SulfurRecovery, WastewaterPlant } from './RefinerySections';
import { getChainlinkMap, getWeatheredSteelMap, getYardSurfaceMap } from './materials';

function ShorelineSeawall(){return <group>
 <Box position={[37.23,-.32,14]} scale={[.46,.72,48]} color="#626d69"/>
 <Box position={[37.23,.025,14]} scale={[.62,.09,48.5]} color="#858981"/>
 {Array.from({length:17},(_,i)=><Box key={`seawall-joint-${i}`} position={[37.472,-.31,-9.4+i*2.85]} scale={[.018,.6,.035]} color="#a19f93"/>)}
 <Box position={[37.23,-.71,14]} scale={[.58,.14,48.2]} color="#535e5a"/>
 </group>}
function SiteTerrain({night}:{night:boolean}){
 const geometry=useMemo(()=>{const land=new THREE.Shape();land.moveTo(-70,-50);land.lineTo(85,-50);land.lineTo(85,-38);land.lineTo(37,-38);land.lineTo(37,10);land.lineTo(85,10);land.lineTo(85,50);land.lineTo(-70,50);land.closePath();const surface=new THREE.ShapeGeometry(land,1);surface.rotateX(-Math.PI/2);surface.computeVertexNormals();return surface},[]);
 return <mesh geometry={geometry} position={[0,-.16,0]} receiveShadow><meshStandardMaterial map={getYardSurfaceMap('soil',1/18,1/18)} color={night?'#59635d':'#ffffff'} roughness={1} side={THREE.DoubleSide}/></mesh>;
}
function TankFarmBundAccess(){return <group>
 {/* Staggered concrete treads and paired handrails cross the east containment berm. */}
 {Array.from({length:4},(_,i)=><Box key={`bund-step-${i}`} position={[31.45-i*.48,.085+i*.17,-4]} scale={[.54,.17,1.18]} color={i%2?'#8a8e83':'#777f76'}/>)}
 {[-.66,.66].map(side=><group key={`bund-handrail-${side}`}>
  <Pipe a={[31.78,1.02,-4+side]} b={[29.1,1.72,-4+side]} color="#c0b17c" radius={.035}/>
  <Pipe a={[31.78,.43,-4+side]} b={[29.1,1.13,-4+side]} color="#8b948b" radius={.026}/>
  {[31.55,30.6,29.65].map((x,i)=><Box key={x} position={[x,1.1+i*.24,-4+side]} scale={[.055,.72,.055]} color="#89948a"/>)}
 </group>)}
 {/* Small sump, grated cover and manually isolated drain outlet; no open discharge to the harbor. */}
 <Box position={[29.35,.035,-9]} scale={[.92,.07,.82]} color="#626c66"/>
 {Array.from({length:8},(_,i)=><Box key={`bund-sump-grate-${i}`} position={[29.35,.08,-9.32+i*.092]} scale={[.75,.025,.028]} color="#353f3b"/>)}
 <Pipe a={[29.82,-.12,-9]} b={[31.9,-.12,-9]} color="#53615b" radius={.075}/>
 <ValveWheel position={[30.78,.02,-9]} color="#92784f"/>
 <mesh position={[30.92,.68,-8.78]}><torusGeometry args={[.1,.025,6,12]}/><meshStandardMaterial color="#d3b350" metalness={.5}/></mesh>
 <Box position={[32.15,.055,-9]} scale={[.64,.16,.68]} color="#68736d"/>
 <mesh position={[32.15,.15,-9]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.48,.5]}/><meshStandardMaterial color="#343e39" wireframe/></mesh>
 </group>}
function FireHydrantBody(){return <group>
 <mesh position={[0,.13,0]}><cylinderGeometry args={[.24,.28,.22,12]}/><meshStandardMaterial color="#b4aa8c" metalness={.42}/></mesh>
 <mesh position={[0,.72,0]} castShadow><cylinderGeometry args={[.16,.21,1.02,12]}/><meshStandardMaterial color="#b64137" roughness={.55}/></mesh>
 <mesh position={[0,1.27,0]}><cylinderGeometry args={[.2,.2,.14,12]}/><meshStandardMaterial color="#d2b66b" metalness={.5}/></mesh>
 <mesh position={[0,1.39,0]}><sphereGeometry args={[.14,12,8]}/><meshStandardMaterial color="#b64137"/></mesh>
 {[-1,1].map(side=><group key={side} position={[side*.17,.66,0]} rotation={[0,0,side*Math.PI/2]}>
  <mesh><cylinderGeometry args={[.105,.13,.28,10]}/><meshStandardMaterial color="#c8c2a9" metalness={.6}/></mesh>
  <mesh position={[0,side*.17,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.12,.035,6,12]}/><meshStandardMaterial color="#d8cda9" metalness={.55}/></mesh>
  <mesh position={[0,side*.29,0]}><cylinderGeometry args={[.08,.08,.08,10]}/><meshStandardMaterial color="#d5b84f" metalness={.45}/></mesh>
 </group>)}
 <mesh position={[0,.26,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.23,.035,6,16]}/><meshStandardMaterial color="#d4bd78" metalness={.48}/></mesh>
 </group>}
const fireHydrantSites:[number,number,number][]=[[-41.5,0,-12],[-41.5,0,13],[0,0,-27],[32.4,0,-24],[32.4,0,22],[0,0,25]];
const firewaterLoop:[number,number,number][]=[[-36.5,-.16,7.3],[-41.5,-.16,7.3],[-41.5,-.16,-24],[-38.5,-.16,-27],[29.4,-.16,-27],[32.4,-.16,-24],[32.4,-.16,22],[29.4,-.16,25],[-38.5,-.16,25],[-41.5,-.16,22],[-41.5,-.16,7.3],[-36.5,-.16,7.3]];
function FirewaterRing(){return <group>
 <PipelinePath points={firewaterLoop} color="#a7473c" radius={.082}/>
 <Pipe a={[-36.5,-.16,7.3]} b={[-36.5,1.08,7.3]} color="#a7473c" radius={.12}/>
 <Pipe a={[-36.5,1.08,7.3]} b={[-36.5,1.08,9.8]} color="#a7473c" radius={.12}/>
 {fireHydrantSites.map((position,i)=><group key={`fire-hydrant-${i}`} position={position}><Pipe a={[0,-.16,0]} b={[0,.08,0]} color="#a7473c" radius={.08}/><FireHydrantBody/></group>)}
 </group>}
function FirewaterFacility({item}:{item:SiteItem}){return <ClickGroup item={item} position={item.position}>
 {/* Dedicated storage tank with roof vent, gauge, shell courses and fixed access ladder. */}
 <mesh position={[0,.14,0]}><cylinderGeometry args={[2.7,2.7,.24,28]}/><meshStandardMaterial color="#6b7770" roughness={.86}/></mesh>
 <mesh position={[0,2.05,0]} castShadow receiveShadow><cylinderGeometry args={[2.38,2.42,3.6,32]}/><meshStandardMaterial color="#aeb9ad" map={getWeatheredSteelMap()} metalness={.42} roughness={.62}/></mesh>
 <mesh position={[0,3.86,0]} castShadow><sphereGeometry args={[2.38,28,14,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#bdc3b6" metalness={.38} roughness={.58}/></mesh>
 {[.42,1.35,2.3,3.25].map(y=><mesh key={`fw-shell-band-${y}`} position={[0,y,0]}><torusGeometry args={[2.4,.038,6,32]}/><meshStandardMaterial color="#78857c" metalness={.55}/></mesh>)}
 {Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return <Box key={`fw-shell-stiffener-${i}`} position={[Math.cos(a)*2.39,2.05,Math.sin(a)*2.39]} scale={[.045,3.45,.07]} color="#87938a"/>})}
 <mesh position={[0,4.75,0]}><cylinderGeometry args={[.18,.22,.38,10]}/><meshStandardMaterial color="#747f75" metalness={.5}/></mesh>
 <mesh position={[0,4.98,0]}><cylinderGeometry args={[.26,.26,.08,12]}/><meshStandardMaterial color="#d1bc7b" metalness={.52}/></mesh>
 <Pipe a={[2.47,.38,0]} b={[2.47,4.05,0]} color="#596860" radius={.045}/>
 {Array.from({length:12},(_,i)=><Box key={`fw-ladder-rung-${i}`} position={[2.47,.48+i*.28,.08]} scale={[.055,.045,.62]} color="#c8b77e"/>)}
 <Box position={[2.72,2.1,0]} scale={[.08,3.9,.08]} color="#64746a"/><Box position={[2.2,2.1,0]} scale={[.08,3.9,.08]} color="#64746a"/>
 <mesh position={[2.47,4.12,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.42,.035,6,20]}/><meshStandardMaterial color="#c8b77e"/></mesh>
 <mesh position={[-2.43,1.65,.35]}><boxGeometry args={[.1,2.45,.18]}/><meshStandardMaterial color="#46544d"/></mesh>
 <mesh position={[-2.5,1.65,.35]}><boxGeometry args={[.045,1.65,.12]}/><meshStandardMaterial color="#d7ae62" emissive="#694715" emissiveIntensity={.18}/></mesh>
 <Pipe a={[0,.5,-2.36]} b={[-1.55,.5,-3.05]} color="#a7473c" radius={.11}/>
 <Pipe a={[-1.55,.5,-3.05]} b={[-1.55,.5,-4.45]} color="#a7473c" radius={.11}/>
 {/* Enclosed electric and diesel standby pump house, visibly tied to the reserve tank and ring header. */}
 <Box position={[-2.5,.12,-4.7]} scale={[3.7,.24,3.5]} color="#535f58"/>
 <Box position={[-2.5,1.35,-4.7]} scale={[3.45,2.35,3.2]} color="#78847a"/>
 <Box position={[-2.5,2.58,-4.7]} scale={[3.72,.18,3.46]} color="#4c5952"/>
 <Box position={[-2.5,1.25,-3.06]} scale={[2.2,1.9,.08]} color="#4b5650"/>
 {[-3.7,-1.3].map(x=><group key={`fw-pump-louver-${x}`}>
  {Array.from({length:7},(_,i)=><Box key={i} position={[x,1.62,-3.01]} scale={[.7,.045,.06]} color="#9ca59a"/>)}
 </group>)}
 {[-3.45,-1.55].map((x,i)=><group key={`fw-pump-skid-${i}`}>
  <Box position={[x,.38,-4.5]} scale={[1.28,.2,1.45]} color="#515e56"/>
  <mesh position={[x,.78,-4.6]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.31,.31,.82,16]}/><meshStandardMaterial color={i?'#3e4a43':'#60736a'} metalness={.45}/></mesh>
  <mesh position={[x+.52,.72,-4.6]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.23,.23,.8,14]}/><meshStandardMaterial color="#7d8980" metalness={.52}/></mesh>
  <Pipe a={[x,.95,-4.6]} b={[x,.95,-3.25]} color="#b1493d" radius={.085}/>
  <Box position={[x,.19,-4.5]} scale={[.12,.38,.12]} color="#c0ad76"/>
 </group>)}
 <Pipe a={[-2.5,1.08,-3.08]} b={[-2.5,1.08,-2.2]} color="#a7473c" radius={.14}/>
 <Pipe a={[-2.5,1.08,-2.2]} b={[-1.4,1.08,-2.2]} color="#a7473c" radius={.12}/>
 <Pipe a={[-1.4,1.08,-2.2]} b={[0,1.08,-2.2]} color="#a7473c" radius={.12}/>
 <mesh position={[-4.16,2.7,-4.7]}><cylinderGeometry args={[.14,.17,1.4,10]}/><meshStandardMaterial color="#4f5d56" metalness={.42}/></mesh>
 <mesh position={[-4.16,3.43,-4.7]}><cylinderGeometry args={[.24,.24,.08,10]}/><meshStandardMaterial color="#a7a294"/></mesh>
 <EquipmentTag label={item.id} position={[0,5.35,2.55]}/>
 </ClickGroup>}
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
 <SitePerimeterFence/><CompanyArrivalLandscape/><CompanyMonumentSign/><RoadDrainageAndEmergencyAccess/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-10,-.05,-8]}><planeGeometry args={[40,32]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',40/9,32/9)} color={night?'#59635d':'#cdd1c8'} roughness={.96}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[16,-.05,-8]}><planeGeometry args={[24,22]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',24/9,22/9)} color={night?'#59635d':'#d1cebc'} roughness={.96}/></mesh>
 <WaterSurface position={[61.25,-.16,14]} size={[47.5,48]} night={night}/>
 <ShorelineSeawall/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[28.5,-.075,14]}><planeGeometry args={[11,38]}/><meshStandardMaterial color="#888c80" roughness={.92}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[34,.025,14]}><planeGeometry args={[6,38]}/><meshStandardMaterial color="#787b70" roughness={.88}/></mesh>
 {[-1,0,1].map((x,i)=><group key={`tower${i}`} position={[-13+x*5,0,-8]}><mesh position={[0,4.2,0]} castShadow><cylinderGeometry args={[.75,.95,8.4,20]}/><meshStandardMaterial color="#b9c1b6" metalness={.4} roughness={.5}/></mesh>{[1.4,3,5,7].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[1.08,1.08,.1,20]}/><meshStandardMaterial color="#d4b66f" metalness={.45}/></mesh>)}</group>)}
 <Flare item={items.find(x=>x.id==='FL-01')!}/>
 {Array.from({length:6},(_,i)=><group key={`tank${i}`} position={[12+(i%3)*5,0,-12+Math.floor(i/3)*8]}><mesh position={[0,1.4,0]} castShadow><cylinderGeometry args={[2,2,2.8,24]}/><meshStandardMaterial color="#aeb9ac" metalness={.35}/></mesh><mesh position={[0,2.83,0]}><cylinderGeometry args={[2,2,.12,24]}/><meshStandardMaterial color="#d3d0be"/></mesh></group>)}
 {items.filter(x=>x.kind==='sphere-tank').map(t=><SphereTank key={`fallback-${t.id}`} item={t}/>)}
 <Box position={[19.5,.34,-15.8]} scale={[22,.68,.38]} color="#777e73"/><Box position={[8.5,.34,-9]} scale={[.38,.68,13.2]} color="#777e73"/><Box position={[30.5,.34,-9]} scale={[.38,.68,13.2]} color="#777e73"/><Box position={[14,.34,-2.3]} scale={[11,.68,.38]} color="#777e73"/><Box position={[25,.34,-2.3]} scale={[11,.68,.38]} color="#777e73"/>
 <TankFarmBundAccess/>
 <Pipe a={[7,1.35,-19.6]} b={[30,1.35,-19.6]} color="#bd6c51" radius={.15}/>{[9,15,21,27].map(x=><Pipe key={`fallback-lpg-${x}`} a={[x-1.55,1.35,-19.6]} b={[x-1.55,1.35,-21.2]} color="#bd6c51" radius={.1}/>)}
 <ProcessRefinery/><MainPipeway/><AirCoolerBank item={items.find(x=>x.id==='ACHE-01')!}/><FacilityInterconnects/><ElectricalFeed/><FlowLines/>
 {items.filter(x=>x.id==='FCC-01'||x.id==='HDS-01').map(unit=><RefineryUnit key={`fallback-${unit.id}`} item={unit}/>)}
 <CrudeReceiving item={items.find(x=>x.id==='CRUDE-01')!}/><SulfurRecovery item={items.find(x=>x.id==='SRU-01')!}/><DesalterUnit item={items.find(x=>x.id==='DS-101')!}/><CoolingBattery item={items.find(x=>x.id==='CW-01')!}/><WastewaterPlant item={items.find(x=>x.id==='WWT-01')!}/><ElectricalSubstation item={items.find(x=>x.id==='SUB-01')!}/><FirewaterFacility item={items.find(x=>x.id==='FW-01')!}/><FirewaterRing/><TransferPumpStation item={items.find(x=>x.id==='P-301A')!}/>
 {items.filter(x=>x.kind==='worker').map((person,i)=><WorkerFallback key={`fallback-${person.id}`} item={person} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/>)}
 <ControlBuilding item={items.find(x=>x.id==='CCR-01')!}/><LaboratoryBuilding item={items.find(x=>x.id==='LAB-01')!}/>
 <WaterTreatmentFacility item={items.find(x=>x.id==='WW-01')!}/><SteamBoilerStation item={items.find(x=>x.id==='SB-01')!}/><SteamUtilityNetwork/>
 <FireStation item={items.find(x=>x.id==='FIRE-01')!}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-24,-.07,22]}><planeGeometry args={[20,12]}/><meshStandardMaterial color="#999d91"/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[-25.8,-.03,25.85]}><planeGeometry args={[14.2,5.1]}/><meshStandardMaterial color="#555c57"/></mesh>
 {[-32.8,-30.45,-28.1,-25.75,-23.4,-21.05].map(x=><mesh key={`fallback-stall-${x}`} position={[x,.01,25.85]}><boxGeometry args={[.045,.02,4.55]}/><meshBasicMaterial color="#d8d0aa"/></mesh>)}
 {[-31.7,-29.35,-27,-24.65,-22.3,-19.95].map((x,i)=><CampusCar key={`fallback-car-${i}`} position={[x,.04,25.8]} color={['#5b716f','#c5c0ad','#87918b'][i%3]}/>)}
 {[[-32.8,17.3],[-15.8,17.3],[-32.8,20.4],[-15.8,21.8]].map(([x,z],i)=><CampusTree key={`fallback-tree-${i}`} position={[x,0,z]}/>)}
 <Box position={[-15.5,1.65,28.55]} scale={[5,.32,.45]} color="#536359"/><Box position={[-15.5,1.1,27.8]} scale={[4.15,.12,.13]} color="#d2bd78"/>
 <CompanyCampusDetails gatehouse={items.find(x=>x.id==='SEC-01')!}/>
 <ShipFallback item={items.find(x=>x.id==='VES-08')!}/>
 {[-1,5,11,17,23,29].map(z=><group key={`port-bollard-${z}`} position={[36.72,.48,z]}><mesh><cylinderGeometry args={[.18,.22,.96,10]}/><meshStandardMaterial color="#4d5852" metalness={.45}/></mesh><mesh position={[0,.43,0]}><torusGeometry args={[.22,.045,6,14]}/><meshStandardMaterial color="#d0b774" metalness={.45}/></mesh></group>)}
 <MarineLoadingArm position={[32.2,0,4]} color="#c69d5d"/><MarineLoadingArm position={[32.2,0,18]} color="#d6d0bc"/>
 {[[-1,4],[5,8],[29,24],[23,20]].map(([start,end],i)=><Pipe key={`fallback-mooring-${i}`} a={[36.72,.95,start]} b={[38.2,1.48,end]} color="#39443e" radius={.045}/>)}
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,.02,7]}><planeGeometry args={[54,2.5]}/><meshStandardMaterial color="#404a46"/></mesh>
 <TruckTrafficSafety/><TruckLoadingRack/><DrumLoadingApron/>
 {items.filter(x=>x.kind==='truck').map((t,i)=><Truck key={`fallback-${t.id}`} item={t} index={i}/>)}
 <DrumLoadingForklift item={items.find(x=>x.id==='FL-027')!}/>
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
  <TowerAppurtenances scale={scale}/>
 </ClickGroup>;
}
function TowerAppurtenances({scale}:{scale:number}){
 const weldYs=[.9,2.8,4.7,6.6,8.4];
 return <group scale={scale}>
  {/* Base ring, anchor points and shell-course welds enrich the existing column without changing its footprint. */}
  <mesh position={[0,.16,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.08,1.27,32]}/><meshStandardMaterial color="#68766e" metalness={.62}/></mesh>
  {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <mesh key={`tower-anchor-${i}`} position={[Math.cos(a)*1.22,.12,Math.sin(a)*1.22]}><cylinderGeometry args={[.045,.045,.18,7]}/><meshStandardMaterial color="#c6b886" metalness={.52}/></mesh>})}
  {weldYs.map(y=>{const r=1.18-(y/9)*.36;return <mesh key={`tower-shell-course-${y}`} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[r,.022,5,28]}/><meshStandardMaterial color="#c5c6b8" metalness={.5} roughness={.55}/></mesh>})}
  {/* Curved head, vent nozzle and a small pressure-relief assembly. */}
  <mesh position={[0,8.98,0]} scale={[1,.48,1]} castShadow><sphereGeometry args={[.82,24,12,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#aeb7aa" map={getWeatheredSteelMap()} metalness={.46} roughness={.58}/></mesh>
  <mesh position={[0,9.38,0]}><cylinderGeometry args={[.14,.18,.35,12]}/><meshStandardMaterial color="#758278" metalness={.55}/></mesh>
  <mesh position={[0,9.58,0]}><cylinderGeometry args={[.22,.22,.08,12]}/><meshStandardMaterial color="#cbb779" metalness={.5}/></mesh>
  <Pipe a={[.3,9.18,0]} b={[.3,9.62,0]} color="#9da79b" radius={.055}/>
  <mesh position={[.3,9.72,0]}><cylinderGeometry args={[.12,.12,.18,10]}/><meshStandardMaterial color="#c2ae77" metalness={.48}/></mesh>
  {/* Reflux-return nozzle is placed on the column face below the top access deck. */}
  <Pipe a={[0,8.25,.82]} b={[0,8.25,1.4]} color="#78959a" radius={.105}/>
  <mesh position={[0,8.25,1.42]}><torusGeometry args={[.15,.026,5,14]}/><meshStandardMaterial color="#d2c08b" metalness={.5}/></mesh>
  {/* Three flanged manways align with the existing circular access decks. */}
  {[2.5,5.8,8.15].map((y,i)=>{
   const x=i===1?-.38:.38,r=1.18-(y/9)*.36,z=Math.sqrt(r*r-x*x)+.035;
   return <group key={`tower-manway-${y}`}>
    <mesh position={[x,y,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.3,.3,.11,16]}/><meshStandardMaterial color="#66756d" metalness={.58}/></mesh>
    <mesh position={[x,y,z+.07]}><torusGeometry args={[.31,.038,6,20]}/><meshStandardMaterial color="#cfbd86" metalness={.5}/></mesh>
    {Array.from({length:10},(_,n)=>{const a=n*Math.PI/5;return <mesh key={`manway-bolt-${n}`} position={[x+Math.cos(a)*.34,y+Math.sin(a)*.34,z+.075]}><sphereGeometry args={[.035,6,6]}/><meshStandardMaterial color="#dfd0a2" metalness={.58}/></mesh>})}
    <Box position={[x-.29,y+.08,z+.09]} scale={[.08,.32,.07]} color="#8d998c"/>
    <Box position={[x-.37,y+.24,z+.11]} scale={[.28,.06,.08]} color="#aab2a5"/>
   </group>;
  })}
  {/* Alternating side-draw nozzles, short flanged spools and platform-accessible handwheels. */}
  {[1.7,4.45,6.9].map((y,i)=>{
   const x=i===1?-.52:.52,r=1.18-(y/9)*.36,z=Math.sqrt(r*r-x*x);
   return <group key={`tower-side-draw-${y}`}>
    <Pipe a={[x,y,z-.02]} b={[x,y,z+.52]} color={i===1?'#9b7751':'#7e9b99'} radius={.105}/>
    <mesh position={[x,y,z+.52]}><torusGeometry args={[.15,.026,5,14]}/><meshStandardMaterial color="#d0bd85" metalness={.48}/></mesh>
    <ValveWheel position={[x,y-.32,z+.58]} color="#7c877e"/>
    <Box position={[x,y-.32,z+.28]} scale={[.08,.1,.46]} color="#748278"/>
   </group>;
  })}
  {/* External level-glass chamber with isolation valves and short shell connections. */}
  <Pipe a={[-.93,3.48,.48]} b={[-1.28,3.48,.48]} color="#9da79b" radius={.055}/>
  <Pipe a={[-1.28,3.48,.48]} b={[-1.28,5.2,.48]} color="#b5c5bc" radius={.065}/>
  <Pipe a={[-1.28,5.2,.48]} b={[-.88,5.2,.48]} color="#9da79b" radius={.055}/>
  <ValveWheel position={[-1.28,3.32,.48]} color="#7d8980"/><ValveWheel position={[-1.28,4.7,.48]} color="#7d8980"/>
  {Array.from({length:5},(_,i)=><Box key={`level-glass-mark-${i}`} position={[-1.33,3.72+i*.28,.55]} scale={[.1,.035,.035]} color="#d6d3c0"/>)}
  {/* Pressure/temperature gauges are mounted on short standpipes beside the upper access deck. */}
  {[[.94,5.35],[.76,7.82]].map(([x,y],i)=>{
   const r=1.18-(y/9)*.36,z=Math.sqrt(r*r-x*x)+.15;
   return <group key={`tower-instrument-${i}`}>
    <Pipe a={[x,y-.2,z-.18]} b={[x,y,z-.04]} color="#a5aea3" radius={.045}/>
    <mesh position={[x,y,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.16,.16,.09,14]}/><meshStandardMaterial color="#303b38" metalness={.35}/></mesh>
    <mesh position={[x,y,z+.055]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.12,.025,14]}/><meshStandardMaterial color="#d9d6c8"/></mesh>
    <mesh position={[x+.025,y,z+.075]} rotation={[0,0,-.5]}><boxGeometry args={[.012,.12,.018]}/><meshStandardMaterial color="#9b5545"/></mesh>
   </group>;
  })}
 </group>;
}
function OverheadCondenser({item}:{item:SiteItem}){
 return <ClickGroup item={item} position={item.position}>
  <mesh position={[0,.105,0]} receiveShadow><boxGeometry args={[5.2,.21,2.5]}/><meshStandardMaterial color="#727d74" roughness={.94}/></mesh>
  {[-1.25,1.25].map(x=><group key={`e101-saddle-${x}`}>
   <Box position={[x,.66,0]} scale={[.46,.9,1.25]} color="#69766e"/>
   <Box position={[x,.34,0]} scale={[.9,.16,1.4]} color="#a19168"/>
  </group>)}
  <mesh position={[0,1.47,0]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow><cylinderGeometry args={[.62,.62,3.8,24]}/><meshStandardMaterial color="#aab4aa" map={getWeatheredSteelMap()} metalness={.42} roughness={.61}/></mesh>
  {[-1,1].map(side=><group key={`e101-channel-head-${side}`}>
   <mesh position={[side*1.92,1.47,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.58,.58,.16,20]}/><meshStandardMaterial color="#77847b" metalness={.45}/></mesh>
   <mesh position={[side*2.02,1.47,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.48,.055,7,22]}/><meshStandardMaterial color="#d2bd84" metalness={.52}/></mesh>
   {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <mesh key={`e101-bolt-${i}`} position={[side*2.05,1.47+Math.cos(a)*.49,Math.sin(a)*.49]}><sphereGeometry args={[.045,7,6]}/><meshStandardMaterial color="#d4c697" metalness={.6}/></mesh>})}
  </group>)}
  {[[-1.25,1.9],[1.05,1.9]].map(([x,y],i)=><group key={`e101-nozzle-${i}`}>
   <Pipe a={[x,y,0]} b={[x,y+.42,0]} color="#8a988d" radius={.11}/>
   <mesh position={[x,y+.45,0]}><torusGeometry args={[.15,.028,5,14]}/><meshStandardMaterial color="#c5b684" metalness={.48}/></mesh>
  </group>)}
  <Pipe a={[0,2.0,0]} b={[0,2.35,0]} color="#acb4a6" radius={.13}/>
  <mesh position={[0,2.4,0]}><torusGeometry args={[.18,.03,5,16]}/><meshStandardMaterial color="#d1bd85" metalness={.5}/></mesh>
  <Pipe a={[2.02,1.47,0]} b={[2.34,1.47,0]} color="#9b8055" radius={.11}/>
  <mesh position={[2.34,1.47,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.16,.028,5,14]}/><meshStandardMaterial color="#cfbd86" metalness={.5}/></mesh>
  <Box position={[0,.2,1.1]} scale={[3.8,.08,.1]} color="#8b9589"/>
  <EquipmentTag label={item.id} position={[0,2.5,1.25]}/>
 </ClickGroup>;
}
function RefluxAccumulator({item}:{item:SiteItem}){
 return <ClickGroup item={item} position={item.position}>
  <mesh position={[0,.09,0]} receiveShadow><boxGeometry args={[4.35,.18,2.4]}/><meshStandardMaterial color="#737e74" roughness={.93}/></mesh>
  {[-1.05,1.05].map(x=><group key={`v102-saddle-${x}`}>
   <Box position={[x,.51,0]} scale={[.38,.72,1.12]} color="#637168"/>
   <Box position={[x,.28,0]} scale={[.82,.16,1.32]} color="#a18e63"/>
  </group>)}
  <mesh position={[0,1.27,0]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow><cylinderGeometry args={[.64,.64,3.25,24]}/><meshStandardMaterial color="#aab4a9" map={getWeatheredSteelMap()} metalness={.44} roughness={.62}/></mesh>
  {[-1,1].map(side=><group key={`v102-head-${side}`}>
   <mesh position={[side*1.65,1.27,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.61,.61,.12,20]}/><meshStandardMaterial color="#77847b" metalness={.42}/></mesh>
   <mesh position={[side*1.71,1.27,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.56,.04,6,20]}/><meshStandardMaterial color="#d1bd86" metalness={.5}/></mesh>
   {Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return <mesh key={`v102-flange-bolt-${i}`} position={[side*1.74,1.27+Math.cos(a)*.53,Math.sin(a)*.53]}><sphereGeometry args={[.036,6,6]}/><meshStandardMaterial color="#d7c89b" metalness={.56}/></mesh>})}
  </group>)}
  {/* Overhead vapor inlet, vent and liquid draw nozzles. */}
  <Pipe a={[-1.05,1.78,0]} b={[-1.05,2.1,0]} color="#9ca79b" radius={.13}/>
  <Pipe a={[.55,1.78,0]} b={[.55,2.26,0]} color="#87968a" radius={.09}/>
  <Pipe a={[0,1.82,0]} b={[0,2.3,0]} color="#8c978c" radius={.075}/>
  <Pipe a={[0,.66,0]} b={[0,.47,0]} color="#96774f" radius={.13}/>
  <mesh position={[0,.48,0]}><torusGeometry args={[.17,.028,5,14]}/><meshStandardMaterial color="#cfbb84" metalness={.5}/></mesh>
  {/* External level chamber and two isolation valves. */}
  <Pipe a={[.9,.86,.38]} b={[1.28,.86,.38]} color="#a2ada2" radius={.05}/>
  <Pipe a={[1.28,.86,.38]} b={[1.28,1.75,.38]} color="#b6c7bd" radius={.06}/>
  <Pipe a={[1.28,1.75,.38]} b={[.9,1.75,.38]} color="#a2ada2" radius={.05}/>
  <ValveWheel position={[1.28,.69,.38]} color="#78877e"/><ValveWheel position={[1.28,1.5,.38]} color="#78877e"/>
  <Box position={[1.38,1.3,.4]} scale={[.035,.46,.035]} color="#d5d3c2"/>
  <EquipmentTag label={item.id} position={[0,2.45,.95]}/>
 </ClickGroup>;
}
function RefluxPumpSet({item}:{item:SiteItem}){
 return <ClickGroup item={item} position={item.position}>
  <mesh position={[0,.1,0]} receiveShadow><boxGeometry args={[5.2,.2,2.75]}/><meshStandardMaterial color="#6e7970" roughness={.94}/></mesh>
  {[-1.2,1.2].map((x,i)=><group key={`p102-set-${i}`}>
   <Box position={[x,.29,0]} scale={[2.05,.18,1.55]} color="#505e56"/>
   <Box position={[x-.43,.71,-.25]} scale={[.92,.55,.88]} color="#6b786f"/>
   <mesh position={[x-.38,.76,-.24]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.27,.27,.82,16]}/><meshStandardMaterial color="#859187" map={getWeatheredSteelMap()} metalness={.48} roughness={.57}/></mesh>
   <mesh position={[x-.82,.76,-.24]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.22,.22,.12,12]}/><meshStandardMaterial color="#c2b17e" metalness={.5}/></mesh>
   <Box position={[x+.28,.73,.36]} scale={[.68,.62,.64]} color={i?'#60736a':'#53665d'}/>
   <mesh position={[x+.48,1.08,.36]}><cylinderGeometry args={[.12,.12,.35,12]}/><meshStandardMaterial color="#b4b9ad" metalness={.44}/></mesh>
   <Pipe a={[x+.48,1.25,.36]} b={[x+.48,1.65,.36]} color={i?'#78979a':'#a47851'} radius={.09}/>
   <Box position={[x-.02,.76,.02]} scale={[.18,.32,.62]} color="#303a36"/>
   <mesh position={[x-.02,.76,.35]}><torusGeometry args={[.17,.035,6,14]}/><meshStandardMaterial color="#bdac7b" metalness={.5}/></mesh>
   <ValveWheel position={[x+.48,1.42,.36]} color="#7e897e"/>
  </group>)}
  {/* Common suction header and two short pump branches. */}
  <PipelinePath points={[[-1.2,.55,-.92],[0,.55,-.92],[1.2,.55,-.92]]} color="#96774f" radius={.11}/>
  <PipelinePath points={[[-1.2,.55,-.92],[-1.2,.55,.36],[-.72,.68,.36]]} color="#96774f" radius={.075}/>
  <PipelinePath points={[[1.2,.55,-.92],[1.2,.55,.36],[1.68,.68,.36]]} color="#96774f" radius={.075}/>
  {/* Discharge branches join a raised reflux return header. */}
  <PipelinePath points={[[-.72,1.65,.36],[-.72,1.35,.95],[0,1.35,.95],[.72,1.35,.95],[1.68,1.65,.36]]} color="#78959a" radius={.085}/>
  <Box position={[0,1.95,-1.17]} scale={[2.8,.08,.08]} color="#c6b782"/>
  <EquipmentTag label={item.id} position={[0,2.45,1.12]}/>
 </ClickGroup>;
}
function CDUOverheadPiping(){return <group>
 {/* Illustrative CDU overhead -> shell-and-tube condenser -> accumulator, plus a separate reflux-pump return. */}
 <PipelinePath points={[[-12,9.62,-9],[-12,10,-9],[-9,10,-9],[-9,2.35,-9],[-9,2.35,-5.7]]} color="#a98553" radius={.14}/>
 <PipelinePath points={[[-6.66,1.47,-5.7],[-5.15,1.47,-5.7],[-5.15,2.08,-5.7]]} color="#9c8055" radius={.11}/>
 <PipelinePath points={[[-4.1,.72,-5.7],[-4.1,.45,-5.7],[-4.1,.45,-3.12],[-6.8,.45,-3.12],[-6.8,.55,-3.12]]} color="#96774f" radius={.12}/>
 <PipelinePath points={[[-6.8,1.35,-1.25],[-6.8,4.4,-1.25],[-6.8,4.4,-7.6],[-12,4.4,-7.6],[-12,8.25,-7.6]]} color="#78959a" radius={.11}/>
 <ValveWheel position={[-9,2.35,-7.1]} color="#8f7854"/><ValveWheel position={[-6.8,4.4,-4.5]} color="#6f8c8f"/>
 </group>}
function FurnaceBurner({x}:{x:number}){
 const flame=useRef<THREE.Group>(null),phase=useRef(x*.7),night=useStore(s=>s.night);
 useFrame((_,delta)=>{phase.current+=delta;if(flame.current){const t=phase.current;flame.current.scale.set(.92+Math.sin(t*11)*.05,.9+Math.sin(t*14+x)*.12,.9+Math.cos(t*9)*.05);flame.current.rotation.z=Math.sin(t*2.5)*.035;}});
 return <group position={[x,1.02,1.99]}>
  {/* Small burner throat set into the firebox wall; flame remains behind the protective rim. */}
  <Box position={[-.24,0,0]} scale={[.055,.64,.14]} color="#46534c"/><Box position={[.24,0,0]} scale={[.055,.64,.14]} color="#46534c"/>
  <Box position={[0,-.29,0]} scale={[.52,.055,.14]} color="#46534c"/><Box position={[0,.29,0]} scale={[.52,.055,.14]} color="#46534c"/>
  <mesh position={[0,0,-.025]}><cylinderGeometry args={[.12,.16,.16,12]}/><meshStandardMaterial color="#303632" metalness={.45} roughness={.58}/></mesh>
  <group ref={flame} position={[0,.02,.045]}>
   <mesh position={[0,.25,0]}><coneGeometry args={[.15,.5,8]}/><meshBasicMaterial color="#f27726" transparent opacity={.88} depthWrite={false} toneMapped={false}/></mesh>
   <mesh position={[0,.18,.012]} scale={[.52,.75,.62]}><coneGeometry args={[.12,.42,7]}/><meshBasicMaterial color="#ffd16a" transparent opacity={.92} depthWrite={false} toneMapped={false}/></mesh>
  </group>
  {night&&<pointLight position={[0,.32,.24]} color="#ff8b32" intensity={1.5} distance={3.5} decay={2}/>}
 </group>;
}
function Furnace({item}: {item:SiteItem}) {
 const night=useStore(s=>s.night);
 const stackX=1.02,stackZ=-.15,stackBottom=7.28,stackHeight=7.05;
 return <ClickGroup item={item} position={item.position}>
  {/* Keep this taller heater inside its existing equipment envelope; only the stack gains height. */}
  <group scale={[.62,1,.62]}>
  {/* Low plinth, steel bents, and a refractory-lined box-type radiant/firebox section. */}
  <mesh position={[0,.105,0]} receiveShadow><boxGeometry args={[5.55,.21,4.65]}/><meshStandardMaterial color="#747c73" roughness={.94}/></mesh>
  {[-2.25,2.25].flatMap(x=>[-1.95,1.95].map(z=><group key={`heater-foot-${x}-${z}`}>
   <Box position={[x,.32,z]} scale={[.48,.22,.48]} color="#85877c"/>
   <Box position={[x,2.63,z]} scale={[.14,4.5,.14]} color="#67756c"/>
   <Box position={[x,.49,z]} scale={[.46,.1,.46]} color="#b2a078"/>
  </group>))}
  {[-1,1].map(side=><group key={`heater-side-brace-${side}`}>
   <Pipe a={[side*2.25,.55,-1.94]} b={[side*2.25,4.68,1.94]} color="#69776e" radius={.055}/>
   <Pipe a={[side*2.25,4.68,-1.94]} b={[side*2.25,.55,1.94]} color="#69776e" radius={.055}/>
   <Box position={[side*2.25,1.05,0]} scale={[.1,.1,3.85]} color="#77847a"/>
   <Box position={[side*2.25,4.42,0]} scale={[.1,.1,3.85]} color="#77847a"/>
  </group>)}
  {/* Back, side, roof and floor casing panels. */}
  <mesh position={[0,2.52,-1.86]} castShadow receiveShadow><boxGeometry args={[4.35,3.76,.15]}/><meshStandardMaterial color="#89897e" map={getWeatheredSteelMap()} metalness={.35} roughness={.72}/></mesh>
  {[-2.1,2.1].map(x=><mesh key={`heater-side-wall-${x}`} position={[x,2.52,0]} castShadow receiveShadow><boxGeometry args={[.15,3.76,3.65]}/><meshStandardMaterial color="#85877d" map={getWeatheredSteelMap()} metalness={.32} roughness={.72}/></mesh>)}
  <Box position={[0,.64,0]} scale={[4.3,.18,3.7]} color="#4d554e"/>
  <Box position={[0,4.43,0]} scale={[4.38,.16,3.82]} color="#767d73"/>
  {/* Front casing has three burner openings, not a broad exposed toy flame panel. */}
  <Box position={[0,.72,1.94]} scale={[4.28,.22,.16]} color="#777e74"/>
  <Box position={[0,2.94,1.94]} scale={[4.28,2.92,.16]} color="#85867c"/>
  {[[-1.83,.72],[-.625,.83],[.625,.83],[1.83,.72]].map(([x,width],i)=><Box key={`heater-burner-front-panel-${i}`} position={[x,1.03,1.94]} scale={[width,.62,.16]} color="#85867c"/>)}
  {[-1.25,0,1.25].map(x=><FurnaceBurner key={`heater-burner-${x}`} x={x}/>)}
  {/* Radiant tubes and return bends visible within the lined firebox. */}
  {[-1,1].map(side=><group key={`radiant-coil-${side}`}>
   {[-1.08,-.54,0,.54,1.08].map((z,i)=><Pipe key={`radiant-tube-${i}`} a={[side*1.87,.92,z]} b={[side*1.87,4.06,z]} color="#c0c5ba" radius={.045}/>)}
   {[-1.08,-.54,0,.54].map((z,i)=>{const y=i%2===0?4.06:.92;return <Pipe key={`radiant-return-${i}`} a={[side*1.87,y,z]} b={[side*1.87,y,z+.54]} color="#aab3a8" radius={.045}/>})}
  </group>)}
  {/* External insulated header boxes and small access covers. */}
  {[-1,1].map(side=><group key={`heater-header-box-${side}`}>
   <Box position={[side*2.31,2.45,0]} scale={[.34,1.8,1.52]} color="#6a756d"/>
   <Box position={[side*2.49,2.5,0]} scale={[.035,1.4,1.17]} color="#8a9082"/>
   {[-.48,0,.48].map(z=><mesh key={`header-bolt-${z}`} position={[side*2.515,2.52,z]}><sphereGeometry args={[.04,7,6]}/><meshStandardMaterial color="#c4b684" metalness={.55}/></mesh>)}
   <Pipe a={[side*2.31,1.6,-.68]} b={[side*2.66,1.6,-.68]} color="#987951" radius={.075}/>
   <Pipe a={[side*2.31,3.32,.68]} b={[side*2.66,3.32,.68]} color="#987951" radius={.075}/>
  </group>)}
  {/* Fuel manifold with three short branches and hand-isolation wheels. */}
  <Pipe a={[-1.76,.47,2.33]} b={[1.76,.47,2.33]} color="#936a4b" radius={.075}/>
  {[-1.25,0,1.25].map(x=><group key={`fuel-branch-${x}`}>
   <Pipe a={[x,.47,2.33]} b={[x,.75,2.12]} color="#a36c49" radius={.055}/>
   <mesh position={[x,.51,2.3]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.115,.024,6,14]}/><meshStandardMaterial color="#c2ac76" metalness={.48}/></mesh>
   <Box position={[x,.36,2.3]} scale={[.06,.22,.06]} color="#c2ac76"/>
  </group>)}
  {/* Stacked convection/shield tube bank in an open maintenance frame above the firebox. */}
  <Box position={[0,4.72,0]} scale={[3.5,.18,3.12]} color="#59665e"/>
  {[-1.58,1.58].map(x=><Box key={`conv-column-x-${x}`} position={[x,5.78,0]} scale={[.13,2.05,2.85]} color="#69786e"/>)}
  {[-1.35,1.35].map(z=><Box key={`conv-column-z-${z}`} position={[0,5.78,z]} scale={[3.22,2.05,.13]} color="#69786e"/>)}
  <Box position={[0,5.78,-1.32]} scale={[3.0,1.8,.1]} color="#727c72"/>
  {Array.from({length:7},(_,i)=>{
   const y=4.98+i*.28;
   return <group key={`convection-row-${i}`}>
    <Pipe a={[-1.48,y,1.28]} b={[1.48,y,1.28]} color={i<2?'#aeb7ab':'#9fa99f'} radius={i<2?.07:.075}/>
    {i>=2&&Array.from({length:8},(_,fin)=>{const x=-1.26+fin*.36;return <mesh key={`finned-tube-${fin}`} position={[x,y,1.28]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.13,.018,5,12]}/><meshStandardMaterial color="#b7b7a4" metalness={.46} roughness={.58}/></mesh>})}
    {[-1,1].map(side=><Box key={`tube-sheet-${side}`} position={[side*1.48,y,1.28]} scale={[.1,.2,.32]} color="#a39c81"/>)}
   </group>;
  })}
  {[-1.28,-.64,0,.64,1.28].map((x,i)=><Box key={`convection-louver-${i}`} position={[x,5.78,1.39]} scale={[.05,1.9,.05]} color="#859187"/>)}
  <Box position={[0,6.82,0]} scale={[3.52,.15,3.12]} color="#69766d"/>
  {/* Top inspection deck and its waist-high guardrail. */}
  {Array.from({length:17},(_,i)=><Box key={`heater-top-grate-${i}`} position={[-1.5+i*.187,6.91,0]} scale={[.035,.035,2.86]} color="#353f3a"/>)}
  {[-1.82,1.82].map(x=><group key={`heater-top-rail-x-${x}`}><Box position={[x,7.37,0]} scale={[.055,.9,3.05]} color="#caba8a"/>{[-1.4,-.7,0,.7,1.4].map(z=><Box key={z} position={[x,7.36,z]} scale={[.055,.82,.055]} color="#caba8a"/>)}</group>)}
  {[-1.53,1.53].map(z=><group key={`heater-top-rail-z-${z}`}><Box position={[0,7.37,z]} scale={[3.65,.9,.055]} color="#caba8a"/>{[-1.4,-.7,0,.7,1.4].map(x=><Box key={x} position={[x,7.36,z]} scale={[.055,.82,.055]} color="#caba8a"/>)}</group>)}
  {/* Fixed access ladder up the firebox and convection-frame service side. */}
  <Pipe a={[2.22,.55,-1.48]} b={[2.22,6.74,-1.48]} color="#c3b787" radius={.025}/>
  <Pipe a={[2.22,.55,-1.08]} b={[2.22,6.74,-1.08]} color="#c3b787" radius={.025}/>
  {Array.from({length:19},(_,i)=><Box key={`heater-service-rung-${i}`} position={[2.22,.72+i*.32,-1.28]} scale={[.05,.035,.4]} color="#c3b787"/>)}
  {[3.0,4.2,5.4,6.5].map(y=><mesh key={`heater-service-hoop-${y}`} position={[2.22,y,-1.28]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.31,.018,5,16]}/><meshStandardMaterial color="#a9996e" metalness={.42}/></mesh>)}
  {/* Breeching feeds an unscaled round stack; the stack itself stays circular within the compact bay. */}
  <group position={[stackX,0,stackZ]} scale={[1/.62,1,1/.62]}>
   <mesh position={[0,stackBottom+stackHeight/2,0]} castShadow>
    <cylinderGeometry args={[.36,.45,stackHeight,20,1,true]}/>
    <meshStandardMaterial color="#7f8981" map={getWeatheredSteelMap()} metalness={.46} roughness={.62} side={THREE.DoubleSide}/>
   </mesh>
   <mesh position={[0,stackBottom+.18,0]}><cylinderGeometry args={[.58,.62,.36,20]}/><meshStandardMaterial color="#65746b" metalness={.42}/></mesh>
   {[8.15,10.45,12.9,14.12].map(y=><mesh key={`heater-stack-seam-${y}`} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.4-(y-stackBottom)*.012,.025,6,24]}/><meshStandardMaterial color="#adb0a3" metalness={.6}/></mesh>)}
   <mesh position={[0,stackBottom+stackHeight,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.36,.045,7,24]}/><meshStandardMaterial color="#b8b7a8" metalness={.6}/></mesh>
   <mesh position={[0,13.72,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.44,.9,28]}/><meshStandardMaterial color="#333d38" metalness={.38} roughness={.82} side={THREE.DoubleSide}/></mesh>
   {[13.88,14.26].map(y=><mesh key={`heater-stack-rail-${y}`} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.87,.026,6,28]}/><meshStandardMaterial color="#cfbd89" metalness={.42}/></mesh>)}
   {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <mesh key={`heater-stack-post-${i}`} position={[Math.cos(a)*.87,14.06,Math.sin(a)*.87]}><cylinderGeometry args={[.02,.02,.42,6]}/><meshStandardMaterial color="#c6b682"/></mesh>})}
   <Pipe a={[.38,9.25,0]} b={[.7,9.25,0]} color="#a6a796" radius={.055}/>
   <mesh position={[.73,9.25,0]}><cylinderGeometry args={[.09,.09,.12,10]}/><meshStandardMaterial color="#d0bd86" metalness={.55}/></mesh>
   <Pipe a={[.52,8.3,-.3]} b={[.52,8.3,.3]} color="#b6a578" radius={.035}/>
   {/* Stack ladder starts at the heater top deck, then continues to the sampling platform. */}
   <Pipe a={[.48,7.35,-.22]} b={[.48,14.1,-.22]} color="#c3b787" radius={.025}/>
   <Pipe a={[.48,7.35,.22]} b={[.48,14.1,.22]} color="#c3b787" radius={.025}/>
   {Array.from({length:21},(_,i)=><Box key={`heater-ladder-rung-${i}`} position={[.48,7.45+i*.32,0]} scale={[.05,.035,.44]} color="#c3b787"/>)}
   {[8.0,8.8,9.6,10.4,11.2,12.0,12.8,13.6].map(y=><mesh key={`heater-ladder-hoop-${y}`} position={[.48,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.38,.018,5,18]}/><meshStandardMaterial color="#a9996e" metalness={.42}/></mesh>)}
  </group>
  {night&&<pointLight position={[0,1.2,2.3]} color="#ff9c4a" intensity={2.2} distance={9} decay={2}/>}
  </group>
  <EquipmentTag label={item.id} position={[-.75,4.1,1.22]}/>
 </ClickGroup>;
}
function CampusCar({position,color}:{position:[number,number,number];color:string}){return <group position={position}>
 <Box position={[0,.55,0]} scale={[1.55,.55,3.55]} color={color}/><Box position={[0,.92,-.18]} scale={[1.28,.62,1.62]} color="#aab8b3"/><Box position={[0,.93,.22]} scale={[1.31,.52,1.45]} color="#30474a"/>
 <Box position={[0,.42,1.8]} scale={[1.46,.2,.16]} color="#525957"/><Box position={[0,.42,-1.8]} scale={[1.46,.2,.16]} color="#525957"/>
 {[-1,1].map(side=><group key={side}>{[-1,1].map(end=><group key={end} position={[side*.78,.36,end*1.12]} rotation={[0,0,Math.PI/2]}><mesh><cylinderGeometry args={[.32,.32,.16,12]}/><meshStandardMaterial color="#303532" roughness={.9}/></mesh><mesh position={[0,side*.09,0]}><cylinderGeometry args={[.16,.16,.025,12]}/><meshStandardMaterial color="#aeb1a4" metalness={.6}/></mesh></group>)}<Box position={[side*.79,.72,-.12]} scale={[.14,.15,.3]} color={color}/></group>)}
 {[-1,1].map(side=><group key={`lamp-${side}`}><Box position={[side*.48,.59,1.81]} scale={[.28,.16,.035]} color="#ead9a0"/><Box position={[side*.5,.6,-1.82]} scale={[.26,.13,.035]} color="#a44c3f"/></group>)}
 </group>}
function CampusTree({position}:{position:[number,number,number]}){
 return <group position={position}>
  {/* Mulched tree pit and a tapered trunk with visible branching. */}
  <mesh position={[0,.035,0]} receiveShadow><cylinderGeometry args={[.55,.58,.07,20]}/><meshStandardMaterial color="#665b49" roughness={1}/></mesh>
  <mesh position={[0,.95,0]} castShadow><cylinderGeometry args={[.085,.16,1.9,10]}/><meshStandardMaterial color="#64503f" roughness={1}/></mesh>
  {[-1,1].map(side=><group key={`tree-branch-${side}`}>
   <mesh position={[side*.18,1.74,0]} rotation={[0,0,-side*.38]} castShadow><cylinderGeometry args={[.045,.075,.82,8]}/><meshStandardMaterial color="#66503f" roughness={1}/></mesh>
   <mesh position={[0,1.82,side*.17]} rotation={[side*.34,0,0]} castShadow><cylinderGeometry args={[.035,.065,.68,8]}/><meshStandardMaterial color="#66503f" roughness={1}/></mesh>
  </group>)}
  {/* Overlapping, irregular crowns keep a natural silhouette without spherical topiary. */}
  <mesh position={[0,2.38,0]} scale={[.69,.74,.66]} castShadow><dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color="#647d58" roughness={1}/></mesh>
  <mesh position={[-.32,2.22,.17]} scale={[.48,.43,.47]} rotation={[.12,.28,-.1]} castShadow><dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color="#718964" roughness={1}/></mesh>
  <mesh position={[.38,2.34,-.2]} scale={[.47,.48,.46]} rotation={[-.08,.4,.12]} castShadow><dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color="#566f4f" roughness={1}/></mesh>
  <mesh position={[-.08,2.95,.1]} scale={[.54,.55,.52]} rotation={[.16,-.3,.08]} castShadow><dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color="#6b835c" roughness={1}/></mesh>
 </group>;
}
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
function ControlBuilding({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <ClickGroup item={item} position={item.position}>
  <Box position={[0,.16,0]} scale={[7.45,.32,5.45]} color="#626d66"/>
  <Box position={[0,1.78,0]} scale={[7,3.2,5]} color="#828c83"/>
  <Box position={[0,.44,0]} scale={[7.16,.3,5.16]} color="#657168"/>
  {/* Separate control-building massing with a narrow glazed observation band facing the campus. */}
  <Box position={[0,2.36,2.54]} scale={[5.08,.66,.1]} color="#354541"/>
  <Box position={[0,2.36,2.60]} scale={[4.74,.43,.035]} color={night?'#eeddb9':'#78908d'}/>
  {[-1.9,-.95,0,.95,1.9].map(x=><Box key={`ccr-mullion-${x}`} position={[x,2.36,2.64]} scale={[.055,.54,.055]} color="#c2b383"/>)}
  <Box position={[0,2.73,2.64]} scale={[5.2,.11,.16]} color="#a49f8b"/>
  {/* Main entrance, raised stoop and handrails; secondary egress is on the east flank. */}
  <Box position={[2.55,1.12,2.56]} scale={[1.02,1.95,.12]} color="#344542"/>
  <Box position={[2.55,1.12,2.63]} scale={[.72,1.62,.035]} color={night?'#e5d5b1':'#758b87'}/>
  <Box position={[2.98,1.18,2.67]} scale={[.06,.12,.08]} color="#d0b77b"/>
  <Box position={[2.55,.15,2.94]} scale={[1.65,.24,.72]} color="#9d9c8c"/>
  {[-1,1].map(side=><group key={`ccr-entry-rail-${side}`}>
   <Pipe a={[2.55+side*1.02,.3,3.18]} b={[2.55+side*1.02,.82,2.8]} color="#bca875" radius={.035}/>
   {[2.83,3.07].map(z=><Box key={z} position={[2.55+side*1.02,.55,z]} scale={[.055,.52,.055]} color="#737e74"/>)}
  </group>)}
  <Box position={[3.53,1.02,-1.15]} scale={[.1,1.78,.98]} color="#364541"/>
  <Box position={[3.59,1.02,-1.15]} scale={[.035,1.48,.72]} color={night?'#e7d5af':'#718783'}/>
  <Box position={[3.96,.14,-1.15]} scale={[.92,.24,1.34]} color="#a2a091"/>
  <Box position={[3.53,2.18,-1.7]} scale={[.18,.12,.34]} color="#bd5b43"/>
  {/* Screened low-profile roof ventilation, access hatch and perimeter gutters. */}
  <Box position={[0,3.4,0]} scale={[7.38,.24,5.38]} color="#56635c"/>
  <Box position={[-2.2,3.66,-1.25]} scale={[1.45,.36,1.18]} color="#7c867b"/>
  <Box position={[-2.2,3.87,-1.25]} scale={[1.5,.08,1.22]} color="#9c9e8f"/>
  <mesh position={[-2.2,3.92,-1.25]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[.34,.34,.045,14]}/><meshStandardMaterial color="#4e5a54"/></mesh>
  <Box position={[0,3.64,-2.43]} scale={[5.9,.38,.12]} color="#66736a"/>
  {[-2.92,2.92].map(x=><Box key={`ccr-roof-screen-${x}`} position={[x,3.64,-1.2]} scale={[.12,.38,2.45]} color="#66736a"/>)}
  <mesh position={[2.94,3.72,-1.18]}><cylinderGeometry args={[.16,.2,.44,10]}/><meshStandardMaterial color="#858d82"/></mesh>
  <Pipe a={[-3.38,.3,-1.95]} b={[-3.38,3.28,-1.95]} color="#707d74" radius={.055}/>
  <Box position={[-2.25,3.2,2.62]} scale={[1.6,.14,.16]} color="#a7a18f"/>
  <Box position={[-2.25,2.7,2.64]} scale={[1.2,.045,.045]} color="#4d5c54"/>
  <mesh position={[2.55,2.25,2.71]}><boxGeometry args={[.34,.08,.17]}/><meshStandardMaterial color="#e8d8ad" emissive={night?'#ffc46d':'#000000'} emissiveIntensity={night?1.2:0}/></mesh>
  {night&&<pointLight position={[2.55,2.2,2.82]} color="#ffe2b0" intensity={1.3} distance={7} decay={2}/>}
  <group position={[-2.2,3.4,2.7]}><EquipmentTag label={item.id} position={[0,0,0]}/></group>
 </ClickGroup>
}
function LaboratoryBuilding({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <ClickGroup item={item} position={item.position}>
  <Box position={[0,.14,0]} scale={[5.4,.28,4.4]} color="#656f67"/>
  <Box position={[0,1.35,0]} scale={[5,2.55,4]} color="#92978c"/>
  <Box position={[0,.39,0]} scale={[5.13,.25,4.12]} color="#67736b"/>
  {/* Clean modular cladding, framed sample-room glazing and a recessed staff entrance. */}
  <Box position={[-.48,1.86,2.045]} scale={[2.28,.82,.075]} color="#364744"/>
  {[-1.16,-.4,.36].map(x=><group key={`lab-window-${x}`}>
   <Box position={[x,1.86,2.09]} scale={[.65,.61,.03]} color={night?'#ead9b7':'#829a96'}/>
   <Box position={[x,1.86,2.12]} scale={[.045,.7,.045]} color="#c0b183"/>
  </group>)}
  <Box position={[-.48,2.34,2.12]} scale={[2.48,.12,.16]} color="#a59f8c"/>
  <Box position={[1.68,.98,2.05]} scale={[.84,1.72,.1]} color="#3a4a46"/>
  <Box position={[1.68,.98,2.11]} scale={[.54,1.4,.035]} color={night?'#dfd0aa':'#718783'}/>
  <Box position={[2.04,.98,2.14]} scale={[.045,.1,.06]} color="#d2b981"/>
  <Box position={[1.68,.13,2.43]} scale={[1.4,.2,.68]} color="#a1a092"/>
  {/* Roofed vestibule, service louvers and small low-profile laboratory exhaust stacks. */}
  <Box position={[0,2.71,0]} scale={[5.35,.2,4.35]} color="#59665f"/>
  <Box position={[1.68,2.12,2.34]} scale={[1.72,.14,.72]} color="#6f7a71"/>
  {[-1.8,-1.1,-.4].map((x,i)=><group key={`lab-exhaust-${i}`} position={[x,0,-.75+i*.62]}>
   <Box position={[0,2.86,0]} scale={[.68,.18,.62]} color="#66756d"/>
   <mesh position={[0,3.33,0]}><cylinderGeometry args={[.14,.17,.82,12]}/><meshStandardMaterial color="#a4aaa0" metalness={.42}/></mesh>
   <mesh position={[0,3.77,0]}><cylinderGeometry args={[.24,.24,.075,12]}/><meshStandardMaterial color="#777f75" metalness={.4}/></mesh>
  </group>)}
  <Box position={[-2.55,1.5,-.35]} scale={[.08,.92,1.1]} color="#4c5a54"/>
  {Array.from({length:5},(_,i)=><Box key={`lab-louver-${i}`} position={[-2.61,1.5,-.72+i*.19]} scale={[.04,.055,.12]} color="#b0aa94"/>)}
  <Box position={[-2.58,.94,1.05]} scale={[.12,1.12,.82]} color="#6e7a72"/>
  <Box position={[-2.66,1.12,1.05]} scale={[.035,.42,.52]} color="#c9c1a9"/>
  <Pipe a={[2.34,.28,-1.45]} b={[2.34,2.52,-1.45]} color="#758078" radius={.04}/>
  <Box position={[-1.95,2.52,2.13]} scale={[1.2,.13,.16]} color="#a49f8c"/>
  <group position={[-1.95,2.9,2.18]}><EquipmentTag label={item.id} position={[0,0,0]}/></group>
  <mesh position={[1.68,1.97,2.25]}><boxGeometry args={[.3,.07,.15]}/><meshStandardMaterial color="#ead8ac" emissive={night?'#ffbc63':'#000000'} emissiveIntensity={night?1.1:0}/></mesh>
  {night&&<pointLight position={[1.68,1.92,2.35]} color="#ffe1ad" intensity={.9} distance={5} decay={2}/>}
 </ClickGroup>
}
function FireEngine({x,variant=0}:{x:number;variant?:number}){
 const red=variant?'#b84336':'#c34a3b';
 return <group position={[x,.12,-.12]}>
  {/* Compact six-wheel industrial response appliance, parked within the open bay. */}
  <Box position={[0,.63,-.22]} scale={[1.48,.42,4.35]} color="#343d3a"/>
  <Box position={[0,1.12,-.52]} scale={[1.42,.96,2.3]} color={red}/>
  <Box position={[0,1.34,-.55]} scale={[1.46,.14,2.12]} color="#e4d9bd"/>
  <Box position={[0,1.42,.98]} scale={[1.5,1.44,1.48]} color={red}/>
  <Box position={[0,1.75,1.74]} scale={[1.26,.62,.055]} color="#354744"/>
  <Box position={[0,1.39,2.15]} scale={[1.47,.3,.13]} color="#353e3b"/>
  <Box position={[0,1.24,2.235]} scale={[.54,.36,.035]} color="#7f8c87"/>
  {[-1,1].map(side=><group key={`engine-side-${side}`}>
   <Box position={[side*.755,1.52,1.03]} scale={[.035,.62,.66]} color="#344744"/>
   <Box position={[side*.78,1.6,1.05]} scale={[.025,.42,.48]} color="#819895"/>
   {[-1.45,.05,1.37].map(z=><group key={`${side}-${z}`} position={[side*.77,.43,z]}>
    <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.35,.35,.22,16]}/><meshStandardMaterial color="#202725" roughness={.86}/></mesh>
    <mesh rotation={[0,0,Math.PI/2]}><torusGeometry args={[.19,.045,7,14]}/><meshStandardMaterial color="#9a9d91" metalness={.38}/></mesh>
   </group>)}
   <Box position={[side*.74,1.12,-.55]} scale={[.035,.12,1.95]} color="#e6dcbf"/>
   <Box position={[side*.742,1.18,-1.12]} scale={[.04,.43,.5]} color="#873e34"/>
   <Box position={[side*.742,1.18,-.48]} scale={[.04,.43,.5]} color="#873e34"/>
  </group>)}
  {[-.48,.48].map(dx=><mesh key={`engine-headlamp-${dx}`} position={[dx,1.25,2.255]}><circleGeometry args={[.105,12]}/><meshStandardMaterial color="#f2d493" emissive="#8c6540" emissiveIntensity={.18}/></mesh>)}
  {/* Lightbar, hose reel and ladder rails. */}
  <Box position={[0,2.16,1.02]} scale={[1.05,.13,.23]} color="#303a37"/>
  <Box position={[-.34,2.25,1.02]} scale={[.2,.12,.18]} color="#d4a74f"/>
  <Box position={[.34,2.25,1.02]} scale={[.2,.12,.18]} color="#5f8990"/>
  <Box position={[0,1.72,-1.72]} scale={[.72,.55,.045]} color="#edd9a1"/>
  <Box position={[0,1.58,-1.75]} scale={[.62,.12,.035]} color="#a94d3d"/>
  {[-.52,.52].map(dx=><Pipe key={`engine-ladder-${dx}`} a={[dx,1.99,-1.45]} b={[dx,2.17,.05]} color="#b8bcb0" radius={.035}/>)}
 </group>;
}
function FireStation({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <ClickGroup item={item} position={item.position}>
  {/* A marked hardstand links the two vehicle bays to the existing utility road. */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-.2,.025,3.7]} receiveShadow><planeGeometry args={[8.3,1.6]}/><meshStandardMaterial color={night?'#333a37':'#555d57'} roughness={.95}/></mesh>
  <Box position={[-.2,.045,3.7]} scale={[8.15,.025,1.5]} color="#555d57"/>
  {[ -3.1,-2.75,2.35,2.7].map(x=><Box key={`apron-edge-${x}`} position={[x,.063,3.7]} scale={[.045,.025,1.42]} color="#d0c9b0"/>)}
  <Box position={[4.42,.028,3.18]} scale={[1.0,.02,.68]} color="#555d57"/>
  {/* Concrete slab, rear and side walls; the front is intentionally open at both apparatus bays. */}
  <Box position={[0,.12,0]} scale={[7.8,.24,5.9]} color="#73766d"/>
  <Box position={[0,.26,0]} scale={[7.48,.08,5.58]} color="#4b514d"/>
  <Box position={[-3.72,1.86,0]} scale={[.2,3.36,5.55]} color="#8e9389"/>
  <Box position={[3.72,1.86,0]} scale={[.2,3.36,5.55]} color="#858c82"/>
  <Box position={[0,1.86,-2.7]} scale={[7.5,3.36,.2]} color="#858c82"/>
  {/* Structural bay jambs and lintels leave clear openings for both fire engines. */}
  <Box position={[-3.66,1.7,2.72]} scale={[.24,3.12,.22]} color="#717a71"/>
  <Box position={[3.66,1.7,2.72]} scale={[.24,3.12,.22]} color="#717a71"/>
  <Box position={[0,1.64,2.72]} scale={[.38,3.0,.24]} color="#707970"/>
  {[-1.84,1.84].map(x=><group key={`station-bay-${x}`}>
   <Box position={[x,1.38,2.655]} scale={[3.22,2.64,.07]} color="#303a37"/>
   <Box position={[x,2.82,2.72]} scale={[3.44,.16,.28]} color="#b0aa96"/>
   {[-1,1].map(side=><Box key={side} position={[x+side*1.68,1.42,2.72]} scale={[.11,2.85,.14]} color="#69766e"/>)}
   <Box position={[x,3.22,2.64]} scale={[3.15,.38,.1]} color="#53635c"/>
   {[-.9,0,.9].map(dx=><Box key={dx} position={[x+dx,3.22,2.72]} scale={[.04,.3,.04]} color="#b1a77f"/>)}
  </group>)}
  {/* Visible apparatus and bay interior fittings. */}
  {[-1.82,1.82].map((x,i)=><FireEngine key={`fire-engine-${i}`} x={x} variant={i}/>)}
  {[-3.38,3.38].map((x,i)=><group key={`locker-${i}`}>
   <Box position={[x,1.02,-1.68]} scale={[.35,1.48,1.3]} color="#596b61"/>
   {[.55,1.0,1.45].map(y=><Box key={y} position={[x, y,-.99]} scale={[.28,.07,.05]} color="#c1b58c"/>)}
   <Box position={[x,1.06,-.98]} scale={[.2,.72,.035]} color="#b49c69"/>
  </group>)}
  <Box position={[0,.34,-2.56]} scale={[7.25,.14,.16]} color="#9d9c8e"/>
  {/* Staff entrance, glazed upper band, roof edge and modest pitched metal roof. */}
  <Box position={[3.32,1.1,2.79]} scale={[.66,1.98,.12]} color="#394944"/>
  <Box position={[3.32,1.1,2.86]} scale={[.44,1.68,.035]} color={night?'#e7d6b1':'#728a85'}/>
  <Box position={[3.32,.14,3.03]} scale={[1.12,.22,.66]} color="#a19f91"/>
  <Box position={[0,3.3,0]} scale={[7.85,.34,5.9]} color="#6e7971"/>
  <Box position={[0,3.24,2.91]} scale={[7.7,.34,.3]} color="#a49f8e"/>
  {[-2.8,-1.4,0,1.4,2.8].map(x=><Box key={`fire-station-transom-${x}`} position={[x,3.24,3.08]} scale={[.08,.44,.05]} color="#6f7c73"/>)}
  <Box position={[-1.85,3.63,0]} scale={[4.05,.14,6.24]} rotation={[0,0,-.12]} color="#515d57"/>
  <Box position={[1.85,3.63,0]} scale={[4.05,.14,6.24]} rotation={[0,0,.12]} color="#515d57"/>
  <Box position={[0,3.9,0]} scale={[.16,.2,6.3]} color="#748078"/>
  <Box position={[0,3.52,3.18]} scale={[2.35,.42,.18]} color="#394843"/>
  <group position={[0,3.52,3.3]}><EquipmentTag label={item.id} position={[0,0,0]}/></group>
  {[ -3.35,3.35].map(x=><Pipe key={`downpipe-${x}`} a={[x,3.15,2.82]} b={[x,.35,2.82]} color="#737f75" radius={.045}/>)}
  <Box position={[0,4.14,-2.22]} scale={[.78,.12,.08]} color="#6b766e"/>
  <mesh position={[3.32,2.35,3.02]}><boxGeometry args={[.22,.08,.13]}/><meshStandardMaterial color="#f1d9a6" emissive={night?'#ffc46d':'#000000'} emissiveIntensity={night?1.2:0}/></mesh>
  {night&&<pointLight position={[3.32,2.28,3.16]} color="#ffe1ae" intensity={1.6} distance={7} decay={2}/>}
 </ClickGroup>;
}
function ProcessPumpSet({x}:{x:number}){
 return <group position={[x,0,-.35]}>
  <Box position={[0,.16,0]} scale={[.74,.18,1.16]} color="#414e48"/>
  {[-.29,.29].flatMap(dx=>[-.43,.43].map(z=><group key={`${dx}-${z}`} position={[dx,.27,z]}>
   <mesh><cylinderGeometry args={[.045,.045,.12,8]}/><meshStandardMaterial color="#c7b88e" metalness={.6}/></mesh>
   <mesh position={[0,.07,0]}><cylinderGeometry args={[.015,.015,.05,6]}/><meshStandardMaterial color="#77857b"/></mesh>
  </group>))}
  {/* Horizontal driver, ribbed motor casing, terminal box and fan cover. */}
  <mesh position={[0,.76,-.43]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.235,.235,.66,20]}/><meshStandardMaterial color="#536a61" metalness={.5} roughness={.54}/></mesh>
  {[-.69,-.55,-.4,-.25,-.1].map(z=><mesh key={z} position={[0,.76,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.235,.025,6,18]}/><meshStandardMaterial color="#89958b" metalness={.55}/></mesh>)}
  <mesh position={[0,.76,-.78]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.2,.2,.1,18]}/><meshStandardMaterial color="#77867d" metalness={.5}/></mesh>
  <Box position={[.18,1.02,-.42]} scale={[.25,.18,.3]} color="#66786d"/>
  <Box position={[0,.76,-.03]} scale={[.49,.36,.25]} color="#c0a76a"/>
  {/* Bearing housing and volute-shaped casing at the pump end. */}
  <Box position={[0,.76,.16]} scale={[.36,.3,.28]} color="#708078"/>
  <mesh position={[0,.77,.39]} scale={[.34,.3,.34]} castShadow><sphereGeometry args={[1,18,14]}/><meshStandardMaterial color="#70847a" metalness={.48} roughness={.48}/></mesh>
  <mesh position={[0,.77,.57]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.27,.035,7,18]}/><meshStandardMaterial color="#aeb6aa" metalness={.5}/></mesh>
  {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <mesh key={`pump-case-bolt-${i}`} position={[Math.cos(a)*.27,.77+Math.sin(a)*.27,.59]}><sphereGeometry args={[.028,6,6]}/><meshStandardMaterial color="#c9bd95" metalness={.6}/></mesh>})}
  {/* Suction nozzle, bolted flange, discharge riser and a stylized valve/check body. */}
  <Pipe a={[0,.76,.56]} b={[0,.76,1.21]} color="#98a39a" radius={.105}/>
  <mesh position={[0,.76,1.2]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.14,.035,7,18]}/><meshStandardMaterial color="#c8b985" metalness={.6}/></mesh>
  <Pipe a={[0,.91,.38]} b={[0,1.43,.38]} color="#9ba69b" radius={.095}/>
  <mesh position={[0,1.22,.38]}><sphereGeometry args={[.17,12,10]}/><meshStandardMaterial color="#8e9a90" metalness={.4}/></mesh>
  <Pipe a={[0,1.43,.38]} b={[0,1.43,.93]} color="#b48a54" radius={.085}/>
  <mesh position={[0,1.48,.38]}><torusGeometry args={[.12,.023,6,16]}/><meshStandardMaterial color="#d0bd86" metalness={.58}/></mesh>
  <Box position={[0,.35,.5]} scale={[.16,.18,.15]} color="#596b60"/>
 </group>;
}
function SteamBoilerStation({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <ClickGroup item={item} position={item.position}>
  {/* Independent package-boiler pad, kept clear of the existing treatment plant and gate approach. */}
  <mesh position={[0,.1,0]} receiveShadow><boxGeometry args={[8.6,.2,4.5]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',8.6/9,4.5/9)} color="#8b8e82" roughness={.94}/></mesh>
  <Box position={[0,.22,0]} scale={[8.2,.06,4.16]} color="#4b5750"/>
  {/* Open modular steel frame leaves the boiler train legible from the overview camera. */}
  {[-3.9,3.9].flatMap(x=>[-1.85,1.85].map(z=><group key={`boiler-frame-${x}-${z}`}>
   <Box position={[x,2.88,z]} scale={[.16,5.35,.16]} color="#607168"/><Box position={[x,.35,z]} scale={[.42,.18,.42]} color="#9b9274"/>
  </group>))}
  {[2.05,4.45].map(y=><group key={`boiler-tie-${y}`}>
   {[-3.9,3.9].map(z=><Box key={z} position={[0,y,z]} scale={[7.9,.12,.12]} color="#718078"/>)}
   {[-3.9,3.9].map(x=><Box key={x} position={[x,y,0]} scale={[.12,.12,3.8]} color="#718078"/>)}
  </group>)}
  {/* Water-tube package: radiant furnace, burner register and convection/economizer bank. */}
  <mesh position={[-1.45,1.85,-.15]} castShadow receiveShadow>
   <boxGeometry args={[3.55,3.35,2.85]}/><meshStandardMaterial color="#718078" map={getWeatheredSteelMap()} metalness={.48} roughness={.61}/>
  </mesh>
  {[-3.18,.28].map(x=><Box key={`boiler-side-seam-${x}`} position={[x,1.84,-.15]} scale={[.09,3.18,2.92]} color="#56645d"/>)}
  {[-2.45,-1.45,-.45].map(x=><group key={`boiler-burner-${x}`}>
   <mesh position={[x,1.45,1.31]}><cylinderGeometry args={[.36,.43,.18,16]}/><meshStandardMaterial color="#414d47" metalness={.55}/></mesh>
   <mesh position={[x,1.46,1.42]}><circleGeometry args={[.24,16]}/><meshBasicMaterial color={night?'#f2a24d':'#794b2c'} toneMapped={false}/></mesh>
   <Box position={[x,1.04,1.36]} scale={[.11,.68,.12]} color="#bd7d49"/>
  </group>)}
  <Box position={[-1.45,3.55,-.15]} scale={[3.25,.22,2.58]} color="#a1a495"/>
  {/* Tube bank cassette and individually readable tube rows. */}
  <Box position={[.82,3.25,-.2]} scale={[1.42,1.72,2.62]} color="#65756d"/>
  {Array.from({length:8},(_,i)=><mesh key={`boiler-tube-${i}`} position={[.2+i*.18,3.28,1.16]} rotation={[Math.PI/2,0,0]}>
   <cylinderGeometry args={[.045,.045,2.28,8]}/><meshStandardMaterial color={i%2?'#a4aaa0':'#89958a'} metalness={.48} roughness={.48}/>
  </mesh>)}
  {/* Steam drum, safety valves, level glass, handwheel and manway. */}
  <mesh position={[-1.15,4.28,-.2]} rotation={[0,0,Math.PI/2]} castShadow>
   <cylinderGeometry args={[.48,.48,3.1,24,1,false]}/><meshStandardMaterial color="#aab1a5" map={getWeatheredSteelMap()} metalness={.52} roughness={.55}/>
  </mesh>
  {[-2.64,.34].map(x=><mesh key={`boiler-drum-head-${x}`} position={[x,4.28,-.2]} scale={[.26,.48,.48]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#aab1a5" map={getWeatheredSteelMap()} metalness={.5} roughness={.56}/></mesh>)}
  {[-2.15,-.72].map(x=><mesh key={`drum-course-${x}`} position={[x,4.28,-.2]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.482,.022,6,22]}/><meshStandardMaterial color="#69776e" metalness={.5}/></mesh>)}
  {[-2.05,-1.16,-.22].map((x,i)=><group key={`boiler-safety-${i}`}>
   <Pipe a={[x,4.65,-.2]} b={[x,5.12,-.2]} color="#bdad7d" radius={.055}/>
   <mesh position={[x,5.19,-.2]}><cylinderGeometry args={[.11,.14,.12,12]}/><meshStandardMaterial color="#c6b982" metalness={.48}/></mesh>
  </group>)}
  <Pipe a={[-3.1,4.28,-.2]} b={[-3.48,4.28,-.2]} color="#77867c" radius={.035}/>
  <mesh position={[-3.49,4.28,-.2]}><cylinderGeometry args={[.14,.14,.08,16]}/><meshStandardMaterial color="#dae0d4"/></mesh>
  {/* Breeching, induced-draft fan and compact stack with restrained shell-course wear. */}
  <PipelinePath points={[[1.48,3.3,-.45],[2.15,3.3,-.45],[2.15,4.05,-.45],[2.8,4.05,-.45],[2.8,6.25,-.45]]} color="#66756d" radius={.19}/>
  <mesh position={[2.8,4.72,-.45]}><cylinderGeometry args={[.39,.46,1.05,18]}/><meshStandardMaterial color="#717d74" map={getWeatheredSteelMap()} metalness={.48} roughness={.61}/></mesh>
  <mesh position={[2.8,6.65,-.45]}><cylinderGeometry args={[.29,.37,3.0,20,1,true]}/><meshStandardMaterial color="#838b80" map={getWeatheredSteelMap()} metalness={.48} roughness={.57} side={THREE.DoubleSide}/></mesh>
  {[5.35,6.8,7.95].map(y=><mesh key={`boiler-stack-band-${y}`} position={[2.8,y,-.45]}><torusGeometry args={[y>7?.31:.38,.035,6,20]}/><meshStandardMaterial color="#a49b7d" metalness={.43}/></mesh>)}
  <mesh position={[2.8,8.2,-.45]}><cylinderGeometry args={[.43,.43,.16,20]}/><meshStandardMaterial color="#5b6961" metalness={.45}/></mesh>
  <mesh position={[1.96,3.25,-.45]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.44,.44,.32,16]}/><meshStandardMaterial color="#526158" metalness={.5}/></mesh>
  <mesh position={[2.15,3.25,-.45]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.32,.035,6,16]}/><meshStandardMaterial color="#c2b17d" metalness={.48}/></mesh>
  {/* Deaerator vessel on a service frame, with spray head, vent, level column and access ladder. */}
  {[-1.84,1.84].map(z=><group key={`deaerator-saddle-${z}`}>
   <Box position={[2.16,2.48,z]} scale={[.22,1.75,.22]} color="#68766d"/><Box position={[2.16,1.64,z]} scale={[.72,.16,.52]} color="#9b9375"/>
  </group>)}
  <mesh position={[2.16,3.38,1.05]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.47,.47,3.25,20]}/><meshStandardMaterial color="#9ba89d" map={getWeatheredSteelMap()} metalness={.46} roughness={.58}/></mesh>
  {[-1.43,1.43].map(x=><mesh key={`deaerator-head-${x}`} position={[2.16+x,3.38,1.05]} scale={[.25,.47,.47]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color="#a5ada1" map={getWeatheredSteelMap()} metalness={.46}/></mesh>)}
  <mesh position={[2.16,4.0,1.05]}><cylinderGeometry args={[.3,.38,.58,16]}/><meshStandardMaterial color="#89978d" metalness={.45}/></mesh>
  <mesh position={[2.16,4.43,1.05]}><cylinderGeometry args={[.14,.18,.34,14]}/><meshStandardMaterial color="#78867d" metalness={.42}/></mesh>
  <Pipe a={[2.16,4.56,1.05]} b={[2.16,5.12,1.05]} color="#9da89c" radius={.035}/>
  <Pipe a={[3.82,3.37,1.05]} b={[3.82,4.65,1.05]} color="#71837b" radius={.035}/>
  <mesh position={[3.82,3.37,1.1]}><cylinderGeometry args={[.115,.115,.66,12]}/><meshStandardMaterial color="#d9d7c6"/></mesh>
  {[.39,.69,.99,1.29].map(z=><Box key={`deaerator-ladder-${z}`} position={[3.97,2.16,z]} scale={[.055,.045,.34]} color="#c1b17e"/>)}
  {/* Twin boiler-feed pumps, individual motors, coupling guards, suction and discharge manifolds. */}
  {[-.9,.5].map((x,i)=><group key={`boiler-feed-pump-${i}`} position={[x,.27,-1.42]}>
   <Box position={[0,.12,0]} scale={[1.06,.18,.92]} color="#424f49"/>
   <mesh position={[0,.57,-.2]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.24,.24,.74,18]}/><meshStandardMaterial color="#52685f" metalness={.48} roughness={.55}/></mesh>
   {[-.46,-.3,-.14,.02].map(z=><mesh key={z} position={[0,.57,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.24,.022,6,16]}/><meshStandardMaterial color="#a5ab9e" metalness={.5}/></mesh>)}
   <Box position={[0,.57,.28]} scale={[.48,.35,.28]} color="#c0a66d"/>
   <mesh position={[0,.57,.57]} scale={[.34,.3,.3]}><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color="#76857a" metalness={.43}/></mesh>
   <Pipe a={[0,.57,.72]} b={[0,.57,1.18]} color="#87958a" radius={.08}/>
   <Pipe a={[0,.57,-.54]} b={[0,.57,-.95]} color="#7c9698" radius={.075}/>
  </group>)}
  <Pipe a={[-.9,.84,-2.02]} b={[.5,.84,-2.02]} color="#7d9696" radius={.09}/>
  <Pipe a={[-.9,1.12,-.25]} b={[.5,1.12,-.25]} color="#b28d5a" radius={.085}/>
  <PipelinePath points={[[ -.2,1.12,-.25],[-.2,2.55,-.25],[.36,2.55,-.25],[.36,3.22,-.25]]} color="#7d9696" radius={.07}/>
  <PipelinePath points={[[.36,3.65,-.2],[.36,4.18,-.2],[-.25,4.62,-.2],[-.25,4.76,-.2]]} color="#b88c56" radius={.075}/>
  {/* Chemical dosing cabinet, small day tank, gauges, control panel and protected walkway. */}
  <Box position={[-3.35,1.05,-1.35]} scale={[.62,1.65,.9]} color="#58675e"/>
  <Box position={[-3.35,1.1,-.87]} scale={[.48,.8,.045]} color="#8d9a8e"/>
  <mesh position={[-2.82,.8,-1.45]}><cylinderGeometry args={[.28,.31,.98,16]}/><meshStandardMaterial color="#a6aea2" map={getWeatheredSteelMap()} metalness={.35}/></mesh>
  <Pipe a={[-2.82,1.3,-1.45]} b={[-2.82,1.64,-1.45]} color="#b09661" radius={.035}/>
  {[-3.55,-2.95].map(x=><Box key={`boiler-stair-stringer-${x}`} position={[x,.46,1.63]} scale={[.055,.12,1.18]} color="#727f75"/>)}
  {Array.from({length:5},(_,i)=><Box key={`boiler-stair-${i}`} position={[-3.25,.24+i*.13,1.12+i*.24]} scale={[.78,.06,.24]} color="#a2a99d"/>)}
  {[-3.85,-2.55].map(x=><Pipe key={`boiler-rail-${x}`} a={[x,.42,2.02]} b={[x,1.15,.75]} color="#c8b779" radius={.026}/>)}
  {/* Localized moisture/rust halos occur only at selected feet and drain edges, not over the plant uniformly. */}
  {[-2.8,2.9].map((x,i)=><mesh key={`localized-corrosion-${i}`} position={[x,.213,1.7]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.32,20]}/><meshBasicMaterial color="#8a6549" transparent opacity={.22} depthWrite={false}/></mesh>)}
  {/* Contained yard drain with bolted grate and a shutoff sump; it has no modeled harbor outfall. */}
  <Box position={[0,.11,2.32]} scale={[8.1,.06,.18]} color="#3c4640"/>
  {Array.from({length:30},(_,i)=><Box key={`boiler-trench-grate-${i}`} position={[-3.9+i*.27,.148,2.32]} scale={[.035,.035,.17]} color="#a3a69b"/>)}
  <Box position={[4.45,.11,1.95]} scale={[.7,.16,.7]} color="#58645d"/>
  <mesh position={[4.45,.205,1.95]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.48,.48]}/><meshStandardMaterial color="#313b36" wireframe/></mesh>
  <Pipe a={[4.1,-.06,1.95]} b={[3.2,-.06,1.95]} color="#53625a" radius={.065}/><ValveWheel position={[3.35,.01,1.95]} color="#8d7550"/>
  <EquipmentTag label={item.id} position={[.15,3.05,2.35]}/>
  {night&&<>
   <pointLight position={[-.6,4.7,.35]} color="#ffd79d" intensity={2.4} distance={8} decay={2}/>
   <pointLight position={[2.2,4.85,1.35]} color="#ffe4bb" intensity={1.3} distance={5} decay={2}/>
  </>}
 </ClickGroup>;
}
function SteamUtilityNetwork(){
 const steam='#b88c56',condensate='#6d9698',feed='#7395a2';
 const steamTrunk:[number,number,number][]=[[-8.55,4.76,24.7],[-12.4,5.85,24.9],[-12.4,5.85,6],[-6,5.85,6],[-6,5.85,2.72],[30,5.85,2.72]];
 const steamBranches:[number,number,number][][]=[
  [[-12,5.85,2.72],[-12,5.85,-9],[-12,2.25,-9]],
  [[-6,5.85,2.72],[-5,5.85,-12],[-5,2.25,-12]],
  [[2,5.85,2.72],[2,5.85,-14],[2,2.25,-14]],
  [[2.5,5.85,2.72],[2.5,5.85,.5],[2.5,2.25,.5]],
 ];
 const condensateMain:[number,number,number][]=[[-12.4,3.05,24.5],[-12.4,3.05,6],[-6,3.05,3.55],[2.5,3.05,3.55],[2.5,3.05,.5],[.5,3.05,.5],[-6,3.05,-3.8],[-12,3.05,-3.8],[-12,3.05,-9],[-12,2.25,-9]];
 const makeup:[number,number,number][]=[[-21,6.55,14],[-16,6.55,14],[-12.4,6.55,14],[-12.4,6.55,24.9],[-9.2,6.55,24.9],[-6.14,6.55,25.95],[-6.14,4.0,25.95]];
 return <group>
  {/* Supported west-side riser and overhead utility-water crossover; no existing item is moved. */}
  { [6,12,18,24].map(z=><group key={`steam-column-${z}`}>
   <Box position={[-12.4,2.9,z]} scale={[.11,5.6,.11]} color="#65736b"/><Box position={[-12.4,.12,z]} scale={[.38,.16,.38]} color="#8e8d7d"/>
   <Box position={[-12.4,5.78,z]} scale={[.72,.08,.38]} color="#8c968b"/>
  </group>)}
  <PipelinePath points={makeup} color={feed} radius={.075}/>
  <PipelinePath points={steamTrunk} color={steam} radius={.105}/>
  <PipelinePath points={[[-6,5.85,2.72],[-12,5.85,2.72]]} color={steam} radius={.075}/>
  {steamBranches.map((points,i)=><PipelinePath key={`steam-consumer-${i}`} points={points} color={steam} radius={.075}/>)}
  <PipelinePath points={condensateMain} color={condensate} radius={.085}/>
  <PipelinePath points={[[-12.4,3.05,24.5],[-9.8,3.05,24.5],[-6.14,3.05,25.95],[-6.14,3.38,25.95]]} color={condensate} radius={.075}/>
  <PipelinePath points={[[2,2.25,-14],[2,3.05,-14],[2,3.05,-3.8],[-6,3.05,-3.8]]} color={condensate} radius={.065}/>
  <PipelinePath points={[[ -5,2.25,-12],[-5,3.05,-12],[-5,3.05,-3.8]]} color={condensate} radius={.065}/>
  {[[-12.4,5.85,24.9],[-12.4,5.85,6],[-6,5.85,2.72],[10,5.85,2.72],[20,5.85,2.72]].map(([x,y,z],i)=><mesh key={`steam-header-shoe-${i}`} position={[x,y-.12,z]}><cylinderGeometry args={[.16,.16,.12,10]}/><meshStandardMaterial color="#c1ad79" metalness={.42}/></mesh>)}
  {[-10,10,20].map(x=><group key={`steam-header-guide-${x}`}><Pipe a={[x,5.84,2.72]} b={[x+.18,5.84,2.72]} color="#d4bd82" radius={.15}/></group>)}
 </group>;
}
function RoadDrainageAndEmergencyAccess(){
 return <group>
  {/* Raised, mountable kerb edges define the existing cross-plant emergency access without narrowing it. */}
  {[-1,1].map(side=><group key={`fire-lane-kerb-${side}`}>
   <Box position={[.35,.055,7+side*1.34]} scale={[42.4,.11,.14]} color="#9a9b8d"/>
   <Box position={[.35,.12,7+side*1.34]} scale={[42.1,.025,.055]} color="#c7b882"/>
  </group>)}
  {/* Low-profile reflectors at the fire-station approach, kept beyond the apparatus apron. */}
  {[-20,-18,-16,-14,-12].map(x=><group key={`fire-access-reflector-${x}`}>
   <Box position={[x,.045,8.34]} scale={[.2,.08,.16]} color="#9f4938"/><Box position={[x,.095,8.34]} scale={[.07,.035,.06]} color="#dccb9a"/>
  </group>)}
  {/* Covered curb inlets and cross grates drain toward a contained catchpit, not the harbor. */}
  {[-17,-8,1,10,19].map((x,i)=><group key={`storm-inlet-${i}`} position={[x,.03,8.48]}>
   <Box position={[0,.02,0]} scale={[.92,.06,.3]} color="#35403a"/>
   {Array.from({length:8},(_,j)=><Box key={j} position={[-.39+j*.112,.063,0]} scale={[.028,.035,.25]} color="#a7a99d"/>)}
  </group>)}
  <Box position={[20.8,.045,8.48]} scale={[.9,.15,.84]} color="#555f58"/>
  <mesh position={[20.8,.13,8.48]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.58,.58]}/><meshStandardMaterial color="#343d38" wireframe/></mesh>
  <Pipe a={[19.45,-.07,8.48]} b={[20.1,-.07,8.48]} color="#58645c" radius={.075}/>
  {/* Road-edge pavement joints and a restrained repaired seam add scale without distressed, uniform grunge. */}
  {[-12,4,16].map((x,i)=><Box key={`road-repair-${i}`} position={[x,.008,6.98]} scale={[.7,.018,.06]} color="#515b55"/>)}
  {[-19,21].map(x=><group key={`road-edge-post-${x}`}><Box position={[x,.56,5.42]} scale={[.12,1.08,.12]} color="#57645d"/><Box position={[x,.88,5.35]} scale={[.13,.22,.035]} color="#d8bc76"/></group>)}
 </group>;
}
function CompanyMonumentSign(){
 const night=useStore(s=>s.night),fa=typeof document!=='undefined'&&document.documentElement.lang==='fa';
 return <group position={[-21.45,0,35.0]}>
  <Box position={[0,.48,0]} scale={[1.04,.96,.52]} color="#515f58"/>
  <Box position={[0,1.35,-.02]} scale={[.92,.78,.13]} color="#293a3b"/>
  <Box position={[0,1.76,.055]} scale={[.94,.055,.17]} color="#b69a61"/>
  <Box position={[-.3,1.36,.055]} scale={[.09,.38,.17]} color="#77928f"/>
  <Box position={[.06,1.36,.055]} scale={[.09,.38,.17]} color="#77928f"/>
  <Html center position={[.1,1.39,.15]} distanceFactor={7} style={{pointerEvents:'none',whiteSpace:'nowrap'}}>
   <div style={{fontFamily:'Inter, sans-serif',fontSize:'8px',fontWeight:700,letterSpacing:'1.2px',color:'#f3ead3',textShadow:'0 1px 3px #101718',textAlign:'left'}}>
    PETROVISTA<br/><span style={{fontSize:'5px',letterSpacing:'1px',fontWeight:500}}>{fa?'ورودی مجتمع صنعتی':'INDUSTRIAL CAMPUS'}</span>
   </div>
  </Html>
  <Box position={[0,.08,0]} scale={[1.45,.16,.78]} color="#9d9b8d"/>
  {night&&<pointLight position={[0,1.65,.45]} color="#ffe0aa" intensity={.8} distance={3.5} decay={2}/>}
 </group>;
}

function TransferPumpStation({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 const pumpCenters=[-1.05,-.18];
 return <ClickGroup item={item} position={item.position}>
  {/* Kept on the western end of the existing utility slab, clear of WWT vessels and pipe supports. */}
  <Box position={[-.62,.075,-.35]} scale={[1.9,.15,1.42]} color="#73776e"/>
  <Box position={[-.62,.16,-.35]} scale={[1.75,.06,1.28]} color="#3b4741"/>
  {pumpCenters.map((x,i)=><ProcessPumpSet key={`P-301-set-${i}`} x={x}/>)}
  {/* Shared suction/discharge headers with flanged branch take-offs and supports. */}
  <Pipe a={[-1.43,.76,.86]} b={[.18,.76,.86]} color="#778f8b" radius={.11}/>
  {pumpCenters.map((x,i)=><group key={`P-301-suction-branch-${i}`}>
   <Pipe a={[x,.76,.82]} b={[x,.76,.98]} color="#778f8b" radius={.075}/>
   <mesh position={[x,.76,.9]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.115,.023,6,16]}/><meshStandardMaterial color="#c8b985" metalness={.55}/></mesh>
   <Pipe a={[x,1.43,.58]} b={[x,1.43,.72]} color="#b48a54" radius={.07}/>
   <mesh position={[x,1.43,.68]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.095,.022,6,16]}/><meshStandardMaterial color="#d0bd86" metalness={.58}/></mesh>
  </group>)}
  <Pipe a={[-1.43,1.43,.72]} b={[.18,1.43,.72]} color="#b48a54" radius={.095}/>
  {[-1.35,.1].map(x=><group key={`P-301-header-support-${x}`}>
   <Box position={[x,1.05,.72]} scale={[.08,1.16,.08]} color="#5a675f"/>
   <Box position={[x,1.53,.72]} scale={[.32,.07,.22]} color="#a4a28e"/>
  </group>)}
  {/* Compact local panel, instrument dials, conduit and small service canopy frame. */}
  <Box position={[.36,.84,-.63]} scale={[.28,1.34,.6]} color="#59675e"/>
  <Box position={[.36,1.0,-.315]} scale={[.22,.44,.035]} color="#82938a"/>
  {[-1.28,-.38].map((x,i)=><group key={`P-301-gauge-${i}`}>
   <Pipe a={[x,1.43,.72]} b={[x,1.78,.72]} color="#8c9990" radius={.025}/>
   <mesh position={[x,1.86,.76]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.13,.13,.07,16]}/><meshStandardMaterial color="#d6d4c8" metalness={.25}/></mesh>
   <mesh position={[x,1.86,.805]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.093,16]}/><meshBasicMaterial color="#d9dfd2"/></mesh>
   <Pipe a={[x,1.86,.81]} b={[x+.035,1.91,.81]} color="#b84f40" radius={.012}/>
  </group>)}
  {[-1.45,.35].map(x=><Box key={`P-301-canopy-edge-${x}`} position={[x,2.32,.05]} scale={[.08,.09,1.72]} color="#637168"/>)}
  <Box position={[-.55,2.32,-.77]} scale={[1.78,.09,.08]} color="#637168"/>
  <Box position={[-.55,2.32,.88]} scale={[1.78,.09,.08]} color="#637168"/>
  <Pipe a={[.32,.22,-.88]} b={[.32,2.26,-.88]} color="#68766d" radius={.035}/>
  <Box position={[-.55,1.86,1.0]} scale={[1.9,.08,.08]} color="#8c9587"/>
  <group position={[-.55,2.12,1.05]}><EquipmentTag label={item.id} position={[0,0,0]}/></group>
  {night&&<pointLight position={[.25,2.05,.65]} color="#ffe0ae" intensity={.75} distance={4.5} decay={2}/>}
 </ClickGroup>;
}
function WaterTreatmentFacility({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 const filterCenters=[.2,1.24], membraneRows=[1.02,1.58,2.14];
 return <ClickGroup item={item} position={item.position}>
  {/* Compact service-water package: pretreatment filters, membrane skid and clearwell. */}
  <Box position={[0,.08,0]} scale={[6.5,.16,4.8]} color="#73796f"/>
  <Box position={[0,.19,0]} scale={[6.25,.08,4.58]} color="#4e5953"/>
  {/* Open galvanized skid frame leaves the packaged equipment visible from above. */}
  {[-1.72,1.72].flatMap(x=>[-1.24,1.24].map(z=><group key={`ro-frame-post-${x}-${z}`}>
   <Box position={[x,1.32,z]} scale={[.12,2.45,.12]} color="#426b82"/>
   <Box position={[x,.32,z]} scale={[.3,.12,.3]} color="#384b54"/>
  </group>))}
  {[.42,1.16,2.48].map(y=><group key={`ro-frame-level-${y}`}>
   <Box position={[0,y,-1.24]} scale={[3.55,.12,.13]} color="#3f6680"/><Box position={[0,y,1.24]} scale={[3.55,.12,.13]} color="#3f6680"/>
   {[-1.72,1.72].map(x=><Box key={x} position={[x,y,0]} scale={[.12,.12,2.5]} color="#3f6680"/>)}
  </group>)}
  {/* Three tiers of horizontal membrane pressure vessels, with end caps and clamps. */}
  {membraneRows.flatMap((y,row)=>[-.75,0,.75].map(z=><group key={`ro-membrane-${row}-${z}`}>
   <mesh position={[.02,y,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.205,.205,2.86,18]}/><meshStandardMaterial color="#e0e3d9" metalness={.18} roughness={.36}/></mesh>
   {[-1,1].map(side=><mesh key={side} position={[.02+side*1.435,y,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.215,.215,.08,18]}/><meshStandardMaterial color="#75867e" metalness={.42}/></mesh>)}
   {[-.85,.85].map(side=><mesh key={side} position={[.02+side*.74,y,z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.214,.025,6,18]}/><meshStandardMaterial color="#536d78" metalness={.52}/></mesh>)}
  </group>))}
  {/* Paired multimedia/cartridge pretreatment vessels. */}
  {filterCenters.map((z,i)=><group key={`water-filter-${i}`} position={[-2.35,0,z]}>
   <mesh position={[0,.2,0]}><cylinderGeometry args={[.38,.42,.28,18]}/><meshStandardMaterial color="#53645c" metalness={.38}/></mesh>
   <mesh position={[0,1.12,0]} castShadow><cylinderGeometry args={[.34,.38,1.58,20,1,true]}/><meshStandardMaterial color={i?'#aeb8ae':'#b8c0b6'} metalness={.42} roughness={.5} side={THREE.DoubleSide}/></mesh>
   <mesh position={[0,1.93,0]}><sphereGeometry args={[.34,18,10,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#aab5ab" metalness={.38}/></mesh>
   {[.56,1.68].map(y=><mesh key={y} position={[0,y,0]}><torusGeometry args={[.365,.045,6,20]}/><meshStandardMaterial color="#c7b681" metalness={.48}/></mesh>)}
   <mesh position={[0,2.05,0]}><cylinderGeometry args={[.12,.15,.2,12]}/><meshStandardMaterial color="#87958b" metalness={.4}/></mesh>
   <Pipe a={[.34,.76,0]} b={[.62,.76,0]} color="#74979a" radius={.055}/>
   <Box position={[.42,1.3,.15]} scale={[.14,.05,.12]} color="#52675d"/>
  </group>)}
  {/* Feed-water buffer and treated-water clearwell are separate, low storage vessels. */}
  <group position={[-2.35,0,-1.35]}>
   <mesh position={[0,.92,0]} castShadow><cylinderGeometry args={[.58,.62,1.58,24]}/><meshStandardMaterial color="#a6b2a7" metalness={.4} roughness={.56}/></mesh>
   <mesh position={[0,1.72,0]}><cylinderGeometry args={[.58,.58,.1,24]}/><meshStandardMaterial color="#d0c298" metalness={.3}/></mesh>
   <mesh position={[0,1.79,0]}><cylinderGeometry args={[.13,.18,.16,12]}/><meshStandardMaterial color="#78867e" metalness={.45}/></mesh>
   <mesh position={[0,.19,0]}><cylinderGeometry args={[.64,.64,.2,24]}/><meshStandardMaterial color="#536158" metalness={.28}/></mesh>
  </group>
  <group position={[2.66,0,1.58]}>
   <mesh position={[0,.79,0]} castShadow><cylinderGeometry args={[.51,.55,1.34,24]}/><meshStandardMaterial color="#aab7ab" metalness={.4} roughness={.55}/></mesh>
   <mesh position={[0,1.47,0]}><cylinderGeometry args={[.51,.51,.1,24]}/><meshStandardMaterial color="#d2c89c" metalness={.3}/></mesh>
   <mesh position={[0,1.55,0]}><cylinderGeometry args={[.12,.15,.15,12]}/><meshStandardMaterial color="#7c8980" metalness={.4}/></mesh>
   <mesh position={[0,.16,0]}><cylinderGeometry args={[.57,.57,.18,24]}/><meshStandardMaterial color="#58645b"/></mesh>
  </group>
  {/* Small chemical day tanks and metering pumps; no specific treatment recipe is implied. */}
  {[-1.34,-.38].map((x,i)=><group key={`water-dose-${i}`} position={[x,0,-1.86]}>
   <mesh position={[0,.42,0]} castShadow><cylinderGeometry args={[.24,.29,.76,16]}/><meshStandardMaterial color={i?'#879a87':'#b28d56'} metalness={.25}/></mesh>
   <mesh position={[0,.82,0]}><cylinderGeometry args={[.24,.24,.07,16]}/><meshStandardMaterial color="#d2bd85"/></mesh>
   <Box position={[.32,.23,.3]} scale={[.34,.42,.3]} color="#4d5e55"/><Pipe a={[.28,.45,.3]} b={[.62,.75,.3]} color="#9b855a" radius={.035}/>
  </group>)}
  {/* Local transfer/booster pumps under the RO rack. */}
  {[-.48,.72].map((x,i)=><group key={`ro-pump-${i}`} position={[x,.18,1.73]}>
   <Box position={[0,.36,0]} scale={[.74,.55,.62]} color="#56695e"/>
   <mesh position={[0,.39,.39]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.22,.07,8,14]}/><meshStandardMaterial color={i?'#74999a':'#bf8852'} metalness={.48}/></mesh>
   <mesh position={[0,.43,-.38]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.17,.17,.55,12]}/><meshStandardMaterial color="#85938a" metalness={.54}/></mesh>
   <Box position={[0,.73,0]} scale={[.12,.3,.14]} color="#d0bd89"/>
  </group>)}
  {/* Local pipework indicates package connections, not a fixed process flow or rated design. */}
  <Pipe a={[-2.35,.72,-.55]} b={[-2.35,.72,-.25]} color="#819b91" radius={.075}/>
  <Pipe a={[-2.35,.72,.58]} b={[-2.35,.72,1.02]} color="#819b91" radius={.075}/>
  <Pipe a={[-1.97,.72,.58]} b={[-1.66,.72,.58]} color="#6c9497" radius={.07}/>
  <Pipe a={[-1.66,.72,.58]} b={[-1.66,1.15,.58]} color="#6c9497" radius={.07}/>
  <Pipe a={[-1.66,1.15,.58]} b={[-1.38,1.15,.58]} color="#6c9497" radius={.07}/>
  <Pipe a={[1.48,1.48,-.75]} b={[2.02,1.22,-.75]} color="#729c99" radius={.075}/>
  <Pipe a={[2.02,1.22,-.75]} b={[2.5,1.0,-.2]} color="#729c99" radius={.075}/>
  <Pipe a={[2.5,1.0,-.2]} b={[2.5,1.0,1.58]} color="#729c99" radius={.075}/>
  <Pipe a={[-2.35,1.8,-.73]} b={[-1.8,1.8,-.73]} color="#b1844e" radius={.065}/>
  {/* Open service canopy frame and a readable equipment tag. */}
  {[-2.85,2.85].map(x=><Box key={`water-roof-edge-${x}`} position={[x,2.72,0]} scale={[.12,.12,4.35]} color="#5c6b62"/>)}
  {[-2.08,2.08].map(z=><Box key={`water-roof-cross-${z}`} position={[0,2.72,z]} scale={[5.82,.12,.12]} color="#5c6b62"/>)}
  <Box position={[0,2.55,0]} scale={[5.55,.1,.1]} color="#6d7c71"/>
  {[-3.0,3.0].map(x=><Box key={`water-bollard-${x}`} position={[x,.52,2.22]} scale={[.12,1.02,.12]} color="#58665e"/>)}
  <Box position={[0,2.95,2.43]} scale={[2.5,.12,.16]} color="#8d9588"/>
  <group position={[0,3.2,2.48]}><EquipmentTag label={item.id} position={[0,0,0]}/></group>
  <mesh position={[2.95,2.42,2.19]}><boxGeometry args={[.2,.08,.12]}/><meshStandardMaterial color="#efd9a6" emissive={night?'#ffd08a':'#000000'} emissiveIntensity={night?1.05:0}/></mesh>
  {night&&<pointLight position={[2.95,2.34,2.3]} color="#ffe0ae" intensity={1.1} distance={6} decay={2}/>}
 </ClickGroup>;
}
function SecurityGatehouse({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <ClickGroup item={item} position={item.position}>
  <Box position={[0,.12,0]} scale={[5.25,.24,4.15]} color="#646d66"/>
  <Box position={[0,1.2,0]} scale={[4.25,2.05,3.08]} color="#8c9388"/>
  <Box position={[0,.42,0]} scale={[4.32,.28,3.12]} color="#666f68"/>
  {/* Deep, wraparound security glazing, framed mullions and protected side entrance. */}
  <Box position={[0,1.52,-1.57]} scale={[3.02,.78,.075]} color="#263b3c"/>
  <Box position={[0,1.52,-1.615]} scale={[2.76,.59,.028]} color={night?'#f0d9af':'#91a8a5'}/>
  {[-.92,0,.92].map(x=><Box key={`gatehouse-front-mullion-${x}`} position={[x,1.52,-1.65]} scale={[.055,.69,.055]} color="#d0bd88"/>)}
  <Box position={[0,1.08,-1.66]} scale={[3.02,.07,.06]} color="#c4b17e"/>
  <Box position={[-2.16,1.52,.1]} scale={[.07,.75,1.65]} color="#263b3c"/>
  <Box position={[-2.205,1.52,.1]} scale={[.028,.56,1.42]} color={night?'#e5cfaa':'#809a98'}/>
  <Box position={[2.16,.99,.88]} scale={[.075,1.5,.92]} color="#374744"/>
  <Box position={[2.21,.99,.88]} scale={[.035,1.24,.67]} color="#273c3b"/>
  <Box position={[2.01,1.04,.45]} scale={[.035,.095,.09]} color="#d2bd86"/>
  {/* Flat overhanging roof, front canopy, gutters, downpipe and screened rooftop HVAC. */}
  <Box position={[0,2.34,0]} scale={[4.58,.2,3.38]} color="#59665f"/>
  <Box position={[0,2.2,-1.93]} scale={[3.66,.16,.82]} color="#6d7970"/>
  {[-1.42,1.42].map(x=><Box key={`gatehouse-canopy-bracket-${x}`} position={[x,1.99,-1.73]} scale={[.09,.54,.11]} color="#ae9a6c"/>)}
  <Box position={[0,2.47,1.48]} scale={[4.18,.22,.14]} color="#9d9b8b"/>
  <Box position={[0,2.47,-1.48]} scale={[4.18,.22,.14]} color="#9d9b8b"/>
  <Box position={[-2.04,2.47,0]} scale={[.14,.22,3]} color="#9d9b8b"/><Box position={[2.04,2.47,0]} scale={[.14,.22,3]} color="#9d9b8b"/>
  <Box position={[1.24,2.67,.35]} scale={[.92,.42,.78]} color="#747e75"/>
  <mesh position={[1.24,2.9,.35]}><cylinderGeometry args={[.19,.19,.04,14]}/><meshStandardMaterial color="#4f5a54"/></mesh>
  <Pipe a={[-1.92,.34,1.25]} b={[-1.92,2.2,1.25]} color="#69766d" radius={.045}/>
  <mesh position={[-1.92,2.08,1.25]}><torusGeometry args={[.07,.022,6,12]}/><meshStandardMaterial color="#b2a276"/></mesh>
  {/* Entry step and impact-protection bollards; the booth stays outside the vehicle lane. */}
  <Box position={[2.58,.12,.88]} scale={[.82,.18,1.18]} color="#a3a294"/>
  {[-1.55,0,1.55].map(x=><group key={`gatehouse-bollard-${x}`} position={[x,.48,-2.37]}>
   <mesh><cylinderGeometry args={[.105,.14,.92,10]}/><meshStandardMaterial color="#454f4a" metalness={.25}/></mesh>
   <mesh position={[0,.27,0]}><torusGeometry args={[.111,.024,6,12]}/><meshStandardMaterial color="#d8bd72"/></mesh>
   <mesh position={[0,.44,0]}><sphereGeometry args={[.12,10,8]}/><meshStandardMaterial color="#d1b368"/></mesh>
  </group>)}
  <mesh position={[.92,2.1,-2.06]}><boxGeometry args={[.38,.08,.18]}/><meshStandardMaterial color="#f1d59c" emissive={night?'#ffbd67':'#000000'} emissiveIntensity={night?1.3:0}/></mesh>
  {night&&<pointLight position={[.92,2.04,-2.17]} color="#ffe2af" intensity={1.2} distance={6} decay={2}/>}
  <group position={[0,3.18,-2.02]} rotation={[0,Math.PI,0]}><EquipmentTag label={item.id} position={[0,0,0]}/></group>
 </ClickGroup>
}
function CampusWalkLight({position,night}:{position:[number,number,number];night:boolean}){return <group position={position}>
 <Box position={[0,1.68,0]} scale={[.1,3.36,.1]} color="#58665f"/><Box position={[.27,3.31,0]} scale={[.68,.11,.18]} color="#b8a271"/>
 <mesh position={[.52,3.24,0]}><boxGeometry args={[.16,.1,.22]}/><meshStandardMaterial color={night?'#fff0cc':'#c8c8b5'} emissive={night?'#ffd18a':'#000000'} emissiveIntensity={night?1.8:0}/></mesh>
 {night&&<pointLight position={[.52,3.08,0]} color="#ffe1b0" intensity={2.1} distance={8} decay={2}/>}
 </group>}
function PerimeterFenceRun({start,end,axis,coordinate}:{start:number;end:number;axis:'x'|'z';coordinate:number}){
 const length=end-start, horizontal=axis==='x',center=(start+end)/2;
 const position:[number,number,number]=horizontal?[center,0,coordinate]:[coordinate,0,center];
 return <group position={position} rotation={[0,horizontal?0:Math.PI/2,0]}>
  <mesh position={[0,1.02,0]} castShadow={false} receiveShadow={false}>
   <planeGeometry args={[length,1.82]}/>
   <meshStandardMaterial map={getChainlinkMap(length,1.82)} color="#b8c2bb" transparent opacity={.82} alphaTest={.12} depthWrite={false} side={THREE.DoubleSide} metalness={.24} roughness={.82}/>
  </mesh>
  <Box position={[0,1.91,0]} scale={[length,.07,.07]} color="#77857c"/>
  <Box position={[0,1.02,0]} scale={[length,.055,.055]} color="#78867d"/>
  <Box position={[0,.14,0]} scale={[length,.06,.06]} color="#78867d"/>
 </group>;
}
function SitePerimeterFence(){
 const northPosts=Array.from({length:22},(_,i)=>-33+i*4);
 const southPosts=northPosts.filter((_,i)=>i<=17&&i!==4&&i!==5);
 const westPosts=Array.from({length:15},(_,i)=>-27+i*3.85);
 return <group>
  {/* Existing gate opening and fence coordinates stay fixed; only the missing mesh and rails are filled in. */}
  <PerimeterFenceRun start={-33} end={51} axis="x" coordinate={-28.65}/>
  <PerimeterFenceRun start={-33} end={-17} axis="x" coordinate={28.65}/>
  <PerimeterFenceRun start={-13} end={35} axis="x" coordinate={28.65}/>
  <PerimeterFenceRun start={-27} end={26.9} axis="z" coordinate={-33.78}/>
  {northPosts.map(x=><group key={`north-fence-post-${x}`}>
   <Box position={[x,.98,-28.65]} scale={[.12,1.96,.12]} color="#69776e"/>
   <mesh position={[x,1.99,-28.65]}><cylinderGeometry args={[.085,.085,.08,8]}/><meshStandardMaterial color="#9ca69c" metalness={.42}/></mesh>
  </group>)}
  {southPosts.map(x=><group key={`south-fence-post-${x}`}>
   <Box position={[x,.98,28.65]} scale={[.12,1.96,.12]} color="#69776e"/>
   <mesh position={[x,1.99,28.65]}><cylinderGeometry args={[.085,.085,.08,8]}/><meshStandardMaterial color="#9ca69c" metalness={.42}/></mesh>
  </group>)}
  {westPosts.map(z=><group key={`west-fence-post-${z}`}>
   <Box position={[-33.78,.98,z]} scale={[.12,1.96,.12]} color="#69776e"/>
   <mesh position={[-33.78,1.99,z]}><cylinderGeometry args={[.085,.085,.08,8]}/><meshStandardMaterial color="#9ca69c" metalness={.42}/></mesh>
  </group>)}
 </group>;
}
const AGAVE_LEAF_GEOMETRY=(()=>{
 const shape=new THREE.Shape();
 shape.moveTo(0,0);shape.quadraticCurveTo(.12,.2,.105,.4);shape.quadraticCurveTo(.075,.66,0,.84);shape.quadraticCurveTo(-.075,.66,-.105,.4);shape.quadraticCurveTo(-.12,.2,0,0);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:5});
 geometry.translate(0,0,-.0125);return geometry;
})();
function EntryAgave({position,scale=1}:{position:[number,number,number];scale?:number}){
 const leafColors=['#70856f','#7e8e72','#61796d','#879477','#718174'];
 return <group position={position} scale={scale}>
  <mesh position={[0,.04,0]} receiveShadow><cylinderGeometry args={[.15,.2,.08,9]}/><meshStandardMaterial color="#a79b7a" roughness={1}/></mesh>
  {Array.from({length:11},(_,i)=>{const angle=i*Math.PI*2/11,lean=.27+(i%4)*.105;return <group key={`agave-leaf-${i}`} rotation={[0,-angle,0]}>
   <mesh geometry={AGAVE_LEAF_GEOMETRY} position={[.025,.04,0]} rotation={[0,0,-lean]} scale={[.88,.72+(i%3)*.09,.78]} castShadow dispose={null}>
    <meshStandardMaterial color={leafColors[i%leafColors.length]} roughness={.94} metalness={.02} side={THREE.DoubleSide}/>
   </mesh>
  </group>})}
  <mesh position={[0,.17,0]}><coneGeometry args={[.06,.34,7]}/><meshStandardMaterial color="#809078" roughness={.96}/></mesh>
 </group>;
}
function EntryXericShrub({position,scale=1}:{position:[number,number,number];scale?:number}){
 const colors=['#6e8064','#77886a','#637961','#81906f'];
 return <group position={position} scale={scale}>
  {[[-.16,.14,0],[.13,.17,.1],[0,.2,-.14],[.05,.27,.02],[-.2,.21,-.12]].map(([x,y,z],i)=><mesh key={`xeric-crown-${i}`} position={[x,y,z]} scale={[.25,.19,.23]} castShadow>
   <dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color={colors[i%colors.length]} roughness={.96}/>
  </mesh>)}
  {[-.12,.1].map(x=><mesh key={`xeric-stem-${x}`} position={[x,.11,0]} rotation={[0,0,x*.65]}><cylinderGeometry args={[.025,.04,.25,6]}/><meshStandardMaterial color="#887455" roughness={1}/></mesh>)}
 </group>;
}
function CompanyArrivalLandscape(){
 const night=useStore(s=>s.night),bedX=-30.55,bedZ=32.75;
 return <group>
  {/* Low gravel bed beside—not across—the security booth approach or the visitor route. */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[bedX,.035,bedZ]} receiveShadow>
   <planeGeometry args={[4.02,6.42]}/>
   <meshStandardMaterial map={getYardSurfaceMap('soil',4.02/1.8,6.42/1.8)} color={night?'#66675b':'#c6b48f'} roughness={1}/>
  </mesh>
  {[-1,1].map(side=><Box key={`arrival-bed-z-curb-${side}`} position={[bedX,.13,bedZ+side*3.27]} scale={[4.22,.18,.12]} color="#9b9f91"/>)}
  {[-1,1].map(side=><Box key={`arrival-bed-x-curb-${side}`} position={[bedX+side*2.05,.13,bedZ]} scale={[.12,.18,6.42]} color="#9b9f91"/>)}
  {[[-31.45,.07,30.7,.63],[-29.65,.07,32.55,.58],[-31.45,.07,34.75,.55] as [number,number,number,number]].map(([x,y,z,size],i)=><EntryAgave key={`arrival-agave-${i}`} position={[x,y,z]} scale={size}/>)}
  {[-29.75,-31.55].map((x,i)=><EntryXericShrub key={`arrival-shrub-${i}`} position={[x,.07,i===0?30.65:33.05]} scale={.82}/>)}
  {[[ -30.3,.11,31.55],[ -31.9,.11,32.25],[ -29.35,.11,34.1],[ -30.15,.11,35.3]].map(([x,y,z],i)=><mesh key={`arrival-rock-${i}`} position={[x,y,z]} scale={[.18,.085,.14]} rotation={[.08,i*.7,.1]} castShadow>
   <dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#888171':'#a3977f'} roughness={1}/>
  </mesh>)}
 </group>;
}

function CompanyCampusDetails({gatehouse}:{gatehouse:SiteItem}){
 const night=useStore(s=>s.night);
 return <group>
  {/* Paved, kerbed gate approach and a clear vehicle stopping line. */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-15.5,-.045,32.8]}><planeGeometry args={[10.2,11.8]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',10.2/12,11.8/12)} color={night?'#777f79':'#ffffff'} roughness={.96}/></mesh>
  <Box position={[-20.58,.08,28.95]} scale={[.18,.16,3.8]} color="#a3a292"/><Box position={[-20.58,.08,36.65]} scale={[.18,.16,3.8]} color="#a3a292"/>
  <Box position={[-10.42,.08,32.8]} scale={[.18,.16,11.5]} color="#a3a292"/>
  <Box position={[-21.02,-.005,32.8]} scale={[.88,.06,3.75]} color="#aaa99a"/>
  <Box position={[-15.5,.012,29.45]} scale={[5.3,.025,.16]} color="#e0d8bd"/>
  {[31,34,37].map(z=><Box key={`entry-dash-${z}`} position={[-15.5,.012,z]} scale={[.11,.025,1.05]} color="#d6cfaf"/>)}
  {/* Wheel stops, protected pedestrian path and a marked gate crossing, kept clear of parked-car footprints. */}
  {[-31.7,-29.35,-27,-24.65,-22.3,-19.95].map(x=><Box key={`parking-stop-${x}`} position={[x,.1,27.82]} scale={[1,.16,.17]} color="#777d75"/>)}
  <Box position={[-25.75,.015,23.55]} scale={[14.5,.07,.5]} color="#a2a498"/>
  <Box position={[-18.15,.015,24.05]} scale={[.94,.07,3.16]} color="#a2a498"/>
  <Box position={[-26.75,.095,23.9]} scale={[12.5,.16,.13]} color="#777f77"/>
  <Box position={[-19.625,.095,23.9]} scale={[1.75,.16,.13]} color="#777f77"/>
  {[-30.525,-28.175,-25.825,-23.475,-21.125].map(x=><group key={`walkway-bollard-${x}`} position={[x,.47,23.9]}>
   <mesh><cylinderGeometry args={[.095,.13,.9,10]}/><meshStandardMaterial color="#505d56"/></mesh>
   <mesh position={[0,.28,0]}><torusGeometry args={[.101,.022,6,12]}/><meshStandardMaterial color="#d3bb79"/></mesh>
  </group>)}
  {[-18.8,-18,-17.2,-16.4,-15.6,-14.8,-14,-13.2].map(x=><Box key={`campus-zebra-${x}`} position={[x,.015,27.15]} scale={[.42,.025,1.1]} color="#ded9c7"/>)}
  <Box position={[-18.15,.016,26.15]} scale={[.96,.025,1.1]} color="#a2a498"/>
  {/* Low hedge planting and human-scale lights enrich the office-side forecourt. */}
  {[-27,-25.5,-24,-22.5,-21].map((x,i)=><mesh key={`office-hedge-${i}`} position={[x,.51,16.8]} castShadow><dodecahedronGeometry args={[.36,1]}/><meshStandardMaterial color={i%2?'#637460':'#748168'} roughness={.95}/></mesh>)}
  <CampusWalkLight position={[-33.35,0,22]} night={night}/><CampusWalkLight position={[-23.5,0,21]} night={night}/><CampusWalkLight position={[-18.95,0,22.15]} night={night}/>
  <SecurityGatehouse item={gatehouse}/>
 </group>
}
const FLARE_STACK_HEIGHT=16;
function FlareFire(){
 const outer=useRef<THREE.Group>(null),core=useRef<THREE.Group>(null),embers=useRef<(THREE.Mesh|null)[]>([]);
 const phase=useRef(0),night=useStore(s=>s.night);
 const outerProfile=useMemo(()=>[[0,0],[.12,.08],[.29,.22],[.4,.44],[.34,.68],[.39,.9],[.3,1.18],[.25,1.45],[.29,1.72],[.19,2.02],[.14,2.28],[.045,2.58],[0,2.72]].map(([r,y])=>new THREE.Vector2(r,y)),[]);
 const coreProfile=useMemo(()=>[[0,0],[.1,.08],[.19,.22],[.22,.42],[.16,.65],[.17,.83],[.11,1.08],[.08,1.34],[.025,1.62],[0,1.78]].map(([r,y])=>new THREE.Vector2(r,y)),[]);
 useFrame((_,delta)=>{
  phase.current+=delta;const t=phase.current;
  if(outer.current){outer.current.scale.set(.91+Math.sin(t*8.7)*.075,.9+Math.sin(t*12.4)*.09,.9+Math.cos(t*7.3)*.07);outer.current.rotation.z=Math.sin(t*2.1)*.055;outer.current.position.x=Math.sin(t*1.35)*.065;outer.current.rotation.x=Math.cos(t*1.8)*.035;}
  if(core.current){core.current.scale.set(.94+Math.sin(t*11.8+.8)*.08,.94+Math.sin(t*15.1)*.08,.92+Math.cos(t*9.7)*.065);core.current.rotation.z=Math.sin(t*2.6+.5)*.045;}
  embers.current.forEach((ember,i)=>{if(!ember)return;const rise=(t*.36+i*.29)%1;ember.position.set(Math.sin(t*2.2+i*2.1)*(.12+rise*.2),FLARE_STACK_HEIGHT+.36+rise*1.55,Math.cos(t*1.8+i)*(.1+rise*.14));ember.scale.setScalar(.032*(1-rise));});
 });
 return <>
  <group ref={outer} position={[0,FLARE_STACK_HEIGHT,0]}>
   <mesh><latheGeometry args={[outerProfile,24]}/><meshBasicMaterial color="#ed4d12" transparent opacity={.75} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
   <mesh position={[.1,.12,.025]} scale={[.68,.9,.7]}><latheGeometry args={[outerProfile,18]}/><meshBasicMaterial color="#ff7b1b" transparent opacity={.68} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
   <mesh position={[-.13,.24,-.08]} rotation={[.08,0,-.08]} scale={[.48,.73,.52]}><latheGeometry args={[outerProfile,16]}/><meshBasicMaterial color="#ff9a26" transparent opacity={.5} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
  </group>
  <group ref={core} position={[0,FLARE_STACK_HEIGHT+.06,0]}>
   <mesh><latheGeometry args={[coreProfile,20]}/><meshBasicMaterial color="#ffd36a" transparent opacity={.96} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
   <mesh position={[0,.06,0]} scale={[.5,.66,.52]}><latheGeometry args={[coreProfile,16]}/><meshBasicMaterial color="#fff1b7" transparent opacity={.9} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
  </group>
  {Array.from({length:6},(_,i)=><mesh key={`flare-ember-${i}`} ref={el=>{embers.current[i]=el}}><sphereGeometry args={[1,7,6]}/><meshBasicMaterial color={i%2?'#ff9c35':'#ffd26a'} toneMapped={false}/></mesh>)}
  <pointLight position={[0,FLARE_STACK_HEIGHT+.45,.1]} color="#ff842d" intensity={night?42:2.3} distance={night?25:8} decay={2}/>
 </>;
}
function Flare({item}:{item:SiteItem}) {
 const decks=[5.2,10.5,14.55];
 const stripeLevels=[2.1,6.4,10.7,14.5];
 const stackRadius=(y:number)=>.54-(y/FLARE_STACK_HEIGHT)*.2;
 return <ClickGroup item={item} position={item.position}>
  {/* A small hardstand keeps the flare base legible against the wider process paving. */}
  <mesh position={[-.5,.075,.35]} receiveShadow>
   <boxGeometry args={[8,.15,7]}/>
   <meshStandardMaterial map={getYardSurfaceMap('concrete',8/9,7/9)} color="#c7cbc2" roughness={.94}/>
  </mesh>
  <group position={[0,.15,0]}>
   {/* Self-supported, tapered stack with a heavy base collar, shell courses, and bands. */}
   <mesh position={[0,FLARE_STACK_HEIGHT/2,0]} castShadow receiveShadow>
    <cylinderGeometry args={[.34,.54,FLARE_STACK_HEIGHT,24,1,true]}/>
    <meshStandardMaterial color="#d1d2c8" metalness={.42} roughness={.58} side={THREE.DoubleSide}/>
   </mesh>
   <mesh position={[0,.2,0]}><cylinderGeometry args={[.77,.84,.4,20]}/><meshStandardMaterial color="#68756d" metalness={.4} roughness={.62}/></mesh>
   {[.32,4.2,8.2,12.2].map(y=><mesh key={`flare-shell-joint-${y}`} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[stackRadius(y),.025,6,28]}/><meshStandardMaterial color="#858d81" metalness={.55} roughness={.5}/></mesh>)}
   {stripeLevels.map(y=><mesh key={`flare-paint-${y}`} position={[0,y,0]}><cylinderGeometry args={[stackRadius(y)+.006,stackRadius(y)+.012,1.05,24]}/><meshStandardMaterial color="#a8493d" roughness={.68}/></mesh>)}
   {/* Three open grated service decks: toe board, mid-rail, top rail, and braces. */}
   {decks.map(y=><group key={`flare-deck-${y}`}>
    <mesh position={[0,y,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.46,1.23,36]}/><meshStandardMaterial color="#343c38" metalness={.48} roughness={.78} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,y-.045,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[1.19,.025,6,36]}/><meshStandardMaterial color="#9a9d8d" metalness={.35}/></mesh>
    {[y+.18,y+.52].map((rail,railIndex)=><mesh key={`flare-deck-rail-${railIndex}`} position={[0,rail,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.22,.026,6,36]}/><meshStandardMaterial color="#d4c18c" metalness={.45} roughness={.55}/></mesh>)}
    {Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8;return <group key={`flare-deck-post-${i}`}>
     <mesh position={[Math.cos(angle)*1.22,y+.35,Math.sin(angle)*1.22]}><cylinderGeometry args={[.022,.022,.7,6]}/><meshStandardMaterial color="#c8b77f" metalness={.4}/></mesh>
     {i%4===0&&<Pipe a={[Math.cos(angle)*.53,y-.04,Math.sin(angle)*.53]} b={[Math.cos(angle)*1.02,y-.42,Math.sin(angle)*1.02]} color="#aa9a6f" radius={.025}/>}
    </group>})}
    {/* A narrow maintenance ladder gate on each platform, kept on the same side as the cage ladder. */}
    <Box position={[.56,y+.34,-.51]} scale={[.12,.56,.12]} color="#dfce9a"/>
   </group>)}
   {/* Fixed ladder with paired rails, rungs, and a restrained safety-cage silhouette. */}
   <Pipe a={[.56,1.05,-.31]} b={[.56,15.1,-.31]} color="#d0be8b" radius={.027}/>
   <Pipe a={[.56,1.05,.31]} b={[.56,15.1,.31]} color="#d0be8b" radius={.027}/>
   {Array.from({length:36},(_,i)=>{const y=1.18+i*.39;return <Box key={`flare-ladder-rung-${i}`} position={[.56,y,0]} scale={[.055,.04,.62]} color="#d0be8b"/>})}
   {[3.1,3.85,4.6,6.25,7,7.75,9.8,10.55,11.3,13.6,14.35,15.1].map(y=><mesh key={`flare-ladder-hoop-${y}`} position={[.56,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.43,.018,5,20]}/><meshStandardMaterial color="#aa9b73" metalness={.38}/></mesh>)}
   {/* Top-service collar, burner head, perimeter pilots, and three lightning electrodes. */}
   <mesh position={[0,15.72,0]}><cylinderGeometry args={[.38,.43,.54,20]}/><meshStandardMaterial color="#78847b" metalness={.64} roughness={.4}/></mesh>
   <mesh position={[0,16.02,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.35,.045,8,24]}/><meshStandardMaterial color="#c4b98e" metalness={.62}/></mesh>
   <mesh position={[0,16.18,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.27,.024,6,20]}/><meshStandardMaterial color="#444d47" metalness={.45}/></mesh>
   {Array.from({length:3},(_,i)=>{const angle=i*Math.PI*2/3,r=.46,x=Math.cos(angle)*r,z=Math.sin(angle)*r;return <group key={`flare-pilot-${i}`}>
    <Pipe a={[x,15.95,z]} b={[x,16.42,z]} color="#a7a28c" radius={.035}/>
    <Pipe a={[x,16.42,z]} b={[Math.cos(angle)*.28,16.46,Math.sin(angle)*.28]} color="#b6a779" radius={.025}/>
    <mesh position={[x,16.55,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.07,.018,5,10]}/><meshStandardMaterial color="#e68a3a" emissive="#a13b18" emissiveIntensity={.35}/></mesh>
   </group>})}
   {[0,1,2].map(i=>{const a=i*Math.PI*2/3;return <Pipe key={`flare-lightning-${i}`} a={[Math.cos(a)*.39,13.1,Math.sin(a)*.39]} b={[Math.cos(a)*.39,16.9,Math.sin(a)*.39]} color="#c2b785" radius={.018}/>})}
   {/* Conceptual knockout drum, saddles, local header, and base-inlet connection. */}
   <mesh position={[-2.55,.82,2.18]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.39,.39,2.05,20]}/><meshStandardMaterial color="#89958c" map={getWeatheredSteelMap()} metalness={.5} roughness={.55}/></mesh>
   {[-3.56,-1.54].map(x=><mesh key={`flare-drum-head-${x}`} position={[x,.82,2.18]} scale={[.34,.39,.39]} castShadow><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#89958c" map={getWeatheredSteelMap()} metalness={.48} roughness={.56}/></mesh>)}
   {[-3.15,-1.95].map(x=><group key={`flare-drum-saddle-${x}`}><Box position={[x,.4,2.18]} scale={[.18,.52,.72]} color="#59645e"/><Box position={[x,.23,2.18]} scale={[.72,.12,.82]} color="#69756c"/></group>)}
   {[-3.15,-1.95].map(x=><mesh key={`flare-drum-seam-${x}`} position={[x,.82,2.18]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.39,.022,6,20]}/><meshStandardMaterial color="#aab0a3" metalness={.58}/></mesh>)}
   <Pipe a={[-4.48,.78,2.18]} b={[-3.58,.78,2.18]} color="#9b6b4b" radius={.11}/>
   <Pipe a={[-3.34,1.18,2.18]} b={[-3.34,1.45,2.18]} color="#859087" radius={.055}/>
   <mesh position={[-3.34,1.53,2.18]}><cylinderGeometry args={[.105,.105,.09,12]}/><meshStandardMaterial color="#c9bb8e" metalness={.42}/></mesh>
   <PipelinePath points={[[-1.52,.84,2.18],[-1.13,.84,1.58],[-.72,1.02,.86],[-.48,1.12,.38]]} color="#9b6b4b" radius={.105}/>
   {[-4.05,-1.15].map(x=><group key={`flare-header-support-${x}`}><Box position={[x,.34,2.18]} scale={[.12,.56,.12]} color="#616c64"/><Box position={[x,.11,2.18]} scale={[.45,.12,.42]} color="#737d72"/></group>)}
   <FlareFire/>
  </group>
 </ClickGroup>;
}
const truckRoute:[number,number][]=[[10,14],[23,14],[23,23],[6,23],[6,14]];
const flatbedRoute:[number,number][]=[[17,23],[6,23],[6,20.5],[23,20.5],[23,23]];
function routePoint(progress:number,route:readonly [number,number][]=truckRoute){const distance=(progress%1)*route.length,index=Math.floor(distance),part=distance-index,a=route[index],b=route[(index+1)%route.length];return {x:a[0]+(b[0]-a[0])*part,z:a[1]+(b[1]-a[1])*part,dx:b[0]-a[0],dz:b[1]-a[1]}}
function TruckTrafficSafety(){const night=useStore(s=>s.night);return <group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[16.5,-.026,14]}><planeGeometry args={[13.2,4.5]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',13.2/12,4.5/12)} color="#ffffff" roughness={.96}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[23,-.026,18.5]}><planeGeometry args={[4.5,9]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',4.5/12,9/12)} color="#ffffff" roughness={.96}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[14.5,-.026,23]}><planeGeometry args={[17,4.5]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',17/12,4.5/12)} color="#ffffff" roughness={.96}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[14.5,-.026,20.5]}><planeGeometry args={[17,3.5]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',17/12,3.5/12)} color="#ffffff" roughness={.96}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]} position={[6,-.026,18.5]}><planeGeometry args={[4.5,9]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',4.5/12,9/12)} color="#ffffff" roughness={.96}/></mesh>
 {Array.from({length:4},(_,i)=><Box key={`outer-loop-dash-${i}`} position={[9+i*4.1,.006,20.5]} scale={[1.7,.02,.1]} color="#d8cf9d"/>)}
 {/* Continuous marked pedestrian route, physically guarded from the one-way truck loop. */}
 <mesh rotation={[-Math.PI/2,0,0]} position={[15,-.008,9.8]}><planeGeometry args={[20,1.8]}/><meshStandardMaterial color="#747d73" roughness={.9}/></mesh>
 {[8.95,10.65].map(z=><Box key={`walk-edge-${z}`} position={[15,.018,z]} scale={[20,.035,.07]} color="#dfd4a6"/>)}
 <Box position={[15,.38,11.65]} scale={[17.6,.76,.24]} color="#5e6965"/><Box position={[15,.81,11.65]} scale={[17.6,.1,.1]} color="#d4b878"/>
 {Array.from({length:10},(_,i)=>{const x=6.5+i*1.9;return <Box key={`walk-post-${i}`} position={[x,.47,11.65]} scale={[.12,.94,.32]} color="#68746f"/>})}
 {[4.2,25.8].map(x=><group key={`walk-lamp-${x}`}><Box position={[x,1.7,9.8]} scale={[.12,3.4,.12]} color="#596862"/><Box position={[x,3.42,9.8]} scale={[.7,.12,.18]} color="#b6a06d"/><mesh position={[x,3.34,9.8]}><sphereGeometry args={[.11,8,8]}/><meshStandardMaterial color={night?'#fff1c8':'#a8ad9c'} emissive={night?'#ffca76':'#000000'} emissiveIntensity={night?1.8:0}/></mesh>{night&&<pointLight position={[x,3.1,9.8]} color="#ffe0ac" intensity={3.2} distance={10} decay={2}/>}</group>)}
 {[11.5,12.5,13.5].map(z=><Box key={`bay-guide-${z}`} position={[16.5,.007,z]} scale={[13,.02,.07]} color={z===12.5?'#d6bb71':'#d3d0b9'}/>)}
 {[10,15,20].map(x=><group key={`truck-stop-mark-${x}`}><Box position={[x,.012,14]} scale={[.14,.025,3.25]} color="#e5dfcb"/><Box position={[x,.018,11.98]} scale={[1.15,.035,.15]} color="#d6b875"/></group>)}
 </group>}
function TruckBayNumber({position,number}:{position:[number,number,number];number:number}){
 const digits=String(number).padStart(2,'0'),patterns:Record<string,number[]>={'0':[0,1,2,3,4,5],'1':[1,2],'2':[0,1,6,4,3],'3':[0,1,6,2,3]};
 const bars:[[number,number,number,number],... [number,number,number,number][]]=[[0,.13,.18,.035],[.09,.065,.035,.105],[.09,-.065,.035,.105],[0,-.13,.18,.035],[-.09,-.065,.035,.105],[-.09,.065,.035,.105],[0,0,.18,.035]];
 return <group position={position}>
  <Box position={[0,0,0]} scale={[.82,.48,.08]} color="#38443f"/>
  {digits.split('').flatMap((digit,i)=>(patterns[digit]??[]).map(segment=>{const [x,y,w,h]=bars[segment];return <Box key={`${i}-${segment}`} position={[(i?1:-1)*.19+x,y,.052]} scale={[w,h,.025]} color="#e2c16d"/>}))}
 </group>
}
function TruckLoadingRack(){return <group>
 {/* Three open top-loading bays: braced portals, raised access platforms and guarded ladders, not closed car-park canopies. */}
 {[10,15,20].map((x,bay)=><group key={`loading-bay-${x}`}>
  {[-1.62,1.62].flatMap(dx=>[-2.15,2.15].map(dz=><group key={`${dx}-${dz}`}>
   <Box position={[x+dx,2.48,15+dz]} scale={[.16,4.72,.16]} color="#66766d"/>
   <Box position={[x+dx,.18,15+dz]} scale={[.5,.12,.48]} color="#89928a"/>
   {[-.14,.14].map(bolt=><mesh key={bolt} position={[x+dx+bolt,.255,15+dz]}><cylinderGeometry args={[.035,.035,.035,8]}/><meshStandardMaterial color="#c0b484" metalness={.55}/></mesh>)}
  </group>))}
  {[-2.15,2.15].map(dz=><group key={`portal-${dz}`}>
   <Box position={[x,4.68,15+dz]} scale={[3.55,.18,.2]} color="#819087"/>
   <Pipe a={[x-1.48,.55,15+dz]} b={[x+1.48,4.47,15+dz]} color="#748278" radius={.055}/>
   <Pipe a={[x+1.48,.55,15+dz]} b={[x-1.48,4.47,15+dz]} color="#748278" radius={.055}/>
  </group>)}
  {[-1.62,1.62].map(dx=><Box key={`crossbeam-${dx}`} position={[x+dx,4.68,15]} scale={[.18,.18,4.4]} color="#87948a"/>)}
  {/* Open grated side platform with a kick plate, double rails, access gate and crossover onto the tanker crown. */}
  <Box position={[x,2.82,16.55]} scale={[3.48,.14,1.34]} color="#68766d"/>
  {Array.from({length:15},(_,i)=><Box key={`grating-${i}`} position={[x-1.58+i*.226,2.902,16.55]} scale={[.035,.025,1.24]} color="#b6b19b"/>)}
  <Box position={[x,2.98,17.2]} scale={[3.48,.18,.09]} color="#bd9c57"/>
  {[15.92,17.18].map(z=><group key={`platform-rail-${z}`}>
   {bay===0&&z===17.18?<><Pipe a={[x-1.25,3.05,z]} b={[x+1.72,3.05,z]} color="#c2b47e" radius={.035}/><Pipe a={[x-1.25,3.92,z]} b={[x+1.72,3.92,z]} color="#c2b47e" radius={.04}/></>:<><Pipe a={[x-1.72,3.05,z]} b={[x+1.72,3.05,z]} color="#c2b47e" radius={.035}/><Pipe a={[x-1.72,3.92,z]} b={[x+1.72,3.92,z]} color="#c2b47e" radius={.04}/></>}
   {(bay===0&&z===17.18?[-.82,.82,1.65]:[-1.65,-.82,.82,1.65]).map(dx=><Box key={dx} position={[x+dx,3.48,z]} scale={[.055,.88,.055]} color="#9ba18f"/>)}
  </group>)}
  {[-1.72,1.72].filter(dx=>!(bay===0&&dx<0)).map(dx=><group key={`end-rail-${dx}`}>
   <Pipe a={[x+dx,3.05,15.94]} b={[x+dx,3.05,17.18]} color="#c2b47e" radius={.035}/>
   <Pipe a={[x+dx,3.92,15.94]} b={[x+dx,3.92,17.18]} color="#c2b47e" radius={.04}/>
   <Box position={[x+dx,3.48,16.56]} scale={[.055,.88,1.15]} color="#9ba18f"/>
  </group>)}
  <Box position={[x-.82,2.57,15.1]} scale={[.9,.09,1.38]} color="#a49c7e"/>
  <Box position={[x-.82,2.65,15.1]} scale={[.78,.04,1.24]} color="#c6b67f"/>
  <TruckBayNumber position={[x,4.22,17.33]} number={bay+1}/>
  {/* Product loading arm: swivel elbow, suspended hose and a final nozzle. Bay 01 aligns with the parked road tanker. */}
  <PipelinePath points={[[x,4.15,15],[x,3.78,15],[x-.36,3.78,15],[x-.72,3.58,14.76],[x-.82,3.58,14.4],[x-.82,2.15,14]]} color={bay===0?'#bc8050':'#9e8d68'} radius={.085}/>
  <mesh position={[x,3.78,15]}><sphereGeometry args={[.15,12,10]}/><meshStandardMaterial color="#c9b985" metalness={.55}/></mesh>
  <mesh position={[x-.72,3.58,14.76]}><sphereGeometry args={[.14,12,10]}/><meshStandardMaterial color="#b9a978" metalness={.55}/></mesh>
  <mesh position={[x-.82,2.14,14]}><torusGeometry args={[.12,.025,6,14]}/><meshStandardMaterial color="#d7c69a" metalness={.5}/></mesh>
  <Box position={[x+1.48,1.25,12.78]} scale={[.34,.48,.12]} color="#a44a3d"/>
  <mesh position={[x+1.48,1.34,12.69]}><cylinderGeometry args={[.075,.075,.08,10]}/><meshStandardMaterial color="#e6c36f" emissive="#6c281c" emissiveIntensity={.55}/></mesh>
 </group>)}
 {/* The pipeway-owned shared header feeds the arms; local flanges and branch meters keep each bay legible. */}
 {[10,15,20].map(x=><group key={`bay-meter-${x}`}>
  <mesh position={[x,4.15,15]}><torusGeometry args={[.18,.035,6,14]}/><meshStandardMaterial color="#d2be86" metalness={.48}/></mesh>
  <Box position={[x+1.37,1.75,12.78]} scale={[.22,.36,.14]} color="#64756c"/>
  <Box position={[x+1.37,1.78,12.68]} scale={[.13,.16,.035]} color="#a5b5a1"/>
 </group>)}
 {/* A ladder cage reaches the outer catwalk from the service side, clear of the truck body and marked traffic loop. */}
 <Box position={[8.18,1.47,17.2]} scale={[.08,2.8,.08]} color="#c3b47f"/><Box position={[8.68,1.47,17.2]} scale={[.08,2.8,.08]} color="#c3b47f"/>
 {Array.from({length:12},(_,i)=>{const y=.22+i*.23;return <Box key={`loading-ladder-rung-${i}`} position={[8.43,y,17.2]} scale={[.57,.045,.065]} color="#d0c08a"/>})}
 {[1.9,2.4,2.9].map(y=><mesh key={`loading-ladder-hoop-${y}`} position={[8.43,y,17.2]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.44,.018,5,16]}/><meshStandardMaterial color="#b5a575"/></mesh>)}
 {/* Flush slotted trench drain at the edge of the loading apron; no bollards intrude into the marked truck path. */}
 <Box position={[15,.035,18.35]} scale={[14,.07,.36]} color="#555f5a"/>
 {Array.from({length:15},(_,i)=><Box key={`loading-drain-${i}`} position={[8.5+i*.93,.08,18.35]} scale={[.055,.025,.3]} color="#303a36"/>)}
 </group>}
function Truck({item,index}:{item:SiteItem;index:number}) {
 const tanker=item.id==='TR-014',loadingFlatbed=item.id==='TR-027',route=tanker?truckRoute:flatbedRoute;
 const ref=useRef<THREE.Group>(null);const wheelRefs=useRef<THREE.Mesh[]>([]);const progress=useRef(0);const previousReset=useRef(useStore.getState().resetKey);const playing=useStore(s=>s.playing);const speed=useStore(s=>s.speed);const night=useStore(s=>s.night);const resetKey=useStore(s=>s.resetKey);const select=useStore(s=>s.select);const selected=useStore(s=>s.selected);
 useFrame((_,delta)=>{if(!ref.current||tanker||loadingFlatbed)return;if(resetKey!==previousReset.current){progress.current=0;previousReset.current=resetKey;}if(!playing)return;
  const candidate=(progress.current+delta*.024*speed)%1,next=routePoint(candidate,route);const blocked=items.some(person=>person.kind==='worker'&&Math.hypot(person.position[0]-next.x,person.position[2]-next.z)<3.8);
  if(!blocked)progress.current=candidate;const pose=routePoint(progress.current,route);ref.current.position.set(pose.x,.22,pose.z);ref.current.rotation.y=Math.atan2(-pose.dx,-pose.dz);wheelRefs.current.forEach(w=>w&&(w.rotation.x-=delta*speed*4));
 });
 const initialPose=routePoint(0,route);
 return <group ref={ref} position={[initialPose.x,.22,initialPose.z]} rotation={[0,Math.atan2(-initialPose.dx,-initialPose.dz),0]} onClick={e=>{e.stopPropagation();select(item)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}>
  <group position={[0,-.275,0]}>
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
   {/* Four drums secured as one palletized load; the remaining two drums ride in on the forklift pallet. */}
   <Box position={[0,.98,.75]} scale={[1.9,.28,3.65]} color="#67736d"/>
   {[-.84,.84].map(x=><Box key={`bed-rail-${x}`} position={[x,1.2,.75]} scale={[.09,.16,3.45]} color="#acb0a2"/>)}
   {[-.63,-.43,-.23,-.03,.17,.37,.57,.77,.97,1.17,1.37,1.57,1.77,1.97,2.17].map(z=><Box key={`deck-rib-${z}`} position={[0,1.14,z]} scale={[1.74,.035,.045]} color="#a79b79"/>)}
   <Box position={[0,1.72,-1.08]} scale={[1.86,1.22,.16]} color="#69746e"/>
   {[-.55,.55].map(x=><Box key={`headboard-mesh-${x}`} position={[x,1.75,-.98]} scale={[.055,1.08,.045]} color="#c0b27f"/>)}
   <Box position={[0,1.18,.42]} scale={[1.42,.12,1.3]} color="#765c3e"/>
   {[-.58,0,.58].map(z=><Box key={`pallet-runner-${z}`} position={[0,1.105,.42+z]} scale={[1.34,.09,.11]} color="#92744a"/>)}
   {[-.4,.4].map((x,xi)=>[.02,.82].map((z,zi)=>{const drumColor=['#9e7043','#b18a4d','#647a7d','#a26b49'][(xi*2+zi)%4];return <group key={`oil-drum-${xi}-${zi}`}>
    <mesh position={[x,1.57,z]} castShadow><cylinderGeometry args={[.22,.22,.68,18]}/><meshStandardMaterial color={drumColor} metalness={.38} roughness={.56}/></mesh>
    {[1.34,1.56,1.79].map(y=><mesh key={y} position={[x,y,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.217,.018,5,16]}/><meshStandardMaterial color="#d2c9ae" metalness={.48} roughness={.44}/></mesh>)}
    <mesh position={[x,1.92,z]}><cylinderGeometry args={[.17,.17,.035,14]}/><meshStandardMaterial color="#737e77" metalness={.48}/></mesh>
    <mesh position={[x+.075,1.945,z-.035]}><cylinderGeometry args={[.025,.025,.025,8]}/><meshStandardMaterial color="#b7ae8f" metalness={.42}/></mesh>
   </group>}))}
   {[.42].map(z=><group key={`load-strap-${z}`}><Box position={[0,1.98,z]} scale={[1.86,.055,.075]} color="#353c3b"/><Box position={[-.91,1.58,z]} scale={[.055,.8,.075]} color="#353c3b"/><Box position={[.91,1.58,z]} scale={[.055,.8,.075]} color="#353c3b"/><Box position={[-.98,1.38,z]} scale={[.16,.12,.12]} color="#bd9658"/><Box position={[.98,1.38,z]} scale={[.16,.12,.12]} color="#bd9658"/></group>)}
   <Box position={[0,.66,2.77]} scale={[1.78,.2,.2]} color="#bd6d4d"/>
   <Box position={[0,.78,-1.1]} scale={[1.82,.16,.14]} color="#b79d60"/>
  </group>}
  {/* Rear lamps and conspicuity tape */}
  {[-.68,.68].map(x=><group key={`rear-light-${x}`}><Box position={[x,.94,2.98]} scale={[.22,.3,.06]} color="#c95542"/><Box position={[x,.55,2.99]} scale={[.24,.18,.065]} color="#e3bf65"/></group>)}
  </group>
 </group>;
}
function DrumLoadingApron(){return <group>
 {/* A separate heavy-paved drum-handling pad adjoins the truck court without turning the tanker top-loading arms into a barrel filler. */}
 <mesh rotation={[-Math.PI/2,0,0]} position={[17.75,-.04,26.3]}><planeGeometry args={[9,5.2]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',9/9,5.2/9)} color="#b6b9af" roughness={.96}/></mesh>
 {[-1,1].map(side=><Box key={`drum-apron-edge-${side}`} position={[17.75+side*4.32,-.005,26.3]} scale={[.11,.035,4.9]} color="#d3ae59"/>)}
 {[24.15,28.45].map(z=><Box key={`drum-apron-stop-${z}`} position={[17.75,-.005,z]} scale={[8.65,.035,.11]} color="#d3ae59"/>)}
 <Box position={[14.2,.008,25.1]} scale={[.1,.02,1.35]} color="#d7d1bb"/><Box position={[21.3,.008,25.1]} scale={[.1,.02,1.35]} color="#d7d1bb"/>
 </group>}
function DrumLoadingForklift({item}:{item:SiteItem}){const night=useStore(s=>s.night);return <ClickGroup item={item} position={item.position}>
 <mesh position={[0,1.38,-.1]}><boxGeometry args={[3.4,3.2,4.8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {/* Counterbalanced industrial forklift, mast, overhead guard, driver, raised forks and the second secured drum pallet. */}
 <Box position={[0,.36,.05]} scale={[1.06,.22,2.45]} color="#3b4541"/>
 <Box position={[0,.72,.78]} scale={[1.22,.92,1.05]} color="#d5a73e"/>
 <Box position={[0,.78,1.31]} scale={[1.08,.64,.42]} color="#b98d33"/>
 <Box position={[0,1.18,1.0]} scale={[1.12,.1,.15]} color="#4c5650"/>
 <Box position={[0,.46,-.6]} scale={[.94,.18,.86]} color="#59655f"/>
 {[-.62,.62].flatMap(x=>[-.47,1.07].map(z=><group key={`forklift-wheel-${x}-${z}`}>
  <mesh position={[x,.35,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.34,.34,.2,16]}/><meshStandardMaterial color="#202725" roughness={.94}/></mesh>
  <mesh position={[x*1.12,.35,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.15,.15,.035,12]}/><meshStandardMaterial color="#a9ada3" metalness={.48}/></mesh>
  {Array.from({length:8},(_,i)=>{const angle=i*Math.PI/4;return <Box key={`tread-${i}`} position={[x*1.12,.35+Math.cos(angle)*.31,z+Math.sin(angle)*.31]} scale={[.22,.045,.08]} rotation={[angle,0,0]} color="#303936"/>})}
 </group>))}
 {/* Twin mast rails and crosshead, with paired hydraulic rams and hose details. */}
 {[-.52,.52].map(x=><group key={`mast-side-${x}`}>
  <Box position={[x,1.47,-1.05]} scale={[.12,2.85,.15]} color="#76827a"/>
  <Box position={[x,1.48,-1.18]} scale={[.045,2.55,.045]} color="#c0b381"/>
  <Pipe a={[x*.57,.66,-.82]} b={[x*.57,2.62,-1.02]} color="#8f9990" radius={.055}/>
  <Pipe a={[x*.57,.78,-.76]} b={[x*.57,2.52,-.96]} color="#bd9a54" radius={.022}/>
 </group>)}
 <Box position={[0,1.28,-1.18]} scale={[1.28,.34,.16]} color="#a1a79a"/>
 <Box position={[0,1.64,-1.18]} scale={[1.18,.12,.12]} color="#55625c"/>
 <Box position={[0,2.72,-.02]} scale={[1.38,.12,1.68]} color="#66736a"/>
 {[-.58,.58].map(x=><group key={`guard-post-${x}`}>
  <Pipe a={[x,1.16,.55]} b={[x,2.72,.55]} color="#c2b37e" radius={.045}/>
  <Pipe a={[x,1.16,-.68]} b={[x,2.72,-.68]} color="#c2b37e" radius={.045}/>
  <Box position={[x,2.1,-.06]} scale={[.07,1.18,.07]} color="#7b877e"/>
 </group>)}
 {[-.52,.52].map(x=><Box key={`guard-cross-${x}`} position={[x,2.1,-.06]} scale={[.07,.07,1.28]} color="#c3b47d"/>)}
 <Box position={[0,1.66,.35]} scale={[.44,.52,.38]} color="#38474a"/>
 <mesh position={[0,2.03,.36]} castShadow><sphereGeometry args={[.18,12,10]}/><meshStandardMaterial color="#a7795f" roughness={.8}/></mesh>
 <mesh position={[0,2.17,.35]} castShadow><sphereGeometry args={[.205,14,9,0,Math.PI*2,0,Math.PI*.52]}/><meshStandardMaterial color="#e0b33e" roughness={.58}/></mesh>
 <Box position={[0,1.42,.08]} scale={[.56,.12,.42]} color="#4c5550"/>
 <Box position={[0,1.25,-.02]} scale={[.18,.38,.1]} color="#313b39"/>
 {/* Reinforced forks reach underneath the pallet; the load is deliberately held above the truck side rail during transfer. */}
 {[-.36,.36].map(x=><group key={`fork-tine-${x}`}>
  <Box position={[x,1.27,-2.16]} scale={[.15,.13,2.55]} color="#a6aaa0"/>
  <Box position={[x,1.27,-3.43]} scale={[.24,.13,.24]} color="#b4b6a9"/>
 </group>)}
 <Box position={[0,1.39,-2.36]} scale={[1.34,.14,1.26]} color="#765c3e"/>
 {[-.5,0,.5].map(z=><Box key={`fork-pallet-runner-${z}`} position={[0,1.31,-2.36+z]} scale={[1.28,.08,.1]} color="#92744a"/>)}
 {[-.36,.36].map((x,i)=><group key={`fork-drum-${i}`}>
  <mesh position={[x,1.79,-2.36]} castShadow><cylinderGeometry args={[.22,.22,.68,18]}/><meshStandardMaterial color={i?'#a77843':'#687d7d'} metalness={.38} roughness={.56}/></mesh>
  {[1.56,1.78,2.01].map(y=><mesh key={y} position={[x,y,-2.36]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.217,.018,5,16]}/><meshStandardMaterial color="#d2c9ae" metalness={.46} roughness={.44}/></mesh>)}
  <mesh position={[x,2.14,-2.36]}><cylinderGeometry args={[.17,.17,.035,14]}/><meshStandardMaterial color="#737e77" metalness={.45}/></mesh>
 </group>)}
 <Box position={[0,2.16,-2.36]} scale={[1.16,.045,.07]} color="#333b39"/>
 <Box position={[-.6,1.78,-2.36]} scale={[.05,.78,.07]} color="#333b39"/><Box position={[.6,1.78,-2.36]} scale={[.05,.78,.07]} color="#333b39"/>
 <Box position={[.46,1.74,.94]} scale={[.2,.18,.08]} color="#d8c27c"/>
 <mesh position={[0,2.9,.18]}><cylinderGeometry args={[.09,.09,.18,10]}/><meshStandardMaterial color="#dfbd63" emissive={night?'#f2a72d':'#000000'} emissiveIntensity={night?1.2:0}/></mesh>
 {night&&<pointLight position={[0,2.96,.18]} color="#ffca62" intensity={2.4} distance={5} decay={2}/>}
 </ClickGroup>}
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
function AirCoolerFan({x}:{x:number}){
 const rotor=useRef<THREE.Group>(null),playing=useStore(s=>s.playing);
 useFrame((_,delta)=>{if(rotor.current&&playing)rotor.current.rotation.y+=delta*2.7;});
 return <group position={[x,8.58,0]}>
  <mesh position={[0,-.03,0]}><cylinderGeometry args={[.96,.96,.12,24,1,true]}/><meshStandardMaterial color="#485851" metalness={.45} roughness={.55} side={THREE.DoubleSide}/></mesh>
  <mesh position={[0,.035,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.94,.045,6,24]}/><meshStandardMaterial color="#c0b58c" metalness={.48}/></mesh>
  <group ref={rotor} position={[0,.07,0]}>
   {Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return <mesh key={`fan-blade-${i}`} position={[Math.cos(a)*.4,0,Math.sin(a)*.4]} rotation={[0,-a,0]}><boxGeometry args={[.82,.055,.17]}/><meshStandardMaterial color="#bcc4b7" metalness={.36} roughness={.55}/></mesh>})}
   <mesh position={[0,.035,0]}><cylinderGeometry args={[.18,.2,.16,12]}/><meshStandardMaterial color="#d0b975" metalness={.52}/></mesh>
  </group>
  {/* Compact motor and fan-shaft detail below the forced-draft fan. */}
  <mesh position={[0,-.36,0]}><cylinderGeometry args={[.16,.18,.42,12]}/><meshStandardMaterial color="#68766d" metalness={.55} roughness={.52}/></mesh>
  <mesh position={[0,-.62,0]}><cylinderGeometry args={[.23,.23,.12,12]}/><meshStandardMaterial color="#48554e" metalness={.45}/></mesh>
 </group>;
}
function AirCoolerBank({item}:{item:SiteItem}){
 const fanXs=[-2.25,0,2.25],tubeXs=[-2.85,-1.71,-.57,.57,1.71,2.85],tubeYs=[9.76,9.98,10.2,10.42];
 return <ClickGroup item={item} position={item.position}>
  {/* The cooler's portal legs continue the existing pipe-rack bents; the new structure begins above the highest pipe and cable tiers. */}
  {[-5,0,5].flatMap(x=>[-1.65,1.95].map(z=><group key={`ache-support-${x}-${z}`}>
   {/* The outer row cantilevers just beyond the rack edge to stay outside the cable-tray envelope. */}
   {z>1.7&&<Box position={[x,5.58,1.8]} scale={[.5,.14,.4]} color="#8b9386"/>}
   <Box position={[x,5.58,z]} scale={[.5,.15,.5]} color="#a69770"/>
   <Box position={[x,6.79,z]} scale={[.16,2.38,.16]} color="#66766d"/>
  </group>))}
  {[-1.65,1.95].map(z=><group key={`ache-long-brace-${z}`}>
   <Pipe a={[-5,5.68,z]} b={[0,7.84,z]} color="#74847a" radius={.045}/>
   <Pipe a={[-5,7.84,z]} b={[0,5.68,z]} color="#74847a" radius={.045}/>
   <Pipe a={[0,5.68,z]} b={[5,7.84,z]} color="#74847a" radius={.045}/>
   <Pipe a={[0,7.84,z]} b={[5,5.68,z]} color="#74847a" radius={.045}/>
  </group>)}
  {[-1.65,1.95].map(z=><group key={`ache-long-girder-${z}`}>
   <Box position={[0,7.91,z]} scale={[10.4,.2,.2]} color="#718077"/>
   <Box position={[0,5.67,z]} scale={[10.1,.16,.2]} color="#718077"/>
  </group>)}
  {[-5,0,5].map(x=><Box key={`ache-crossbeam-${x}`} position={[x,7.91,0]} scale={[.2,.18,3.45]} color="#819087"/>)}
  {/* Open lower maintenance walkways leave the air inlets and the pipe rack visible below. */}
  {[-1,1].map(side=><Box key={`ache-lower-sidewalk-${side}`} position={[side*4.05,8.03,0]} scale={[.66,.12,5.15]} color="#59665e"/>)}
  {[-1,1].map(side=><Box key={`ache-lower-endwalk-${side}`} position={[0,8.03,side*2.55]} scale={[7.95,.12,.58]} color="#59665e"/>)}
  {[-1,1].map(side=><group key={`ache-lower-long-rail-${side}`}>
   <Box position={[side*4.32,8.53,0]} scale={[.06,.92,5.35]} color="#c7b783"/>
   {[-2.2,-1.1,0,1.1,2.2].map(z=><Box key={z} position={[side*4.32,8.51,z]} scale={[.06,.86,.06]} color="#c7b783"/>)}
  </group>)}
  {[-1,1].map(side=><group key={`ache-lower-end-rail-${side}`}>
   <Box position={[0,8.53,side*2.84]} scale={[8.6,.92,.06]} color="#c7b783"/>
   {[-3.6,-2.4,-1.2,0,1.2,2.4,3.6].map(x=><Box key={x} position={[x,8.51,side*2.84]} scale={[.06,.86,.06]} color="#c7b783"/>)}
  </group>)}
  {/* Three forced-draft cells: axial fans below tapered plenums, then a shared finned-tube bundle. */}
  {fanXs.map(x=><group key={`ache-cell-${x}`}>
   <AirCoolerFan x={x}/>
   <mesh position={[x,9.1,0]} castShadow><cylinderGeometry args={[.79,1.02,1.04,20,1,true]}/><meshStandardMaterial color="#78847a" metalness={.34} roughness={.64} side={THREE.DoubleSide}/></mesh>
   <mesh position={[x,9.64,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.79,.035,6,20]}/><meshStandardMaterial color="#aab09f" metalness={.48}/></mesh>
  </group>)}
  <mesh position={[0,10.04,0]} castShadow receiveShadow><boxGeometry args={[7.75,.8,4.18]}/><meshStandardMaterial color="#737f76" map={getWeatheredSteelMap()} metalness={.38} roughness={.65}/></mesh>
  {/* Parallel finned tubes are visible through the open service-side study; removable header covers and bolts give the bundle a believable scale. */}
  {tubeXs.flatMap(x=>tubeYs.map(y=><group key={`ache-tube-${x}-${y}`}>
   <Pipe a={[x,y,-2.03]} b={[x,y,2.03]} color="#bec2b4" radius={.036}/>
   {[-1.5,-.75,0,.75,1.5].map(z=><mesh key={`ache-fin-${z}`} position={[x,y,z]}><torusGeometry args={[.125,.014,5,10]}/><meshStandardMaterial color="#b8bcae" metalness={.35} roughness={.62}/></mesh>)}
  </group>))}
  {[-1,1].map(side=><group key={`ache-header-${side}`}>
   <Box position={[0,10.04,side*2.28]} scale={[7.9,.82,.48]} color="#69776e"/>
   <Box position={[0,10.04,side*2.54]} scale={[7.72,.68,.08]} color="#838d81"/>
   {Array.from({length:12},(_,i)=>{const x=-3.42+i*.62;return <mesh key={`ache-header-bolt-${i}`} position={[x,10.04,side*2.59]}><sphereGeometry args={[.045,7,6]}/><meshStandardMaterial color="#d0bf8a" metalness={.55}/></mesh>})}
   <mesh position={[side===-1?-3.35:3.35,10.04,side*2.68]}><cylinderGeometry args={[.15,.17,.28,12]}/><meshStandardMaterial color="#89958a" metalness={.5}/></mesh>
  </group>)}
  {/* Raised perimeter service deck around the tube headers. */}
  {[-1,1].map(side=><Box key={`ache-upper-sidewalk-${side}`} position={[side*4.08,10.58,0]} scale={[.62,.12,5.25]} color="#56645d"/>)}
  {[-1,1].map(side=><Box key={`ache-upper-endwalk-${side}`} position={[0,10.58,side*2.83]} scale={[8.35,.12,.54]} color="#56645d"/>)}
  {[-1,1].map(side=><group key={`ache-upper-rail-x-${side}`}>
   <Box position={[side*4.36,11.07,0]} scale={[.06,.9,5.52]} color="#c8b782"/>
   {[-2.2,-1.1,0,1.1,2.2].map(z=><Box key={z} position={[side*4.36,11.05,z]} scale={[.06,.84,.06]} color="#c8b782"/>)}
  </group>)}
  {[-1,1].map(side=><group key={`ache-upper-rail-z-${side}`}>
   <Box position={[0,11.07,side*3.1]} scale={[8.7,.9,.06]} color="#c8b782"/>
   {[-3.6,-2.4,-1.2,0,1.2,2.4,3.6].map(x=><Box key={x} position={[x,11.05,side*3.1]} scale={[.06,.84,.06]} color="#c8b782"/>)}
  </group>)}
  {/* Ground-to-deck ladder is outside the cable-tray lane; a short second ladder reaches the header service deck. */}
  <Pipe a={[-4.55,.35,-1.95]} b={[-4.55,7.88,-1.95]} color="#c7b783" radius={.026}/>
  <Pipe a={[-4.55,.35,-1.55]} b={[-4.55,7.88,-1.55]} color="#c7b783" radius={.026}/>
  {Array.from({length:25},(_,i)=><Box key={`ache-ladder-rung-${i}`} position={[-4.55,.48+i*.3,-1.75]} scale={[.055,.038,.4]} color="#c7b783"/>)}
  {[2.8,3.8,4.8,5.8,6.8].map(y=><mesh key={`ache-ladder-cage-${y}`} position={[-4.55,y,-1.75]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.32,.018,5,16]}/><meshStandardMaterial color="#b19e70" metalness={.42}/></mesh>)}
  <Pipe a={[4.08,8.08,2.48]} b={[4.08,10.46,2.48]} color="#c7b783" radius={.022}/>
  <Pipe a={[3.68,8.08,2.48]} b={[3.68,10.46,2.48]} color="#c7b783" radius={.022}/>
  {Array.from({length:8},(_,i)=><Box key={`ache-upper-ladder-rung-${i}`} position={[3.88,8.22+i*.29,2.48]} scale={[.4,.035,.05]} color="#c7b783"/>)}
  {/* Header tie-ins descend to the top process-rack header; the values and arrangement are demonstrative only. */}
  <PipelinePath points={[[-3.35,10.04,-2.68],[-3.35,5.82,-2.68],[-3.35,5.82,-1.07],[-3.35,5.35,-1.07]]} color="#9f8054" radius={.105}/>
  <PipelinePath points={[[3.35,10.04,2.68],[3.35,5.82,2.68],[3.35,5.82,-1.07],[3.35,5.35,-1.07]]} color="#668d96" radius={.09}/>
  <ValveWheel position={[-3.35,5.82,-1.07]} color="#9a7b51"/><ValveWheel position={[3.35,5.82,-1.07]} color="#6e8a8d"/>
  <EquipmentTag label={item.id} position={[-4.1,8.42,3.34]}/>
 </ClickGroup>;
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
 {/* Independent road-tanker loading header carried above the three truck bays; separate from marine export. */}
 <PipelinePath points={[[10,1.25,-9],[9.1,1.25,-9],[9.1,4.15,-9],[9.1,4.15,9],[10,4.15,9],[10,4.15,15],[20,4.15,15]]} color="#8d7053" radius={.105}/>
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
 {color:'#84c9dc',points:[[10,1.25,-9],[9.1,1.25,-9],[9.1,4.15,-9],[9.1,4.15,9],[10,4.15,9],[10,4.15,15],[20,4.15,15]]},
 {color:'#efba68',points:[[10,4.15,15],[10,3.78,15],[9.64,3.78,15],[9.28,3.58,14.76],[9.18,3.58,14.4],[9.18,2.15,14]]},
 {color:'#efba68',points:[[15,4.15,15],[15,3.78,15],[14.64,3.78,15],[14.28,3.58,14.76],[14.18,3.58,14.4],[14.18,2.15,14]]},
 {color:'#efba68',points:[[20,4.15,15],[20,3.78,15],[19.64,3.78,15],[19.28,3.58,14.76],[19.18,3.58,14.4],[19.18,2.15,14]]},
 {color:'#d9c394',points:[[29,1.25,-9],[32.2,1.25,-9],[32.2,1.25,18]]},
 {color:'#efba68',points:[[-12,9.62,-9],[-12,10,-9],[-9,10,-9],[-9,2.35,-9],[-9,2.35,-5.7],[-6.66,1.47,-5.7],[-5.15,1.47,-5.7],[-5.15,2.08,-5.7]]},
 {color:'#83c9d5',points:[[-4.1,.72,-5.7],[-4.1,.45,-5.7],[-4.1,.45,-3.12],[-6.8,.55,-3.12],[-6.8,1.35,-1.25],[-6.8,4.4,-1.25],[-6.8,4.4,-7.6],[-12,4.4,-7.6],[-12,8.25,-7.6]]},
 {color:'#7395a2',points:[[-21,6.55,14],[-16,6.55,14],[-12.4,6.55,14],[-12.4,6.55,24.9],[-9.2,6.55,24.9],[-6.14,6.55,25.95],[-6.14,4.0,25.95]]},
 {color:'#b88c56',points:[[-8.55,4.76,24.7],[-12.4,5.85,24.9],[-12.4,5.85,6],[-6,5.85,6],[-6,5.85,2.72],[30,5.85,2.72],[2.5,5.85,2.72],[2.5,5.85,.5],[2.5,2.25,.5]]},
 {color:'#b88c56',points:[[-6,5.85,2.72],[-12,5.85,2.72],[-12,5.85,-9],[-12,2.25,-9]]},
 {color:'#6d9698',points:[[2.5,2.25,.5],[2.5,3.05,.5],[2.5,3.05,3.55],[-6,3.05,3.55],[-12.4,3.05,6],[-12.4,3.05,24.5],[-9.8,3.05,24.5],[-6.14,3.05,25.95],[-6.14,3.38,25.95]]},
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
  <SitePerimeterFence/>
  {/* site edge and zone paving */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-10,-.08,-7]}><planeGeometry args={[42,34]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',42/9,34/9)} color={night?'#46534f':'#c2c6bd'} roughness={.96}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[16,-.075,-9]}><planeGeometry args={[24,22]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',24/9,22/9)} color={night?'#4b534d':'#d1cebc'} roughness={.96}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[15,-.07,16]}><planeGeometry args={[28,17]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',28/9,17/9)} color={night?'#47524c':'#b2bcb2'} roughness={.96}/></mesh>
  {/* Company campus: paved forecourt, marked visitor parking, planted edge and secure vehicle gate */}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-24,-.075,22]}><planeGeometry args={[20,12]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',20/9,12/9)} color={night?'#4b544e':'#c2c2b6'} roughness={.96}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-25.8,-.035,25.85]}><planeGeometry args={[14.2,5.1]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',14.2/12,5.1/12)} color={night?'#747c76':'#ffffff'} roughness={.96}/></mesh>
  {Array.from({length:6},(_,i)=><mesh key={`parking-line-${i}`} position={[-32.8+i*2.35,.012,25.85]}><boxGeometry args={[.045,.025,4.55]}/><meshBasicMaterial color="#d8d0aa"/></mesh>)}
  {[-31.7,-29.35,-27,-24.65,-22.3,-19.95].map((x,i)=><CampusCar key={`campus-car-${i}`} position={[x,.04,25.8]} color={['#5b716f','#c5c0ad','#87918b'][i%3]}/>)}
  <mesh rotation={[-Math.PI/2,0,0]} position={[-15.45,-.025,25.8]}><planeGeometry args={[2.7,6.5]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',2.7/10,6.5/10)} color="#ffffff" roughness={.96}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-17.3,-.02,23.75]}><planeGeometry args={[3.8,1.8]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',3.8/10,1.8/10)} color="#ffffff" roughness={.96}/></mesh>
  {[[-32.8,17.3],[-32.8,20.4],[-15.8,17.3],[-15.8,21.8]].map(([x,z],i)=><CampusTree key={`landscape-edge-${i}`} position={[x,0,z]}/>)}
  <group position={[-24,.08,16.8]}><Box position={[0,.38,0]} scale={[8.1,.72,.38]} color="#64795a"/><Box position={[0,.77,0]} scale={[8.35,.08,.5]} color="#788b63"/></group>
  {/* Steel gate frame and striped lifting barrier at the southern campus entrance */}
  {[-18,-13].map(x=><Box key={`gate-post-${x}`} position={[x,1.65,28.55]} scale={[.48,3.3,.48]} color="#536359"/>)}
  <Box position={[-15.5,3.24,28.55]} scale={[5.2,.42,.55]} color="#8c9a8d"/>
  <Box position={[-15.5,3.25,28.24]} scale={[4.1,.32,.055]} color="#b99d64"/>
  <Box position={[-15.5,1.1,27.8]} scale={[4.15,.12,.13]} color="#d2bd78" rotation={[0,0,-.02]}/>
  {[-17.1,-16.3,-15.5,-14.7,-13.9].map(x=><Box key={`barrier-mark-${x}`} position={[x,1.1,27.8]} scale={[.35,.14,.15]} color="#c34e3f" rotation={[0,0,-.02]}/>)}
  <CompanyCampusDetails gatehouse={items.find(x=>x.id==='SEC-01')!}/><CompanyArrivalLandscape/><CompanyMonumentSign/>
  {/* Road network */}
  {[[-1,0,4,2.3],[0,7,2.3,44],[1,13,2.5,26],[-15,0,2.2,23]].map((r,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[r[0],-.035,r[1]]}><planeGeometry args={[r[3],r[2]]}/><meshStandardMaterial map={getYardSurfaceMap('asphalt',r[3]/12,r[2]/12)} color="#ffffff" roughness={.96}/></mesh>)}
  {Array.from({length:10},(_,i)=><mesh key={'dash'+i} rotation={[-Math.PI/2,0,0]} position={[-20+i*4,.005,7]}><planeGeometry args={[2,.12]}/><meshBasicMaterial color="#d8cf9d"/></mesh>)}
  <RoadDrainageAndEmergencyAccess/>
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
  <ControlBuilding item={items.find(x=>x.id==='CCR-01')!}/><LaboratoryBuilding item={items.find(x=>x.id==='LAB-01')!}/>
   {/* Process vessels, pipe racks, furnace and flare */}
  <Tower item={items[0]} scale={1.06}/><Tower item={items[1]} scale={.78}/><Furnace item={items[2]}/><Flare item={items[3]}/><ProcessRefinery/><MainPipeway/><FacilityInterconnects/><CDUOverheadPiping/><ElectricalFeed/>
  <OverheadCondenser item={items.find(x=>x.id==='E-101')!}/><RefluxAccumulator item={items.find(x=>x.id==='V-102')!}/><RefluxPumpSet item={items.find(x=>x.id==='P-102A')!}/>
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
  <TankFarmBundAccess/>
  <Pipe a={[7,1.35,-19.6]} b={[30,1.35,-19.6]} color="#bd6c51" radius={.15}/>
  {[9,15,21,27].map(x=><group key={`lpg-branch-${x}`}><Pipe a={[x-1.55,1.35,-19.6]} b={[x-1.55,1.35,-21.2]} color="#bd6c51" radius={.11}/><Pipe a={[x-1.55,1.35,-21.2]} b={[x-1.55,2.7,-21.2]} color="#bd6c51" radius={.09}/></group>)}
  {/* Utilities */}
  <CoolingBattery item={items.find(x=>x.id==='CW-01')!}/>
  <WastewaterPlant item={items.find(x=>x.id==='WWT-01')!}/>
  <ElectricalSubstation item={items.find(x=>x.id==='SUB-01')!}/>
  <FirewaterFacility item={items.find(x=>x.id==='FW-01')!}/><FirewaterRing/>
  <TransferPumpStation item={items.find(x=>x.id==='P-301A')!}/>
  <WaterTreatmentFacility item={items.find(x=>x.id==='WW-01')!}/>
  <SteamBoilerStation item={items.find(x=>x.id==='SB-01')!}/><SteamUtilityNetwork/>
  <FireStation item={items.find(x=>x.id==='FIRE-01')!}/>
  <TruckTrafficSafety/>
  {/* Road-tanker top-loading arms and the palletized-drum forklift bay are intentionally separate operations. */}
  <TruckLoadingRack/><DrumLoadingApron/>
  {items.filter(x=>x.kind==='truck').map((t,i)=><Truck key={t.id} item={t} index={i}/>)}
  <DrumLoadingForklift item={items.find(x=>x.id==='FL-027')!}/>
  {/* ship, loading arm connecting to jetty */}
  <AssetBoundary fallback={(_error)=> <ShipFallback item={items.find(x=>x.id==='VES-08')!}/>}><Suspense fallback={<ShipFallback item={items.find(x=>x.id==='VES-08')!}/>}><Ship item={items.find(x=>x.id==='VES-08')!}/></Suspense></AssetBoundary>
  <MarineLoadingArm position={[32.2,0,4]} color="#c69d5d"/><MarineLoadingArm position={[32.2,0,18]} color="#d6d0bc"/>
  {items.filter(x=>x.kind==='worker').map((person,i)=><AssetBoundary key={person.id} fallback={()=> <WorkerFallback item={person} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/>}><Suspense fallback={<WorkerFallback item={person} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/>}><Worker item={person} index={i} color={['#e0b44f','#d97746','#d7a83f','#c8aa55'][i%4]}/></Suspense></AssetBoundary>)}
  {mode==='personnel'&&items.map((it)=><mesh key={'pin'+it.id} position={[it.position[0],4,it.position[2]]}><sphereGeometry args={[.35,10,10]}/><meshBasicMaterial color="#f4cb79"/></mesh>)}
  <OrbitControls ref={controlsRef} makeDefault target={[0,0,0]} minPolarAngle={.25} maxPolarAngle={Math.PI/2.12} minDistance={24} maxDistance={100} enableDamping dampingFactor={.08} />
  <FocusCamera controlsRef={controlsRef}/>
 </>;
}
