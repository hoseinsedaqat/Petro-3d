# PetroVista 3D

**Explore. Understand. Simulate.**

An interactive, client-side 3D refinery and petroleum export terminal demonstration. Built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Zustand, Framer Motion, and Lucide icons. All operations, values, personnel and statuses are simulated demo data; the application is not connected to a real facility.

## Features

- Isometric-style, orbitable Three.js site with selectable process units, distillation towers, tanks, utilities, buildings, tanker trucks, workers and an export vessel.
- Separate road-truck loading and marine export areas, connected to dedicated, visibly independent process and transfer pipelines.
- Multi-tier steel pipeway with repeated bents, cross-bracing, pipe shoes/flanges, accessible walkways, separate power and instrument ladder trays, an overhead crossover around the HDS equipment envelope, and a lateral expansion loop.
- Three electrical feeder conduits follow a covered inland trench with handholes to the relocated, fenced switchyard; the station is set back from the harbor, and its location/details are illustrative.
- Tank-farm containment includes a stair crossing, sump grate and visible manually isolated drain detail; no open drain is routed to the sea, and all features are illustrative.
- A dedicated firewater reserve tank, enclosed electric/standby pump house, buried red ring main and accessible perimeter hydrants visualize active firewater coverage; the layout and equipment are illustrative, with no real capacity, hydraulic analysis, or compliance claim.
- PPE-detailed field staff with reflective bands, hard hats, boots, handheld gas detector/tablet/tool accents, and subtle role-based movement.
- Company entrance and visitor campus include a selectable glazed security gatehouse, marked approach and stop line, wheel stops, a kerbed pedestrian route, protected zebra crossing, low-glare path lights and planted office-side beds; parking and access-control details are illustrative.
- The perimeter now has locally textured chain-link infill, top/mid rails and taller posts, while preserving the original gate opening and post locations. A low gravel-and-xeric planting bed softens the company-side arrival without intruding into the gatehouse, vehicle apron or pedestrian path.
- The central control building and laboratory use distinct industrial façades: a restrained control-room observation band, screened low-profile roof ventilation, visible access/egress details, and laboratory exhaust stacks. These are visual details only—not blast-resistance, ventilation, or laboratory-safety designs.
- A differentiated road tanker and a flatbed carrying six restrained steel oil drums; marked truck lanes, a protected pedestrian walkway, physical barriers, and a worker-proximity stop check prevent the demo vehicles from driving through staff.
- Simulated moving trucks with rotating wheels, subtle ship bobbing, animated workers and pipeline-flow indicators; flow mode traces separate feed, conversion, road-export and marine-export routes with moving directional markers.
- Expanded site terrain with a carved harbor basin, flush shoreline water, and a segmented concrete quay wall; the water surface no longer overlays the land plate, and existing equipment coordinates remain fixed.
- A more legible elevated flare vignette with a tapered red/white stack, grated service decks and rails, caged access ladder, burner-tip pilots, a local knockout-drum/header detail, and a layered flickering flame. It is an illustrative visual model, not a flare-system or safety design.
- `F-102` now has a compact box-type fired-heater silhouette with a radiant firebox, small burner ports and flicker, coil/header details, an open-framed convection/shield bank, breeching, and a tall stack with access decks and ladders. This is a local illustrative model, not process, combustion, emissions, stack-sizing, or safety engineering.
- Procedural local-only yard materials distinguish compacted site soil, saw-cut concrete process pads, and asphalt vehicle routes; subtle aggregate, panel joints, and pad textures add scale without remote assets or layout changes.
- Floodlight masts, illuminated pedestrian lamps, truck headlamps and warm control-room windows keep the night scene readable. These are illustrative visual effects, not lighting engineering data.
- Bilingual Persian / English interface (Persian by default), RTL-aware layout, day/night lighting, process flow mode, navigation, search, asset inspection, simulation speed/pause/reset, and scene quality settings.
- Static-only architecture. No backend, database, external API, or remote 3D asset dependency. User language preference is saved in localStorage.
- Bundled glTF/GLB assets: an animated, skinned worker character and a detailed oil tanker vessel. Both are loaded locally; the worker model has PPE accents and its supplied logo area is neutralized.
- GitHub Pages deployment workflow with repository-path Vite base support.

