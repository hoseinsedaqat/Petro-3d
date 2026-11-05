import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export type ScenePerformanceSample={
 fps:number;
 drawCalls:number;
 triangles:number;
 geometries:number;
 textures:number;
};

type Props={enabled:boolean;onSample:(sample:ScenePerformanceSample)=>void};

/** Optional, zero-cost-while-disabled renderer sampling for local browser profiling (?perf=1). */
export function ScenePerformanceProbe({enabled,onSample}:Props){
 const {gl}=useThree();
 const elapsed=useRef(0),frames=useRef(0);
 useFrame((_,delta)=>{
  if(!enabled)return;
  elapsed.current+=delta;
  frames.current+=1;
  if(elapsed.current<1)return;
  const info=gl.info;
  onSample({
   fps:Math.round(frames.current/elapsed.current),
   drawCalls:info.render.calls,
   triangles:info.render.triangles,
   geometries:info.memory.geometries,
   textures:info.memory.textures,
  });
  elapsed.current=0;
  frames.current=0;
 });
 return null;
}
