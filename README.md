<div align="center">
  <h1>PetroVista 3D</h1>
  <p><strong>Explore. Understand. Simulate.</strong><br />An interactive, bilingual 3D refinery and export-terminal demo.</p>
  <p><a href="#english">English</a> · <a href="#persian">فارسی</a></p>
  <p>
    <img src="https://img.shields.io/badge/React-18.3-149eca?logo=react&logoColor=white" alt="React 18.3" />
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5.6" />
    <img src="https://img.shields.io/badge/Three.js-0.170-black?logo=threedotjs&logoColor=white" alt="Three.js 0.170" />
    <img src="https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white" alt="Vite 5.4" />
  </p>
</div>

<a id="english"></a>

## English

PetroVista 3D is a browser-based, interactive miniature of a refinery campus and its export terminal. Explore the site from an isometric overview, follow illustrative process routes, and inspect equipment in context. The interface is available in English and Persian, with Persian RTL support.

### The site at a glance

![PetroVista 3D — live application screenshot showing the refinery, tank farm, landscaped site buffers, road terminal, and marine berth](docs/images/petrovista-site-overview.png)

*Captured from the running PetroVista 3D application. All people, equipment states, readings, and activities shown are demonstration data.*

### Explore

- **Refinery and utilities:** crude receiving, distillation, conversion, hydrotreating, hydrogen, sulfur recovery, steam, instrument air, nitrogen, firewater, and wastewater systems.
- **Storage and export:** atmospheric and spherical storage tanks, a separate road-loading terminal, and a marine berth with an oil tanker.
- **A living site model:** selectable equipment, animated workers and vehicles, illustrative flow cues, day/night lighting, and locally generated ground and landscape materials.
- **Bilingual controls:** switch between English and Persian, search for equipment, inspect selected assets, navigate by site zone, and adjust scene quality.

### Controls

- Drag to orbit or pan the scene; use the mouse wheel to zoom.
- Select a unit, tank, or vehicle to open its information panel; use search to find an asset by name or tag.
- Use the navigation rail to focus on a site zone. The toolbar provides day/night, flow, playback, speed, reset, and quality controls.
- Keyboard shortcuts: **W/A/S/D** or **arrow keys** to move the focus, **F** to focus the selected asset, **R** to reset, and **Esc** to clear the selection or close search/help.

### Run locally

**Requirements:** Node.js 20+ and npm.

```bash
git clone https://github.com/hoseinsedaqat/Petro-3d.git
cd Petro-3d
npm ci
npm run dev
```

Open the local URL printed by Vite. The server binds to `0.0.0.0`, which also works in hosted preview environments.

```bash
npm run typecheck   # TypeScript checks
npm run build       # Production build in dist/
npm run preview     # Serve the production build locally
```

### Deploy to GitHub Pages

The repository includes a GitHub Actions workflow named **Deploy PetroVista 3D to GitHub Pages**. Configure **Settings → Pages → Build and deployment → Source** to **GitHub Actions**, then push to the `test` branch or run the workflow manually from the Actions tab. It installs the locked dependencies, type-checks, builds with the repository-specific Vite base path, and deploys `dist/`.

For a local project-site build, set the base path to match the repository name:

```bash
VITE_BASE_PATH=/Petro-3d/ npm run build
```

### Project map

| Path | Purpose |
| --- | --- |
| `src/scene/World.tsx` | Site layout, environment, pipelines, and scene behavior |
| `src/scene/RefinerySections.tsx` | Selectable process and utility equipment |
| `src/scene/ProcessSteelwork.tsx` | Central process steelwork and pipe rack |
| `src/scene/SphereTank.tsx` | Spherical storage tanks |
| `src/scene/VesselAccessDeck.tsx` | Shared vessel access decks and ladder landings |
| `src/data/site.ts` | Bilingual demo asset, zone, and personnel data |
| `src/i18n/` | English and Persian interface strings |
| `src/store.ts` | Local UI and simulation state |
| `public/models/` | Locally bundled ship and worker GLB assets |
| `ASSET-CREDITS.md` | Attribution and asset license notes |

### Important scope note

**PetroVista is a visual demonstration—not an operating refinery, digital twin, process simulator, engineering design, or safety system.** It has no backend, PLC connection, live telemetry, or external 3D-asset dependency. Equipment placement, routes, dimensions, capacities, readings, and operational behavior are illustrative and are not verified for engineering, regulatory, or safety use. Bundled model attributions and license obligations are listed in [`ASSET-CREDITS.md`](ASSET-CREDITS.md).

---

<a id="persian"></a>

## فارسی

**پتروویستا ۳بعدی** یک ماکت تعاملی و مرورگرمحور از محوطه‌ی پالایشگاه و پایانه‌ی صادراتی است. در نمای کلی سایت حرکت کنید، مسیرهای مفهومی فرایند را دنبال کنید و تجهیزات را در جایگاه خود بررسی کنید. رابط کاربری فارسی و انگلیسی است و چیدمان فارسی از راست به چپ پشتیبانی می‌شود.

### نمایی از سایت

تصویر بالا از خود محیط در حال اجرای PetroVista 3D گرفته شده است. تجهیزات، افراد، وضعیت‌ها، اعداد و فعالیت‌های نمایش‌داده‌شده همگی داده‌ی نمایشی هستند.

### بخش‌های اصلی

