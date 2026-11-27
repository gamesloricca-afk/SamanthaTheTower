import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'runtime/package.json'));
const Ajv2020 = require('ajv/dist/2020.js').default;
const data = JSON.parse(await readFile(path.join(root, 'domains/modules-unique.json'), 'utf8'));
const schema = JSON.parse(await readFile(path.join(root, 'schema/unique-modules.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
const validate = ajv.compile(schema);

assert.equal(validate(data), true, JSON.stringify(validate.errors));
assert.equal(data.modules.length, 28);
assert.equal(new Set(data.modules.map(module => module.id)).size, 28);
assert.equal(data.verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(data.source.sdkPackage, 'thetowersdk');
assert.equal(data.source.sdkVersion, '0.14.1');
assert.equal(data.source.sourceVersion, null);
assert.equal(data.source.sourceRevision, 'main');
assert.equal(data.source.retrievedAt, null);
assert.equal(data.modules.every(module => module.minRarity === 'Epic'), true);
assert.equal(data.modules.every(module => module.rarityBonuses.length === 4), true);
for (const module of data.modules) assert.deepEqual(module.rarityBonuses.map(bonus => bonus.rarity), ['Epic','Legendary','Mythic','Ancestral'], module.id);
assert.equal(data.modules.some(module => module.id.startsWith('rare-') || module.id.startsWith('common-')), false);
assert.deepEqual(
  Object.fromEntries(['Cannon','Armor','Generator','Core'].map(category => [category, data.modules.filter(module => module.category === category).length])),
  { Cannon: 7, Armor: 7, Generator: 7, Core: 7 }
);
for (const module of data.modules) {
  assert.ok(module.effectTemplate.includes('{value}'), module.id);
  assert.equal(typeof module.id, 'string');
}
assert.equal(schema.properties.modules.minItems, 28);
assert.equal(schema.properties.modules.maxItems, 28);
console.log(JSON.stringify({
  test: 'Samantha GKB Unique Module Catalog',
  status: 'PASSED',
  schemaValidation: 'PASSED',
  moduleCount: data.modules.length,
  categories: { Cannon: 7, Armor: 7, Generator: 7, Core: 7 },
  excludedNonUniqueModules: true,
  verificationStatus: data.verificationStatus
}, null, 2));
