import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [app, world, probe] = await Promise.all([
  readFile(path.join(root, 'src/App.tsx'), 'utf8'),
  readFile(path.join(root, 'src/scene/World.tsx'), 'utf8'),
  readFile(path.join(root, 'src/scene/PerformanceProbe.tsx'), 'utf8'),
]);

assert.match(app, /const assetsReady=!assetsLoading&&\(assetsProgress>=100\|\|quality==='low'\)/,
  'Scene reveal must wait for all local assets (or intentional low-quality fallbacks).');
assert.match(app, /<SceneReadySignal onReady=\{onReady\} ready=\{assetsReady\}/,
  'The initial loading overlay must wait for a frame after all assets are ready.');
assert.match(world, /if\(ready&&!sent\.current\)\{sent\.current=true;onReady\(\)\}/,
  'The scene-ready signal must not fire before the loaded frame.');
assert.doesNotMatch(world, /DeferredSceneContent/,
  'Visual scene content must not be deferred until after the initial loader.');

for (const [name, nextName] of [['ProgressiveWorker', 'ProgressiveShip'], ['ProgressiveShip', 'TankerHull']]) {
  const start = world.indexOf(`function ${name}(`);
  const end = world.indexOf(`function ${nextName}(`, start + 1);
  assert.ok(start >= 0 && end > start, `Could not find ${name} loading component.`);
  assert.doesNotMatch(world.slice(start, end), /setTimeout|setInterval/,
    `${name} must not reveal models on a timer after loading.`);
}

for (const [relativePath, maximumBytes] of [
  ['public/models/ships/oil-tanker.glb', 2.5 * 1024 * 1024],
  ['public/models/workers/cesium-man.glb', 300 * 1024],
]) {
  const modelPath = path.join(root, relativePath);
  const bytes = (await stat(modelPath)).size;
  assert.ok(bytes <= maximumBytes, `${relativePath} exceeds its local asset budget (${bytes} bytes).`);
  const glb = await readFile(modelPath);
  assert.equal(glb.toString('ascii', 0, 4), 'glTF', `${relativePath} must be a binary glTF model.`);
  const jsonChunkLength = glb.readUInt32LE(12);
  const document = JSON.parse(glb.toString('utf8', 20, 20 + jsonChunkLength));
  assert.ok(document.extensionsRequired?.includes('EXT_meshopt_compression'),
    `${relativePath} must retain the local Meshopt compression used to meet its size budget.`);
}

assert.match(app, /new URLSearchParams\(window\.location\.search\)\.get\('perf'\)==='1'/,
  'Renderer diagnostics must be available via ?perf=1.');
assert.match(probe, /drawCalls:info\.render\.calls/);
assert.match(probe, /triangles:info\.render\.triangles/);
assert.match(app, /entryTypes:\['longtask'\]/,
  'The optional diagnostics HUD should observe long tasks.');

console.log('Scene performance contracts passed: no post-loader staging, gated first frame, local model budgets, and opt-in renderer/long-task diagnostics.');
