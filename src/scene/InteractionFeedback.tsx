import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SiteItem } from '../data/site';
import { categoryName, relatedAssetIds } from '../data/interactions';
import { processStageById } from '../data/process';
import { useStore } from '../store';

type Props={item:SiteItem;root:RefObject<THREE.Group|null>;anchor?:[number,number,number]};
const markerRadius:Record<string,number>={tank:3.3,'sphere-tank':3.5,ship:5.6,building:3.4,process:3.1,furnace:2.7,truck:2.8,forklift:2.1,worker:1.25,pipeline:1.2,'loading-bay':2.2};
const selectedOutlineColor=new THREE.Color('#e9c478'),relatedOutlineColor=new THREE.Color('#79b9b0'),hoverOutlineColor=new THREE.Color('#c8d6c8');

/** Hover name, ground marker and a world-space bounds outline shared by all selectable assets. */
export function InteractionFeedback({item,root,anchor=[0,0,0]}:Props){
 const selected=useStore(s=>s.selected),hovered=useStore(s=>s.hovered),lang=useStore(s=>s.lang),activeProcessStage=useStore(s=>s.activeProcessStage),reduceMotion=Boolean(useReducedMotion());
 const {scene,invalidate}=useThree();
 const bounds=useMemo(()=>new THREE.Box3(),[]),meshBounds=useMemo(()=>new THREE.Box3(),[]),boundsTimer=useRef(0);
 const isSelected=selected?.id===item.id;
 const isRelated=Boolean(selected&&relatedAssetIds[selected.id]?.includes(item.id));
 const isProcessRelated=Boolean(activeProcessStage&&processStageById.get(activeProcessStage)?.assetIds.includes(item.id));
 const isHovered=hovered?.id===item.id;
 const related=isRelated||isProcessRelated;
 const active=isSelected||related||isHovered;
 const helper=useMemo(()=>{
  const box=new THREE.Box3();const outline=new THREE.Box3Helper(box,new THREE.Color('#e7bd73'));
  outline.name=`interaction-outline-${item.id}`;outline.visible=false;
  const material=outline.material as THREE.LineBasicMaterial;material.depthTest=false;material.transparent=true;material.opacity=0;material.toneMapped=false;
  return outline;
 },[item.id]);
 useEffect(()=>{scene.add(helper);return()=>{scene.remove(helper);helper.geometry.dispose();(helper.material as THREE.Material).dispose()}},[helper,scene]);
 useFrame((_,delta)=>{
  const material=helper.material as THREE.LineBasicMaterial;
  // The flare already has a physical circular footing; suppress selection bounds there so no gold overlay can tint its base.
  const blend=reduceMotion?1:1-Math.exp(-13*delta),targetOpacity=item.kind==='flare'?0:isSelected?.78:related?.52:isHovered?.36:0;
  material.opacity+=(targetOpacity-material.opacity)*blend;
  material.color.lerp(isSelected?selectedOutlineColor:related?relatedOutlineColor:hoverOutlineColor,blend);
  if(!reduceMotion&&Math.abs(targetOpacity-material.opacity)>.01)invalidate();
  if(!active&&material.opacity<.015){helper.visible=false;boundsTimer.current=0;return}
  if(!root.current){helper.visible=false;return}
  // Selection bounds only need to follow moving assets at 12 Hz; reuse scratch boxes to avoid per-frame allocations.
  boundsTimer.current+=delta;
  if(helper.visible&&boundsTimer.current<1/12)return;
  boundsTimer.current=0;
  root.current.updateWorldMatrix(true,true);
  bounds.makeEmpty();
  root.current.traverse((object)=>{
   const mesh=object as THREE.Mesh & {instance?:{current?:THREE.InstancedMesh};instanceKey?:unknown};
   const isInstance=Boolean(mesh.instance?.current&&mesh.instanceKey);
   if((!mesh.isMesh&&!isInstance)||!mesh.visible||mesh.userData.interactionDecoration||!mesh.geometry)return;
   const sourceMaterial=isInstance?mesh.instance!.current!.material:mesh.material;
   const materials=Array.isArray(sourceMaterial)?sourceMaterial:[sourceMaterial];
   if(materials.length&&materials.every(material=>material.transparent&&material.opacity<.05))return;
   if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
   if(mesh.geometry.boundingBox){meshBounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);bounds.union(meshBounds)}
  });
  if(bounds.isEmpty()){helper.visible=false;return}
  helper.box.copy(bounds);helper.visible=true;helper.updateMatrixWorld(true);
 });
 const radius=markerRadius[item.kind]??2.4;
 const top=item.kind==='ship'?8:item.kind==='tank'||item.kind==='sphere-tank'?6:item.kind==='worker'?2.8:item.kind==='pipeline'?3:item.kind==='loading-bay'?5:5.5;
 return <>
  {item.kind!=='flare'&&(active||isHovered)&&<mesh userData={{interactionDecoration:true}} position={[anchor[0],.075,anchor[2]]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[radius*.92,radius,48]}/><meshBasicMaterial color={isSelected?'#e7bd73':related?'#72b4aa':'#c4d0c7'} transparent opacity={isSelected?.78:related?.48:.3} depthWrite={false} toneMapped={false}/>
  </mesh>}
  {isHovered&&<Html center position={[anchor[0],top,anchor[2]]} zIndexRange={[40,0]} style={{pointerEvents:'none',whiteSpace:'nowrap'}}>
   <div className="scene-object-tooltip" lang={lang} dir={lang==='fa'?'rtl':'ltr'}><b>{lang==='fa'?item.fa:item.en}</b><small>{item.id} · {categoryName(item,lang==='fa')}</small></div>
  </Html>}
 </>;
}
