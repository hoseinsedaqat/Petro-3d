import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const helperPath = path.join(root, 'src/scene/responsiveZoom.ts');
const source = await readFile(helperPath, 'utf8');
const { outputText, diagnostics = [] } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  reportDiagnostics: true,
});
assert.equal(diagnostics.length, 0, 'Responsive zoom helper should transpile cleanly.');
const helper = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const widths = [320, 375, 480, 768, 850, 1024, 1440, 1920];
const zooms = widths.map(width => helper.responsiveZoomForWidth(width));
for (const zoom of zooms) assert.ok(zoom >= 3.2 && zoom <= 9.7, `Out-of-range zoom: ${zoom}`);
for (let i = 1; i < zooms.length; i++) assert.ok(zooms[i] >= zooms[i - 1], 'Zoom should be monotonic with viewport width.');
assert.equal(zooms[0], 3.2, 'Narrow mobile widths should stay within the camera minimum.');
assert.equal(zooms.at(-1), 9.7, 'Wide screens should retain the established desktop framing.');

const styles = await readFile(path.join(root, 'src/styles.css'), 'utf8');
assert.match(styles, /@media\(max-width:850px\)/, 'Tablet/mobile layout breakpoint is missing.');
assert.match(styles, /@media\(max-width:480px\)/, 'Small-phone layout breakpoint is missing.');
console.log(`Responsive layout checks passed for ${widths.length} viewport widths plus tablet and phone CSS breakpoints.`);
