import { items, type SiteItem, type SiteZoneId } from './site';

const pipeline = (id:string,fa:string,en:string,position:[number,number,number],descriptionFa:string,descriptionEn:string,zone:SiteZoneId='storage'):SiteItem => ({
 id,fa,en,kind:'pipeline',zone,position,status:'مسیر نمایشی · بدون کنترل واقعی',descriptionFa,descriptionEn,
});
const loadingBay = (n:number,x:number):SiteItem => ({
 id:`LB-0${n}`,fa:`جایگاه بارگیری ${new Intl.NumberFormat('fa-IR').format(n)}`,en:`Loading bay 0${n}`,kind:'loading-bay',zone:'truck',position:[x,0,15],status:'فعال · داده نمایشی',
 descriptionFa:`جایگاه ${n} پایانه جاده‌ای؛ ظرفیت، وضعیت و اتصال‌های این نمای سه‌بعدی صرفاً شبیه‌سازی شده‌اند.`,
 descriptionEn:`Road terminal bay ${n}; capacity, state and connections in this 3D view are simulated only.`,
});

export const interactionItems:SiteItem[]=[
 pipeline('PL-PROD-01','هدر و انشعاب خط فرآورده','Product manifold & tank branch',[10,1.25,-9],
  'نمای تعاملی از هدر فرآورده و یک انشعاب مخزن؛ مسیر، اتصال‌ها و داده‌ها مفهومی و شبیه‌سازی‌شده‌اند.',
  'Interactive view of the product manifold and a tank branch; route, connections and readings are conceptual and simulated.'),
 pipeline('PL-ROAD-01','خط انتقال به پایانه جاده‌ای','Road-terminal loading line',[15,2.8,15],
  'شاخه نمایشی هدر بارگیری جاده‌ای؛ هیچ فرمان یا انتقال واقعی انجام نمی‌شود.',
  'Illustrative branch of the road-loading header; no real command or transfer is performed.','truck'),
 pipeline('PL-MARINE-01','خط صادرات دریایی','Marine export line',[32.2,1.25,4],
  'خط مفهومی اتصال هدر فرآورده به بازوی بارگیری اسکله؛ تمام وضعیت‌ها نمایشی‌اند.',
  'Conceptual route from the product header to the berth loading arm; all states are illustrative.','marine'),
 loadingBay(1,10),loadingBay(2,15),loadingBay(3,20),
];
export const inspectableItems=[...items,...interactionItems];
export const interactionById=new Map(inspectableItems.map(item=>[item.id,item]));

/** Conceptual demo connections, not an engineered P&ID or control network. */
export const relatedAssetIds:Record<string,string[]>={
 'TK-101':['PL-PROD-01','P-301A','TR-014','LB-01','VES-08','PL-MARINE-01'],
 'TK-102':['PL-PROD-01','P-301A','TR-014','LB-01'],
 'TK-103':['PL-PROD-01','P-301A','TR-014','LB-01'],
 'TK-104':['PL-PROD-01','P-301A','VES-08','PL-MARINE-01'],
 'TK-105':['PL-PROD-01','P-301A','TR-014','LB-01'],
 'TK-106':['PL-PROD-01','P-301A','TR-014','LB-01'],
 'TK-107':['PL-PROD-01','P-301A','VES-08','PL-MARINE-01'],
 'TK-108':['PL-PROD-01','P-301A','VES-08','PL-MARINE-01'],
 'PL-PROD-01':['TK-101','P-301A','PL-ROAD-01','PL-MARINE-01','LB-01','VES-08'],
 'P-301A':['PL-PROD-01','TK-101','TR-014','LB-01'],
 'TR-014':['LB-01','PL-ROAD-01','P-301A','PL-PROD-01'],
 'LB-01':['TR-014','PL-ROAD-01','P-301A','PL-PROD-01'],
 'LB-02':['TR-014','PL-ROAD-01'],
 'LB-03':['TR-014','PL-ROAD-01'],
 'PL-ROAD-01':['TR-014','LB-01','P-301A','PL-PROD-01'],
 'VES-08':['BERTH-01','PL-MARINE-01'],
 'BERTH-01':['VES-08','PL-MARINE-01'],
 'PL-MARINE-01':['VES-08','BERTH-01','PL-PROD-01'],
 'CDU-01':['F-102','E-101','V-102','P-102A','V-201'],
 'F-102':['CDU-01','V-201'],
 'E-101':['CDU-01','V-102','P-102A'],
 'V-102':['CDU-01','E-101','P-102A'],
 'P-102A':['CDU-01','V-102','E-101'],
 'V-201':['CDU-01','F-102'],
 'CW-01':['ACHE-01','P-301A'],
 'ACHE-01':['CW-01','HDS-01'],
 'HDS-01':['ACHE-01','P-102A'],
 'FL-01':['FL-KO-01','SRU-01'],
 'FL-KO-01':['FL-01','SRU-01'],
 'FL-027':['TR-027','LB-02'],
 'TR-027':['FL-027','LB-02'],
 'LD-014':['LB-01','TR-014'],
 'MR-008':['VES-08','BERTH-01'],
 'OP-014':['CDU-01','F-102'],
 'MT-021':['P-301A','CW-01'],
 'UT-003':['CW-01','SB-01'],
 'DR-027':['TR-027','FL-027'],
 'CR-002':['CCR-01'],
 'EN-006':['CDU-01','E-101'],
};