## Requirements

Node.js 20 or newer and npm.

## Install and run locally

```bash
npm ci
npm run dev
```

Vite prints the local development URL. The dev server binds to `0.0.0.0` for preview environments.

## Type-check and production build

```bash
npm run typecheck
npm run build
npm run preview
```

The static production files are written to `dist/`. To test a project-site path locally, set the base path before building:

```bash
VITE_BASE_PATH=/petrovista-3d/ npm run build
```

The default base path is `/` for local development.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main`, or start **Deploy PetroVista 3D to GitHub Pages** from the **Actions** tab using **Run workflow**.
4. The workflow installs dependencies, runs TypeScript checks, builds the app with `VITE_BASE_PATH=/<repository-name>/`, uploads `dist/`, and deploys the static artifact.
5. Visit `https://<username>.github.io/<repository-name>/` after the deployment job completes.

The workflow uses the repository name automatically; no hard-coded username or root-host assumption is required. This app uses a single page and does not require direct-route rewrites.

## Troubleshooting

- **404 or missing assets on a project site:** confirm the Pages source is GitHub Actions and that the latest deployment ran successfully. The workflow sets the repository base path; local custom builds need a matching `VITE_BASE_PATH`.
- **Workflow permission failure:** verify Pages is configured to use GitHub Actions and that repository Actions policies permit the official Pages actions. The workflow requests only `contents: read`, `pages: write`, and `id-token: write`.
- **Dependency lock mismatch:** run `npm install` after changing `package.json`, then commit the updated `package-lock.json`.
- **Slow rendering on a lower-end device:** use the scene quality control to step down from High to Medium or Low; reduce browser zoom or close other GPU-heavy tabs.
- **No live operations data:** this is expected. All data is deterministic local demonstration data and intentionally has no backend or industrial-system integration.

## Visual design references

