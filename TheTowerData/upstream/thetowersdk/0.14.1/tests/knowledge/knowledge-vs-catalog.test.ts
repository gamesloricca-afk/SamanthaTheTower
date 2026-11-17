import { describe, expect, it } from 'vitest'
import {
  ASSIST_MODULE_STONE_COSTS,
  CARD_LEVELS,
  CARD_MAX_COPIES,
  CARD_TEMPLATES,
  computeModuleStat,
  ENEMY_TYPE_SUMMARIES,
  getLevelCapForRarity,
  getModuleCoinUpgradeCost,
  getModuleShardUpgradeCost,
  LAB_CATALOG,
  LAB_RESEARCH_BY_INDEX,
  MAX_CAMPAIGN_TIER,
  MILESTONE_KEY_UNLOCK_ROWS,
  MILESTONE_SYSTEM_UNLOCK_ROWS,
  MODULE_COIN_COSTS,
  MODULE_EFFECT_RARITY_ROWS,
  MODULE_RARITIES,
  MODULE_RARITY_LEVEL_CAPS,
  MODULE_SHARD_COSTS,
  RARITY_CHANCES,
  STANDARD_PERKS,
  TIER_BATTLE_CONDITION_TIERS,
  TIER_COIN_BONUS_ROWS,
  TOWER_MODULE_RARITY_ENUM,
  WORKSHOP_DATA,
  WSP_WORKSHOP_COSTS,
} from '../../src/data'
import * as oracle from '../../src/knowledge'
import {
  ASSIST_EFFICIENCY_FIRST_STEP_COST,
  ASSIST_EFFICIENCY_LADDER_STEPS_AT_CHART,
  ASSIST_EFFICIENCY_MAX_FROM_STONES_AT_CHART,
  ASSIST_EFFICIENCY_STEP_INCREMENT,
  ASSIST_MULTIPLIER_EFFICIENCY_MAX_TOTAL,
  ASSIST_STONE_COST_ALL_TYPES,
  ASSIST_STONE_COST_BY_PURCHASE,
  ASSIST_STONE_COST_PER_TYPE,
  ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_ALL_TYPES,
  ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_PER_TYPE,
  ASSIST_UNIQUE_EFFECT_STONE_COST,
} from '../../src/knowledge'
import {
  CARD_COPIES_ACQUIRED_PER_STAR,
  CARD_COPIES_PER_STAR,
  CARD_DRAW_RATE,
  CARD_GEM_COST_PER_STAR,
  CARD_MASTERY_NAME_TO_CARD,
  CARD_MASTERY_STONE_COST,
  CARD_MAX_LEVEL,
  CRITICAL_FACTOR_MAX,
  DEATH_DEFY_WORKSHOP_MAX,
  ENEMY_BASE_COIN_VALUE,
  ENEMY_HEALTH_MULTIPLE,
  ENEMY_TYPES,
  ENEMY_TYPES_WITHOUT_COIN_VALUE,
  ENEMY_TYPES_WITHOUT_HEALTH_MULTIPLE,
  MAX_TIER,
  MODULE_RARITY_MAX_LEVEL,
  RECOVERY_MAX_HEALTH_MULTIPLE,
  STANDARD_PERK_MAX_QUANTITY,
  TIER_BATTLE_CONDITIONS_FROM,
  TOURNAMENT_ENEMY_LEVEL_SKIP,
  TOURNAMENT_LEAGUE_NAMES,
} from '../../src/knowledge'

/**
 * The oracle checked against the catalogs.
 *
 * ## Why this file exists
 *
 * Writing the knowledge graph, I copied the wiki's tier coin-bonus table into
 * it. The catalog already held that table, from a different source, and the two
 * disagreed at tiers 22, 23 and 24 — a conflict created and shipped inside a
 * single sitting, invisible because both copies looked authoritative.
 *
 * That is the repo's signature defect wearing new clothes: *supported by the
 * model, never reconciled with the wiring, nothing anywhere reports it.*
 *
 * ## The rule this enforces
 *
 * **The catalogs own values. The oracle owns meaning.** Where the oracle does
 * restate a number — because the semantic claim is inseparable from it, as with
 * "a star tier is its own rung" — the two copies must agree, and this file is
 * what makes disagreement loud.
 *
 * A failure here is not necessarily an oracle bug. It means two sources have
 * diverged and a human has to decide which is right. Do not "fix" it by editing
 * whichever side is easier to reach.
 */