- **پالایشگاه و یوتیلیتی‌ها:** دریافت نفت خام، تقطیر، تبدیل، گوگردزدایی، تولید هیدروژن، بازیافت گوگرد، بخار، هوای ابزار دقیق، نیتروژن، آب آتش‌نشانی و تصفیه‌ی پساب.
- **ذخیره‌سازی و صادرات:** مخازن اتمسفریک و کروی، پایانه‌ی مستقل بارگیری جاده‌ای و اسکله‌ی دریایی با نفت‌کش.
- **مدل زنده‌ی سایت:** انتخاب و بررسی تجهیزات، حرکت نمایشی کارکنان و خودروها، نشانه‌های بصری جریان، نورپردازی روز و شب و مصالح محلیِ ساخته‌شده در خود پروژه.
- **کنترل دوزبانه:** جابه‌جایی بین فارسی و انگلیسی، جست‌وجوی تجهیزات، بررسی مشخصات دارایی‌ها، ناوبری بر اساس محدوده‌های سایت و تنظیم کیفیت صحنه.

### راهبری صحنه

- برای چرخاندن یا جابه‌جایی دید، صحنه را بکشید؛ برای بزرگ‌نمایی از چرخ ماوس استفاده کنید.
- با انتخاب واحد، مخزن یا وسیله‌ی نقلیه، پنل اطلاعات آن را باز کنید؛ برای یافتن تجهیز می‌توانید از نام یا شناسه‌ی آن جست‌وجو کنید.
- از نوار ناوبری برای رفتن به محدوده‌های سایت استفاده کنید. نوار ابزار، حالت روز/شب، نمایش جریان، پخش و سرعت شبیه‌سازی، بازنشانی و کیفیت صحنه را کنترل می‌کند.
- میان‌برها: **W/A/S/D** یا کلیدهای جهت‌دار برای حرکت نقطه‌ی تمرکز، **F** برای تمرکز روی تجهیز انتخاب‌شده، **R** برای بازنشانی و **Esc** برای پاک‌کردن انتخاب یا بستن جست‌وجو/راهنما.

### اجرا در سیستم محلی

**پیش‌نیازها:** Node.js نسخه‌ی ۲۰ یا جدیدتر و npm.

```bash
git clone https://github.com/hoseinsedaqat/Petro-3d.git
cd Petro-3d
npm ci
npm run dev
```

نشانی محلی‌ای را که Vite چاپ می‌کند باز کنید. سرور روی `0.0.0.0` اجرا می‌شود و در محیط‌های پیش‌نمایش میزبانی‌شده نیز قابل استفاده است.

```bash
npm run typecheck   # بررسی TypeScript
npm run build       # ساخت نسخه‌ی انتشار در dist/
npm run preview     # اجرای محلی نسخه‌ی ساخته‌شده
```

### انتشار در GitHub Pages

مخزن یک گردش‌کار GitHub Actions با نام **Deploy PetroVista 3D to GitHub Pages** دارد. در **Settings → Pages → Build and deployment → Source** گزینه‌ی **GitHub Actions** را انتخاب کنید؛ سپس به شاخه‌ی `test` push کنید یا گردش‌کار را از زبانه‌ی Actions به‌صورت دستی اجرا کنید. گردش‌کار وابستگی‌های قفل‌شده را نصب می‌کند، TypeScript را بررسی می‌کند، با مسیر پایه‌ی متناسب با نام مخزن build می‌گیرد و پوشه‌ی `dist/` را منتشر می‌کند.

برای build محلی با مسیر پروژه، مسیر پایه را مطابق نام مخزن تنظیم کنید:

```bash
VITE_BASE_PATH=/Petro-3d/ npm run build
```

### ساختار پروژه

| مسیر | کاربرد |
| --- | --- |
| `src/scene/World.tsx` | چیدمان سایت، محیط، خطوط لوله و رفتار صحنه |
| `src/scene/RefinerySections.tsx` | تجهیزات فرایندی و یوتیلیتیِ قابل انتخاب |
| `src/scene/ProcessSteelwork.tsx` | سازه‌ی فرایندی مرکزی و پایپ‌رک |
| `src/scene/SphereTank.tsx` | مخازن کروی ذخیره‌سازی |
| `src/scene/VesselAccessDeck.tsx` | سکوهای دسترسی مخازن و پاگرد نردبان |
| `src/data/site.ts` | داده‌های دوزبانه‌ی نمایشی تجهیزات، محدوده‌ها و کارکنان |
| `src/i18n/` | متن‌های رابط انگلیسی و فارسی |
| `src/store.ts` | وضعیت محلی رابط و شبیه‌سازی |
| `public/models/` | فایل‌های GLB محلی کشتی و نیروی انسانی |
| `ASSET-CREDITS.md` | انتساب و توضیحات مجوز دارایی‌ها |

### محدوده و هشدار مهم

**پتروویستا صرفاً یک نمایش بصری است؛ نه پالایشگاه عملیاتی، دوقلوی دیجیتال، شبیه‌ساز فرایند، طرح مهندسی یا سامانه‌ی ایمنی.** این پروژه backend، اتصال PLC، داده‌ی زنده یا وابستگی به مدل سه‌بعدی خارجی ندارد. جانمایی تجهیزات، مسیرها، ابعاد، ظرفیت‌ها، اعداد و رفتارهای عملیاتی نمایشی‌اند و برای استفاده‌ی مهندسی، مقرراتی یا ایمنی صحه‌گذاری نشده‌اند. اطلاعات انتساب و تعهدات مجوز مدل‌های همراه پروژه در [`ASSET-CREDITS.md`](ASSET-CREDITS.md) آمده است.
