import * as THREE from 'three';

const metal = '#65766d';
const rail = '#d6c18d';
const pipePalette = ['#b28a51', '#75999b', '#b96e54', '#7b8d74'];

function Beam({position, size, color = metal, rotation}: {position:[number,number,number];size:[number,number,number];color?:string;rotation?:[number,number,number]}) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={.45} roughness={.58}/></mesh>;
}
function PipeRun({a,b,color,r=.095}:{a:[number,number,number];b:[number,number,number];color:string;r?:number}) {
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), direction=end.clone().sub(start);
  return <mesh position={start.clone().add(end).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize())} castShadow><cylinderGeometry args={[r,r,direction.length(),10]}/><meshStandardMaterial color={color} metalness={.5} roughness={.36}/></mesh>;
}
function ProcessSteelwork(){
 const levels=[1.8,3.8,6.1];
 const columns=useMemoColumns();
 return <group position={[-10,0,-7]}>
  {/* Dense open process frame with three accessible decks. */}
  {columns.map(([x,z],i)=><group key={`column-${i}`}><Beam position={[x,3.3,z]} size={[.22,6.6,.22]} color={i%3?'#586b62':'#6a7a70'}/><Beam position={[x,2.1,z]} size={[.34,.09,.34]} color="#b59a66"/></group>)}
  {/* Cross-braced structural bays, visible under the decks */}
  {[-4.6,4.6].flatMap(z=>[-6.5,-3.3,0,3.3].flatMap((x,bay)=>[[.25,1.7],[1.95,3.7],[4,5.8]].flatMap(([lo,hi],tier)=>[
    <PipeRun key={`xbrace-a-${z}-${bay}-${tier}`} a={[x,lo,z]} b={[x+3.2,hi,z]} color="#687970" r={.07}/>,
    <PipeRun key={`xbrace-b-${z}-${bay}-${tier}`} a={[x,hi,z]} b={[x+3.2,lo,z]} color="#687970" r={.07}/>,
  ])))}
  {[-6.5,6.5].flatMap(x=>[-4.6,0].flatMap((z,bay)=>[[.25,1.7],[1.95,3.7],[4,5.8]].flatMap(([lo,hi],tier)=>[
    <PipeRun key={`zbrace-a-${x}-${bay}-${tier}`} a={[x,lo,z]} b={[x,hi,z+4.6]} color="#687970" r={.07}/>,
    <PipeRun key={`zbrace-b-${x}-${bay}-${tier}`} a={[x,hi,z]} b={[x,lo,z+4.6]} color="#687970" r={.07}/>,
  ])))}
  {levels.map((y,level)=><group key={`deck-${level}`}>
    {/* Open steel grating: visible joists instead of a solid concrete-looking floor */}
    {Array.from({length:27},(_,i)=><Beam key={`grate-${i}`} position={[0,y+.055,-4.72+i*.36]} size={[13.7,.045,.035]} color="#34413b"/>)}
    {[-6,-3,0,3,6].map(x=><Beam key={`joist-${x}`} position={[x,y-.08,0]} size={[.11,.16,9.5]} color="#89958b"/>)}
    {[-6.9,6.9].map(x=><Beam key={`lx${x}`} position={[x,y+.58,-.05]} size={[.075,1.12,10.1]} color={rail}/>)}
    {[-4.9,4.9].map(z=><Beam key={`lz${z}`} position={[0,y+.58,z]} size={[14.1,1.12,.075]} color={rail}/>) }
    {Array.from({length:17},(_,i)=><Beam key={`balx-${i}`} position={[-6.5+i*.81,y+.58,-.05]} size={[.055,.78,.055]} color={rail}/>)}
    {Array.from({length:12},(_,i)=><Beam key={`balz-${i}`} position={[0,y+.58,-4.6+i*.84]} size={[.055,.78,.055]} color={rail}/>)}
    {[-6,-3,0,3,6].map(x=><Beam key={`cross-${x}`} position={[x,y+.13,0]} size={[.09,.12,9.6]} color="#91a098"/>)}
  </group>)}
  {/* Process drums, exchangers, pumps, and instrument clusters */}
  {[[-4.4,2.6,-1.9],[-.9,2.6,1.8],[3.2,2.6,-2.3]].map(([x,y,z],i)=><group key={`drum-${i}`} position={[x,y,z]}>
    <mesh castShadow rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.7,.7,2.7,18]}/><meshStandardMaterial color={i===1?'#9da89e':'#aab2a6'} metalness={.45} roughness={.42}/></mesh>
    {[-1.35,1.35].map(k=><mesh key={k} position={[0,0,k]}><cylinderGeometry args={[.7,.7,.09,18]}/><meshStandardMaterial color="#d0b36c" metalness={.55}/></mesh>)}
    <mesh position={[0,.82,0]}><cylinderGeometry args={[.1,.1,.42,10]}/><meshStandardMaterial color="#d6bc78"/></mesh>
    <Beam position={[0,-1.05,0]} size={[.13,1.1,.13]}/>
  </group>)}
  {[-4,0,4].map((x,i)=><group key={`exchanger-${i}`} position={[x,1.05,3.2]}>
    <Beam position={[0,0,0]} size={[2.5,.65,.8]} color="#7b8981"/>
    <mesh position={[0,.03,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.42,.42,2.4,16]}/><meshStandardMaterial color="#b6bdb2" metalness={.56}/></mesh>
    {[-.9,-.45,0,.45,.9].map(z=><Beam key={z} position={[0,.0,z]} size={[.04,.76,.045]} color="#d0b16a"/>)}
    {[-.8,.8].map(z=><Beam key={z} position={[0,-.48,z]} size={[.15,.55,.15]} color="#4f645a"/>)}
  </group>)}
  {[-5,0,5].map((x,i)=><group key={`pump-${i}`} position={[x,.75,-3.8]}>
    <Beam position={[0,.35,0]} size={[1.35,.7,.95]} color="#697c72"/>
    <mesh position={[0,.54,.62]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.36,.36,.25,14]}/><meshStandardMaterial color={pipePalette[i]} metalness={.62}/></mesh>
    <mesh position={[0,1.05,-.05]}><cylinderGeometry args={[.12,.12,.6,10]}/><meshStandardMaterial color="#d0b36c"/></mesh>
  </group>)}
  {/* Multi-level process lines, elbows, manifolds, and valve wheels. */}
  {[-1,0,1,2].map((level,i)=>{
    const y=2.15+level*.62, c=pipePalette[i];
    return <group key={`pipe-course-${i}`}>
      <PipeRun a={[-6,y,-2.4]} b={[6.2,y,-2.4]} color={c}/>
      <PipeRun a={[-6,y,2.3]} b={[6.2,y,2.3]} color={pipePalette[(i+1)%4]}/>
      <PipeRun a={[-4.5,y,-2.4]} b={[-4.5,y,2.3]} color={c}/>
      <PipeRun a={[2.8,y,-2.4]} b={[2.8,y,2.3]} color={c}/>
      <PipeRun a={[-4.5,y,2.3]} b={[-4.5,y+1.2,2.3]} color={c}/>
      <PipeRun a={[2.8,y,-2.4]} b={[2.8,y+1.1,-2.4]} color={c}/>
      {[-4.5,2.8].map((x,j)=><group key={`${x}-${j}`} position={[x,y,2.3]}>
        <mesh rotation={[0,0,Math.PI/2]}><torusGeometry args={[.19,.045,8,16]}/><meshStandardMaterial color="#d7bd77" metalness={.35}/></mesh>
        <Beam position={[0,.32,0]} size={[.08,.55,.08]} color="#d7bd77"/>
      </group>)}
    </group>;
  })}
  {/* Stair towers and safety cages. */}
  {[-6.3,6.3].map((x,i)=><group key={`stair-${i}`} position={[x,0,i===0?-3.3:3.3]}>
    {[0,1,2,3,4,5,6,7].map(n=><Beam key={n} position={[0,.65+n*.34,(i===0?1:-1)*n*.42]} size={[.75,.075,.13]} color="#a9b0a3"/>)}
    <Beam position={[-.4,1.85,0]} size={[.055,3.8,3.2]} color={rail}/><Beam position={[.4,1.85,0]} size={[.055,3.8,3.2]} color={rail}/>
    <Beam position={[0,3.75,0]} size={[1.1,.14,1.1]} color="#77847a"/>
  </group>)}
  {/* Local control panels and small status beacons. */}
  {[-3,0,3].map((x,i)=><group key={`panel-${i}`} position={[x,.9,4.1]}>
    <Beam position={[0,.65,0]} size={[.85,1.3,.18]} color="#485b53"/>
    <Beam position={[0,.85,.105]} size={[.55,.42,.035]} color={i===1?'#8bb49c':'#819f9b'}/>
    <mesh position={[0,1.5,0]}><sphereGeometry args={[.09,8,8]}/><meshBasicMaterial color={i===1?'#e8b85a':'#6eb687'}/></mesh>
  </group>)}
 </group>;
}
function useMemoColumns(){return [[-6.5,-4.6],[-3.3,-4.6],[0,-4.6],[3.3,-4.6],[6.5,-4.6],[-6.5,0],[-3.3,0],[3.3,0],[6.5,0],[-6.5,4.6],[-3.3,4.6],[0,4.6],[3.3,4.6],[6.5,4.6]] as [number,number][]}

export function ProcessRefinery(){return <ProcessSteelwork/>}
