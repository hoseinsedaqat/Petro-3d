import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { SiteItem } from '../data/site';
import { useStore } from '../store';
import { getWeatheredSteelMap, getYardSurfaceMap } from './materials';
import { VesselAccessDeck } from './VesselAccessDeck';
import { InteractionFeedback } from './InteractionFeedback';

const steel='#65766d', paleSteel='#aeb8ae', safety='#d5bd83', pipe='#a97e49';

/** Lightweight local particles for illustrative steam/smoke; no external assets or services. */
export function SimulatedPlume({color='#d5dcd6',count=14,rise=3.2,spread=.42,size=.22,position}:{color?:string;count?:number;rise?:number;spread?:number;size?:number;position?:[number,number,number]}){
 const playing=useStore(s=>s.playing),speed=useStore(s=>s.speed),quality=useStore(s=>s.quality),resetKey=useStore(s=>s.resetKey),elapsed=useRef(0),lastReset=useRef(resetKey);
 const particleCount=quality==='low'?Math.max(3,Math.ceil(count*.42)):quality==='high'?Math.ceil(count*1.35):count;
 const plume=useMemo(()=>{
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(particleCount*3),3));geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,rise/2,0),Math.hypot(rise/2,spread*1.25)+size);
  const material=new THREE.PointsMaterial({color,size,transparent:true,opacity:.34,depthWrite:false,sizeAttenuation:true});
  return {geometry,material,phases:Array.from({length:particleCount},(_,i)=>((i*.61803398875)%1)*.92)};
 },[color,particleCount,rise,size,spread]);
 useEffect(()=>()=>{plume.geometry.dispose();plume.material.dispose()},[plume]);
 useFrame((_,delta)=>{
  if(resetKey!==lastReset.current){elapsed.current=0;lastReset.current=resetKey;}
  if(!playing)return;
  elapsed.current+=delta*speed;
  const positions=plume.geometry.getAttribute('position') as THREE.BufferAttribute;
  for(let i=0;i<particleCount;i++){
   const phase=(plume.phases[i]+elapsed.current*.29)%1,angle=i*2.399+elapsed.current*.24;
   positions.setXYZ(i,Math.cos(angle)*spread*(.2+phase),phase*rise,Math.sin(angle)*spread*(.2+phase));
  }
  positions.needsUpdate=true;
 });
 return <points position={position} geometry={plume.geometry} material={plume.material}/>;
}
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
 const root=useRef<THREE.Group>(null),select=useStore(s=>s.select),hovered=useStore(s=>s.hovered),setHovered=useStore(s=>s.setHovered);
 return <group ref={root} position={item.position} onClick={e=>{e.stopPropagation();select(item)}} onPointerOver={e=>{e.stopPropagation();setHovered(item);document.body.style.cursor='pointer'}} onPointerOut={()=>{if(hovered?.id===item.id)setHovered(null);document.body.style.cursor='auto'}}>
  {children}<InteractionFeedback item={item} root={root}/>
 </group>;
}
export function EquipmentTag({label,position}:{label:string;position:[number,number,number]}){
 const map=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const c=canvas.getContext('2d');if(!c)return undefined;c.fillStyle='#293832';c.fillRect(0,0,512,160);c.fillStyle='#caa65f';c.fillRect(0,0,22,160);c.strokeStyle='#bba775';c.lineWidth=8;c.strokeRect(10,10,492,140);c.fillStyle='#e8e6d8';c.font='bold 72px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(label,270,82);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;},[label]);
 useEffect(()=>()=>map?.dispose(),[map]);
 return <group position={position}><Beam position={[-.65,-.48,0]} size={[.06,.9,.06]} color="#46574e"/><Beam position={[.65,-.48,0]} size={[.06,.9,.06]} color="#46574e"/><mesh><boxGeometry args={[1.8,.62,.12]}/><meshStandardMaterial color="#fff" map={map} metalness={.22} roughness={.48}/></mesh></group>;
}
function Vessel({x,z,r,h,color=paleSteel,band=true}:{x:number;z:number;r:number;h:number;color?:string;band?:boolean}){
 const accessLevels=[h*.48,h*.84];
 const ladderTop=h*.84+.9,ladderHeight=ladderTop-.1,ladderCenter=(ladderTop+.1)/2;
 const ladderRungCount=Math.floor((ladderTop-.62)/.42)+1;
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
  {/* Two accessible ring decks with ladder-aligned openings, grated transfer landings and gates swung clear. */}
  {accessLevels.map((level,k)=><VesselAccessDeck key={`vessel-deck-${k}`} radius={r} level={level} color={safety}/>)}
  {/* Fixed ladder is offset outside the vessel shell and lands on the grated bridges at both access decks. */}
  <mesh position={[r+.82,ladderCenter,0]}><boxGeometry args={[.055,ladderHeight,.055]}/><meshStandardMaterial color={safety}/></mesh>
  <mesh position={[r+1.14,ladderCenter,0]}><boxGeometry args={[.055,ladderHeight,.055]}/><meshStandardMaterial color={safety}/></mesh>
  {Array.from({length:ladderRungCount},(_,i)=><mesh key={`rung-${i}`} position={[r+.98,.62+i*.42,0]}><boxGeometry args={[.39,.045,.055]}/><meshStandardMaterial color={safety}/></mesh>)}
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
function PlatformLevels({levels,halfX=4.8,halfZ=3.6,ladderAccess=false}:{levels:number[];halfX?:number;halfZ?:number;ladderAccess?:boolean}){
 const ladderZ=2.2,opening=.9,gapStart=ladderZ-opening/2,gapEnd=ladderZ+opening/2;
 return <>{levels.map(y=><group key={y}>
  {Array.from({length:Math.floor(halfZ*5)},(_,n)=><Beam key={`grating-${n}`} position={[0,y+.035,-halfZ+.18+n*.36]} size={[halfX*2-.2,.04,.035]} color="#303b36"/>)}
  {[-halfX,0,halfX].map(x=><Beam key={`joist-${x}`} position={[x,y-.065,0]} size={[.12,.14,halfZ*2]} color="#87938a"/>)}
  <Beam position={[-halfX,y+.55,0]} size={[.06,.95,halfZ*2]} color={safety}/>
  {ladderAccess?<>
   <Beam position={[halfX,y+.55,(-halfZ+gapStart)/2]} size={[.06,.95,gapStart+halfZ]} color={safety}/>
   <Beam position={[halfX,y+.55,(gapEnd+halfZ)/2]} size={[.06,.95,halfZ-gapEnd]} color={safety}/>
  </>:<Beam position={[halfX,y+.55,0]} size={[.06,.95,halfZ*2]} color={safety}/>}
  {[-halfZ,halfZ].map(z=><Beam key={`railz-${z}`} position={[0,y+.55,z]} size={[halfX*2,.95,.06]} color={safety}/>)}
  {Array.from({length:Math.floor(halfX*2)},(_,n)=><Beam key={`bal-${n}`} position={[-halfX+.5+n,y+.5,halfZ]} size={[.045,.68,.045]} color={safety}/>)}
  {ladderAccess&&<group>
   {/* Short grated landings tie the fixed unit ladders into each deck; the hinged gate is shown swung clear of the ladder path. */}
   <Beam position={[halfX,y+.5,gapEnd]} size={[.06,.9,.06]} color={safety}/>
   <Beam position={[halfX+.3,y+.045,ladderZ]} size={[.9,.05,.9]} color="#303b36"/>
   {Array.from({length:7},(_,i)=><Beam key={`ladder-landing-grate-${i}`} position={[halfX+.3,y+.08,ladderZ-.36+i*.12]} size={[.82,.025,.025]} color="#a3aea5"/>)}
   <Beam position={[halfX+.75,y+.55,ladderZ]} size={[.06,.95,1.05]} color={safety}/>
   {[-.5,.5].map(offset=><Beam key={`landing-post-${offset}`} position={[halfX+.75,y+.5,ladderZ+offset]} size={[.06,.9,.06]} color={safety}/>)}
   {[-.45,.45].map(offset=><Beam key={`landing-side-top-${offset}`} position={[halfX+.3,y+.55,ladderZ+offset]} size={[.9,.07,.06]} color={safety}/>)}
   {/* Self-closing gate is open in the illustration so the ladder-to-platform route stays visible. */}
   <group position={[halfX,y,ladderZ-opening/2]} rotation={[0,-Math.PI/2,0]}>
    <Beam position={[0,.5,0]} size={[.06,.9,.06]} color={safety}/>
    <Beam position={[0,.5,opening]} size={[.06,.9,.06]} color={safety}/>
    <Beam position={[0,.92,opening/2]} size={[.06,.07,opening]} color={safety}/>
    <Beam position={[0,.52,opening/2]} size={[.05,.055,opening]} color={safety}/>
    <Beam position={[0,.1,opening/2]} size={[.06,.18,opening]} color="#b8a46e"/>
   </group>
  </group>}
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
 const night=useStore(s=>s.night);
 const fcc=item.id==='FCC-01';
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[12,.12,9]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',12/9,9/9)} color={night?'#4b554f':'#c0c1b5'} roughness={.94}/></mesh>
  {[-5,5].map(x=>[-3.55,3.55].map(z=><group key={`${x}-${z}`}><Beam position={[x,3.8,z]} size={[.2,7.6,.2]}/><Beam position={[x,1.4,z]} size={[.36,.14,.36]} color="#a18d64"/></group>))}
  <PlatformLevels levels={fcc?[2.7,5.5,8.2]:[2.5,5,7.5]} halfX={4.8} halfZ={3.45} ladderAccess/>
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
  {/* Fixed access ladder is clear of the corner support and aligned with the three grated deck landings. */}
  <Beam position={[4.85,4.4,2.2]} size={[.1,7.8,.1]} color={safety}/><Beam position={[5.35,4.4,2.2]} size={[.1,7.8,.1]} color={safety}/>
  {Array.from({length:18},(_,i)=><Beam key={`rung-${i}`} position={[5.1,.8+i*.42,2.2]} size={[.52,.045,.055]} color={safety}/>)}
  {[-4.8,4.8].map(x=><Beam key={x} position={[x,3.8,3.25]} size={[.11,7.1,.11]} rotation={[0,0,x<0?-.42:.42]} color="#819087"/>)}
  {item.id==='HDS-01'&&<group>
   <Run a={[4.75,5.3,.2]} b={[5.6,5.3,.2]} color="#9eb5b2" r={.12}/>
   <mesh position={[5.5,5.3,.2]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.2,.04,6,18]}/><meshStandardMaterial color="#d0bd88" metalness={.54}/></mesh>
  </group>}
  <EquipmentTag label={item.id} position={[0,1.55,4.62]}/>
 </Selectable>;
}
export function HydrogenPlant({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 const adsorberZ=[-2.05,-.68,.68,2.05];
 return <Selectable item={item}>
  <mesh position={[0,.08,0]} receiveShadow><boxGeometry args={[16,.16,11.6]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',16/9,11.6/9)} color={night?'#4b554f':'#c1c2b7'} roughness={.95}/></mesh>
  <mesh position={[0,.18,0]}><boxGeometry args={[15.72,.08,11.32]}/><meshStandardMaterial color="#4d5952" roughness={.82}/></mesh>
  {/* Feed desulfurization: two guard vessels with a shared isolation manifold. */}
  <Vessel x={-6.05} z={-1.15} r={.47} h={2.9} color="#a7b1a6"/>
  <Vessel x={-6.05} z={1.05} r={.47} h={2.9} color="#b5bdb1"/>
  <Run a={[-6.05,3.55,-1.15]} b={[-4.95,3.55,-1.15]} color="#c28b50" r={.07}/>
  <Run a={[-6.05,3.55,1.05]} b={[-4.95,3.55,1.05]} color="#c28b50" r={.07}/>
  <Run a={[-4.95,3.55,-1.15]} b={[-4.95,3.55,1.05]} color="#c28b50" r={.075}/>
  <Run a={[-7.55,.85,-1.15]} b={[-6.52,.85,-1.15]} color="#c28b50" r={.085}/>
  {/* Fired steam-methane reformer: radiant box, convection cassette, burner doors and stack. */}
  {[-4.92,-1.25].flatMap(x=>[-3.15,.58].map(z=><group key={`smr-frame-${x}-${z}`}>
   <Beam position={[x,4.1,z]} size={[.16,8.1,.16]} color="#65736b"/>
   <Beam position={[x,.34,z]} size={[.38,.18,.38]} color="#9a8967"/>
  </group>))}
  {[.7,4.95,7.2].map(y=><group key={`smr-level-${y}`}>
   <Beam position={[-3.08,y,-1.28]} size={[3.75,.14,.15]} color="#78867c"/>
   <Beam position={[-3.08,y,.48]} size={[3.75,.14,.15]} color="#78867c"/>
   {[-4.88,-1.28].map(x=><Beam key={x} position={[x,y,-.4]} size={[.14,.14,1.78]} color="#78867c"/>)}
  </group>)}
  <Beam position={[-3.08,3.03,-1.25]} size={[3.15,4.55,3.05]} color="#555e59"/>
  <Beam position={[-3.08,3.02,.31]} size={[2.85,4.24,.08]} color="#737b72"/>
  <Beam position={[-3.08,5.63,-1.28]} size={[3.45,1.25,3.4]} color="#78847a"/>
  <Beam position={[-3.08,6.35,-1.28]} size={[3.62,.18,3.56]} color="#a28f68"/>
  {/* Louvered refractory front and four low-level burner registers. */}
  {[-4.13,-3.43,-2.73,-2.03].map((x,i)=><group key={`smr-burner-${i}`}>
   <mesh position={[x,1.45,.39]}><cylinderGeometry args={[.2,.2,.12,12]}/><meshStandardMaterial color="#303934" metalness={.38}/></mesh>
   <mesh position={[x,1.45,.47]}><circleGeometry args={[.12,12]}/><meshBasicMaterial color={night?'#f18943':'#a34d2e'} toneMapped={false}/></mesh>
   <Beam position={[x,.99,.46]} size={[.48,.07,.12]} color="#c6b681"/>
  </group>)}
  {Array.from({length:7},(_,i)=><Beam key={`smr-louver-${i}`} position={[-3.08,2.05+i*.43,.365]} size={[2.72,.045,.035]} color="#a49d88"/>)}
  <mesh position={[-3.08,9.45,-1.25]} castShadow><cylinderGeometry args={[.36,.48,5.25,20]}/><meshStandardMaterial color="#66736b" metalness={.48} roughness={.62}/></mesh>
  {[7.1,8.85,10.6,11.96].map((y,i)=><mesh key={`smr-stack-band-${y}`} position={[-3.08,y,-1.25]}><torusGeometry args={[i===3?.36:.405,.04,6,22]}/><meshStandardMaterial color={i===3?'#b95843':'#a4a392'} metalness={.4}/></mesh>)}
  <mesh position={[-3.08,12.12,-1.25]}><cylinderGeometry args={[.46,.46,.12,20]}/><meshStandardMaterial color="#768279" metalness={.42}/></mesh>
  <Run a={[-1.5,6.5,-2.8]} b={[-1.5,7.8,-2.8]} color="#b9a272" r={.11}/>
  {/* Waste-heat recovery steam drum and two catalytic shift converters. */}
  <HorizontalVessel x={-.42} z={-3.65} y={2.55} length={2.65} r={.58}/>
  <Run a={[-1.72,3.2,-3.65]} b={[-1.72,4.35,-3.65]} color="#b88c56" r={.09}/>
  <Vessel x={.85} z={1.52} r={.72} h={5.25} color="#abb6aa"/>
  <Vessel x={2.7} z={1.52} r={.62} h={4.45} color="#9ca99e"/>
  <Run a={[-1.25,4.2,.65]} b={[.12,4.2,1.52]} color="#b76550" r={.12}/>
  <Run a={[1.58,4.55,1.52]} b={[2.08,4.2,1.52]} color="#b76550" r={.1}/>
  {/* Four PSA adsorber beds, shared feed/product headers, and upper valve actuators. */}
  {adsorberZ.map((z,i)=><group key={`h2-psa-${i}`}>
   <Vessel x={5.0} z={z} r={.48} h={4.35} color={i%2?'#a9b5aa':'#b9c1b5'}/>
   <Run a={[5,4.9,z]} b={[5,5.32,z]} color="#c7b782" r={.07}/>
   <mesh position={[5,5.42,z]}><cylinderGeometry args={[.18,.15,.18,12]}/><meshStandardMaterial color="#7a877d" metalness={.5}/></mesh>
   {i<adsorberZ.length-1&&<Run a={[5,5.18,z]} b={[5,5.18,adsorberZ[i+1]]} color="#9fa99c" r={.055}/>}
  </group>)}
  {/* Compact hydrogen compressor train on a separate skid, with driver, coupling guard and cooler. */}
  <Beam position={[2.75,.34,-3.5]} size={[3.9,.28,1.75]} color="#526159"/>
  <Beam position={[1.72,.87,-3.5]} size={[1.15,.95,1.18]} color="#61766b"/>
  <mesh position={[1.72,.91,-2.82]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.37,.37,1.12,18]}/><meshStandardMaterial color="#75857a" metalness={.58}/></mesh>
  <Beam position={[3.25,.8,-3.5]} size={[1.15,.82,1.02]} color="#79877e"/>
  <mesh position={[2.55,.92,-3.5]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.24,.07,8,16]}/><meshStandardMaterial color="#c7a96a" metalness={.58}/></mesh>
  <HorizontalVessel x={5.15} z={-3.55} y={1.22} length={2.3} r={.38}/>
  {/* Internal process paths: treated feed to reformer, shifted gas to PSA, then compressed H2. */}
  <Run a={[-6.05,.85,-1.15]} b={[-4.95,.85,-1.15]} color="#c18a4d" r={.075}/>
  <Run a={[-4.95,.85,-1.15]} b={[-4.4,1.55,-1.15]} color="#c18a4d" r={.075}/>
  <Run a={[-1.45,4.3,-1.1]} b={[.15,4.3,1.1]} color="#b45d48" r={.12}/>
  <Run a={[1.58,3.9,1.52]} b={[3.95,3.9,1.52]} color="#b45d48" r={.1}/>
  <Run a={[3.95,3.9,1.52]} b={[4.55,3.2,.7]} color="#9aa89d" r={.1}/>
  <Run a={[4.55,3.2,.7]} b={[4.55,2.4,-3.1]} color="#8ca19b" r={.09}/>
  <Run a={[4.55,2.4,-3.1]} b={[3.4,1.35,-2.7]} color="#8ca19b" r={.09}/>
  <Run a={[3.4,1.35,-2.7]} b={[6.65,1.35,-2.7]} color="#8ca19b" r={.09}/>
  <Run a={[6.65,1.35,-2.7]} b={[6.65,4.25,.4]} color="#9fb6b3" r={.1}/>
  <Run a={[6.65,4.25,.4]} b={[7.2,4.25,.8]} color="#9fb6b3" r={.1}/>
  {/* Elevated service walkway with a continuous guardrail, clear ladder landing and open-sided access. */}
  <Beam position={[.65,3.15,3.95]} size={[7.2,.13,.88]} color="#343e39"/>
  {[-2.15,-1.05,.05,1.15,2.25,3.35,4.0].map(x=><Beam key={`h2-walk-rail-post-${x}`} position={[x,3.68,4.28]} size={[.07,.96,.07]} color="#d1bd82"/>)}
  <Beam position={[.925,4.15,4.28]} size={[6.15,.07,.07]} color="#d1bd82"/>
  <Beam position={[.925,3.68,4.28]} size={[6.15,.055,.055]} color="#d1bd82"/>
  <Beam position={[.925,3.29,4.28]} size={[6.15,.14,.07]} color="#b0a27b"/>
  <Beam position={[4.0,3.68,3.55]} size={[.07,.96,.07]} color="#d1bd82"/>
  <Beam position={[4.0,4.15,3.915]} size={[.07,.07,.73]} color="#d1bd82"/>
  <Beam position={[4.0,3.68,3.915]} size={[.055,.055,.73]} color="#d1bd82"/>
  <Run a={[-2.55,.34,4.1]} b={[-2.55,3.1,4.1]} color="#cbb87f" r={.028}/>
  <Run a={[-2.95,.34,4.1]} b={[-2.95,3.1,4.1]} color="#cbb87f" r={.028}/>
  {Array.from({length:11},(_,i)=><Beam key={`h2-ladder-rung-${i}`} position={[-2.75,.5+i*.235,4.1]} size={[.44,.045,.055]} color="#cbb87f"/>)}
  <Beam position={[6.48,1.32,-4.5]} size={[.8,1.5,.9]} color="#64756b"/>
  <Beam position={[6.48,2.12,-4.5]} size={[.86,.08,.94]} color="#b6ad8b"/>
  <Beam position={[6.8,2.2,-4.02]} size={[.12,.1,.08]} color={night?'#e6c269':'#7d8b73'}/>
  <EquipmentTag label={item.id} position={[-6.4,2.55,4.55]}/>
 </Selectable>;
}

export function SourWaterStripper({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <Selectable item={item}>
  <mesh position={[0,.08,0]} receiveShadow><boxGeometry args={[6.8,.16,6]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',6.8/9,6/9)} color={night?'#4b554f':'#bdbeb2'} roughness={.95}/></mesh>
  <mesh position={[0,.18,0]}><boxGeometry args={[6.55,.08,5.76]}/><meshStandardMaterial color="#4c5952" roughness={.82}/></mesh>
  {/* Compact steam-reboiled sour-water stripper package; open steel keeps the process train inspectable. */}
  {[-3.02,3.02].flatMap(x=>[-2.55,2.55].map(z=><group key={`sws-frame-${x}-${z}`}>
   <Beam position={[x,2.18,z]} size={[.13,4.25,.13]} color="#68776d"/>
   <Beam position={[x,.32,z]} size={[.34,.16,.34]} color="#a08d66"/>
  </group>))}
  <Vessel x={.25} z={-.55} r={.58} h={6.9} color="#a9b4aa"/>
  {[3.25,5.35].map(y=><group key={`sws-column-deck-${y}`}>
   <mesh position={[.25,y,-.55]} rotation={[Math.PI/2,0,0]}><ringGeometry args={[.72,1.02,28]}/><meshStandardMaterial color="#47534d" metalness={.4} side={THREE.DoubleSide}/></mesh>
   <mesh position={[.25,y+.45,-.55]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.02,.022,6,28]}/><meshStandardMaterial color="#d0bd83" metalness={.42}/></mesh>
   {Array.from({length:12},(_,n)=>{const a=n*Math.PI/6;return <Beam key={n} position={[.25+Math.cos(a),y+.22,-.55+Math.sin(a)]} size={[.04,.42,.04]} color="#c6b57e"/>})}
  </group>)}
  {/* Feed flash drum, process reboiler, overhead condenser and reflux receiver. */}
  <HorizontalVessel x={-2.1} z={1.75} y={1.05} length={2.0} r={.38}/>
  <HorizontalVessel x={2.0} z={1.45} y={1.05} length={2.1} r={.42}/>
  <HorizontalVessel x={-1.95} z={-1.9} y={4.8} length={1.8} r={.32}/>
  <HorizontalVessel x={-2.3} z={-1.85} y={2.45} length={1.8} r={.32}/>
  <Run a={[-2.85,1.08,1.75]} b={[-1.1,1.08,1.75]} color="#9a8056" r={.08}/>
  <Run a={[-1.1,1.08,1.75]} b={[-.22,1.9,-.15]} color="#9a8056" r={.08}/>
  <Run a={[.25,1.32,-.55]} b={[.25,.72,-.55]} color="#aa8052" r={.075}/>
  <Run a={[.25,.72,-.55]} b={[1.55,.72,.2]} color="#aa8052" r={.075}/>
  <Run a={[1.55,.72,.2]} b={[2.0,1.05,1.45]} color="#aa8052" r={.075}/>
  <Run a={[.25,.35,-.55]} b={[.25,.18,-.55]} color="#6d9790" r={.075}/>
  {/* External steam inlet and trapped-condensate return make the reboiler service explicit. */}
  <Run a={[3.2,1.6,1.45]} b={[3.0,1.6,1.45]} color="#b78348" r={.07}/>
  <mesh position={[3.0,1.6,1.45]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.12,.022,6,14]}/><meshStandardMaterial color="#c5b47b" metalness={.48}/></mesh>
  <Run a={[3.0,.95,1.45]} b={[2.7,.65,2.4]} color="#6d9790" r={.055}/>
  <Beam position={[2.7,.32,2.4]} size={[.72,.16,.62]} color="#4b5b53"/>
  <Run a={[2.7,.4,2.4]} b={[2.7,.75,2.4]} color="#6d9790" r={.055}/>
  {/* Overhead gas is cooled, condensate returns as reflux, and non-condensables leave on a separate acid-gas header. */}
  <Run a={[.25,7.55,-.55]} b={[.25,5.55,-.55]} color="#b57857" r={.085}/>
  <Run a={[.25,5.55,-.55]} b={[-.85,5.35,-1.9]} color="#b57857" r={.085}/>
  <Run a={[-.85,5.35,-1.9]} b={[-1.95,4.8,-1.9]} color="#b57857" r={.085}/>
  <Run a={[-1.95,4.45,-1.9]} b={[-2.3,3.02,-1.85]} color="#718f8a" r={.065}/>
  <Run a={[-2.3,2.95,-1.85]} b={[-1.65,2.15,-.55]} color="#718f8a" r={.065}/>
  <Run a={[-2.3,3.02,-1.85]} b={[-2.85,3.28,-.5]} color="#b57857" r={.07}/>
  <Run a={[-2.85,3.28,-.5]} b={[-3,3.5,.5]} color="#b57857" r={.07}/>
  {/* Process pumps, condensate-return pump, local panel and ladder; the ladder stays outside the vessel envelope. */}
  {[-.8,.9].map((x,i)=><group key={`sws-pump-${i}`} position={[x,.2,2.5]}>
   <Beam position={[0,.34,0]} size={[.82,.54,.66]} color="#52675d"/>
   <mesh position={[0,.38,.38]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.2,.06,8,14]}/><meshStandardMaterial color={i?'#82968a':'#b78151'} metalness={.5}/></mesh>
   <Beam position={[0,.73,0]} size={[.1,.25,.12]} color="#d1bd83"/>
  </group>)}
  {[2.75,3.18].map(x=><Run key={`sws-ladder-rail-${x}`} a={[x,.34,.2]} b={[x,5.7,.2]} color="#c8b77f" r={.028}/>)}
  {Array.from({length:18},(_,i)=><Beam key={`sws-ladder-rung-${i}`} position={[2.965,.48+i*.29,.2]} size={[.43,.04,.05]} color="#c8b77f"/>)}
  <Beam position={[2.58,1.28,-2.05]} size={[.62,1.44,.14]} color="#5b6b61"/>
  <mesh position={[2.58,1.55,-1.96]}><sphereGeometry args={[.055,8,8]}/><meshStandardMaterial color={night?'#e6c269':'#849780'} emissive={night?'#7f5b1c':'#000000'} emissiveIntensity={night?.45:0}/></mesh>
  <EquipmentTag label={item.id} position={[0,1.45,3.18]}/>
 </Selectable>;
}
export function DesalterUnit({item}:{item:SiteItem}){
 const night=useStore(s=>s.night),ladderZ=1.07,accessWidth=.9,gapStart=ladderZ-accessWidth/2,gapEnd=ladderZ+accessWidth/2;
 return <Selectable item={item}>
  <mesh position={[0,.07,0]} receiveShadow><boxGeometry args={[11,.14,9.5]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',11/9,9.5/9)} color={night?'#4b554f':'#c0c1b6'} roughness={.95}/></mesh>
  {/* Access frame and open grating service deck */}
  {[-4.6,4.6].flatMap(x=>[-3.7,3.7].map(z=><group key={`${x}-${z}`}><Beam position={[x,2.15,z]} size={[.2,4.3,.2]}/><Beam position={[x,.16,z]} size={[.42,.2,.42]} color="#a18d64"/></group>))}
  {[-3.2,-2.9,-2.6].map((y,i)=><Run key={i} a={[-4.3,y,-3.2]} b={[4.3,y,-3.2]} color={['#9a8057','#658f90','#b66c51'][i]} r={.085}/>)}
  <Beam position={[0,4.05,0]} size={[9.2,.14,7.1]} color="#596b62"/>
  {Array.from({length:19},(_,i)=><Beam key={`grate-${i}`} position={[0,4.14,-3.35+i*.37]} size={[8.9,.04,.035]} color="#303a36"/>)}
  <Beam position={[-4.55,4.65,0]} size={[.06,1,7.1]} color={safety}/>
  {/* Open the east guardrail only at the stair landing; the gate is swung clear of the stair head. */}
  <Beam position={[4.55,4.65,(-3.55+gapStart)/2]} size={[.06,1,gapStart+3.55]} color={safety}/>
  <Beam position={[4.55,4.65,(gapEnd+3.55)/2]} size={[.06,1,3.55-gapEnd]} color={safety}/>
  <Beam position={[4.55,4.55,gapEnd]} size={[.06,.9,.06]} color={safety}/>
  {/* Grated stair-head landing, aligned to the last step and bounded on the exposed edges. */}
  <Beam position={[5.02,4.08,ladderZ]} size={[1.02,.06,.94]} color="#303b36"/>
  {Array.from({length:7},(_,i)=><Beam key={`stair-landing-grate-${i}`} position={[5.02,4.115,gapStart+.08+i*.12]} size={[.92,.025,.025]} color="#a3aea5"/>)}
  <Beam position={[5.5,4.62,ladderZ]} size={[.06,1,.94]} color={safety}/>
  {[gapStart,gapEnd].map(z=><Beam key={`landing-side-rail-${z}`} position={[5.02,4.62,z]} size={[.96,1,.06]} color={safety}/>)}
  {/* Self-closing gate is illustrated open so the stair can reach the service deck. */}
  <group position={[4.55,4.08,gapStart]} rotation={[0,-Math.PI/2,0]}>
   <Beam position={[0,.5,0]} size={[.06,.9,.06]} color={safety}/>
   <Beam position={[0,.5,accessWidth]} size={[.06,.9,.06]} color={safety}/>
   <Beam position={[0,.94,accessWidth/2]} size={[.06,.07,accessWidth]} color={safety}/>
   <Beam position={[0,.52,accessWidth/2]} size={[.05,.055,accessWidth]} color={safety}/>
   <Beam position={[0,.1,accessWidth/2]} size={[.06,.18,accessWidth]} color="#b8a46e"/>
  </group>
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
  {Array.from({length:13},(_,i)=><Beam key={`step-${i}`} position={[5.02,.25+i*.32,ladderZ+(12-i)*.19]} size={[.58,.07,.3]} color="#aab1a4"/>)}
  <EquipmentTag label={item.id} position={[0,1.55,4.82]}/>
 </Selectable>;
}
export function CrudeReceiving({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[5.6,.12,4.8]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',5.6/9,4.8/9)} color={night?'#4b554f':'#bcbdb1'} roughness={.95}/></mesh>
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
 const night=useStore(s=>s.night);
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[9,.12,7.4]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',9/9,7.4/9)} color={night?'#4b554f':'#b7b8ac'} roughness={.95}/></mesh>
  {/* Claus reaction furnace and refractory combustion chamber */}
  <Beam position={[-3.05,1.45,1.65]} size={[2.15,2.9,1.8]} color="#606960"/>
  <mesh position={[-3.05,1.5,2.58]}><planeGeometry args={[1.08,1.26]}/><meshBasicMaterial color="#f18a3d" transparent opacity={.65}/></mesh>
  {/* Sour-water acid-gas battery-limit tie-in to the thermal reactor; no atmospheric vent is modeled. */}
  <Run a={[-4.1,2.55,1.65]} b={[-3.82,2.55,1.65]} color="#b57857" r={.075}/>
  <mesh position={[-4.1,2.55,1.65]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.13,.025,6,16]}/><meshStandardMaterial color="#c4ad79" metalness={.5}/></mesh>
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
 const night=useStore(s=>s.night);
 return <Selectable item={item}>
  <mesh position={[0,.06,0]} receiveShadow><boxGeometry args={[12,.12,9]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',12/9,9/9)} color={night?'#4b554f':'#bdbeb2'} roughness={.95}/></mesh>
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
 const rotor=useRef<THREE.Group>(null),playing=useStore(s=>s.playing),speed=useStore(s=>s.speed),resetKey=useStore(s=>s.resetKey),lastReset=useRef(resetKey);
 useFrame((_,dt)=>{const reset=resetKey!==lastReset.current;if(reset){if(rotor.current)rotor.current.rotation.y=0;lastReset.current=resetKey;}if(!playing&&!reset)return;if(rotor.current&&playing)rotor.current.rotation.y+=dt*speed*(index%2?3.1:-2.7)});
 return <group position={position}>
  <mesh position={[0,.06,0]}><cylinderGeometry args={[1.05,1.05,.14,24]}/><meshStandardMaterial color="#4d6158" metalness={.45}/></mesh>
  <group ref={rotor} position={[0,.17,0]}>
    {[0,1,2,3,4,5].map(i=><mesh key={i} rotation={[0,i*Math.PI/3,0]} position={[Math.cos(i*Math.PI/3)*.42,.04,Math.sin(i*Math.PI/3)*.42]}><boxGeometry args={[.78,.08,.17]}/><meshStandardMaterial color="#b9c1b5" metalness={.38}/></mesh>)}
    <mesh position={[0,.05,0]}><sphereGeometry args={[.2,12,10]}/><meshStandardMaterial color="#d3bd80" metalness={.45}/></mesh>
  </group>
 </group>;
}
export function CoolingBattery({item}:{item:SiteItem}){
 const night=useStore(s=>s.night);
 return <Selectable item={item}>
  <mesh position={[0,.08,0]} receiveShadow><boxGeometry args={[11,.16,8.5]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',11/9,8.5/9)} color={night?'#4b554f':'#b9bbb0'} roughness={.95}/></mesh>
  {/* Elevated utility platform and open steel substructure, following modular refinery cooling-station references */}
  {[-4.4,0,4.4].map(x=>[-3,3].map(z=><group key={`${x}-${z}`}><Beam position={[x,1.35,z]} size={[.24,2.7,.24]}/><Beam position={[x,.16,z]} size={[.55,.22,.55]} color="#a39068"/></group>))}
  {[2.25,2.5].map((y,i)=><Beam key={y} position={[0,y,0]} size={[10,.16,7.2]} color={i?'#7b8880':'#68786e'}/>)}
  {[-3.5,0,3.5].map((x,i)=><group key={`cell-${i}`} position={[x,0,0]}>
    <Beam position={[0,3.9,0]} size={[3.15,2.75,5.2]} color={['#7d8c83','#849188','#72847a'][i]}/>
    <Beam position={[0,5.33,0]} size={[3.3,.18,5.35]} color="#9da99f"/>
    <mesh position={[0,5.47,0]}><cylinderGeometry args={[.92,.92,.16,24]}/><meshStandardMaterial color="#4b5d54" metalness={.35}/></mesh>
    <Fan position={[0,5.58,0]} index={i}/>
    <SimulatedPlume position={[0,6.22,0]} color="#d6ded8" count={11} rise={2.8} spread={.48} size={.2}/>
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
 const night=useStore(s=>s.night);
 return <Selectable item={item}>
  <mesh position={[0,.07,0]} receiveShadow><boxGeometry args={[12,.14,9]}/><meshStandardMaterial map={getYardSurfaceMap('concrete',12/9,9/9)} color={night?'#4b554f':'#bdbeb2'} roughness={.95}/></mesh>
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
  {/* Closed oily-water sewer inlet enters the first covered separation lane through its west headwall. */}
  <Run a={[-3.25,1.22,-1.18]} b={[-2.84,1.22,-1.18]} color="#625d52" r={.095}/>
  <mesh position={[-3.2,1.22,-1.18]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.17,.035,6,18]}/><meshStandardMaterial color="#b4a575" metalness={.48}/></mesh>
  {/* Filter building, dosing skids, pipe headers and access rails */}
  <Beam position={[0,1.4,3.2]} size={[4.8,2.8,2.5]} color="#78877d"/><Beam position={[0,2.9,3.2]} size={[5,.2,2.7]} color="#b09c6e"/>
  {[-1.35,0,1.35].map((x,i)=><group key={`filter-${i}`} position={[x,0,3.15]}><mesh position={[0,1.45,0]} castShadow><cylinderGeometry args={[.45,.55,2.25,16]}/><meshStandardMaterial color="#b1b9ad" metalness={.35}/></mesh><mesh position={[0,2.6,0]}><cylinderGeometry args={[.18,.4,.32,14]}/><meshStandardMaterial color="#859288"/></mesh></group>)}
  {[-2.3,0,2.3].map((x,i)=><group key={`pump-${i}`} position={[x,.15,-3.15]}><Beam position={[0,.35,0]} size={[.85,.55,.7]} color="#52675c"/><mesh position={[0,.38,.42]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.22,.07,8,14]}/><meshStandardMaterial color="#b47d4d" metalness={.5}/></mesh></group>)}
  {/* Illustrative treatment train around the existing oil-separation channels:
      equalization, aeration, secondary clarification, polishing and sludge handling. */}
  <group position={[-4.55,0,-2.55]}>
   <mesh position={[0,.12,0]}><cylinderGeometry args={[.79,.84,.24,24]}/><meshStandardMaterial color="#596a60" metalness={.4}/></mesh>
   <mesh position={[0,1.03,0]} castShadow><cylinderGeometry args={[.73,.77,1.62,24,1,true]}/><meshStandardMaterial color="#9ca99f" metalness={.42} roughness={.58} side={THREE.DoubleSide}/></mesh>
   <mesh position={[0,.58,0]}><cylinderGeometry args={[.72,.72,.04,24]}/><meshStandardMaterial color="#708c82" roughness={.35}/></mesh>
   <mesh position={[0,1.86,0]}><cylinderGeometry args={[.79,.79,.1,24]}/><meshStandardMaterial color="#747e73" metalness={.4}/></mesh>
   <mesh position={[0,1.93,0]}><cylinderGeometry args={[.28,.28,.08,16]}/><meshStandardMaterial color="#87968c" metalness={.4}/></mesh>
   <Run a={[0,.6,0]} b={[0,1.9,0]} color="#82958b" r={.07}/>
   <Beam position={[.77,1.0,0]} size={[.06,.9,.06]} color={safety}/><Beam position={[.78,1.35,0]} size={[.06,.06,.12]} color="#c8bd9a"/>
   <Beam position={[0,2.02,0]} size={[1.65,.06,.06]} color={safety}/>
  </group>
  {/* Stripped-water line enters equalization separately from the oily-water API-separator inlet. */}
  <Run a={[-5.45,.95,-2.55]} b={[-4.92,.95,-2.55]} color="#6d9790" r={.075}/>
  <mesh position={[-5.32,.95,-2.55]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.14,.025,6,16]}/><meshStandardMaterial color="#c2b381" metalness={.48}/></mesh>
  {/* Low aeration basin with visible diffuser grid and air header; not a rated process design. */}
  <group position={[4.5,0,0]}>
   <Beam position={[0,.16,0]} size={[2.3,.3,2.05]} color="#65766c"/>
   {[-1,1].flatMap(s=>[
    <Beam key={`bio-end-${s}`} position={[0,.63,s*.96]} size={[2.3,.98,.14]} color="#8c9588"/>,
   ])}
   {[-1,1].map(x=><Beam key={`bio-side-${x}`} position={[x*1.08,.63,0]} size={[.14,.98,1.8]} color="#8c9588"/>)}
   <mesh position={[0,.78,0]}><boxGeometry args={[2.05,.045,1.77]}/><meshStandardMaterial color="#63847d" roughness={.36} metalness={.12}/></mesh>
   {[-.58,0,.58].map(x=><Run key={`air-grid-${x}`} a={[x,.84,-.7]} b={[x,.84,.7]} color="#9ba99e" r={.035}/>)}
   {[-.55,0,.55].map(z=><Run key={`diffuser-${z}`} a={[-.82,.84,z]} b={[.82,.84,z]} color="#a4aea2" r={.03}/>)}
   {[-.55,0,.55].map(x=>[-.45,.35].map(z=><mesh key={`aeration-bubble-${x}-${z}`} position={[x,.91,z]}><sphereGeometry args={[.075,8,6]}/><meshStandardMaterial color="#b6d0c1" transparent opacity={.75}/></mesh>))}
   <Run a={[0,1.12,-.98]} b={[0,1.55,-1.38]} color="#a9b4a9" r={.07}/>
  </group>
  {/* Circular secondary clarifier with a center feedwell, bridge and launder rim. */}
  <group position={[4.5,0,2.75]}>
   <mesh position={[0,.12,0]}><cylinderGeometry args={[1.12,1.18,.24,32]}/><meshStandardMaterial color="#69776d"/></mesh>
   <mesh position={[0,.54,0]}><cylinderGeometry args={[1.08,1.15,.66,32,1,true]}/><meshStandardMaterial color="#92998d" side={THREE.DoubleSide}/></mesh>
   <mesh position={[0,.69,0]}><cylinderGeometry args={[.98,.98,.035,32]}/><meshStandardMaterial color="#729087" roughness={.34}/></mesh>
   <mesh position={[0,.89,0]}><torusGeometry args={[1.08,.075,8,32]}/><meshStandardMaterial color="#c4b58b" metalness={.34}/></mesh>
   <mesh position={[0,.86,0]}><cylinderGeometry args={[.24,.3,.56,16]}/><meshStandardMaterial color="#849187" metalness={.35}/></mesh>
   <Run a={[-1.03,1.04,0]} b={[1.03,1.04,0]} color="#c4b98f" r={.045}/>
   <Run a={[0,1.05,-.98]} b={[0,1.05,.98]} color="#9ba79a" r={.035}/>
   {[-.85,.85].map(x=><Beam key={`clarifier-rail-${x}`} position={[x,1.14,0]} size={[.045,.22,.045]} color={safety}/>)}
   <Beam position={[0,1.25,0]} size={[.05,.06,1.8]} color={safety}/>
  </group>
  {/* Sludge holding and compact dewatering press skid, kept within the existing pad. */}
  <group position={[-4.55,0,2.75]}>
   <mesh position={[0,.12,0]}><cylinderGeometry args={[.56,.61,.24,20]}/><meshStandardMaterial color="#596a60"/></mesh>
   <mesh position={[0,.93,0]} castShadow><cylinderGeometry args={[.5,.53,1.38,20,1,true]}/><meshStandardMaterial color="#a0aaa0" metalness={.4} side={THREE.DoubleSide}/></mesh>
   <mesh position={[0,1.63,0]}><cylinderGeometry args={[.57,.57,.11,20]}/><meshStandardMaterial color="#707c72" metalness={.4}/></mesh>
   <Run a={[0,.3,0]} b={[0,1.7,0]} color="#8c9b8f" r={.055}/>
  </group>
  <group position={[-4.5,0,.35]}>
   <Beam position={[0,.15,0]} size={[1.55,.22,1.32]} color="#555f59"/>
   {[-.48,-.27,-.06,.15,.36].map((x,i)=><group key={`press-plate-${i}`}>
    <Beam position={[x,.74,0]} size={[.09,1.0,.84]} color={i%2?'#78877e':'#a3ada2'}/>
    <Beam position={[x,.72,.48]} size={[.12,.12,.08]} color="#c4b68b"/>
   </group>)}
   <Beam position={[0,1.3,0]} size={[1.45,.1,.16]} color="#68766e"/>
   <Beam position={[0,1.42,-.52]} size={[.32,.22,.32]} color="#947c52"/>
  </group>
  {/* Color-coded demo headers indicate routing only; actual treatment trains vary by refinery. */}
  <Run a={[-3.15,.82,-1.18]} b={[-4.55,.82,-1.18]} color="#9a8056" r={.085}/>
  <Run a={[-4.55,.82,-1.18]} b={[-4.55,1.72,-1.82]} color="#9a8056" r={.085}/>
  <Run a={[-4.55,.72,-1.9]} b={[-4.55,.72,-4.02]} color="#8d7754" r={.085}/>
  <Run a={[-4.55,.72,-4.02]} b={[4.5,.72,-4.02]} color="#8d7754" r={.085}/>
  <Run a={[4.5,.72,-4.02]} b={[4.5,.72,-1.02]} color="#6d9790" r={.085}/>
  <Run a={[4.5,.72,1.02]} b={[4.5,.72,1.7]} color="#6d9790" r={.085}/>
  <Run a={[4.5,1.1,2.75]} b={[2.42,1.1,2.75]} color="#78a19c" r={.09}/>
  <Run a={[2.42,1.1,2.75]} b={[1.35,1.1,3.15]} color="#78a19c" r={.09}/>
  <Run a={[2.38,.74,3.9]} b={[5.75,.74,3.9]} color="#6d9a9a" r={.09}/>
  {/* Sludge-transfer routing follows the perimeter to avoid crossing the filter building. */}
  <Run a={[5.65,.43,2.75]} b={[5.65,.43,-4.05]} color="#877f67" r={.075}/>
  <Run a={[5.65,.43,-4.05]} b={[-5.5,.43,-4.05]} color="#877f67" r={.075}/>
  <Run a={[-5.5,.43,-4.05]} b={[-5.5,.43,.35]} color="#877f67" r={.075}/>
  <Run a={[-5.5,.43,.35]} b={[-4.5,.62,.35]} color="#877f67" r={.075}/>
  {[-3.8,-2.2,2.2,3.8].map(x=><Beam key={x} position={[x,1.65,-1.4]} size={[.07,2.4,.07]} color={safety}/>)}
  <Beam position={[0,2.8,-1.4]} size={[7.7,.07,.07]} color={safety}/>
  <Run a={[-4,1.9,-3.5]} b={[4,1.9,-3.5]} color="#72999a" r={.09}/><Run a={[3.2,.8,-3.5]} b={[3.2,.8,1.2]} color="#b38152" r={.09}/>
  <EquipmentTag label={item.id} position={[0,1.55,4.62]}/>
 </Selectable>;
}
