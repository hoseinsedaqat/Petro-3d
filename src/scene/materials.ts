import * as THREE from 'three';

let weatheredSteel: THREE.CanvasTexture | undefined;
const yardSurfaceSources = new Map<string, THREE.CanvasTexture>();
const yardSurfaceVariants = new Map<string, THREE.Texture>();
let chainlinkSource: THREE.CanvasTexture | undefined;
const chainlinkVariants = new Map<string, THREE.Texture>();

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

type YardSurface = 'soil' | 'concrete' | 'asphalt';

/**
 * Small deterministic, locally generated yard materials. The concrete tile has
 * subtle 4 m saw-cut panels plus fine aggregate; soil and asphalt use restrained
 * mottling. Repeat counts are supplied in texture UV units so pads keep panel
 * sizes consistent at different world dimensions. No downloaded textures.
 */
export function getYardSurfaceMap(kind: YardSurface, repeatX = 1, repeatY = 1): THREE.Texture {
 const key = `${kind}:${repeatX.toFixed(3)}:${repeatY.toFixed(3)}`;
 const cached = yardSurfaceVariants.get(key);
 if (cached) return cached;

 let source = yardSurfaceSources.get(kind);
 if (!source) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is required for local yard materials');
  const image = context.createImageData(size, size);
  const pixels = image.data;
  let seed = kind === 'soil' ? 17317 : kind === 'concrete' ? 23041 : 41729;
  const random = () => {
   seed = (seed * 1664525 + 1013904223) >>> 0;
   return seed / 4294967296;
  };
  const base = kind === 'soil' ? [166, 174, 158] : kind === 'concrete' ? [207, 209, 202] : [72, 80, 75];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
   const index = (y * size + x) * 4;
   const noise = (random() - .5) * (kind === 'concrete' ? 12 : 20);
   const broad = Math.sin(x * .027 + Math.sin(y * .014) * 2.1) * 2.1
    + Math.cos(y * .022 + Math.sin(x * .018) * 1.7) * 2.3;
   let seam = 0;
   if (kind === 'concrete') {
    const edge = Math.min(x % 256, 256 - (x % 256), y % 256, 256 - (y % 256));
    if (edge < 1.35) seam = -20;
    else if (edge < 3.2) seam = -4;
   }
   for (let channel = 0; channel < 3; channel++) {
    pixels[index + channel] = Math.max(0, Math.min(255, base[channel] + noise + broad + seam));
   }
   pixels[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  // Very fine speckling reads as aggregate at normal camera distance, not grit.
  const fleckCount = kind === 'asphalt' ? 2100 : kind === 'soil' ? 1300 : 900;
  for (let i = 0; i < fleckCount; i++) {
   const x = random() * size, y = random() * size;
   const radius = kind === 'asphalt' ? .35 + random() * .75 : .25 + random() * .7;
   const alpha = kind === 'concrete' ? .045 + random() * .055 : .07 + random() * .09;
   context.fillStyle = random() > .48 ? `rgba(255,255,246,${alpha})` : `rgba(29,35,31,${alpha})`;
   context.beginPath();
   context.ellipse(x, y, radius, radius * (.6 + random() * .8), random() * Math.PI, 0, Math.PI * 2);
   context.fill();
  }
  source = new THREE.CanvasTexture(canvas);
  source.colorSpace = THREE.SRGBColorSpace;
  source.wrapS = THREE.RepeatWrapping;
  source.wrapT = THREE.RepeatWrapping;
  source.anisotropy = 4;
  source.needsUpdate = true;
  yardSurfaceSources.set(kind, source);
 }
 const texture = source.clone();
 texture.wrapS = THREE.RepeatWrapping;
 texture.wrapT = THREE.RepeatWrapping;
 texture.repeat.set(repeatX, repeatY);
 texture.anisotropy = 4;
 texture.needsUpdate = true;
 yardSurfaceVariants.set(key, texture);
 return texture;
}

/** Seamless transparent diamond-mesh tile for locally modelled perimeter fences. */
export function getChainlinkMap(lengthMeters: number, heightMeters = 1.82): THREE.Texture {
 const key = `${lengthMeters.toFixed(2)}:${heightMeters.toFixed(2)}`;
 const cached = chainlinkVariants.get(key);
 if (cached) return cached;
 if (!chainlinkSource) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is required for local chain-link material');
  context.clearRect(0, 0, 128, 128);
  context.strokeStyle = 'rgba(225,232,227,0.86)';
  context.lineWidth = 1.6;
  for (let offset = -128; offset <= 128; offset += 32) {
   context.beginPath();
   context.moveTo(offset, 0);
   context.lineTo(offset + 128, 128);
   context.moveTo(offset, 128);
   context.lineTo(offset + 128, 0);
   context.stroke();
  }
  chainlinkSource = new THREE.CanvasTexture(canvas);
  chainlinkSource.colorSpace = THREE.SRGBColorSpace;
  chainlinkSource.wrapS = THREE.RepeatWrapping;
  chainlinkSource.wrapT = THREE.RepeatWrapping;
  chainlinkSource.anisotropy = 4;
  chainlinkSource.needsUpdate = true;
 }
 const texture = chainlinkSource.clone();
 texture.wrapS = THREE.RepeatWrapping;
 texture.wrapT = THREE.RepeatWrapping;
 // Each seamless tile represents roughly 1.8 m of fence in both directions.
 texture.repeat.set(lengthMeters / 1.8, heightMeters / 1.8);
 texture.anisotropy = 4;
 texture.needsUpdate = true;
 chainlinkVariants.set(key, texture);
 return texture;
}
