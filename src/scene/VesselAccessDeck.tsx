import * as THREE from 'three';

/** Annular vessel platform with a clear, grated bridge to its fixed access ladder. */
export function VesselAccessDeck({radius,level,color}:{radius:number;level:number;color:string}){
 const outerRadius=radius+.48;
 // A fixed-width opening matches the ladder landing; clamp for the smallest vessels.
 const openingHalfAngle=Math.asin(Math.min(.45/outerRadius,.48));
 const railArc=Math.PI*2-openingHalfAngle*2;
 const railHeight=level+1.18;
 const hingeX=outerRadius*Math.cos(openingHalfAngle);
 const hingeZ=-outerRadius*Math.sin(openingHalfAngle);
 return <group>
  <mesh position={[0,level+.28,0]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[radius+.12,outerRadius,48,1,openingHalfAngle,railArc]}/>
   <meshStandardMaterial color="#303a36" side={THREE.DoubleSide}/>
  </mesh>
  <group rotation={[0,openingHalfAngle,0]}>
   <mesh position={[0,railHeight,0]} rotation={[Math.PI/2,0,0]}>
    <torusGeometry args={[outerRadius,.035,6,48,railArc]}/>
    <meshStandardMaterial color={color}/>
   </mesh>
  </group>
  {Array.from({length:12},(_,i)=>{
   const angle=i*Math.PI/6;
   const distance=Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)));
   if(distance<openingHalfAngle+.12)return null;
   return <mesh key={`rail-post-${i}`} position={[Math.cos(angle)*outerRadius,level+.75,Math.sin(angle)*outerRadius]}>
    <cylinderGeometry args={[.025,.025,.86,6]}/><meshStandardMaterial color={color}/>
   </mesh>;
  })}
  {/* Rail end-posts define a ladder-width opening, and the gate is depicted swung clear. */}
  {[-1,1].map(side=><mesh key={`opening-post-${side}`} position={[hingeX,level+.75,-side*hingeZ]}>
   <cylinderGeometry args={[.028,.028,.86,6]}/><meshStandardMaterial color={color}/>
  </mesh>)}
  <group>
   <mesh position={[hingeX+.29,railHeight,hingeZ]}><boxGeometry args={[.58,.06,.055]}/><meshStandardMaterial color={color}/></mesh>
   <mesh position={[hingeX+.29,level+.75,hingeZ]}><boxGeometry args={[.58,.055,.05]}/><meshStandardMaterial color={color}/></mesh>
   <mesh position={[hingeX+.58,level+.96,hingeZ]}><boxGeometry args={[.055,.42,.055]}/><meshStandardMaterial color={color}/></mesh>
  </group>
  {/* The landing overlaps the ring deck and reaches the ladder, keeping the transfer step-free. */}
  <mesh position={[radius+.95,level+.27,0]} castShadow receiveShadow>
   <boxGeometry args={[1.15,.07,1.02]}/><meshStandardMaterial color="#303a36" side={THREE.DoubleSide}/>
  </mesh>
  {Array.from({length:8},(_,i)=><mesh key={`landing-grate-${i}`} position={[radius+.95,level+.315,-.43+i*.123]}>
   <boxGeometry args={[1.05,.025,.025]}/><meshStandardMaterial color="#a3aea5"/>
  </mesh>)}
  {[-.4,.4].map(side=><mesh key={`landing-brace-${side}`} position={[radius+.91,level-.075,side]} rotation={[0,0,-.43]}>
   <boxGeometry args={[1.08,.055,.055]}/><meshStandardMaterial color="#78867c" metalness={.42} roughness={.58}/>
  </mesh>)}
 </group>;
}
