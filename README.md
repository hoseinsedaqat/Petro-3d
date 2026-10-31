# PetroVista 3D

**Explore. Understand. Simulate.**

An interactive, client-side 3D refinery and petroleum export terminal demonstration. Built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Zustand, Framer Motion, and Lucide icons. All operations, values, personnel and statuses are simulated demo data; the application is not connected to a real facility.

## Features

- Isometric-style, orbitable Three.js site with selectable process units, distillation towers, tanks, utilities, buildings, tanker trucks, workers and an export vessel.
- Separate road-truck loading and marine export areas, connected to dedicated, visibly independent process and transfer pipelines.
- Multi-tier steel pipeway with repeated bents, cross-bracing, pipe shoes/flanges, accessible walkways, separate power and instrument ladder trays, an overhead crossover around the HDS equipment envelope, and a lateral expansion loop.
- Three electrical feeder conduits follow a covered inland trench with handholes to the relocated, fenced switchyard; the station is set back from the harbor, and its location/details are illustrative.
- Tank-farm containment includes a stair crossing, sump grate and visible manually isolated drain detail; no open drain is routed to the sea, and all features are illustrative.
- PPE-detailed field staff with reflective bands, hard hats, boots, handheld gas detector/tablet/tool accents, and subtle role-based movement.
- A differentiated road tanker and a flatbed carrying six restrained steel oil drums; marked truck lanes, a protected pedestrian walkway, physical barriers, and a worker-proximity stop check prevent the demo vehicles from driving through staff.
- Simulated moving trucks with rotating wheels, subtle ship bobbing, animated workers and pipeline-flow indicators; flow mode traces separate feed, conversion, road-export and marine-export routes with moving directional markers.
- Expanded site terrain with a carved harbor basin, flush shoreline water, and a segmented concrete quay wall; the water surface no longer overlays the land plate, and existing equipment coordinates remain fixed.
- Floodlight masts, illuminated pedestrian lamps, truck headlamps, warm control-room windows and a layered, flickering multi-lobe flare flame keep the night scene readable. These are illustrative visual effects, not lighting engineering data.
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

The local renderings are illustrative, not engineering designs. Layout decisions were informed by the multi-tier rack, accessible-valve, cable-separation, and thermal-flexibility notes in [Wermac’s pipe-rack reference](https://www.wermac.org/steel/piperacks.html) and [industrial cable-ladder examples](https://ydxcabletray.com/cable-ladder-tray-applications). The road loop and protected walkway follow the site-traffic principles of separate pedestrian routes, physical barriers, and marked interfaces described in the [WISH safe-traffic guidance](https://www.wishforum.org.uk/wp-content/uploads/2025/08/WISH-WASTE-09-Safe-traffic-management-on-waste-and-recycling-sites-V2.pdf). The flatbed’s visible load straps were informed by [flatbed cargo securement examples](https://truckstop.com/blog/flatbed-shipping). The harbor edge uses a conceptual retained-quay treatment informed by the shoreline-protection vocabulary in the [U.S. Army Corps of Engineers coastal revetment and seawall manual](https://www.delmar.ca.us/DocumentCenter/View/1899/Design-of-Coastal-Revetments-Seawalls-and-Bulkheads_Army-Corps-of-Engineers-1995); this model is illustrative and is not an engineered coastal design. The switchyard setback is a visual choice informed by a utility operator’s [substation flood-mitigation code](https://www.northernpowergrid.com/sites/default/files/assets/IMP001012.pdf); the scene is not a flood-risk assessment. The tank-farm drain/sump depiction was informed by the U.S. EPA’s [SPCC guidance on secondary containment and controlled drainage](https://www.epa.gov/sites/default/files/2014-04/documents/4_secondarycontainment_impracticability_2014.pdf); the model is illustrative and makes no capacity or compliance claim. Shoreline, quay, night-scene, flare, substation and tank-farm compositions were also reviewed against local image-search studies in the workspace; those images are visual references only, not standards, bundled Git assets, or runtime assets.

## Project notes

The truck-to-worker stop check is demonstration logic only and is not safety-rated collision protection. The surrounding refinery layout and repeatable equipment are generated locally in React Three Fiber; the human and ship GLBs are bundled in `public/models/` and never fetched from third-party URLs at runtime. Their attribution and license obligations are documented in `ASSET-CREDITS.md`. Equipment dimensions and KPI values are representative visualization data, not engineering plans or real measurements. See `src/data/site.ts` for local bilingual zone, asset, and personnel data, `src/scene/World.tsx` for scene models and simulation animation, `src/i18n/fa.ts` / `src/i18n/en.ts` for translations, and `src/store.ts` for UI state.
