import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { SiteItem } from '../data/site';
import { useStore } from '../store';
import { getWeatheredSteelMap } from './materials';

const steel='#65766d', paleSteel='#aeb8ae', safety='#d5bd83', pipe='#a97e49';
function Beam({position,size,color=steel,rotation}:{position:[number,number,number];size:[number,number,number];color?:string;rotation?:[number,number,number]}){
 return <mesh position={position} scale={size} rotation={rotation} castShadow receiveShadow><boxGeometry/><meshStandardMaterial color={color} metalness={.42} roughness={.58}/></mesh>;
}
function Run({a,b,color=pipe,r=.11}:{a:[number,number,number];b:[number,number,number];color?:string;r?:number}){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start),length=d.length();
 const orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
 return <group position={start.clone().add(end).multiplyScalar(.5)} quaternion={orientation}>
  <mesh castShadow><cylinderGeometry args={[r,r,length,10]}/><meshStandardMaterial color={color} metalness={.58} roughness={.42}/></mesh>
  {length<3&&[-1,1].map(side=><group key={side} position={[0,side*(length/2-.14),0]}>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[r*1.42,r*.2,6,14]}/><meshStandardMaterial color="#8b9489" metalness={.72} roughness={.35}/></mesh>
    {Array.from({length:6},(_,i)=>{const angle=i*Math.PI/3;return <mesh key={i} position={[Math.cos(angle)*r*1.32,0,Math.sin(angle)*r*1.32]}><cylinderGeometry args={[r*.12,r*.12,r*.13,6]}/><meshStandardMaterial color="#d9c693" metalness={.7}/></mesh>})}
  </group>)}
 </group>;
}
function Selectable({item,children}:{item:SiteItem;children:React.ReactNode}){
 const selected=useStore(s=>s.selected),select=useStore(s=>s.select),active=selected?.id===item.id;
 return <group position={item.position} onClick={e=>{e.stopPropagation();select(item)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}>
  {children}
  {active&&<mesh position={[0,.11,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[5.1,5.35,56]}/><meshBasicMaterial color="#e5bc71"/></mesh>}
 </group>;
}
function EquipmentTag({label,position}:{label:string;position:[number,number,number]}){
 const map=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const c=canvas.getContext('2d');if(!c)return undefined;c.fillStyle='#293832';c.fillRect(0,0,512,160);c.fillStyle='#caa65f';c.fillRect(0,0,22,160);c.strokeStyle='#bba775';c.lineWidth=8;c.strokeRect(10,10,492,140);c.fillStyle='#e8e6d8';c.font='bold 72px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(label,270,82);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;},[label]);
 return <group position={position}><Beam position={[-.65,-.48,0]} size={[.06,.9,.06]} color="#46574e"/><Beam position={[.65,-.48,0]} size={[.06,.9,.06]} color="#46574e"/><mesh><boxGeometry args={[1.8,.62,.12]}/><meshStandardMaterial color="#fff" map={map} metalness={.22} roughness={.48}/></mesh></group>;
}
function Vessel({x,z,r,h,color=paleSteel,band=true}:{x:number;z:number;r:number;h:number;color?:string;band?:boolean}){
 const accessLevels=[h*.48,h*.84];
 return <group position={[x,0,z]}>
  <mesh position={[0,h/2+.28,0]} castShadow receiveShadow><cylinderGeometry args={[r,r*.94,h,32]}/><meshStandardMaterial color={color} map={getWeatheredSteelMap()} metalness={.48} roughness={.62}/></mesh>
  {/* Dished vessel heads, skirt and circumferential weld/flange seams */}
  <mesh position={[0,h+.28,0]} castShadow><sphereGeometry args={[r*.94,24,14,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={color} map={getWeatheredSteelMap()} metalness={.5} roughness={.62}/></mesh>
  <mesh position={[0,.28+r*.94,0]} castShadow><sphereGeometry args={[r*.94,24,14,0,Math.PI*2,Math.PI/2,Math.PI/2]}/><meshStandardMaterial color={color} map={getWeatheredSteelMap()} metalness={.5} roughness={.62}/></mesh>
  <mesh position={[0,.37,0]}><cylinderGeometry args={[r*.9,r,.46,24]}/><meshStandardMaterial color="#56645b" metalness={.5}/></mesh>
  {band&&[.12,.5,.88].map((f,i)=><group key={i} position={[0,.28+h*f,0]}>
    <mesh><torusGeometry args={[r*1.008,.055,7,32]}/><meshStandardMaterial color={i===1?'#748279':safety} metalness={.58}/></mesh>
    {Array.from({length:16},(_,n)=>{const a=n*Math.PI/8;return <mesh key={n} position={[Math.cos(a)*r*1.04,0,Math.sin(a)*r*1.04]}><sphereGeometry args={[.045,7,7]}/><meshStandardMaterial color="#d4c18d" metalness={.7}/></mesh>})}
  </group>)}
  {/* Side nozzle, bolted flange and small handwheel */}
  <group position={[r*.93,h*.55+.28,0]}><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.14,.14,.5,12]}/><meshStandardMaterial color="#87948b" metalness={.6}/></mesh><mesh position={[.28,0,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.19,.045,8,20]}/><meshStandardMaterial color="#d0bd88" metalness={.62}/></mesh><mesh position={[.45,.23,0]}><torusGeometry args={[.16,.035,6,16]}/><meshStandardMaterial color="#bb7351" metalness={.5}/></mesh></group>
  {/* Two-ring access decks, guard rails and caged ladder */}
  {accessLevels.map((level,k)=><group key={k}>
    <mesh position={[0,level+.28,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r+.12,r+.48,32]}/><meshStandardMaterial color="#303a36" side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,level+.8,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[r+.48,.035,6,36]}/><meshStandardMaterial color={safety}/></mesh>
    {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <mesh key={i} position={[Math.cos(a)*(r+.48),level+.55,Math.sin(a)*(r+.48)]}><cylinderGeometry args={[.025,.025,.55,6]}/><meshStandardMaterial color={safety}/></mesh>})}
  </group>)}
  <mesh position={[r+.18,h*.48+.28,0]}><boxGeometry args={[.055,h*.82,.055]}/><meshStandardMaterial color={safety}/></mesh>
  <mesh position={[r+.5,h*.48+.28,0]}><boxGeometry args={[.055,h*.82,.055]}/><meshStandardMaterial color={safety}/></mesh>
  {Array.from({length:Math.floor(h/.42)},(_,i)=><mesh key={`rung-${i}`} position={[r+.34,.62+i*.42,0]}><boxGeometry args={[.39,.045,.055]}/><meshStandardMaterial color={safety}/></mesh>)}
 </group>;
}
function HorizontalVessel({x,z,y=1.05,length=2.7,r=.58}:{x:number;z:number;y?:number;length?:number;r?:number}){
 return <group position={[x,y,z]}>
  <mesh rotation={[0,0,Math.PI/2]} castShadow receiveShadow><cylinderGeometry args={[r,r,length,24]}/><meshStandardMaterial color="#aab4aa" map={getWeatheredSteelMap()} metalness={.52} roughness={.62}/></mesh>
  {[-1,1].map(side=><group key={side} position={[side*length/2,0,0]}>
    <mesh scale={[.52,1,1]} castShadow><sphereGeometry args={[r,18,14]}/><meshStandardMaterial color="#b7beb3" metalness={.5} roughness={.4}/></mesh>
    <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[r*.92,.065,8,24]}/><meshStandardMaterial color="#65756c" metalness={.62}/></mesh>
    {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <mesh key={i} position={[side*.035,Math.cos(a)*r*.72,Math.sin(a)*r*.72]}><sphereGeometry args={[.055,8,8]}/><meshStandardMaterial color="#d1bd8a" metalness={.68}/></mesh>})}
  </group>)}
  {[-.7,.7].map(s=><group key={s} position={[s*length*.3,-.58,0]}><Beam position={[0,0,0]} size={[.64,.7,.88]} color="#56665d"/><Beam position={[0,-.39,0]} size={[.86,.12,1.02]} color="#827457"/></group>)}
  {[-.45,.48].map((u,i)=><group key={i} position={[u*length,r*.9,0]}><mesh position={[0,.2,0]}><cylinderGeometry args={[.17,.2,.4,12]}/><meshStandardMaterial color="#7a8980" metalness={.55}/></mesh><mesh position={[0,.47,0]}><cylinderGeometry args={[.09,.09,.2,10]}/><meshStandardMaterial color="#b77050" metalness={.4}/></mesh></group>)}
  <mesh position={[0,r+.18,.02]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,.36,12]}/><meshStandardMaterial color="#74847a" metalness={.54}/></mesh>
 </group>;
}
function PlatformLevels({levels,halfX=4.8,halfZ=3.6}:{levels:number[];halfX?:number;halfZ?:number}){
 return <>{levels.map(y=><group key={y}>
  {Array.from({length:Math.floor(halfZ*5)},(_,n)=><Beam key={`grating-${n}`} position={[0,y+.035,-halfZ+.18+n*.36]} size={[halfX*2-.2,.04,.035]} color="#303b36"/>)}
  {[-halfX,0,halfX].map(x=><Beam key={`joist-${x}`} position={[x,y-.065,0]} size={[.12,.14,halfZ*2]} color="#87938a"/>)}
  {[-halfX,halfX].map(x=><Beam key={`railx-${x}`} position={[x,y+.55,0]} size={[.06,.95,halfZ*2]} color={safety}/>)}
  {[-halfZ,halfZ].map(z=><Beam key={`railz-${z}`} position={[0,y+.55,z]} size={[halfX*2,.95,.06]} color={safety}/>)}
  {Array.from({length:Math.floor(halfX*2)},(_,n)=><Beam key={`bal-${n}`} position={[-halfX+.5+n,y+.5,halfZ]} size={[.045,.68,.045]} color={safety}/>)}
 </group>)}</>;
}
function PipeBridge(){
 return <>{[2.1,2.55,3,5.2].map((y,i)=><group key={y}>
  <Run a={[-5.3,y,-2.9]} b={[5.5,y,-2.9]} color={['#b78348','#6f9992','#b76550','#9a9b7d'][i]} r={i===3?.15:.09}/>
  <Run a={[-3.5,y,-2.9]} b={[-3.5,y+.85,-2.9]} color={['#b78348','#6f9992','#b76550','#9a9b7d'][i]} r={.08}/>
  <Run a={[3.1,y,-2.9]} b={[3.1,y+1,-2.9]} color={['#b78348','#6f9992','#b76550','#9a9b7d'][i]} r={.08}/>
 </group>)}
 {[-5,0,5].map(x=><group key={x}><Beam position={[x,3.2,-2.9]} size={[.22,6.4,.22]}/><Beam position={[x,3.25,-2.9]} size={[1.35,.13,.18]} color="#87958b"/></group>)}</>;
}
export function RefineryUnit({item}:{item:SiteItem}){
 const fcc=item.id==='FCC-01';
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[12,.12,9]}/><meshStandardMaterial color="#858b80" roughness={.88}/></mesh>
  {[-5,5].map(x=>[-3.55,3.55].map(z=><group key={`${x}-${z}`}><Beam position={[x,3.8,z]} size={[.2,7.6,.2]}/><Beam position={[x,1.4,z]} size={[.36,.14,.36]} color="#a18d64"/></group>))}
  <PlatformLevels levels={fcc?[2.7,5.5,8.2]:[2.5,5,7.5]} halfX={4.8} halfZ={3.45}/>
  {fcc?<>
    <Vessel x={-2.4} z={.2} r={1.1} h={8.3}/><Vessel x={1.1} z={.25} r={1.35} h={9.8} color="#9da99f"/>
    <Vessel x={4.1} z={-.6} r={.85} h={10.7}/>
    {/* FCC reactor/regenerator overhead transfer line and paired cyclone heads */}
    <Run a={[-2.4,8.9,.2]} b={[-2.4,10.1,.2]} color="#c49a59" r={.16}/><Run a={[1.1,10.4,.25]} b={[1.1,11.3,.25]} color="#c49a59" r={.16}/>
    {[-2.4,1.1].map((x,i)=><group key={x} position={[x,0,.2]}><mesh position={[0,10.8+i*.25,0]}><cylinderGeometry args={[.42,.58,.8,14]}/><meshStandardMaterial color="#89968b" metalness={.48}/></mesh><mesh position={[0,11.3+i*.25,0]}><cylinderGeometry args={[.18,.42,.28,14]}/><meshStandardMaterial color="#b5bdb1" metalness={.4}/></mesh></group>)}
    <Run a={[-2.4,7.2,.2]} b={[1.1,8.5,.25]} color="#b8644b" r={.18}/><Run a={[1.1,5.8,.25]} b={[4.1,6.3,-.6]} color="#6d9790" r={.13}/>
    {[-1.7,1.7].map(x=><HorizontalVessel key={`fcc-exchanger-${x}`} x={x} z={2.15} y={1.05} length={2.6} r={.5}/>)}
  </>:<>
    <Vessel x={-2.5} z={-.2} r={1.12} h={8.7}/><Vessel x={.8} z={-.2} r={1.2} h={8.1} color="#a2ada3"/>
    <Vessel x={4.15} z={-.35} r={.9} h={10.8}/>
    {/* Charge heater */}
    <mesh position={[-4.1,1.35,2.05]} castShadow><boxGeometry args={[2.2,2.6,1.7]}/><meshStandardMaterial color="#686d62" metalness={.22}/></mesh>
    <mesh position={[-4.1,1.45,2.93]}><planeGeometry args={[1.15,1.3]}/><meshBasicMaterial color="#ee8b43" transparent opacity={.68}/></mesh>
    <mesh position={[-4.1,2.8,2.05]}><cylinderGeometry args={[.25,.34,2.2,12]}/><meshStandardMaterial color="#525d57" metalness={.5}/></mesh>
    {/* Realistic horizontal exchangers with dished heads, bolted flanges and saddle supports */}
    {[-2.5,0,2.5].map(x=><HorizontalVessel key={x} x={x} z={2.05} y={1.1} length={2.6} r={.52}/>)}
    {[-2.5,.8,4.15].map((x,i)=><Run key={x} a={[x,7.6,-.2]} b={[x,8.5,-.2]} color={i===1?'#a66850':'#81988c'}/>) }
  </>}
  <PipeBridge/>
  {/* Tube bundles, pumps and compact valve stations along the service edge */}
  {[-3.2,0,3.2].map((x,i)=><group key={`pump-${x}`} position={[x,.15,3.55]}>
    <Beam position={[0,.45,0]} size={[1.15,.7,.75]} color="#536a5f"/><mesh position={[0,.48,.52]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.28,.09,8,16]}/><meshStandardMaterial color={['#be8050','#729a94','#b9634a'][i]} metalness={.5}/></mesh>
    <mesh position={[0,.9,0]}><cylinderGeometry args={[.1,.1,.32,10]}/><meshStandardMaterial color="#ddbf77"/></mesh>
  </group>)}
  {/* Caged access ladder and diagonal bracing */}
  <Beam position={[4.85,4.4,3.48]} size={[.1,7.8,.1]} color={safety}/><Beam position={[5.35,4.4,3.48]} size={[.1,7.8,.1]} color={safety}/>
  {Array.from({length:18},(_,i)=><Beam key={`rung-${i}`} position={[5.1,.8+i*.42,3.48]} size={[.52,.045,.055]} color={safety}/>)}
  {[-4.8,4.8].map(x=><Beam key={x} position={[x,3.8,3.25]} size={[.11,7.1,.11]} rotation={[0,0,x<0?-.42:.42]} color="#819087"/>)}
  <EquipmentTag label={item.id} position={[0,1.55,4.62]}/>
 </Selectable>;
}
export function DesalterUnit({item}:{item:SiteItem}){
 return <Selectable item={item}>
  <mesh position={[0,.07,0]} receiveShadow><boxGeometry args={[11,.14,9.5]}/><meshStandardMaterial color="#85897f" roughness={.9}/></mesh>
  {/* Access frame and open grating service deck */}
  {[-4.6,4.6].flatMap(x=>[-3.7,3.7].map(z=><group key={`${x}-${z}`}><Beam position={[x,2.15,z]} size={[.2,4.3,.2]}/><Beam position={[x,.16,z]} size={[.42,.2,.42]} color="#a18d64"/></group>))}
  {[-3.2,-2.9,-2.6].map((y,i)=><Run key={i} a={[-4.3,y,-3.2]} b={[4.3,y,-3.2]} color={['#9a8057','#658f90','#b66c51'][i]} r={.085}/>)}
  <Beam position={[0,4.05,0]} size={[9.2,.14,7.1]} color="#596b62"/>
  {Array.from({length:19},(_,i)=><Beam key={`grate-${i}`} position={[0,4.14,-3.35+i*.37]} size={[8.9,.04,.035]} color="#303a36"/>)}
  {[-4.55,4.55].map(x=><Beam key={`rail-${x}`} position={[x,4.65,0]} size={[.06,1,7.1]} color={safety}/>)}
  {/* Parallel electrostatic desalter drums with dish heads, heavy flanges and saddles */}
  {[-1.75,1.75].map((x,i)=><group key={`desalter-${i}`}>
    <HorizontalVessel x={x} z={-.1} y={1.55} length={3.8} r={.72}/>
    <mesh position={[x,3.14,-.1]}><boxGeometry args={[.9,.78,.8]}/><meshStandardMaterial color="#687970" metalness={.3}/></mesh>
    {[0,1,2,3].map(n=><group key={n} position={[x-.3+(n%2)*.6,3.57,-.3+Math.floor(n/2)*.4]}><mesh><cylinderGeometry args={[.12,.12,.34,10]}/><meshStandardMaterial color="#b9c4bc" metalness={.35}/></mesh><mesh position={[0,.2,0]}><sphereGeometry args={[.08,8,8]}/><meshStandardMaterial color="#d3b878" metalness={.55}/></mesh></group>)}
  </group>)}
  {/* Wash-water injection, crude charge manifolds and paired charge pumps */}
  <Run a={[-5,1.05,-2.6]} b={[5,1.05,-2.6]} color="#b47d4f" r={.13}/><Run a={[-5,2.2,2.8]} b={[5,2.2,2.8]} color="#668f92" r={.11}/>
  {[-3.6,0,3.6].map(x=><group key={`pump-${x}`} position={[x,.15,2.05]}><Beam position={[0,.36,0]} size={[1,.58,.78]} color="#53685d"/><mesh position={[0,.39,.48]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.25,.08,8,16]}/><meshStandardMaterial color="#b47d4f" metalness={.55}/></mesh><Beam position={[0,.9,0]} size={[.14,.42,.14]} color="#d1bd83"/></group>)}
  <Beam position={[4.8,2.15,3.55]} size={[.08,4.2,.08]} color={safety}/><Beam position={[5.25,2.15,3.55]} size={[.08,4.2,.08]} color={safety}/>
  {Array.from({length:13},(_,i)=><Beam key={`step-${i}`} position={[5.02,.25+i*.32,3.35-i*.19]} size={[.58,.07,.3]} color="#aab1a4"/>)}
  <EquipmentTag label={item.id} position={[0,1.55,4.82]}/>
 </Selectable>;
}
export function CrudeReceiving({item}:{item:SiteItem}){
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[5.6,.12,4.8]}/><meshStandardMaterial color="#81847a" roughness={.9}/></mesh>
  {/* Duplex basket strainers */}
  {[-1.55,1.55].map((x,i)=><group key={`strainer-${i}`} position={[x,0,-.8]}>
    <mesh position={[0,1.32,0]} castShadow><cylinderGeometry args={[.48,.55,2.25,18]}/><meshStandardMaterial color="#9ca79d" map={getWeatheredSteelMap()} metalness={.45} roughness={.62}/></mesh>
    <mesh position={[0,2.48,0]}><cylinderGeometry args={[.56,.56,.14,18]}/><meshStandardMaterial color="#66776e" metalness={.55}/></mesh>
    {Array.from({length:10},(_,n)=>{const a=n*Math.PI/5;return <mesh key={n} position={[Math.cos(a)*.51,2.48,Math.sin(a)*.51]}><sphereGeometry args={[.045,7,7]}/><meshStandardMaterial color="#cfbd8e" metalness={.68}/></mesh>})}
    <mesh position={[0,2.7,0]}><torusGeometry args={[.14,.035,7,16]}/><meshStandardMaterial color="#b87251" metalness={.5}/></mesh>
    <Beam position={[0,.2,0]} size={[1.15,.28,1.1]} color="#52635a"/>
  </group>)}
  {/* Suction/discharge headers and compact charge-pump skid */}
  <Run a={[-2.55,2.85,-.8]} b={[2.55,2.85,-.8]} color="#a77b4b" r={.13}/>
  <Run a={[-2.5,1.5,-2]} b={[2.5,1.5,-2]} color="#718f92" r={.1}/>
  {[-1.35,1.35].map((x,i)=><group key={`charge-pump-${i}`} position={[x,0,1.05]}>
    <Beam position={[0,.34,0]} size={[1.05,.62,.85]} color="#526a5e"/>
    <mesh position={[0,.55,.5]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.27,.095,8,16]}/><meshStandardMaterial color={i?'#728f8c':'#b5814e'} metalness={.55}/></mesh>
    <mesh position={[0,.92,0]}><cylinderGeometry args={[.11,.11,.32,10]}/><meshStandardMaterial color="#d5bd83"/></mesh>
  </group>)}
  <Beam position={[0,.4,2.15]} size={[4.8,.38,.35]} color="#4c5952"/>
  <EquipmentTag label={item.id} position={[0,1.15,2.5]}/>
 </Selectable>;
}
export function SulfurRecovery({item}:{item:SiteItem}){
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[9,.12,7.4]}/><meshStandardMaterial color="#777e74" roughness={.9}/></mesh>
  {/* Claus reaction furnace and refractory combustion chamber */}
  <Beam position={[-3.05,1.45,1.65]} size={[2.15,2.9,1.8]} color="#606960"/>
  <mesh position={[-3.05,1.5,2.58]}><planeGeometry args={[1.08,1.26]}/><meshBasicMaterial color="#f18a3d" transparent opacity={.65}/></mesh>
  <mesh position={[-3.05,3.2,1.65]}><cylinderGeometry args={[.31,.42,2.25,14]}/><meshStandardMaterial color="#727d74" map={getWeatheredSteelMap()} metalness={.35} roughness={.65}/></mesh>
  {/* Paired catalytic converters, waste-heat boiler and sulfur condenser */}
  <Vessel x={-.85} z={-.65} r={.72} h={6.3}/><Vessel x={1.15} z={-.65} r={.72} h={6.7} color="#a1aca2"/>
  <HorizontalVessel x={-2.5} z={1.45} y={1.05} length={2.4} r={.48}/>
  <Beam position={[3.05,.55,1.5]} size={[1.15,1.1,1.3]} color="#736d55"/>
  <mesh position={[3.05,1.13,1.5]}><boxGeometry args={[.82,.05,.92]}/><meshStandardMaterial color="#b17840" metalness={.18} roughness={.32}/></mesh>
  {/* Incinerator stack, thermal expansion lines and braced support tower */}
  <mesh position={[3.45,5.2,-2.35]} castShadow><cylinderGeometry args={[.28,.4,9.8,16]}/><meshStandardMaterial color="#c1c5b8" map={getWeatheredSteelMap()} metalness={.42} roughness={.58}/></mesh>
  {[1.7,4.4,7.1].map(y=><mesh key={y} position={[3.45,y,-2.35]}><cylinderGeometry args={[.365-y*.009,.39-y*.009,.85,16]}/><meshStandardMaterial color="#a64d3e" roughness={.66}/></mesh>)}
  {[-1,1].map((x,i)=><group key={`sru-frame-${i}`}><Beam position={[x*4.05,3.3,-2.85]} size={[.16,6.6,.16]}/><Beam position={[x*4.05,3.3,.3]} size={[.16,6.6,.16]}/><Run a={[x*4.05,.35,-2.85]} b={[x*4.05,6.2,.3]} color="#6c7970" r={.07}/></group>)}
  <PlatformLevels levels={[2.4,4.8,6.4]} halfX={3.7} halfZ={2.9}/>
  <Run a={[-3.8,2.2,-2.4]} b={[3.7,2.2,-2.4]} color="#b67a49" r={.12}/><Run a={[-3.8,2.65,-2.4]} b={[3.7,2.65,-2.4]} color="#718f92" r={.085}/>
  <EquipmentTag label={item.id} position={[0,1.35,3.85]}/>
 </Selectable>;
}
function SwitchyardFence(){
 const xPosts=[-7.5,-5,-2.5,2.5,5,7.5];
 return <group>
  {/* Guarded switchyard perimeter, close-spaced steel mesh bars and a service vehicle gate. */}
  {xPosts.map(x=><group key={`yard-endpost-${x}`}><Beam position={[x,1.2,-6]} size={[.12,2.4,.12]} color="#52635a"/><Beam position={[x,1.2,6]} size={[.12,2.4,.12]} color="#52635a"/></group>)}
  {[-4,-2,0,2,4].map(z=><group key={`yard-sidepost-${z}`}><Beam position={[-7.5,1.2,z]} size={[.12,2.4,.12]} color="#52635a"/><Beam position={[7.5,1.2,z]} size={[.12,2.4,.12]} color="#52635a"/></group>)}
  {[-6,6].map(z=><group key={`yard-rails-${z}`}>
   {z===-6?<><Beam position={[0,.18,z]} size={[15,.09,.09]} color="#69776e"/><Beam position={[0,1.18,z]} size={[15,.07,.07]} color="#69776e"/><Beam position={[0,2.32,z]} size={[15,.09,.09]} color="#69776e"/></>:<>{[-5,5].map(x=><group key={x}><Beam position={[x,.18,z]} size={[5,.09,.09]} color="#69776e"/><Beam position={[x,1.18,z]} size={[5,.07,.07]} color="#69776e"/><Beam position={[x,2.32,z]} size={[5,.09,.09]} color="#69776e"/></group>)}</>}
  </group>)}
  {[-7.5,7.5].map(x=><group key={`yard-side-rails-${x}`}><Beam position={[x,.18,0]} size={[.09,.09,12]} color="#69776e"/><Beam position={[x,1.18,0]} size={[.07,.07,12]} color="#69776e"/><Beam position={[x,2.32,0]} size={[.09,.09,12]} color="#69776e"/></group>)}
  {Array.from({length:31},(_,i)=>{const x=-7.5+i*.5;return <group key={`yard-mesh-back-${i}`}><Beam position={[x,1.2,-6]} size={[.026,1.95,.026]} color="#87948a"/>{Math.abs(x)>2.5&&<Beam position={[x,1.2,6]} size={[.026,1.95,.026]} color="#87948a"/>}</group>})}
  {Array.from({length:23},(_,i)=>{const z=-5.5+i*.5;return <group key={`yard-mesh-side-${i}`}><Beam position={[-7.5,1.2,z]} size={[.026,1.95,.026]} color="#87948a"/><Beam position={[7.5,1.2,z]} size={[.026,1.95,.026]} color="#87948a"/></group>})}
  {/* Double-leaf entrance, set into the southern fence line. */}
  {[-1.25,1.25].map((center,i)=><group key={`yard-gate-leaf-${i}`}>
   <Beam position={[center,1.1,6]} size={[2.5,.09,.09]} color="#b1a477"/><Beam position={[center,2.15,6]} size={[2.5,.09,.09]} color="#b1a477"/>
   {Array.from({length:6},(_,n)=><Beam key={n} position={[center-1+n*.4,1.62,6]} size={[.045,1.05,.045]} color="#8b968d"/>)}
   <Run a={[center-1,1.18,6]} b={[center+1,2.08,6]} color="#69776e" r={.035}/>
  </group>)}
  <Beam position={[0,1.65,6.08]} size={[1.3,.42,.08]} color="#d4b74f"/>
  {[-.34,0,.34].map(x=><Beam key={`yard-warning-stripe-${x}`} position={[x,1.65,6.13]} size={[.055,.3,.035]} color="#303b36" rotation={[0,0,-.42]}/>)}
 </group>;
}
export function ElectricalSubstation({item}:{item:SiteItem}){
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[12,.12,9]}/><meshStandardMaterial color="#7e8278" roughness={.9}/></mesh>
  <SwitchyardFence/>
  {/* Two oil-filled power transformers, cooling banks and porcelain bushings */}
  {[-2.5,1.25].map((x,i)=><group key={`tx-${i}`} position={[x,0,-.8]}>
    <Beam position={[0,1.15,0]} size={[2.85,1.9,2.25]} color="#6e7c72"/>
    {[-1.6,-1.3,-1,-.7,.7,1,1.3,1.6].map((z,n)=><Beam key={`fin-${n}`} position={[0,1.15,z]} size={[2.2,1.7,.055]} color="#89958a"/>)}
    <Beam position={[0,.18,0]} size={[3,.26,2.4]} color="#505d55"/>
    <mesh position={[0,2.24,-.15]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.27,.27,2.2,14]}/><meshStandardMaterial color="#9ca69b" map={getWeatheredSteelMap()} metalness={.5} roughness={.6}/></mesh>
    {[-.75,0,.75].map((z,n)=><group key={`bushing-${n}`} position={[z,2.25,.62]}><mesh position={[0,.22,0]}><cylinderGeometry args={[.13,.18,.3,10]}/><meshStandardMaterial color="#c5c4b0" roughness={.4}/></mesh>{[0,1,2,3].map(ring=><mesh key={ring} position={[0,.36+ring*.16,0]}><cylinderGeometry args={[.25-ring*.025,.25-ring*.025,.055,12]}/><meshStandardMaterial color="#d4d1bf" roughness={.42}/></mesh>)}<mesh position={[0,1.05,0]}><sphereGeometry args={[.07,8,8]}/><meshStandardMaterial color="#a87648" metalness={.4}/></mesh></group>)}
  </group>)}
  {/* Steel switchgear cabinets and ceramic disconnects */}
  {[-4.3,4.25].map((x,i)=><group key={`switch-${i}`} position={[x,0,2.65]}><Beam position={[0,1.2,0]} size={[1.3,2.2,1.4]} color={i?'#6c7b70':'#68786d'}/><Beam position={[0,1.22,.72]} size={[.82,1.25,.035]} color="#303b36"/>{[-.38,0,.38].map((z,n)=><mesh key={n} position={[z,1.55,.76]}><sphereGeometry args={[.075,8,8]}/><meshStandardMaterial color={n===1?'#d99b4d':'#8db19a'} emissive={n===1?'#6a3511':'#14291b'} emissiveIntensity={.3}/></mesh>)}</group>)}
  {/* Elevated busbars, gantry columns, insulators and lightning mast */}
  {[-4.7,0,4.7].map(x=><group key={`gantry-${x}`}><Beam position={[x,3.6,-.3]} size={[.18,7,.18]}/><Beam position={[x,6.95,-.3]} size={[1.2,.16,.2]} color="#8c9388"/></group>)}
  {[-3.5,-1.5,1.5,3.5].map(x=><group key={`bus-${x}`}><Run a={[x,7,-.3]} b={[x,7,2.25]} color="#9a9b80" r={.075}/><mesh position={[x,5.95,1.1]}><cylinderGeometry args={[.16,.2,.72,10]}/><meshStandardMaterial color="#d0cfbf"/></mesh><mesh position={[x,6.42,1.1]}><cylinderGeometry args={[.23,.23,.08,10]}/><meshStandardMaterial color="#d0cfbf"/></mesh></group>)}
  <EquipmentTag label={item.id} position={[0,1.5,4.45]}/>
 </Selectable>;
}
function Fan({position,index}:{position:[number,number,number];index:number}){
 const rotor=useRef<THREE.Group>(null),playing=useStore(s=>s.playing);
 useFrame((_,dt)=>{if(rotor.current&&playing)rotor.current.rotation.y+=dt*(index%2?3.1:-2.7)});
 return <group position={position}>
  <mesh position={[0,.06,0]}><cylinderGeometry args={[1.05,1.05,.14,24]}/><meshStandardMaterial color="#4d6158" metalness={.45}/></mesh>
  <group ref={rotor} position={[0,.17,0]}>
    {[0,1,2,3,4,5].map(i=><mesh key={i} rotation={[0,i*Math.PI/3,0]} position={[Math.cos(i*Math.PI/3)*.42,.04,Math.sin(i*Math.PI/3)*.42]}><boxGeometry args={[.78,.08,.17]}/><meshStandardMaterial color="#b9c1b5" metalness={.38}/></mesh>)}
    <mesh position={[0,.05,0]}><sphereGeometry args={[.2,12,10]}/><meshStandardMaterial color="#d3bd80" metalness={.45}/></mesh>
  </group>
 </group>;
}
export function CoolingBattery({item}:{item:SiteItem}){
 return <Selectable item={item}>
  <mesh position={[0,.08,0]} receiveShadow><boxGeometry args={[11,.16,8.5]}/><meshStandardMaterial color="#777d73"/></mesh>
  {/* Elevated utility platform and open steel substructure, following modular refinery cooling-station references */}
  {[-4.4,0,4.4].map(x=>[-3,3].map(z=><group key={`${x}-${z}`}><Beam position={[x,1.35,z]} size={[.24,2.7,.24]}/><Beam position={[x,.16,z]} size={[.55,.22,.55]} color="#a39068"/></group>))}
  {[2.25,2.5].map((y,i)=><Beam key={y} position={[0,y,0]} size={[10,.16,7.2]} color={i?'#7b8880':'#68786e'}/>)}
  {[-3.5,0,3.5].map((x,i)=><group key={`cell-${i}`} position={[x,0,0]}>
    <Beam position={[0,3.9,0]} size={[3.15,2.75,5.2]} color={['#7d8c83','#849188','#72847a'][i]}/>
    <Beam position={[0,5.33,0]} size={[3.3,.18,5.35]} color="#9da99f"/>
    <mesh position={[0,5.47,0]}><cylinderGeometry args={[.92,.92,.16,24]}/><meshStandardMaterial color="#4b5d54" metalness={.35}/></mesh>
    <Fan position={[0,5.58,0]} index={i}/>
    {[-1.2,1.2].map(z=><Beam key={z} position={[0,3.9,z]} size={[2.65,2.35,.055]} color="#b6aa87"/>)}
    <mesh position={[0,2.55,0]}><boxGeometry args={[2.8,.16,4.8]}/><meshStandardMaterial color="#a6b4a9"/></mesh>
  </group>)}
  {/* Lower wet deck, manifolds, headers and pumps */}
  {[-1.05,-.72,-.39].map((y,i)=><Run key={y} a={[-4.6,y,-3.5]} b={[4.6,y,-3.5]} color={['#6d9ca0','#9b8052','#b46c51'][i]} r={.1}/>) }
  {[-3.8,-1.3,1.3,3.8].map(x=><group key={`downcomer-${x}`}><Run a={[x,2.6,-3.5]} b={[x,.38,-3.5]} color="#6d9ca0" r={.095}/><Beam position={[x,.25,-3.5]} size={[.7,.3,.75]} color="#50655b"/></group>)}
  {[0,1,2,3].map(i=><Beam key={`handrail-${i}`} position={[-4.7+i*3.13,2.8,3.72]} size={[.055,.9,.055]} color={safety}/>)}
  <Beam position={[0,3.32,3.72]} size={[9.5,.07,.07]} color={safety}/><Beam position={[0,4.05,3.72]} size={[9.5,.07,.07]} color={safety}/>
  <Beam position={[4.75,1.55,3.45]} size={[.08,3.1,.08]} color={safety}/><Beam position={[5.15,1.55,3.45]} size={[.08,3.1,.08]} color={safety}/>
  {Array.from({length:8},(_,i)=><Beam key={`stair-${i}`} position={[4.95, .35+i*.3,3.1-i*.18]} size={[.62,.07,.32]} color="#aab1a4"/>)}
  <EquipmentTag label={item.id} position={[0,1.65,4.38]}/>
 </Selectable>;
}
export function WastewaterPlant({item}:{item:SiteItem}){
 return <Selectable item={item}>
  <mesh position={[0,.07,0]} receiveShadow><boxGeometry args={[12,.14,9]}/><meshStandardMaterial color="#83877a"/></mesh>
  {/* Twin API gravity-separator channels: concrete raceways, baffles, oily water and travelling skimmer bridges */}
  {[-1.18,.82].map((z,lane)=><group key={`api-channel-${lane}`} position={[0,0,z]}>
    <Beam position={[0,.16,0]} size={[6.2,.24,1.72]} color="#69776e"/>
    <Beam position={[0,.82,-.79]} size={[6.2,1.2,.16]} color="#93988b"/><Beam position={[0,.82,.79]} size={[6.2,1.2,.16]} color="#93988b"/>
    <Beam position={[-3.02,.82,0]} size={[.16,1.2,1.72]} color="#93988b"/><Beam position={[3.02,.82,0]} size={[.16,1.2,1.72]} color="#93988b"/>
    <mesh position={[0,.91,0]}><boxGeometry args={[5.9,.05,1.48]}/><meshStandardMaterial color={lane?'#506e69':'#59766e'} metalness={.12} roughness={.34}/></mesh>
    {[-2.1,.65].map((x,i)=><Beam key={i} position={[x,.9,0]} size={[.1,1.05,1.45]} color="#777f75"/>)}
    <Beam position={[lane===0?-1.25:1.5,1.5,0]} size={[.18,.15,2.1]} color="#bd8354"/>
    {[-.84,.84].map(side=><Beam key={side} position={[lane===0?-1.25:1.5,1.42,side]} size={[.065,.65,.065]} color={safety}/>)}
  </group>)}
  {/* Filter building, dosing skids, pipe headers and access rails */}
  <Beam position={[0,1.4,3.2]} size={[4.8,2.8,2.5]} color="#78877d"/><Beam position={[0,2.9,3.2]} size={[5,.2,2.7]} color="#b09c6e"/>
  {[-1.35,0,1.35].map((x,i)=><group key={`filter-${i}`} position={[x,0,3.15]}><mesh position={[0,1.45,0]} castShadow><cylinderGeometry args={[.45,.55,2.25,16]}/><meshStandardMaterial color="#b1b9ad" metalness={.35}/></mesh><mesh position={[0,2.6,0]}><cylinderGeometry args={[.18,.4,.32,14]}/><meshStandardMaterial color="#859288"/></mesh></group>)}
  {[-2.3,0,2.3].map((x,i)=><group key={`pump-${i}`} position={[x,.15,-3.15]}><Beam position={[0,.35,0]} size={[.85,.55,.7]} color="#52675c"/><mesh position={[0,.38,.42]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.22,.07,8,14]}/><meshStandardMaterial color="#b47d4d" metalness={.5}/></mesh></group>)}
  {[-3.8,-2.2,2.2,3.8].map(x=><Beam key={x} position={[x,1.65,-1.4]} size={[.07,2.4,.07]} color={safety}/>)}
  <Beam position={[0,2.8,-1.4]} size={[7.7,.07,.07]} color={safety}/>
  <Run a={[-4,1.9,-3.5]} b={[4,1.9,-3.5]} color="#72999a" r={.09}/><Run a={[3.2,.8,-3.5]} b={[3.2,.8,1.2]} color="#b38152" r={.09}/>
  <EquipmentTag label={item.id} position={[0,1.55,4.62]}/>
 </Selectable>;
}