/** The catalog writes `Rare +`; the wiki writes `Rare+`. Compare the rungs, not the spacing. */
function normaliseRarity(label: string): string {
  return label.replace(/\s+/g, '').toLowerCase()
}

describe('the oracle agrees with the catalogs', () => {
  it('matches module rarity level caps rung for rung, in both directions', () => {
    const catalog = new Map(
      Object.entries(MODULE_RARITY_LEVEL_CAPS).map(([k, v]) => [normaliseRarity(k), v]),
    )
    const oracleCaps = new Map(
      Object.entries(MODULE_RARITY_MAX_LEVEL).map(([k, v]) => [normaliseRarity(k), v]),
    )

    // Both directions, because a one-way check passes when the oracle is simply
    // missing a rung — which it was: `Common` was absent and nothing said so.
    for (const [rarity, cap] of oracleCaps) {
      expect(catalog.get(rarity), `catalog has no cap for ${rarity}`).toBe(cap)
    }
    for (const [rarity, cap] of catalog) {
      expect(oracleCaps.get(rarity), `oracle is missing the ${rarity} rung`).toBe(cap)
    }
  })

  it('matches the card level ceiling', () => {
    expect(Math.max(...CARD_LEVELS)).toBe(CARD_MAX_LEVEL)
  })

  it('matches card draw rates by rarity', () => {
    for (const [rarity, rate] of Object.entries(CARD_DRAW_RATE)) {
      const fromCatalog = (RARITY_CHANCES as Record<string, number>)[rarity.toLowerCase()]
      expect(fromCatalog, `catalog has no draw rate for ${rarity}`).toBeDefined()
      expect(fromCatalog, `${rarity}: oracle says ${rate}`).toBeCloseTo(rate, 10)
    }
  })

  it('reconciles card copies to the catalog total', () => {
    // The wiki's printed column sums to 81; a maxed card costs 80 copies. The
    // unlock counts toward 2*. This is the check that found it.
    const printed = Object.values(CARD_COPIES_PER_STAR).reduce((a, b) => a + b, 0)
    const acquired = Object.values(CARD_COPIES_ACQUIRED_PER_STAR).reduce((a, b) => a + b, 0)

    expect(acquired, 'acquired copies must match the catalog').toBe(CARD_MAX_COPIES)
    expect(printed, 'the wiki column is expected to over-count by exactly one').toBe(acquired + 1)
  })

  it('matches gem cost to max a card', () => {
    const total = Object.values(CARD_GEM_COST_PER_STAR).reduce((a, b) => a + b, 0)
    expect(total, 'the wiki states 1600 gems to max one card').toBe(1600)
  })

  it('reconciles the assist stone costs against our own ladder', () => {
    /*
     * The assist cost chart closes on its own totals in four independent
     * places, and the ladder in our catalog is one of them. That is what makes
     * it trustworthy — not that it looks plausible.
     *
     * If any of these stops holding, either the chart was misread or the game
     * changed. Both are worth knowing.
     */
    const ladder = ASSIST_MODULE_STONE_COSTS
    const ladderTotal = ladder.reduce((sum, cost) => sum + cost, 0)

    // Our ladder IS the chart's efficiency ladder.
    expect(ladder.length).toBe(ASSIST_EFFICIENCY_LADDER_STEPS_AT_CHART)
    expect(ladder[0]).toBe(ASSIST_EFFICIENCY_FIRST_STEP_COST)
    expect(ladder[1] - ladder[0]).toBe(ASSIST_EFFICIENCY_STEP_INCREMENT)
    expect(ladderTotal).toBe(ASSIST_STONE_COST_BY_PURCHASE.mainEffectEfficiencyLadder)
    expect(ladderTotal).toBe(ASSIST_STONE_COST_BY_PURCHASE.substatEfficiencyLadder)

    // The unique-effect ladder: Epic free, then three paid steps.
    const uniqueTotal = Object.values(ASSIST_UNIQUE_EFFECT_STONE_COST)
      .reduce((sum, cost) => sum + cost, 0)
    expect(uniqueTotal).toBe(ASSIST_STONE_COST_BY_PURCHASE.uniqueEffectLadder)
    expect(ASSIST_UNIQUE_EFFECT_STONE_COST.Epic, 'Epic comes with the slot unlock').toBe(0)

    // Everything sums to the chart's per-type and all-type totals.
    const perType = Object.values(ASSIST_STONE_COST_BY_PURCHASE)
      .reduce((sum, cost) => sum + cost, 0)
    expect(perType).toBe(ASSIST_STONE_COST_PER_TYPE)
    expect(perType * 4).toBe(ASSIST_STONE_COST_ALL_TYPES)

    // ...and the "skip both efficiency ladders" figure.
    const unlockAndUnique = ASSIST_STONE_COST_BY_PURCHASE.slotUnlock
      + ASSIST_STONE_COST_BY_PURCHASE.uniqueEffectLadder
    expect(unlockAndUnique).toBe(ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_PER_TYPE)
    expect(unlockAndUnique * 4).toBe(ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_ALL_TYPES)
  })

  it('knows stones stop short of full assist efficiency', () => {
    // 69 paid steps from 1% reach 70%. The remaining 30 points are labs, so a
    // stone-only cost for 100% is understating a lab dependency.
    expect(1 + ASSIST_EFFICIENCY_LADDER_STEPS_AT_CHART).toBe(ASSIST_EFFICIENCY_MAX_FROM_STONES_AT_CHART)
    // ...and the cap has since risen past it, so the snapshot is not the ceiling.
    expect(ASSIST_MULTIPLIER_EFFICIENCY_MAX_TOTAL).toBeGreaterThan(100)
  })

  it('matches the tier ceiling', () => {
    expect(MAX_CAMPAIGN_TIER).toBe(MAX_TIER)
  })

  it('matches the tier at which battle conditions begin', () => {
    const lowest = Math.min(...TIER_BATTLE_CONDITION_TIERS.map(row => row.tier))
    expect(lowest).toBe(TIER_BATTLE_CONDITIONS_FROM)
  })

  it('holds the tier coin bonuses confirmed in game', () => {
    /*
     * These three were read off the tier screen by the account owner on
     * 2026-08-16, after the oracle surfaced a conflict between the wiki and
     * this catalog. The catalog was wrong — it shipped 75 / 92 / 115.
     *
     * Pinned here rather than left to the table, because the failure mode was
     * not a crash: the numbers were plausible, monotonic, and only wrong for
     * accounts high enough to notice. An in-game reading is the highest
     * authority available and this is where it is recorded.
     */
    const confirmed: Readonly<Record<number, number>> = { 22: 72, 23: 86, 24: 103 }

    for (const [tier, coinBonus] of Object.entries(confirmed)) {
      const row = TIER_COIN_BONUS_ROWS.find(entry => entry.tier === Number(tier))
      expect(row, `no catalog row for tier ${tier}`).toBeDefined()
      expect(row?.coinBonus, `tier ${tier} coin bonus`).toBe(coinBonus)
    }
  })

  it('leaves tier coin bonus to the catalog alone', () => {
    // The oracle must NOT carry its own copy. This asserts the absence — a
    // second table is how the tiers 22-24 conflict happened, and re-adding one
    // should fail here rather than drift quietly.
    expect(
      (oracle as Record<string, unknown>).TIER_COIN_BONUS,
      'the oracle has re-added a tier coin bonus table',
    ).toBeUndefined()

    // The catalog's copy is the one to read, and it must be complete.
    expect(TIER_COIN_BONUS_ROWS.length).toBe(MAX_CAMPAIGN_TIER)
  })

  /**
   * This caught a real one. The oracle named the perk
   * `Perk Wave Requirement -25.00%`; the catalog says `-20.00%`. Fourteen of the
   * fifteen names matched exactly, so nothing looked wrong — the sole mismatch
   * was a rate, in a name, on a perk whose whole job is arithmetic.
   *
   * `waveRequirementRateReproducesWorkedExample` below is the independent check
   * that settled which side was right, rather than trusting the catalog because
   * it is the catalog.
   */
  it('names every standard perk exactly as the catalog does', () => {
    const catalogQuantities = new Map(STANDARD_PERKS.map(perk => [perk.perk, perk.quantity]))

    expect(Object.keys(STANDARD_PERK_MAX_QUANTITY).length).toBe(catalogQuantities.size)

    for (const [name, quantity] of Object.entries(STANDARD_PERK_MAX_QUANTITY)) {
      expect(catalogQuantities.has(name), `oracle has a perk the catalog does not: ${name}`).toBe(true)
      expect(catalogQuantities.get(name), `max quantity for ${name}`).toBe(quantity)
    }

    for (const name of catalogQuantities.keys()) {
      expect(
        name in STANDARD_PERK_MAX_QUANTITY,
        `catalog has a perk the oracle does not: ${name}`,
      ).toBe(true)
    }
  })

  it('matches the workshop table where it restates a workshop maximum', () => {
    // Verified by hand on 2026-08-17 and pinned here. These are the oracle
    // constants that name a value the workshop table also holds; the ones that
    // combine several sources (recovery package chance) are deliberately absent,
    // because comparing those to the workshop alone would fail for a reason that
    // is not a defect.
    const maxOf = (upgrade: string) => {
      const rows = WORKSHOP_DATA[upgrade as keyof typeof WORKSHOP_DATA] as Record<string, { value: number }>
      const levels = Object.keys(rows).map(Number).sort((a, b) => a - b)
      return rows[String(levels[levels.length - 1])].value
    }

    expect(DEATH_DEFY_WORKSHOP_MAX * 100, 'Death Defy').toBeCloseTo(maxOf('Death Defy'), 6)
    expect(RECOVERY_MAX_HEALTH_MULTIPLE, 'Max Recovery').toBeCloseTo(maxOf('Max Recovery'), 6)
    expect(CRITICAL_FACTOR_MAX, 'Critical Factor max').toBeCloseTo(maxOf('Critical Factor'), 5)
  })

  /**
   * The module cost traps, exercised rather than asserted.
   *
   * Both of these are things the oracle now warns about, and a warning nobody
   * proves is just a claim. Each calls the real export.
   */
  it('indexes the module cost tables from level 2, as the traps say', () => {
    for (let level = 2; level <= 299; level += 1) {
      expect(MODULE_COIN_COSTS[level - 2], `coin cost at level ${level}`)
        .toBe(getModuleCoinUpgradeCost(level))
      expect(MODULE_SHARD_COSTS[level - 2], `shard cost at level ${level}`)
        .toBe(getModuleShardUpgradeCost(level))
    }

    // And the obvious lookup really is wrong — if this ever stops differing,
    // the tables were re-indexed and the trap text is now misleading.
    const naiveMismatches = Array.from({ length: 298 }, (_, i) => i + 2)
      .filter(level => MODULE_COIN_COSTS[level - 1] !== getModuleCoinUpgradeCost(level))
    expect(naiveMismatches.length, 'the [level - 1] lookup should be wrong most of the time')
      .toBeGreaterThan(100)
  })

  it('resolves every real spelling of a rarity to the same value', () => {
    /*
     * Fixed 2026-08-17. `normalizeKey` had always folded `*` and the word
     * "star" into `★`, but only the plain labels were ever registered as
     * aliases — so `Ancestral 5*`, the spelling the Effective Paths sheet
     * writes, resolved to null and `computeModuleStat` returned a bonus of 1
     * for a maxed module. The capability existed and nothing used it.
     *
     * Every spelling in circulation must now agree. This is the guard that
     * stops the star drifting back in as an alias problem.
     */
    const spellings = ['Ancestral 5', 'Ancestral 5*', 'Ancestral 5 *', 'Ancestral5', 'ancestral 5']
    const stats = spellings.map(label =>
      computeModuleStat({ type: 'armor', rarityLabel: label, level: 246 }))

    expect(new Set(stats).size, `spellings disagree: ${JSON.stringify(Object.fromEntries(spellings.map((s, i) => [s, stats[i]])))}`).toBe(1)
    expect(stats[0], 'and the shared value is a real bonus, not the silent 1').toBeGreaterThan(1)

    for (const label of spellings) {
      expect(getLevelCapForRarity(label), `cap for ${label}`).toBe(300)
    }

    // Plus-tier spacing, the other drift that reaches this map.
    expect(computeModuleStat({ type: 'armor', rarityLabel: 'Rare+', level: 30 }))
      .toBe(computeModuleStat({ type: 'armor', rarityLabel: 'Rare +', level: 30 }))

    // A label that is genuinely not a rarity must still fail closed.
    expect(computeModuleStat({ type: 'armor', rarityLabel: 'Bogus Rarity', level: 246 })).toBe(1)
  })

  it('confirms every unlock gate the graph cites against the milestone table', () => {
    /*
     * The best kind of check in this file: two independent sources for the same
     * fact. Each of these gates was written into a different compartment from a
     * different wiki page. The milestone table has never been consulted for any
     * of them, so agreement here is corroboration rather than an echo.
     */
    const gates: [string, number, number][] = [
      ['Modules', 2, 90],
      ['Workshop Enhancement', 12, 60],
      ['Card Mastery Unlock', 16, 100],
      ['Assist Module', 19, 40],
      ['Unlock Perks', 2, 150],
      ['Labs', 1, 30],
    ]

    for (const [reward, tier, wave] of gates) {
      const row = MILESTONE_KEY_UNLOCK_ROWS.find(
        entry => entry.reward === reward && entry.tier === tier && entry.wave === wave,
      )
      expect(row, `no milestone unlock for "${reward}" at T${tier} W${wave}`).toBeDefined()
    }
  })

  it('makes every gated system reachable FROM the thing it is gated by', () => {
    /*
     * The gap this closes: the milestone node named its gates in prose and
     * assertions and had no edge to any of them, so "what does a milestone
     * unlock" was answerable and "what gates modules" was not. A relation that
     * exists in one direction only is half a relation.
     *
     * `guild` was excluded here until 2026-08-18 because the graph had no guild
     * entity. It has one now, so every system in the unlock table is covered and
     * there is no skip left.
     */
    for (const unlock of MILESTONE_SYSTEM_UNLOCK_ROWS) {
      const node = oracle.knowledgeFor(unlock.system)
      expect(node, `${unlock.system} is gated by a milestone but is not an entity`).not.toBeNull()

      const gatedBy = oracle.relationsOf(unlock.system)
        .filter(edge => edge.kind === 'gates' && edge.to === unlock.system)
        .map(edge => edge.from)

      expect(gatedBy, `nothing gates ${unlock.system} in the graph`).toContain('milestone')

      // Exactly one milestone edge — the generator skips systems that already
      // have a hand-written one, and a duplicate means that skip list is stale.
      expect(
        gatedBy.filter(from => from === 'milestone'),
        `${unlock.system} has a duplicate milestone gate`,
      ).toHaveLength(1)
    }
  })

  it('puts every feature unlock on the standard track', () => {
    // The premium track pays more but gates nothing, so a feature can never be
    // missed by not paying. If a premium-only unlock ever appears, that stops
    // being true and the milestone disambiguation is wrong.
    const premiumUnlocks = MILESTONE_KEY_UNLOCK_ROWS.filter(row => row.track !== 'standard')
    expect(premiumUnlocks, 'premium track should gate nothing').toEqual([])
    expect(MILESTONE_KEY_UNLOCK_ROWS.length).toBe(141)
  })

  it('keeps the four lab counts distinct, and the one-shot labs visible', () => {
    /*
     * "How many labs" has four right answers depending on the question, and a
     * planner that models every lab as a level ladder is wrong for 22 of them.
     */
    const named = LAB_RESEARCH_BY_INDEX.filter(entry => entry?.displayName)

    expect(LAB_RESEARCH_BY_INDEX).toHaveLength(260)
    expect(named).toHaveLength(236)
    expect(LAB_CATALOG.length, 'LAB_CATALOG carries level tables and omits labs without one').toBe(234)

    // The four counts must stay different, or one of them has silently become
    // a copy of another and the distinction this documents is gone.
    const counts = new Set([LAB_RESEARCH_BY_INDEX.length, named.length, LAB_CATALOG.length])
    expect(counts.size).toBe(3)

    // One-shot labs: levelMax 1 means an unlock, not a ladder.
    const oneShot = named.filter(entry => entry.levelMax === 1)
    expect(oneShot.length, 'labs that are unlocks rather than ladders').toBe(22)
    expect(named.find(entry => entry.slug === 'card_presets')?.levelMax).toBe(5)
    expect(oneShot.map(e => e.displayName)).toContain('Unlock Perks')
    expect(oneShot.map(e => e.displayName)).toContain('Global Presets')

    // And gating is the norm rather than the exception.
    const ungated = named.filter(e => !e.tierUnlock && !e.milestoneUnlock)
    expect(ungated.length, 'labs open from the start').toBe(58)
    expect(ungated.length).toBeLessThan(named.length / 2)
  })

  it('does not let 400 enhancement levels stand as a universal cap', () => {
    /*
     * The wiki documents the Damage enhancement, which has 400 levels, and that
     * figure is easy to copy onto all eighteen. Seven of them are shorter, and
     * one of the shortest is the most expensive per level — so ranking by level
     * count gets the cost order wrong too.
     */
    const ladders = Object.entries(WSP_WORKSHOP_COSTS as Record<string, Record<string, number>>)
      .map(([name, ladder]) => ({ name, levels: Object.keys(ladder).length, ladder }))

    expect(ladders).toHaveLength(18)

    const caps = new Set(ladders.map(l => l.levels))
    expect(caps.size, 'enhancements do not all share one level cap').toBeGreaterThan(1)
    expect([...caps].sort((a, b) => b - a)).toEqual([400, 300, 200, 100, 75, 60])

    // Every ladder opens at the same price, so an early cost predicts nothing.
    const firsts = new Set(ladders.map(l => l.ladder['0']))
    expect(firsts.size, 'all eighteen start at the same first-level cost').toBe(1)

    // And the shortest-but-one ladder ends dearer than the longest.
    const freeUpgrades = ladders.find(l => l.name === 'WSP_FREE_UPGRADES')!
    const damage = ladders.find(l => l.name === 'WSP_DAMAGE')!
    expect(freeUpgrades.levels).toBeLessThan(damage.levels)
    expect(
      freeUpgrades.ladder[String(freeUpgrades.levels - 1)],
      'a shorter ladder can still end more expensive',
    ).toBeGreaterThan(damage.ladder[String(damage.levels - 1)])
  })

  it('keeps sub-effect rarity separate from module rarity, gaps included', () => {
    /*
     * Two rarity numberings in one system. Sub-effect rarity has six entries
     * with values 1, 2, 4, 6, 8, 10 — no plus tiers and no 3, 5, 7 or 9. Module
     * rarity has fifteen with plus tiers.
     *
     * The gaps look like a mistake and are not. If someone "fixes" them into
     * 1-6, every sub-effect above Rare silently changes rarity.
     */
    const values = MODULE_EFFECT_RARITY_ROWS.map(row => row.value)
    expect(values).toEqual([1, 2, 4, 6, 8, 10])
    expect(MODULE_EFFECT_RARITY_ROWS).toHaveLength(6)

    // No plus tiers on a sub-effect, unlike a module.
    for (const row of MODULE_EFFECT_RARITY_ROWS) {
      expect(row.name, `${row.name} should not be a plus tier`).not.toMatch(/\+|plus/i)
    }
    expect(MODULE_RARITIES.some(r => r.includes('+'))).toBe(true)

    // And the two systems are different sizes, so one cannot index the other.
    expect(MODULE_EFFECT_RARITY_ROWS.length).not.toBe(MODULE_RARITIES.length)
  })

  it('counts the save rarity enum as one longer than the display list', () => {
    // The enum leads with `None` at 0, so an enum value is not an index into
    // MODULE_RARITIES — and 0 means "no module", not "Common".
    expect(TOWER_MODULE_RARITY_ENUM).toHaveLength(MODULE_RARITIES.length + 1)
    expect(TOWER_MODULE_RARITY_ENUM[0]).toMatchObject({ name: 'None', value: 0 })
    expect(TOWER_MODULE_RARITY_ENUM[1]).toMatchObject({ name: 'Common', value: 1 })
  })

  it('does not clamp the cost helpers at the maximum level', () => {
    // Documented as a trap: an out-of-range level yields a plausible number
    // rather than an error, so callers must clamp by rarity first. If this ever
    // starts clamping, the trap becomes wrong and should be removed.
    const atCap = getModuleCoinUpgradeCost(300)
    const beyondCap = getModuleCoinUpgradeCost(1000)

    expect(beyondCap, 'a level past the cap still returns a number').toBeGreaterThan(atCap)
    expect(Number.isFinite(beyondCap)).toBe(true)
  })

  it('keeps the enemy type list derived, and its gaps named', () => {
    // Both per-type tables are relative to Basic, so Basic is 1 in each and
    // absent from both. Every OTHER absence is a real gap, and the two tables do
    // not have the same gaps — that asymmetry is the trap, so it is pinned here
    // rather than left to be rediscovered.
    expect(ENEMY_TYPES).toHaveLength(ENEMY_TYPE_SUMMARIES.length)
    expect(ENEMY_TYPES).toContain('Basic')

    expect(ENEMY_BASE_COIN_VALUE).not.toHaveProperty('Basic')
    expect(ENEMY_HEALTH_MULTIPLE).not.toHaveProperty('Basic')

    // The fleet enemies are the ones with no coin value.
    expect([...ENEMY_TYPES_WITHOUT_COIN_VALUE].sort())
      .toEqual(['Commander', 'Overcharge', 'Saboteur'])
    expect([...ENEMY_TYPES_WITHOUT_HEALTH_MULTIPLE].sort())
      .toEqual(['Fast', 'Protector', 'Ranged'])

    // Every key in either table must be a real type, or the table is describing
    // an enemy the game does not have.
    for (const type of [...Object.keys(ENEMY_BASE_COIN_VALUE), ...Object.keys(ENEMY_HEALTH_MULTIPLE)]) {
      expect(ENEMY_TYPES, `"${type}" is not an enemy type`).toContain(type)
    }
  })

  it('maps all 31 masteries onto cards, including the two spelled differently', () => {
    // Verified against the wiki's Card Mastery Overview on 2026-08-17: all 31
    // stone costs and all 9 lab timings matched. What is NOT safe is joining the
    // two tables by name — `Package Chance` is the card `Recovery Package
    // Chance`, and `Berserker` is the card `Berzerker`.
    const cardNames = new Set(CARD_TEMPLATES.map(card => card.name))
    const masteryNames = Object.keys(CARD_MASTERY_STONE_COST)

    expect(masteryNames).toHaveLength(CARD_TEMPLATES.length)

    for (const mastery of masteryNames) {
      const card = CARD_MASTERY_NAME_TO_CARD[mastery] ?? mastery
      expect(cardNames.has(card), `mastery "${mastery}" resolves to no card (tried "${card}")`).toBe(true)
    }

    // The alias map must not rot into a list of names that already match.
    for (const [mastery, card] of Object.entries(CARD_MASTERY_NAME_TO_CARD)) {
      expect(mastery, 'alias entry is redundant — the names already match').not.toBe(card)
      expect(cardNames.has(mastery), `"${mastery}" is a real card name; the alias is wrong`).toBe(false)
    }
  })

  it('gives every tournament league a level-skip entry, zero included', () => {
    // Copper and Silver are 0. A missing key and a zero are different claims,
    // and only one of them is true — this listed Gold upward until 2026-08-17.
    for (const league of TOURNAMENT_LEAGUE_NAMES) {
      expect(
        TOURNAMENT_ENEMY_LEVEL_SKIP[league],
        `${league} has no enemy-level-skip entry`,
      ).toBeTypeOf('number')
    }
    expect(TOURNAMENT_ENEMY_LEVEL_SKIP.Copper).toBe(0)
    expect(TOURNAMENT_ENEMY_LEVEL_SKIP.Legend).toBe(0)
  })

  it('picks the wave-requirement rate that reproduces the formula worked example', () => {
    // The formula's own note: SPB 8% with 3 perks gives 64.8%, so
    // (200 - 3) x (1 - 0.648) = 69.344. That pins the per-perk rate without
    // reference to either name, which is what makes it a real check rather than
    // a restatement of the catalog.
    const perkName = Object.keys(STANDARD_PERK_MAX_QUANTITY).find(name =>
      name.startsWith('Perk Wave Requirement'),
    )
    expect(perkName, 'no wave-requirement perk in the oracle').toBeDefined()

    const rate = Number(/-([\d.]+)%/.exec(perkName ?? '')?.[1]) / 100
    expect(Number.isFinite(rate), `could not read a rate out of ${perkName}`).toBe(true)

    const reduction = rate * (1 + 8 / 100) * 3
    expect(Number((reduction * 100).toFixed(1)), 'reduction percent').toBe(64.8)
    expect(Math.floor((200 - 3) * (1 - reduction)), 'waves required').toBe(69)
  })
})
