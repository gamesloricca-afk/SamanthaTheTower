/**
 * Samantha GKB — TheTowerSDK mechanics API smoke test
 * Executes only documented deterministic examples; does not assert game truth.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const mechanics = await import(pathToFileURL(require.resolve('thetowersdk/mechanics')).href);
const manifest = JSON.parse(require('node:fs').readFileSync(path.join(ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'));
assert.equal(manifest.version, '0.14.1');

const required = ['computeWaveBaseHealth','computeWaveBaseDamage','applyWorkshopOvercapMultiplier','sentryProtocolWorkshopOrbFireInterval'];
const missing = required.filter(key => typeof mechanics[key] !== 'function');
assert.deepEqual(missing, [], `Missing documented mechanics functions: ${missing.join(', ')}`);

const waveHealth = mechanics.computeWaveBaseHealth({ tier: 10, wave: 4500 });
const waveDamage = mechanics.computeWaveBaseDamage({ tier: 10, wave: 4500 });
const overcapResult = mechanics.applyWorkshopOvercapMultiplier(100, 7000);
const orbIntervalResult = mechanics.sentryProtocolWorkshopOrbFireInterval(2);
assert.equal(typeof waveHealth, 'number');
assert.equal(typeof waveDamage, 'number');
assert.equal(typeof overcapResult, 'number');
assert.equal(typeof orbIntervalResult, 'number');

const functions = Object.keys(mechanics).filter(key => typeof mechanics[key] === 'function').sort();
console.log(JSON.stringify({
  test: 'Samantha GKB SDK Mechanics API Smoke Test',
  status: 'PASSED',
  sdkVersion: manifest.version,
  functionExportCount: functions.length,
  requiredFunctions: required,
  documentedExamples: {
    computeWaveBaseHealth: { input: [{ tier: 10, wave: 4500 }], output: waveHealth },
    computeWaveBaseDamage: { input: [{ tier: 10, wave: 4500 }], output: waveDamage },
    applyWorkshopOvercapMultiplier: { input: [100,7000], output: overcapResult },
    sentryProtocolWorkshopOrbFireInterval: { input: [2], output: orbIntervalResult }
  },
  limitations: [
    'This verifies callable exports and reproducibility of selected documented examples only.',
    'It does not establish that every formula exactly reproduces game code.',
    'No formula is promoted into canonical GKB from this smoke test.',
    'Formula inputs, units, caps, version conditions, and accuracy notes require per-function review.'
  ]
}, null, 2));
