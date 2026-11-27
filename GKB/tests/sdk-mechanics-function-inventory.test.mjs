import assert from 'node:assert/strict';
import { buildMechanicsInventory, classifyMechanicsFunction } from '../adapter/sdk-mechanics-function-inventory.mjs';

assert.deepEqual(classifyMechanicsFunction('computeWaveBaseHealth').group, 'enemies');
assert.deepEqual(classifyMechanicsFunction('blackHoleDuration').group, 'ultimate-weapons');
assert.deepEqual(classifyMechanicsFunction('computeCoinsPerKill').group, 'economy-and-drops');
assert.deepEqual(classifyMechanicsFunction('unrecognizedExample').group, 'unclassified');

const namespace = {
  computeWaveBaseHealth: function (input) { return input; },
  blackHoleDuration: function (level, lab) { return level + lab; },
  unknownExport: 1
};
const inventory = buildMechanicsInventory(namespace, '0.14.1', '2026-11-27T00:00:00.000Z');
assert.equal(inventory.functionExportCount, 2);
assert.equal(inventory.groupCounts.enemies, 1);
assert.equal(inventory.groupCounts['ultimate-weapons'], 1);
assert.equal(inventory.functions.find(x => x.functionName === 'blackHoleDuration').runtimeArityHint, 2);
assert.equal(inventory.functions.every(x => x.audit.status === 'NOT_REVIEWED'), true);
assert.equal(inventory.status, 'DISCOVERY_ONLY');
assert.equal(inventory.limitations.some(x => x.includes('No formula is promoted')), true);

console.log(JSON.stringify({
  test: 'Samantha GKB mechanics inventory unit test',
  status: 'PASSED',
  cases: 10
}, null, 2));
