import { describe, expect, it } from 'vitest'
import { LAB_CATALOG } from '../../src/data'
import {
  assistModuleStonesCalculator,
  botUpgradeCalculator,
  CALCULATOR_BUILDERS,
  coinsPerKillCalculator,
  damageReductionCalculator,
  enemyWaveCalculator,
  guardianCalculator,
  findCalculatorBuilder,
  labResearchCalculator,
  moduleCostCalculator,
  thornsCalculator,
  ultimateWeaponCalculator,
  uptimeCalculator,
  workshopUpgradeCalculator,
} from '../../src/builders'

/**
 * A builder that returns a plausible shape while ignoring its inputs is the failure mode
 * that matters here: it renders perfectly and is wrong. So every field a builder advertises
 * is driven, and the result has to move.
 */
describe('every builder is self-describing and total', () => {
  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s describes itself', (_id, builder) => {
    expect(builder.id).toMatch(/^[a-z]+\.[a-z-]+$/)
    expect(builder.title.length).toBeGreaterThan(0)
    expect(builder.summary.length).toBeGreaterThan(0)
    expect(builder.fields.length).toBeGreaterThan(0)

    // Every declared field must exist on the defaults, or a generic form binds to nothing.
    const defaults = builder.defaults as Record<string, unknown>
    for (const field of builder.fields) {
      expect(defaults, `${builder.id}.${field.key}`).toHaveProperty(field.key)
      if (field.kind === 'select') expect(field.options?.length, field.key).toBeGreaterThan(0)
    }
  })

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s survives junk input', (_id, builder) => {
    // A form hands over half-filled state constantly. None of this may throw.
    for (const input of [undefined, {}, { nope: 1 }, { currentLevel: NaN, tier: -5, wave: 'x' }]) {
      expect(() => builder.compute(input as never), JSON.stringify(input)).not.toThrow()
      const result = builder.compute(input as never)
      expect(Array.isArray(result.notes)).toBe(true)
    }
  })

  it('finds a builder by id and returns undefined for an unknown one', () => {
    expect(findCalculatorBuilder('lab.research')).toBe(labResearchCalculator)
    expect(findCalculatorBuilder('nope.nope')).toBeUndefined()
  })

  it('gives every builder a distinct id', () => {
    const ids = CALCULATOR_BUILDERS.map(b => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('lab research', () => {
  const lab = LAB_CATALOG.find(l => (l.levels?.length ?? 0) > 5)!

  it('costs more for more levels', () => {
    const five = labResearchCalculator.compute({ labName: lab.name, currentLevel: 0, targetLevel: 5 })
    const two = labResearchCalculator.compute({ labName: lab.name, currentLevel: 0, targetLevel: 2 })
    expect(five.levels).toHaveLength(5)
    expect(five.totalCoinCost).toBeGreaterThan(two.totalCoinCost)
    expect(five.totalHours).toBeGreaterThan(0)
  })

  it('applies the coin discount', () => {
    const full = labResearchCalculator.compute({ labName: lab.name, targetLevel: 5 })
    const half = labResearchCalculator.compute({ labName: lab.name, targetLevel: 5, coinDiscountPercent: 50 })
    expect(half.totalCoinCost).toBeLessThan(full.totalCoinCost)
  })

  it('lab speed shortens the research, and never divides by zero', () => {
    const base = labResearchCalculator.compute({ labName: lab.name, targetLevel: 5 })
    const fast = labResearchCalculator.compute({ labName: lab.name, targetLevel: 5, labSpeedPercent: 100 })
    expect(fast.totalHours).toBeCloseTo(base.totalHours / 2, 5)
    expect(Number.isFinite(base.totalHours)).toBe(true)
  })

  it('says so rather than returning a confident zero', () => {
    expect(labResearchCalculator.compute({ labName: 'Not A Lab' }).notes[0]).toMatch(/No lab named/)
    const backwards = labResearchCalculator.compute({ labName: lab.name, currentLevel: 5, targetLevel: 2 })
    expect(backwards.levels).toEqual([])
    expect(backwards.notes.join(' ')).toMatch(/not above/)
  })

  it('clamps a target past the cap and reports it', () => {
    const capped = labResearchCalculator.compute({ labName: lab.name, targetLevel: 99_999 })
    expect(capped.levels.length).toBe(capped.maxLevel)
    expect(capped.notes.join(' ')).toMatch(/caps at level/)
  })
})

describe('workshop upgrade', () => {
  it('discounts every level, and caps a combined discount over 100%', () => {
    const full = workshopUpgradeCalculator.compute({ currentLevel: 0, targetLevel: 10 })
    const cut = workshopUpgradeCalculator.compute({ currentLevel: 0, targetLevel: 10, sectionDiscountPercent: 50 })
    expect(cut.totalCost).toBeLessThan(full.totalCost)

    const over = workshopUpgradeCalculator.compute({
      targetLevel: 10,
      sectionDiscountPercent: 80,
      vaultDiscountPercent: 80,
    })
    expect(over.appliedDiscountPercent).toBe(100)
    expect(over.notes.join(' ')).toMatch(/capped/)
  })

  it('names the curve it actually priced against when the key is unknown', () => {
    // Falling back silently would price one stat against another and look correct.
    const result = workshopUpgradeCalculator.compute({ costKey: 'NOT_A_CURVE', targetLevel: 5 })
    expect(result.notes.join(' ')).toMatch(/No cost curve named "NOT_A_CURVE"; priced against/)
    expect(result.totalCost).toBeGreaterThan(0)
  })
})

describe('enemy wave', () => {
  it('scales with wave and with tier', () => {
    const early = enemyWaveCalculator.compute({ tier: 1, wave: 100 })
    const late = enemyWaveCalculator.compute({ tier: 1, wave: 2000 })
    expect(late.baseHealth).toBeGreaterThan(early.baseHealth)

    const highTier = enemyWaveCalculator.compute({ tier: 8, wave: 100 })
    expect(highTier.baseHealth).not.toBe(early.baseHealth)
  })

  it('lists the enemy kinds that spawn, with real numbers', () => {
    const result = enemyWaveCalculator.compute({ tier: 1, wave: 500 })
    expect(result.rows.length).toBeGreaterThan(3)
    for (const row of result.rows) {
      expect(Number.isFinite(row.health), row.type).toBe(true)
      expect(Number.isFinite(row.damage), row.type).toBe(true)
    }
  })

  it('tournament scaling is not the same as campaign', () => {
    const campaign = enemyWaveCalculator.compute({ tier: 5, wave: 1000, tournament: false })
    const tournament = enemyWaveCalculator.compute({ tier: 5, wave: 1000, tournament: true })
    expect(tournament.baseHealth).not.toBe(campaign.baseHealth)
  })
})

describe('thorns', () => {
  it('needs fewer hits to kill as wall thorns rise', () => {
    const rows = thornsCalculator.compute({ baseThorns: 100, tier: 1 }).byWallThorns
    expect(rows).toHaveLength(20)
    expect(rows.at(-1)!.hitsToKillElite).toBeLessThan(rows[0].hitsToKillElite)
  })

  it('reports the wall thorns level that was asked for', () => {
    const result = thornsCalculator.compute({ baseThorns: 100, wallThorns: 7 })
    expect(result.atWallThorns.wallThorns).toBe(7)
    expect(result.atWallThorns).toEqual(result.byWallThorns.find(row => row.wallThorns === 7))
  })

  it('takes more hits to kill a boss than an elite, and fleets sit between', () => {
    // Boss thorn damage is halved and fleets take 85% of elite damage, so the ordering is fixed.
    const { atWallThorns } = thornsCalculator.compute({ baseThorns: 100, wallThorns: 10, tier: 1 })
    expect(atWallThorns.hitsToKillBoss).toBeGreaterThan(atWallThorns.hitsToKillElite)
    expect(atWallThorns.hitsToKillFleet).toBeGreaterThanOrEqual(atWallThorns.hitsToKillElite)
  })

  it('loses effectiveness at higher tiers, which is the whole reason the tier is an input', () => {
    const low = thornsCalculator.compute({ baseThorns: 100, wallThorns: 10, tier: 1 })
    const high = thornsCalculator.compute({ baseThorns: 100, wallThorns: 10, tier: 20 })
    expect(high.atWallThorns.hitsToKillElite).toBeGreaterThan(low.atWallThorns.hitsToKillElite)
  })

  it('says so when Heat (Wave) is set outside a tournament, rather than ignoring it in silence', () => {
    const result = thornsCalculator.compute({ tournamentTier: 'none', heatWave: 400 })
    expect(result.notes.join(' ')).toMatch(/only applies to a tournament/)
  })

  it('will not apply Plasma Cannon mastery without Plasma Cannon, and says which', () => {
    const result = thornsCalculator.compute({ plasmaCannonLevel: 0, plasmaCannonMasteryLevel: 5 })
    expect(result.notes.join(' ')).toMatch(/mastery needs Plasma Cannon at level 7/)
  })
})

describe('module cost', () => {
  it('charges more shards and coins for more levels', () => {
    const short = moduleCostCalculator.compute({ currentLevel: 1, targetLevel: 5 })
    const long = moduleCostCalculator.compute({ currentLevel: 1, targetLevel: 20 })
    expect(long.totalShards).toBeGreaterThan(short.totalShards)
    expect(long.totalCoins).toBeGreaterThan(short.totalCoins)
    expect(long.levels).toHaveLength(19)
  })

  it('applies each discount to its own currency only', () => {
    const base = moduleCostCalculator.compute({ currentLevel: 1, targetLevel: 20 })
    const shardsOff = moduleCostCalculator.compute({ currentLevel: 1, targetLevel: 20, shardDiscountPercent: 50 })
    expect(shardsOff.totalShards).toBeLessThan(base.totalShards)
    expect(shardsOff.totalCoins).toBe(base.totalCoins)
  })

  it('caps the target at the rarity that was chosen, and says so', () => {
    const common = moduleCostCalculator.compute({ rarity: 'Common', targetLevel: 500 })
    expect(common.levelCap).toBe(20)
    expect(common.levels.at(-1)?.level).toBe(20)
    expect(common.notes.join(' ')).toMatch(/caps at level 20/)
  })

  it('names the rarity it fell back to instead of pricing the wrong curve silently', () => {
    const result = moduleCostCalculator.compute({ rarity: 'Nonsense', targetLevel: 10 })
    expect(result.notes.join(' ')).toMatch(/No module rarity named "Nonsense"/)
  })
})

describe('uptime', () => {
  it('is duration over cooldown, measured from activation', () => {
    // 30s of a 100s cooldown is 30%, not 30/(30+100).
    expect(uptimeCalculator.compute({ durationSeconds: 30, cooldownSeconds: 100 }).percent).toBeCloseTo(30, 5)
  })

  it('reports permanent uptime when duration covers the cooldown', () => {
    const result = uptimeCalculator.compute({ durationSeconds: 60, cooldownSeconds: 60 })
    expect(result.permanent).toBe(true)
    expect(result.downtimeSeconds).toBe(0)
    expect(result.notes.join(' ')).toMatch(/never drops/)
  })

  it('refuses a zero cooldown rather than dividing by it', () => {
    const result = uptimeCalculator.compute({ durationSeconds: 30, cooldownSeconds: 0 })
    expect(Number.isFinite(result.ratio)).toBe(true)
    expect(result.notes.join(' ')).toMatch(/Cooldown is 0/)
  })

  it('reports the downtime a UI needs to show a gap', () => {
    expect(uptimeCalculator.compute({ durationSeconds: 20, cooldownSeconds: 80 }).downtimeSeconds).toBe(60)
  })
})

describe('ultimate weapon stones', () => {
  it('costs more stones for more levels', () => {
    const short = ultimateWeaponCalculator.compute({ currentLevel: 0, targetLevel: 3 })
    const long = ultimateWeaponCalculator.compute({ currentLevel: 0, targetLevel: 10 })
    expect(long.totalStones).toBeGreaterThan(short.totalStones)
  })

  it('hands back the stats that belong to the chosen weapon', () => {
    const result = ultimateWeaponCalculator.compute({ weapon: 'Golden Tower' })
    expect(result.weapon).toBe('Golden Tower')
    expect(result.statsForWeapon.length).toBeGreaterThan(1)
    // The stat picked must be one of that weapon's own.
    expect(result.statsForWeapon).toContain(result.stat)
  })

  it('does not carry a stat across to a weapon that has no such stat', () => {
    const result = ultimateWeaponCalculator.compute({ weapon: 'Golden Tower', stat: 'Not A Stat' })
    expect(result.statsForWeapon).toContain(result.stat)
    expect(result.notes.join(' ')).toMatch(/has no stat named "Not A Stat"/)
  })

  it('prices each weapon on its own chart', () => {
    const a = ultimateWeaponCalculator.compute({ weapon: 'Golden Tower', targetLevel: 10 })
    const b = ultimateWeaponCalculator.compute({ weapon: 'Black Hole', targetLevel: 10 })
    expect(a.totalStones).toBeGreaterThan(0)
    expect(b.totalStones).toBeGreaterThan(0)
  })
})

describe('damage reduction', () => {
  it('stacks layers multiplicatively, not additively', () => {
    // Two 50% layers must leave 25% getting through, not 0%.
    const result = damageReductionCalculator.compute({
      rawDamage: 1000,
      useDefensePercent: true,
      defensePercent: 50,
      useChronoField: true,
      chronoReductionPercent: 50,
    })
    expect(result.finalDamage).toBeCloseTo(250, 5)
    expect(result.totalReduction).toBeCloseTo(0.75, 5)
  })

  it('lets the whole hit through when nothing is enabled', () => {
    const result = damageReductionCalculator.compute({
      rawDamage: 1000,
      useDefensePercent: false,
      useDefenseAbsolute: false,
    })
    expect(result.finalDamage).toBe(1000)
    expect(result.totalReduction).toBe(0)
    expect(result.notes.join(' ')).toMatch(/No reduction layers are enabled/)
  })

  it('lists only the layers that actually removed something', () => {
    /*
     * A layer that is switched off and a layer sitting at 0% both remove nothing, and
     * neither appears in `layers`. That is right for a waterfall — there is no step to
     * draw — but it does mean the result cannot tell you which of the two it was. Read
     * the input toggles for that.
     */
    const off = damageReductionCalculator.compute({ rawDamage: 1000, useDefensePercent: false })
    const zero = damageReductionCalculator.compute({
      rawDamage: 1000,
      useDefensePercent: true,
      defensePercent: 0,
    })
    expect(off.layers).toEqual([])
    expect(zero.layers).toEqual([])
    expect(off.finalDamage).toBe(zero.finalDamage)

    const active = damageReductionCalculator.compute({
      rawDamage: 1000,
      useDefensePercent: true,
      defensePercent: 50,
    })
    expect(active.layers).toHaveLength(1)
    expect(active.layers[0]).toMatchObject({ key: 'defenseRel', reductionPercent: 50, remaining: 500 })
  })

  it('caps defence % at the in-game maximum and says so', () => {
    const result = damageReductionCalculator.compute({
      rawDamage: 1000,
      useDefensePercent: true,
      defensePercent: 100,
    })
    expect(result.finalDamage).toBeGreaterThan(0)
    expect(result.notes.join(' ')).toMatch(/caps at 98%/)
  })

  it('explains when a flat floor makes the later layers look broken', () => {
    // This is the real support question: "defence % does nothing". It is downstream of
    // an absolute value that already removed the whole hit.
    const result = damageReductionCalculator.compute({
      rawDamage: 1000,
      useDefenseAbsolute: true,
      defenseAbsolute: 1e9,
      useChronoField: true,
      chronoReductionPercent: 50,
    })
    expect(result.finalDamage).toBe(0)
    expect(result.notes.join(' ')).toMatch(/already removes the whole hit/)
  })
})

describe('guardian upgrade', () => {
  it('costs more bits for more levels', () => {
    const short = guardianCalculator.compute({ currentLevel: 0, targetLevel: 3 })
    const long = guardianCalculator.compute({ currentLevel: 0, targetLevel: 10 })
    expect(long.totalBits).toBeGreaterThan(short.totalBits)
    expect(long.levels).toHaveLength(10)
  })

  it('keeps the stat inside the guardian that was chosen', () => {
    const result = guardianCalculator.compute({ guardian: 'attack', stat: 'Not A Stat' })
    expect(result.statsForGuardian).toContain(result.stat)
    expect(result.notes.join(' ')).toMatch(/has no stat named "Not A Stat"/)
  })

  it('returns the stat value alongside the cost, so a table needs one call', () => {
    const result = guardianCalculator.compute({ guardian: 'attack', targetLevel: 3 })
    expect(result.levels[0]?.value).not.toBeNull()
  })
})

describe('bot upgrade', () => {
  it('costs more medals for more levels', () => {
    const short = botUpgradeCalculator.compute({ currentLevel: 0, targetLevel: 3 })
    const long = botUpgradeCalculator.compute({ currentLevel: 0, targetLevel: 10 })
    expect(long.totalMedals).toBeGreaterThan(short.totalMedals)
  })

  it('is keyed by bot name, not by position in the table', () => {
    // An index would silently point at a different bot if one were inserted.
    const result = botUpgradeCalculator.compute({ bot: 'Flame Bot' })
    expect(result.bot).toBe('Flame Bot')
    expect(result.statsForBot.length).toBeGreaterThan(1)
  })

  it('shares one medal ladder across a bot stats', () => {
    const [statA, statB] = botUpgradeCalculator.compute({ bot: 'Flame Bot' }).statsForBot
    const a = botUpgradeCalculator.compute({ bot: 'Flame Bot', stat: statA, targetLevel: 10 })
    const b = botUpgradeCalculator.compute({ bot: 'Flame Bot', stat: statB, targetLevel: 10 })
    expect(a.totalMedals).toBe(b.totalMedals)
    // ...but the values they buy differ.
    expect(a.levels[0]?.value).not.toBe(b.levels[0]?.value)
  })

  it('keeps the stat inside the bot that was chosen', () => {
    const result = botUpgradeCalculator.compute({ bot: 'Flame Bot', stat: 'Not A Stat' })
    expect(result.statsForBot).toContain(result.stat)
    expect(result.notes.join(' ')).toMatch(/has no stat named "Not A Stat"/)
  })
})

describe('assist module stones', () => {
  it('climbs: a longer stretch costs more than a shorter one', () => {
    const short = assistModuleStonesCalculator.compute({ currentLevel: 0, targetLevel: 3 })
    const long = assistModuleStonesCalculator.compute({ currentLevel: 0, targetLevel: 10 })
    expect(long.totalStones).toBeGreaterThan(short.totalStones)
  })

  it('is a cumulative ladder, not a flat per-level price', () => {
    // If it were flat, ten levels would cost exactly ten times one level.
    const one = assistModuleStonesCalculator.compute({ currentLevel: 0, targetLevel: 1 })
    const ten = assistModuleStonesCalculator.compute({ currentLevel: 0, targetLevel: 10 })
    expect(ten.totalStones).not.toBe(one.totalStones * 10)
  })

  it('clamps past the cap and says so', () => {
    const capped = assistModuleStonesCalculator.compute({ targetLevel: 99_999 })
    expect(capped.notes.join(' ')).toMatch(/caps at level/)
    expect(capped.totalStones).toBeGreaterThan(0)
  })
})

describe('coins per kill', () => {
  it('pays more with a higher workshop level', () => {
    const low = coinsPerKillCalculator.compute({ workshopLevel: 0 })
    const high = coinsPerKillCalculator.compute({ workshopLevel: 30 })
    expect(high.coinsPerKill).toBeGreaterThan(low.coinsPerKill)
    expect(high.workshopValue).toBeGreaterThan(low.workshopValue)
  })

  it('every declared source moves the answer', () => {
    /*
     * The failure this guards is a source the model reads that the wiring never passes —
     * the field renders, the number does not budge, and nothing reports it.
     */
    const base = coinsPerKillCalculator.compute({ workshopLevel: 10 })
    const movers: Array<[string, Record<string, unknown>]> = [
      ['labLevel', { labLevel: 20 }],
      ['enhancementLevel', { enhancementLevel: 10 }],
      ['primarySubstat', { primarySubstat: 2 }],
      ['assistSubstat', { assistSubstat: 2 }],
      ['hasCoinPerk', { hasCoinPerk: true }],
      ['hasCoinTradeOffPerk', { hasCoinTradeOffPerk: true }],
      ['vaultPercent', { vaultPercent: 50 }],
    ]
    const inert: string[] = []
    for (const [name, patch] of movers) {
      const moved = coinsPerKillCalculator.compute({ workshopLevel: 10, ...patch })
      if (moved.coinsPerKill === base.coinsPerKill) inert.push(name)
    }
    expect(inert, `these inputs changed nothing: ${inert.join(', ')}`).toEqual([])
  })

  it('flags a zero substat multiplier that would erase the result', () => {
    const zeroed = coinsPerKillCalculator.compute({ workshopLevel: 10, primarySubstat: 0 })
    expect(zeroed.notes.join(' ')).toMatch(/multiplier and one is 0/)
  })

  it('always returns a finite number', () => {
    for (const input of [{}, { workshopLevel: -5 }, { primarySubstat: NaN }]) {
      expect(Number.isFinite(coinsPerKillCalculator.compute(input as never).coinsPerKill)).toBe(true)
    }
  })
})

describe('every builder is renderable without knowing which one it is', () => {
  /*
   * The promise this package makes is "describe the form from `fields`, and the UI is all
   * you have to write". That promise breaks silently: a field whose `kind` a renderer does
   * not handle simply does not appear, the calculator still computes, and nothing reports
   * the missing input. So the contract is checked here rather than left to each consumer.
   */
  const KNOWN_KINDS = new Set(['number', 'select', 'boolean', 'number-list'])

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s', (_id, builder) => {
    expect(builder.fields.length, 'a builder with no fields cannot be rendered').toBeGreaterThan(0)

    const defaults = builder.defaults as Record<string, unknown>
    const problems: string[] = []
    const seen = new Set<string>()

    for (const field of builder.fields) {
      if (!KNOWN_KINDS.has(field.kind)) problems.push(`${field.key}: unknown kind ${field.kind}`)
      if (!field.label.trim()) problems.push(`${field.key}: no label`)
      if (seen.has(field.key)) problems.push(`${field.key}: duplicated`)
      seen.add(field.key)
      // A field with no default renders as an empty control the user cannot interpret.
      if (defaults[field.key] === undefined) problems.push(`${field.key}: absent from defaults`)
      if (field.kind === 'select' && !field.options?.length) problems.push(`${field.key}: select with no options`)
      if (field.kind === 'number-list' && !Array.isArray(defaults[field.key])) {
        problems.push(`${field.key}: number-list default is not an array`)
      }
    }

    expect(problems, problems.join('; ')).toEqual([])
  })

  it('leaves no default unreachable from the form', () => {
    /*
     * The mirror of the above, and the more common failure here: an input the model reads
     * that the form never offers. A key in `defaults` with no `fields` entry is a control
     * nobody can ever set.
     */
    const orphans: string[] = []
    for (const builder of CALCULATOR_BUILDERS) {
      const keys = new Set(builder.fields.map(f => f.key))
      for (const key of Object.keys(builder.defaults as Record<string, unknown>)) {
        if (!keys.has(key)) orphans.push(`${builder.id}.${key}`)
      }
    }
    expect(orphans, `defaults with no field to set them: ${orphans.join(', ')}`).toEqual([])
  })

  it('has a unique id per builder', () => {
    const ids = CALCULATOR_BUILDERS.map(b => b.id)
    expect(new Set(ids).size, `duplicate ids in ${ids.join(', ')}`).toBe(ids.length)
  })
})