The local renderings are illustrative, not engineering designs. Layout decisions were informed by the multi-tier rack, accessible-valve, cable-separation, and thermal-flexibility notes in [Wermac’s pipe-rack reference](https://www.wermac.org/steel/piperacks.html) and [industrial cable-ladder examples](https://ydxcabletray.com/cable-ladder-tray-applications). The road loop and protected walkway follow the site-traffic principles of separate pedestrian routes, physical barriers, and marked interfaces described in the [WISH safe-traffic guidance](https://www.wishforum.org.uk/wp-content/uploads/2025/08/WISH-WASTE-09-Safe-traffic-management-on-waste-and-recycling-sites-V2.pdf); designated parking, site-entry instructions and pedestrian separation also reflect the [HSE workplace-parking guidance](https://www.hse.gov.uk/workplacetransport/parking.htm). The flatbed’s visible load straps were informed by [flatbed cargo securement examples](https://truckstop.com/blog/flatbed-shipping). The harbor edge uses a conceptual retained-quay treatment informed by the shoreline-protection vocabulary in the [U.S. Army Corps of Engineers coastal revetment and seawall manual](https://www.delmar.ca.us/DocumentCenter/View/1899/Design-of-Coastal-Revetments-Seawalls-and-Bulkheads_Army-Corps-of-Engineers-1995); this model is illustrative and is not an engineered coastal design. The switchyard setback is a visual choice informed by a utility operator’s [substation flood-mitigation code](https://www.northernpowergrid.com/sites/default/files/assets/IMP001012.pdf); the scene is not a flood-risk assessment. Control-building glazing and screened roof-service details were informed by HSE’s [control-room design note](https://www.hse.gov.uk/comah/sragtech/techmeascontrol.htm); no blast-resistance, safe-haven, or ventilation performance is claimed. The tank-farm drain/sump depiction was informed by the U.S. EPA’s [SPCC guidance on secondary containment and controlled drainage](https://www.epa.gov/sites/default/files/2014-04/documents/4_secondarycontainment_impracticability_2014.pdf); the model is illustrative and makes no capacity or compliance claim. The firewater concept was informed by HSE’s notes on [active and passive fire protection](https://www.hse.gov.uk/comah/sragtech/techmeasfire.htm) and [plant layout](https://www.hse.gov.uk/comah/sragtech/techmeasplantlay.htm), including conceptual attention to safe siting, backup supply, hydrant access and site routes; the scene is not a hydraulic design or compliance assessment. Shoreline, quay, night-scene, flare, substation, tank-farm, firewater, refinery-campus, gatehouse and modular control-building compositions were also reviewed against local image-search studies in the workspace; those images are visual references only, include stock/commercial results, and are not standards, bundled Git assets, or runtime assets. The elevated stack vocabulary (service platforms, pilot burners, burner tip and optional knockout/header context) was cross-checked against the U.S. EPA [flare cost manual, Chapter 7](https://www.epa.gov/sites/default/files/2019-08/documents/flarescostmanualchapter7thedition_august2019vff.pdf); the flare remains conceptual and makes no claim about capacity, combustion, emissions, clearances or safety performance. Yard surfacing also takes visual cues from the subtle paved-panel joints in the [warehouse-journey-3d exterior reference](https://github.com/hiobuy/warehouse-journey-3d) and local industrial-ground image searches; the project’s own local procedural textures are used, with no reference image or remote asset loaded at runtime.

The wastewater unit is shown as a selectable treatment-train vignette: the existing oil-separation channels are supplemented with equalization, aeration, secondary clarification, polishing filtration and a compact sludge-handling skid. The arrangement is conceptual; refinery wastewater systems vary by site and stream, and no treatment performance, discharge compliance, hydraulic capacity or safety rating is claimed. The two-bay on-site fire station and its short, marked access hardstand are likewise visual cues only, not a response-time, staffing or fire-protection design. These details were informed by the EPA’s [2019 Detailed Study of the Petroleum Refining Category](https://www.epa.gov/sites/default/files/2019-10/documents/petro-refining-elg-study-2019.pdf), the U.S. Department of Energy’s [Reverse Osmosis Optimization report](https://www.energy.gov/sites/prod/files/2013/10/f3/ro_optimization.pdf) for feed-water pretreatment and RO context, HSE’s [fire-protection guidance](https://www.hse.gov.uk/comah/sragtech/techmeasfire.htm) and [plant-layout guidance](https://www.hse.gov.uk/comah/sragtech/techmeasplantlay.htm), plus local visual searches of wastewater facilities, packaged industrial RO skids and two-bay fire stations. The `WW-01` utility-water package is a compact, non-potable service-water illustration; no purification quality, treatment capacity or process performance is claimed. It remains a separate asset from `WWT-01`, the refinery wastewater plant. Search-result imagery is reference-only and is not bundled or loaded at runtime.

`P-301A` now depicts a compact paired transfer-pump set with horizontal drivers, baseplates, enclosed couplings, suction/discharge headers, small instruments and a simple canopy frame. It remains within the west edge of its existing utility footprint; no equipment coordinates were moved. Pipe routes, equipment duties and clearances are illustrative and make no claim about hydraulic design or safe operation. The visual study used Flowserve’s [HPX API process-pump overview](https://www.flowserve.com/products/products-catalog/pumps/overhung-pumps/api-process-pumps/flowserve-hpx-oh2-type-api-process-pump/) and [pump installation instructions](https://www.flowserve.com/sites/default/files/dam/documents/85392697-e.pdf), HSE’s [plant-layout guidance](https://www.hse.gov.uk/comah/sragtech/techmeasplantlay.htm), and local image searches of process-pump installations. Search imagery is reference-only; no external image or pump model is used at runtime.

`F-102` is represented as a compact box-type fired heater: the lower radiant chamber, burner openings, tube/header cues, upper convection/shield bank, breeching, stack, and access steelwork are separated visually while keeping the existing equipment location and compact ground envelope. The visual vocabulary was cross-checked against [KLM Technology Group’s refinery-furnace design guideline](https://www.klmtechgroup.com/PDF/EDG-REF/ENGINEERING-DESIGN-GUIDELINES-refinery-furnace-Rev1.2web.pdf), [XRG Technologies’ fired-heater overview](https://xrgtechnologies.com/what-is-a-fired-heater-for-dummies/), [HeaterSim’s convection-section notes](https://www.heatersim.com/knowledge/convection_section_design), and local heater image-search references. Search imagery and the user-supplied commercial model page are references only; no downloaded model, image, or texture is used at runtime. The model is not an engineered heater design and makes no claim about duty, tube sizing, combustion, emissions, stack design, clearances, or safety.

The campus trees have been repositioned outside the control-room and laboratory roof/wall footprints in both the primary and fallback scenes, with clearance from the visitor-parking edge and nearby walk light. Their crowns are now irregular layered foliage over visible trunks and small mulch pits rather than large, rigid spheres. The placement follows the integration principle in the EPA [Facilities Manual, Volume 2](https://www.epa.gov/system/files/documents/2023-12/epa-facilities-manual-vol-2-architecture-engineering-guidelines.pdf) and was cross-checked against local courtyard/office-campus landscape images; those search images remain visual references only and are not runtime assets.

The company-side arrival now uses a restrained low-water planting bed and a chain-link fence treatment that fills the existing perimeter posts while keeping the original southern gate opening, all equipment positions, and all vehicle/pedestrian routes unchanged. The planting strategy was cross-checked against EPA [facility landscape and site-planning guidance](https://nepis.epa.gov/Exe/ZyNET.exe/7000010N.txt?Back=ZyActionS&BackDesc=&Client=EPA&DefSeekPage=&Display=hpfrw&Docs=&EndTime=&ExtQFieldOp=0&File=D:%5CZYFILES%5CINDEX+DATA%5C91THRU94%5CTXT%5C00000019%5C7000010N.TXT&FuzzyDegree=-1&ImageQuality=r150g4/r150g4/x150y150g16/i850&Index=1991+Thru+1994&IntQFieldOp=0&MaximumDocuments=0&Password=anonymous&QField=&QFieldDay=&QFieldMonth=&QFieldYear=&Query=fname%3D%227000010N.TXT%22&SearchBack=ZyActionE&SearchMethod=&SortMethod=&Time=&Toc=&TocEntry=&TocRestrict=&UseQField=&User=ANONYMOUS&XmlQuery=&ZyActionW=Download) and the [industrial-site planning guidelines](https://temeculaca.gov/DocumentCenter/View/294/Chapter-5--Industrial-Guidelines-PDF); local image searches of xeric office planting and gated industrial entries were used only as visual references. Neither the searched photos nor remote textures are bundled or loaded at runtime.

## Project notes

The truck-to-worker stop check is demonstration logic only and is not safety-rated collision protection. The surrounding refinery layout and repeatable equipment are generated locally in React Three Fiber; the human and ship GLBs are bundled in `public/models/` and never fetched from third-party URLs at runtime. Their attribution and license obligations are documented in `ASSET-CREDITS.md`. Equipment dimensions and KPI values are representative visualization data, not engineering plans or real measurements. See `src/data/site.ts` for local bilingual zone, asset, and personnel data, `src/scene/World.tsx` for scene models and simulation animation, `src/i18n/fa.ts` / `src/i18n/en.ts` for translations, and `src/store.ts` for UI state.
