import { useStore } from '../store';
import type { SiteItem } from '../data/site';
import { getWeatheredSteelMap } from './materials';

function FrameMember({position,size,rotation,color='#68776e'}:{position:[number,number,number];size:[number,number,number];rotation?:[number,number,number];color?:string}){return <mesh position={position} rotation={rotation} castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={.5} roughness={.55}/></mesh>}
export function SphereTank({item}:{item:SiteItem}){
 const selected=useStore(s=>s.selected);const select=useStore(s=>s.select);const fill=item.fill??60;
 return <group position={item.position} onClick={e=>{e.stopPropagation();select(item)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}>
  <mesh visible={false}><cylinderGeometry args={[2.8,2.8,9,12]}/><meshBasicMaterial transparent opacity={0}/></mesh>
  {selected?.id===item.id&&<mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.45,2.62,48]}/><meshBasicMaterial color="#e6bd77"/></mesh>}
  {/* Pressurized spherical vessel with reinforced lower skirt */}
  <mesh position={[0,3.35,0]} castShadow receiveShadow><sphereGeometry args={[2.05,36,26]}/><meshStandardMaterial color="#b8beb2" map={getWeatheredSteelMap()} metalness={.42} roughness={.62}/></mesh>
  <mesh position={[0,3.35,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.055,.045,8,48]}/><meshStandardMaterial color="#7d8980" metalness={.65}/></mesh>
  <mesh position={[0,5.31,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.1,.095,8,40]}/><meshStandardMaterial color="#8c9489" metalness={.38}/></mesh>
  {/* Braced legs and footings */}
  {[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;const x=Math.cos(a)*1.48,z=Math.sin(a)*1.48;return <group key={i}>
    <FrameMember position={[x,.88,z]} size={[.22,1.82,.22]} color="#747e73"/>
    <FrameMember position={[x*1.05,.18,z*1.05]} size={[.58,.22,.58]} color="#565f58"/>
    <FrameMember position={[x*.52,1.2,z*.52]} size={[1.55,.1,.1]} rotation={[0,-a,Math.PI/4]} color="#8d9486"/>
  </group>})}
  {/* Ring access deck, guard rails, and a stair/ladder tower */}
  <mesh position={[0,5.24,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.25,.09,6,48]}/><meshStandardMaterial color="#756f5b" metalness={.35}/></mesh>
  {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(i=>{const a=i*Math.PI/12;return <mesh key={i} position={[Math.cos(a)*2.26,5.65,Math.sin(a)*2.26]}><cylinderGeometry args={[.027,.027,.78,6]}/><meshStandardMaterial color="#dbc999"/></mesh>})}
  <mesh position={[0,6.03,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.25,.035,5,48]}/><meshStandardMaterial color="#dbc999"/></mesh>
  <FrameMember position={[2.13,3.1,.1]} size={[.1,5.2,.1]} color="#d6c18e"/>
  {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=><FrameMember key={`rung-${i}`} position={[2.13,1+i*.36,.1]} size={[.44,.045,.055]} color="#d6c18e"/>)}
  {/* Top nozzle, pressure valve, red LPG header and level indication */}
  <mesh position={[0,5.52,0]}><cylinderGeometry args={[.23,.3,.34,14]}/><meshStandardMaterial color="#89958a" metalness={.58}/></mesh>
  <mesh position={[0,5.87,0]}><cylinderGeometry args={[.09,.09,.4,12]}/><meshStandardMaterial color="#b95d49" metalness={.5}/></mesh>
  <mesh position={[-1.55,2.75,1.42]}><cylinderGeometry args={[.075,.075,1.3,8]}/><meshStandardMaterial color="#bf6e54" metalness={.5}/></mesh>
  <mesh position={[-1.55,2.7,1.5]}><boxGeometry args={[.17,.13,.15]}/><meshStandardMaterial color={fill>80?'#e1a454':'#75b58c'} emissive={fill>80?'#5b3212':'#173923'} emissiveIntensity={.7}/></mesh>
  <FrameMember position={[0,.055,0]} size={[.2,.11,.2]} color="#b95d49"/>
  <mesh position={[0,6.08,0]}><sphereGeometry args={[.09,10,10]}/><meshBasicMaterial color="#f0b65e"/></mesh>
 </group>
}
