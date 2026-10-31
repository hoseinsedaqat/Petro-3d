import * as THREE from 'three';

let weatheredSteel: THREE.CanvasTexture | undefined;

/** Locally generated, deterministic steel grain and light weathering; no remote assets. */
export function getWeatheredSteelMap(){
 if(weatheredSteel)return weatheredSteel;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
 const ctx=canvas.getContext('2d');
 if(!ctx)return undefined;
 ctx.fillStyle='#e8ece8';ctx.fillRect(0,0,canvas.width,canvas.height);
 // Subtle rolling/galvanized variation and fine mill texture.
 const image=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=image.data;
 let seed=918273;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const p=(y*canvas.width+x)*4,grain=(rand()-.5)*24,streak=Math.sin(x*.19+Math.sin(x*.037)*2)*3,seam=(y%128<2)?-14:0;
  pixels[p]=Math.max(0,Math.min(255,232+grain+streak+seam));
  pixels[p+1]=Math.max(0,Math.min(255,236+grain+streak+seam));
  pixels[p+2]=Math.max(0,Math.min(255,232+grain+streak+seam));
  pixels[p+3]=255;
 }
 ctx.putImageData(image,0,0);
 // Restrained rain streaks and rust bleed near weld seams, not a uniform toy finish.
 for(let i=0;i<34;i++){
  const x=rand()*canvas.width,y=rand()*canvas.height,length=12+rand()*115,width=.4+rand()*1.4;
  const rust=rand()>.55;const color=rust?'rgba(133,82,55,0.12)':'rgba(49,61,55,0.10)';
  const gradient=ctx.createLinearGradient(x,y,x,y+length);gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(.18,color);gradient.addColorStop(.78,color);gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(x,y,width,length);
 }
 ctx.strokeStyle='rgba(54,65,59,.14)';ctx.lineWidth=1;
 for(let y=128;y<canvas.height;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
 weatheredSteel=new THREE.CanvasTexture(canvas);weatheredSteel.colorSpace=THREE.SRGBColorSpace;weatheredSteel.wrapS=THREE.RepeatWrapping;weatheredSteel.wrapT=THREE.RepeatWrapping;weatheredSteel.anisotropy=4;weatheredSteel.needsUpdate=true;
 return weatheredSteel;
}
