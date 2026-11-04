import { inspectableItems } from './interactions';
import type { SiteItem, SiteZoneId } from './site';

/**
 * Ordered, illustrative refinery workflow. Asset links and routes are a teaching view,
 * not a process design, P&ID, operating procedure, or engineering measurement.
 */
export type ProcessStage = {
 id:string;
 fa:string;
 en:string;
 descriptionFa:string;
 descriptionEn:string;
 startFa:string;
 startEn:string;
 endFa:string;
 endEn:string;
 position:[number,number,number];
 startPoint:[number,number,number];
 endPoints:[number,number,number][];
 zone:SiteZoneId;
 assetIds:string[];
 routeIds:number[];
};

const tankIds=inspectableItems.filter(item=>item.kind==='tank'||item.kind==='sphere-tank').map(item=>item.id);

export const processStages:ProcessStage[]=[
 {
  id:'crude-receiving',fa:'دریافت نفت خام',en:'Crude oil receiving',
  descriptionFa:'ورود خوراک خام به محوطه و انتقال مفهومی آن به مرحله نمک‌زدایی. مسیر و وضعیت‌ها کاملاً شبیه‌سازی‌شده‌اند.',
  descriptionEn:'Crude feed enters the site and is illustratively routed toward desalting. Routes and states are simulated.',
  startFa:'ورودی خوراک خام',startEn:'Crude feed inlet',endFa:'هدر ورودی نمک‌زدایی',endEn:'Desalter feed header',
  position:[-31,0,-7],startPoint:[-31,1.7,-7],endPoints:[[-23,1.55,-3]],zone:'refinery',assetIds:['CRUDE-01'],routeIds:[0],
 },
 {
  id:'desalting',fa:'نمک‌زدایی',en:'Desalting',
  descriptionFa:'نمک‌زدایی الکترواستاتیک و جداسازی آب و نمک از خوراک پیش از تقطیر؛ تمام تجهیزات و اتصالات نمایشی‌اند.',
  descriptionEn:'Illustrative electrostatic desalting removes water and salts before distillation; equipment and links are demo-only.',
  startFa:'خوراک خام از دریافت',startEn:'Crude feed from receiving',endFa:'خوراک نمک‌زدایی‌شده به برج اتمسفریک',endEn:'Desalted feed to atmospheric distillation',
  position:[-23,0,-3],startPoint:[-23,1.55,-3],endPoints:[[-12,1.8,-9]],zone:'refinery',assetIds:['DS-101','CRUDE-01','CDU-01'],routeIds:[0,1],
 },
 {
  id:'atmospheric-distillation',fa:'تقطیر اتمسفریک',en:'Atmospheric distillation',
  descriptionFa:'تفکیک خوراک در برج اتمسفریک به برش‌های مفهومی؛ کندانسور بالاسری، درام رفلاکس و پمپ‌ها در نما پیوند خورده‌اند.',
  descriptionEn:'Illustrative atmospheric fractionation, linked in this view to the overhead condenser, reflux drum and pumps.',
  startFa:'خوراک نمک‌زدایی‌شده',startEn:'Desalted crude feed',endFa:'برش‌های تقطیر برای تبدیل و ذخیره',endEn:'Fractions routed to conversion and storage',
  position:[-12,0,-9],startPoint:[-12,1.8,-9],endPoints:[[2,2,-14],[2.5,1.8,.5]],zone:'refinery',assetIds:['CDU-01','F-102','E-101','V-102','P-102A','V-201'],routeIds:[0,2,10,11],
 },
 {
  id:'conversion',fa:'تبدیل برش‌ها',en:'Conversion',
  descriptionFa:'نمای مفهومی تبدیل برش‌های سنگین در واحدهای پالایشی؛ مسیرهای فرایندی، ظرفیت و عملکرد واقعی نیستند.',
  descriptionEn:'Illustrative upgrading of heavier fractions in refinery units; routes, capacities and performance are not real.',
  startFa:'برش‌های سنگین برج تقطیر',startEn:'Heavy distillation fractions',endFa:'جریان‌های مفهومی برای تصفیه',endEn:'Illustrative streams for treatment',
  position:[2,0,-14],startPoint:[2,2,-14],endPoints:[[2.5,1.8,.5]],zone:'refinery',assetIds:['FCC-01','V-201','HDS-01'],routeIds:[2,3],
 },
 {
  id:'treatment',fa:'تصفیه فرآورده',en:'Product treatment',
  descriptionFa:'نمایش پیوند مفهومی هیدروگوگردزدایی، هیدروژن و بازیافت گوگرد؛ همه‌ی اتصال‌ها و وضعیت‌ها نمایشی‌اند.',
  descriptionEn:'Illustrative links between hydrotreating, hydrogen supply and sulfur recovery; all connections and states are simulated.',
  startFa:'جریان‌های تبدیل‌شده',startEn:'Converted streams',endFa:'فرآورده‌ی تصفیه‌شده',endEn:'Treated product',
  position:[2.5,0,.5],startPoint:[2.5,1.8,.5],endPoints:[[10,1.25,-9]],zone:'refinery',assetIds:['HDS-01','H2-01','SRU-01','SWS-01'],routeIds:[3,4,15,16,17,18,19,20],
 },
 {
  id:'blending',fa:'اختلاط و هدر فرآورده',en:'Blending & product manifold',
  descriptionFa:'مرحله‌ی مفهومی هم‌جوسازی و هدایت فرآورده در هدر؛ مدل، ترکیب‌بندی واقعی یا واحد اختلاط مهندسی‌شده را نشان نمی‌دهد.',
  descriptionEn:'Conceptual product pooling and routing at the manifold; this view is not a real blend recipe or engineered blending unit.',
  startFa:'فرآورده‌های تصفیه‌شده',startEn:'Treated product streams',endFa:'انشعاب‌های مخزن و پایانه صادرات',endEn:'Tank and export-terminal branches',
  position:[10,0,-5],startPoint:[10,1.25,-9],endPoints:[[12,1.25,-10.85]],zone:'storage',assetIds:['P-301A','PL-PROD-01'],routeIds:[4,5],
 },
 {
  id:'storage',fa:'ذخیره‌سازی محصول',en:'Product storage',
  descriptionFa:'انتقال مفهومی از هدر به مخازن فرآورده و مخازن کروی؛ ظرفیت و سطح‌ها داده‌ی نمایشی هستند.',
  descriptionEn:'Illustrative manifold transfer to product tanks and LPG spheres; capacities and levels are simulated values.',
  startFa:'هدر فرآورده',startEn:'Product manifold',endFa:'مخزن ذخیره منتخب',endEn:'Selected storage tank',
  position:[17,0,-9],startPoint:[10,1.25,-9],endPoints:[[12,1.25,-13]],zone:'storage',assetIds:[...tankIds,'P-301A','PL-PROD-01'],routeIds:[4],
 },
 {
  id:'export',fa:'بارگیری جاده‌ای و صادرات دریایی',en:'Truck loading & marine export',
  descriptionFa:'دو شاخه‌ی مستقل و نمایشی برای بارگیری تانکر جاده‌ای و نفت‌کش در اسکله؛ انتقال واقعی انجام نمی‌شود.',
  descriptionEn:'Two separate illustrative branches for road-tanker loading and marine export; no real transfer is performed.',
  startFa:'هدر فرآورده',startEn:'Product manifold',endFa:'جایگاه جاده‌ای یا اسکله صادراتی',endEn:'Road loading bay or export berth',
  position:[23,0,12],startPoint:[10,1.25,-9],endPoints:[[10,4.15,15],[32.2,1.25,4]],zone:'truck',assetIds:['PL-ROAD-01','TR-014','LB-01','PL-MARINE-01','BERTH-01','VES-08'],routeIds:[5,6,7,8,9],
 },
];

export const processStageById=new Map(processStages.map(stage=>[stage.id,stage]));
export function processStageAssets(stage:ProcessStage):SiteItem[]{
 return stage.assetIds.map(id=>inspectableItems.find(item=>item.id===id)).filter((item):item is SiteItem=>Boolean(item));
}
