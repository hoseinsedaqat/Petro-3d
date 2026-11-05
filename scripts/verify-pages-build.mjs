import assert from 'node:assert/strict';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const basePath = process.env.VITE_BASE_PATH || '/';

assert.ok(basePath.startsWith('/') && basePath.endsWith('/'), `VITE_BASE_PATH must start and end with a slash; received ${basePath}`);
assert.ok(!basePath.includes('..'), `VITE_BASE_PATH must not contain path traversal; received ${basePath}`);
assert.ok(existsSync(path.join(distRoot, 'index.html')), 'dist/index.html is missing; run npm run build first');

const html = await readFile(path.join(distRoot, 'index.html'), 'utf8');
const localUrls = new Set();
const indexUrls = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
assert.ok(indexUrls.length > 0, 'No built script or stylesheet references were found in dist/index.html');

function collectLocalUrl(reference, parentUrl = `${basePath}index.html`) {
  if (/^(?:data:|blob:|https?:|#|\/\/)/i.test(reference)) return;
  const url = new URL(reference, `https://pages.invalid${parentUrl}`);
  assert.ok(url.pathname.startsWith(basePath), `Asset URL escapes the configured Pages base path: ${url.pathname} (base ${basePath})`);
  const relativePath = decodeURIComponent(url.pathname.slice(basePath.length));
  assert.ok(relativePath && !relativePath.split('/').includes('..'), `Invalid local asset path: ${url.pathname}`);
  const filePath = path.join(distRoot, relativePath);
  assert.ok(filePath.startsWith(`${distRoot}${path.sep}`), `Asset path escapes dist/: ${url.pathname}`);
  assert.ok(existsSync(filePath) && statSync(filePath).isFile(), `Built asset does not exist: ${url.pathname}`);
  localUrls.add(url.pathname);
  return { pathname: url.pathname, filePath };
}

for (const reference of indexUrls) collectLocalUrl(reference);
const cssFiles = [...localUrls].filter(url => url.endsWith('.css')).map(url => path.join(distRoot, decodeURIComponent(url.slice(basePath.length))));
for (const cssFile of cssFiles) {
  const css = await readFile(cssFile, 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const reference = match[1].trim();
    if (reference) collectLocalUrl(reference, `${basePath}${path.relative(distRoot, cssFile).split(path.sep).join('/')}`);
  }
}

const models = ['models/ships/oil-tanker.glb', 'models/workers/cesium-man.glb'];
for (const model of models) {
  const modelPath = path.join(distRoot, model);
  assert.ok(existsSync(modelPath) && statSync(modelPath).isFile(), `Local model was not copied into dist/: ${model}`);
}
const localModelBudgets = new Map([
  ['models/ships/oil-tanker.glb', 2.5 * 1024 * 1024],
  ['models/workers/cesium-man.glb', 300 * 1024],
]);
for (const [model, maximumBytes] of localModelBudgets) {
  const modelSize = statSync(path.join(distRoot, model)).size;
  assert.ok(modelSize <= maximumBytes, `Local model exceeds its size budget (${modelSize} bytes): ${model}`);
}
function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) yield fullPath;
  }
}
const jsFiles = [...walk(path.join(distRoot, 'assets'))];
const jsBundle = (await Promise.all(jsFiles.map(file => readFile(file, 'utf8')))).join('\n');
for (const model of models) assert.ok(jsBundle.includes(`${basePath}${model}`), `Compiled application does not reference the base-prefixed model URL ${basePath}${model}`);

const server = createServer((request, response) => {
  const requestPath = new URL(request.url || '/', 'http://localhost').pathname;
  if (!requestPath.startsWith(basePath)) {
    response.writeHead(404).end('Not found');
    return;
  }
  const relativePath = decodeURIComponent(requestPath.slice(basePath.length));
  const filePath = path.join(distRoot, relativePath || 'index.html');
  if (!filePath.startsWith(`${distRoot}${path.sep}`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  const mime = filePath.endsWith('.html') ? 'text/html; charset=utf-8'
    : filePath.endsWith('.js') ? 'text/javascript; charset=utf-8'
      : filePath.endsWith('.css') ? 'text/css; charset=utf-8'
        : filePath.endsWith('.glb') ? 'model/gltf-binary'
          : filePath.endsWith('.woff2') ? 'font/woff2'
            : filePath.endsWith('.woff') ? 'font/woff'
              : 'application/octet-stream';
  response.writeHead(200, { 'content-type': mime });
  createReadStream(filePath).pipe(response);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  for (const pathname of [`${basePath}`, ...localUrls, ...models.map(model => `${basePath}${model}`)]) {
    const response = await fetch(new URL(pathname, origin));
    assert.equal(response.status, 200, `Static Pages request failed (${response.status}): ${pathname}`);
    if (pathname === basePath) assert.match(response.headers.get('content-type') || '', /text\/html/);
    await response.arrayBuffer();
  }
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

console.log(`GitHub Pages static-path check passed: base ${basePath}; ${localUrls.size} built assets and ${models.length} local models served successfully.`);
