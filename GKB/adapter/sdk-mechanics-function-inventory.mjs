/**
 * Samantha GKB — TheTowerSDK mechanics function inventory.
 *
 * This is a discovery inventory, not a formula validator. Group assignments are
 * name-based hints; signatures, units, limits and correctness require review.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const OUTPUT_DIR = path.join(ROOT, 'staging');

const GROUP_RULES = [
  ['enemies', /enemy|enemies|waveBase|waveHealth|waveDamage|spawn|levelSkip|ranged|fastEnemy|tankEnemy|boss|protector|ray|scatter|vampire|elite/i],
  ['ultimate-weapons', /blackHole|goldenTower|deathWave|chronoField|poisonSwamp|spotlight|innerLandMine|smartMissile|chainLightning|dimensionCore|ultimateWeapon|swamp|chrono|nuke|deathWave/i],
  ['bots-and-guardians', /\bbot\b|bot[A-Z]|guardian|flameBot|goldenBot|ampBot|thunderBot|frequency|synchronicity/i],
  ['battle-conditions', /battleCondition|tournament|heat|resistance|heatLevel|condition/i],
  ['modules-and-cards', /module|card|mastery|substat|reroll/i],
  ['labs-and-research', /lab|research|labCost|labDuration|researchTime/i],
  ['effective-paths', /effectivePath|effectiveHealth|effectiveDamage|effectiveRegen|effectiveEconomy|planEffective/i],
  ['economy-and-drops', /coin|cash|cell|drop|interest|income|resource|economy|roi|killReward|waveReward|goldenCombo/i],
  ['workshop', /workshop|upgradeCost|workshopCost|freeUpgrade|enhancement/i],
  ['combat-and-damage', /damage|crit|critical|bounce|multishot|rend|thorn|knockback|shockwave|projectile|attackSpeed|fireRate|landMine|landmine|armor|defen[cs]e|health|regen|orb|range|slow|stun|shock/i],
  ['perks-and-vault', /perk|vault/i],
  ['planning-primitives-uptime', /uptime|cooldown|duration|interval|timing|schedule|cycle|overlap|coverage|plan|build|apply|calculate|compute/i]
];

export function classifyMechanicsFunction(name) {
  for (const [group, pattern] of GROUP_RULES) {
    if (pattern.test(name)) return { group, basis: 'NAME_HEURISTIC' };
  }
  return { group: 'unclassified', basis: 'NO_MATCHING_NAME_RULE' };
}

export function buildMechanicsInventory(namespace, sdkVersion, generatedAt) {
  assert.equal(typeof sdkVersion, 'string');
  const functions = Object.entries(namespace)
    .filter(([, value]) => typeof value === 'function')
    .map(([name, fn]) => {
      const classification = classifyMechanicsFunction(name);
      return {
        functionName: name,
        group: classification.group,
        groupBasis: classification.basis,
        runtimeArityHint: fn.length,
        audit: {
          status: 'NOT_REVIEWED',
          inputSignature: null,
          outputType: null,
          units: [],
          validRange: null,
          caps: null,
          dependencies: [],
          limitations: [],
          sourceEvidence: []
        }
      };
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.functionName.localeCompare(b.functionName));

  const groups = {};
  for (const item of functions) {
    groups[item.group] ??= [];
    groups[item.group].push(item.functionName);
  }
  return {
    report: 'Samantha GKB TheTowerSDK Mechanics Function Inventory',
    reportVersion: '1.0.0',
    generatedAt,
    sdk: { package: 'thetowersdk', version: sdkVersion, entryPoint: 'thetowersdk/mechanics' },
    status: 'DISCOVERY_ONLY',
    functionExportCount: functions.length,
    groupCounts: Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([group, names]) => [group, names.length])),
    groups,
    functions,
    limitations: [
      'Group assignment is inferred from exported function names and is not a verified mechanic taxonomy.',
      'runtimeArityHint is Function.length; it is not a reliable TypeScript signature.',
      'Input signatures, output types, units, valid ranges and caps remain unreviewed.',
      'No mechanics function is executed by this inventory.',
      'No formula is promoted to canonical GKB knowledge.'
    ]
  };
}

async function main() {
  const require = createRequire(path.join(RUNTIME, 'package.json'));
  const packageJson = JSON.parse(await readFile(require.resolve('thetowersdk/package.json'), 'utf8'));
  const resolved = require.resolve('thetowersdk/mechanics');
  const namespace = await import(pathToFileURL(resolved).href);
  const inventory = buildMechanicsInventory(namespace, packageJson.version, new Date().toISOString());
  await mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, 'sdk-mechanics-function-inventory.json');
  await writeFile(outputPath, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    status: inventory.status,
    sdkVersion: packageJson.version,
    functionExportCount: inventory.functionExportCount,
    groupCounts: inventory.groupCounts,
    unclassifiedCount: inventory.groupCounts.unclassified ?? 0,
    output: 'GKB/staging/sdk-mechanics-function-inventory.json',
    limitations: inventory.limitations
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}