export function relatedItemsFor(item:SiteItem){
 return (relatedAssetIds[item.id]??[]).map(id=>interactionById.get(id)).filter((asset):asset is SiteItem=>Boolean(asset));
}

const categoryFa:Record<string,string>={
 tank:'مخزن ذخیره', 'sphere-tank':'مخزن کروی تحت فشار', pump:'پمپ', process:'تجهیز فرایندی', furnace:'کوره', flare:'مشعل پالایشگاه',
 cooling:'سامانه خنک‌کاری', utility:'یوتیلیتی', building:'ساختمان', truck:'خودرو', forklift:'لیفتراک', ship:'کشتی', worker:'نیروی انسانی',
 pipeline:'خط لوله', 'loading-bay':'جایگاه بارگیری', marine:'اسکله',
};
const categoryEn:Record<string,string>={
 tank:'Storage tank', 'sphere-tank':'Pressurized sphere', pump:'Pump', process:'Process equipment', furnace:'Furnace', flare:'Refinery flare',
 cooling:'Cooling system', utility:'Utility', building:'Building', truck:'Vehicle', forklift:'Forklift', ship:'Vessel', worker:'Personnel',
 pipeline:'Pipeline', 'loading-bay':'Loading bay', marine:'Berth',
};
const functions:Record<string,[string,string]>={
 'CDU-01':['جداسازی نفت خام به برش‌های دمایی','Separate crude into boiling-range fractions'],
 'V-201':['فرآوری باقیمانده در فشار پایین','Process residue under reduced pressure'],
 'F-102':['گرم‌کردن خوراک پیش از ورود به برج','Heat process feed before the column'],
 'P-301A':['پمپاژ و انتقال سیال در مدار نمایشی','Pump and transfer fluid in the illustrative circuit'],
 'P-102A':['گردش رفلاکس به برج تقطیر','Circulate reflux to the distillation column'],
 'TK-101':['ذخیره‌سازی موقت فرآورده','Temporary product storage'],
 'TR-014':['ورود، توقف، بارگیری و خروج از پایانه','Enter, stop, load and depart the road terminal'],
 'TR-027':['حمل پالت بشکه در چرخه‌ی محوطه','Move a drum pallet around the terminal loop'],
 'VES-08':['دریافت محموله در اسکله صادراتی','Receive cargo at the export berth'],
 'PL-PROD-01':['انتقال مفهومی فرآورده میان هدر و مخزن','Illustrative transfer between manifold and tank'],
 'PL-ROAD-01':['تغذیه شاخه‌ی بارگیری تانکر جاده‌ای','Feed the road-tanker loading branch'],
 'PL-MARINE-01':['انتقال مفهومی به بازوی بارگیری دریایی','Illustrative transfer to the marine loading arm'],
};
export function categoryName(item:SiteItem,rtl:boolean){return (rtl?categoryFa:categoryEn)[item.kind]??(rtl?'تجهیز صنعتی':'Industrial asset')}

const statusTranslations:Record<string,[string,string]>={
 'در حال کار':['در حال کار','Operating'],'در حال کار · نمایشی':['در حال کار · نمایشی','Operating · simulated'],
 'پایدار':['پایدار','Stable'],'پایش عادی · نمایشی':['پایش عادی · نمایشی','Normal monitoring · simulated'],
 'آماده‌به‌کار':['آماده‌به‌کار','Ready'],'آماده‌به‌کار · نمایشی':['آماده‌به‌کار · نمایشی','Ready · simulated'],
 'فعال':['فعال','Active'],'فعال · نمایشی':['فعال · نمایشی','Active · simulated'],'فعال — نمایشی':['فعال · نمایشی','Active · simulated'],
 'نیازمند بازبینی':['نیازمند بازبینی','Review required'],'در سرویس':['در سرویس','In service'],'بارگیری نمایشی':['بارگیری نمایشی','Simulated loading'],
 'کشتی در اسکله':['کشتی در اسکله','Vessel at berth'],
 'چرخه‌ی ورود، بارگیری و خروج · نمایشی':['چرخه‌ی ورود، بارگیری و خروج · نمایشی','Arrival, loading & departure cycle · simulated'],
 'چرخه‌ی توقف، بارگیری و حرکت · نمایشی':['چرخه‌ی توقف، بارگیری و حرکت · نمایشی','Stop, load & dispatch cycle · simulated'],
 'چرخه‌ی جابه‌جایی پالت · نمایشی':['چرخه‌ی جابه‌جایی پالت · نمایشی','Pallet-transfer cycle · simulated'],
};
export function statusName(item:SiteItem,rtl:boolean){
 const translated=statusTranslations[item.status];
 if(translated)return translated[rtl?0:1];
 if(item.status.includes('بازبینی'))return rtl?'نیازمند بازبینی':'Review required';
 if(item.status.includes('در حال')||item.status.includes('فعال'))return rtl?'در حال کار · نمایشی':'Operating · simulated';
 return rtl?'آماده‌به‌کار · نمایشی':'Ready · simulated';
}
export function mainFunction(item:SiteItem):[string,string]{
 if(functions[item.id])return functions[item.id];
 if(item.kind==='worker')return [item.taskFa??'فعالیت میدانی نمایشی',item.taskEn??'Illustrative field activity'];
 if(item.kind==='loading-bay')return ['استقرار خودرو و انتقال محموله به‌صورت نمایشی','Illustrative vehicle staging and cargo transfer'];
 return [item.descriptionFa,item.descriptionEn];
}
