import { describe, expect, it } from 'vitest'
import {
  allEdges,
  allNodes,
  BERSERKER_MAX_BONUS_MULTIPLE,
  CARD_MASTERY_STONE_COST,
  CARD_MAX_LEVEL,
  COINS_PER_KILL_FORMULA,
  DAMAGE_FORMULA,
  DAMAGE_REDUCTION_OUTSIDE_DEFENSE_PERCENT,
  DEATH_PREVENTION_PRIORITY,
  DEFENSE_PERCENT_HARD_CAP,
  GAME_KNOWLEDGE,
  IRREVERSIBLE_UPGRADES,
  knowledgeFor,
  LAB_MAX_SLOTS,
  MASTERIES_THAT_SCALE_THE_CARD,
  MODULE_CURRENCIES,
  MODULE_RARITY_MAX_LEVEL,
  PERK_POOL_WEIGHTS,
  RECOVERY_MAX_HEALTH_MULTIPLE,
  relationsOf,
  REVERSIBLE_UPGRADES,
  trapsFor,
  ULTIMATE_WEAPON_STATS,
  ULTIMATE_WEAPON_STONE_COST,
  ULTIMATE_WEAPON_TOTAL_STONE_COST,
  ULTIMATE_WEAPONS_WITHOUT_COOLDOWN,
} from '../../src/knowledge'

/**
 * The knowledge graph is only worth having if it cannot lie.
 *
 * Its whole purpose is to be believed by someone — human or agent — who has no
 * way to check it in the moment. An uncited claim in here is worse than no
 * claim: it carries the authority of the file without the evidence, and the
 * next person inherits a guess as a fact.
 *
 * So the rules are structural: every node cites a source, every edge cites a
 * source, and no edge points at an entity that does not exist.
 */

describe('every claim is sourced', () => {
  it('gives every node at least one source', () => {
    for (const node of allNodes(GAME_KNOWLEDGE)) {
      expect(node.sources.length, `${node.id} has no source`).toBeGreaterThan(0)
      for (const source of node.sources) {
        expect(source.ref, `${node.id} has a source with no ref`).toBeTruthy()
        expect(source.verifiedAt, `${node.id} source ${source.ref} has no date`)
          .toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    }
  })

  it('gives every edge at least one source and a note', () => {
    for (const edge of allEdges(GAME_KNOWLEDGE)) {
      const id = `${edge.from} -${edge.kind}-> ${edge.to}`
      expect(edge.sources.length, `${id} has no source`).toBeGreaterThan(0)
      // The note is what settles an argument later. An edge without one is a
      // shape with no claim attached.
      expect(edge.note, `${id} has no note`).toBeTypeOf('string')
      expect(edge.note.length, `${id} has no note`).toBeGreaterThan(20)
    }
  })

  it('points every edge at entities that exist', () => {
    for (const edge of allEdges(GAME_KNOWLEDGE)) {
      expect(knowledgeFor(edge.from), `${edge.from} is not a node`).not.toBeNull()
      expect(knowledgeFor(edge.to), `${edge.to} is not a node`).not.toBeNull()
    }
  })

  it('gives every node a summary someone could act on', () => {
    for (const node of allNodes(GAME_KNOWLEDGE)) {
      expect(node.summary.length, `${node.id} summary is too thin`).toBeGreaterThan(40)
    }
  })

  it('separates opinion from mechanics', () => {
    /*
     * The wiki's Footguns page is real, careful, and sits in Category:Guides —
     * it argues positions ("you will thank yourself in the long run") beside
     * hard permanence rules. Storing both the same way is how an opinion gets
     * hard-coded into a calculator, or a real rule gets discarded as advice.
     *
     * So: anything marked sentiment must SAY so in its traps, loudly enough
     * that it survives being copied out of context.
     */
    const opinions = allNodes(GAME_KNOWLEDGE).filter(node => node.claimType === 'sentiment')
    expect(opinions.length, 'no sentiment is classified — the split is not being used')
      .toBeGreaterThan(0)

    for (const node of opinions) {
      const traps = (node.traps ?? []).join(' ')
      expect(traps, `${node.id} is sentiment but does not say so in its traps`)
        .toMatch(/sentiment/i)
    }
  })

  it('never lets opinion carry an implementation or a range', () => {
    // A sentiment node describing a valid range or naming an SDK export would
    // be laundering judgement into something a tool computes with.
    for (const node of allNodes(GAME_KNOWLEDGE)) {
      if (node.claimType !== 'sentiment') continue
      expect(node.validRange, `${node.id} is opinion but declares a validRange`).toBeUndefined()
      expect(node.implementedBy ?? [], `${node.id} is opinion but names an implementation`)
        .toEqual([])
    }
  })

  it('gives every node a unique id', () => {
    // Families are merged by spreading arrays. A duplicated id would make
    // knowledgeFor return the first and silently discard the second — the graph
    // would look complete and answer with half of it.
    const seen = new Set<string>()
    for (const node of allNodes(GAME_KNOWLEDGE)) {
      expect(seen.has(node.id), `${node.id} is declared twice`).toBe(false)
      seen.add(node.id)
    }
  })

  it('connects every node to at least one other', () => {
    // An orphan node is knowledge that `relationsOf` and `trapsFor` will never
    // surface from a neighbour — reachable only by knowing its id in advance,
    // which is precisely what an agent does not know.
    for (const node of allNodes(GAME_KNOWLEDGE)) {
      expect(relationsOf(node.id).length, `${node.id} is orphaned`).toBeGreaterThan(0)
    }
  })
})

describe('the facts that were got wrong', () => {
  /*
   * Each of these is a mistake made while porting Effective Paths, encoded so
   * it cannot be made silently again. They are not illustrative — they are the
   * actual defects.
   */

  it('knows a star tier is its own rung, not decoration', () => {
    // `Ancestral 5*` was treated as `Ancestral` with a suffix to strip. It is a
    // separate rung worth a hundred more levels.
    expect(MODULE_RARITY_MAX_LEVEL['Ancestral']).toBe(200)
    expect(MODULE_RARITY_MAX_LEVEL['Ancestral 5']).toBe(300)
    expect(MODULE_RARITY_MAX_LEVEL['Ancestral 5'])
      .toBeGreaterThan(MODULE_RARITY_MAX_LEVEL['Ancestral'])
  })

  it('knows the 5-star banner adjustment needs an unmaxed module to feed', () => {
    // A first reading swapped the maxed and unmaxed dictionaries and applied
    // 0.25x unconditionally, which invented a featured-banner boost that the
    // game never gives an all-5-star account.
    const banner = allNodes(GAME_KNOWLEDGE).find(node => node.id === 'module.banner')
    expect(banner, 'module.banner is not recorded').toBeDefined()
    const said = (predicate: string) =>
      banner?.assertions?.find(a => a.subject === 'module.banner' && a.predicate === predicate)?.value
    expect(said('adjustsOnlyWhenRarityHasMaxedAndUnmaxed')).toBe(true)
    expect(said('featuredModuleAdjusted')).toBe(false)
    expect(said('maxedModuleChanceMultiplier')).toBe(0.25)
    expect(trapsFor('module.banner').join(' ')).toMatch(/UNMAXED/)
  })

  it('knows an assist is weaker than what it assists', () => {
    // The port showed an assist bonus of 29.13 against a primary of 1.36.
    const derived = relationsOf('assistModule')
      .find(edge => edge.kind === 'derivedFrom' && edge.to === 'module')

    expect(derived, 'the assist/module relationship is not recorded').toBeDefined()
    expect(derived?.note).toMatch(/weaker/i)
  })

  it('knows the three assist purchases are separate', () => {
    const separate = relationsOf('assistModule.rarity')
      .some(edge => edge.kind === 'separatePurchaseFrom')
    const levelIndependent = relationsOf('assistModule.level')
      .some(edge => edge.kind === 'independentOf')

    expect(separate, 'rarity and efficiency are not recorded as separate').toBe(true)
    expect(levelIndependent, 'assist level is not recorded as independent').toBe(true)
  })

  it('knows a sub-effect rarity does not follow its module', () => {
    expect(
      relationsOf('module.subEffect').some(edge => edge.kind === 'independentOf'),
      'the independence of sub-effect rarity is not recorded',
    ).toBe(true)
  })

  it('knows two ultimate weapons have no cooldown stat', () => {
    // A "keep cooldowns synced" control was built as though all nine shared the
    // stat. Chain Lightning's third stat is Chance and Spotlight's is Quantity.
    for (const name of ULTIMATE_WEAPONS_WITHOUT_COOLDOWN) {
      expect(ULTIMATE_WEAPON_STATS[name], `${name} has no stat list`).toBeDefined()
      expect(ULTIMATE_WEAPON_STATS[name]).not.toContain('Cooldown')
    }
    // ...and that the exclusion list is exhaustive, so it cannot rot as a
    // hand-maintained subset of the real thing.
    const missing = Object.entries(ULTIMATE_WEAPON_STATS)
      .filter(([, stats]) => !stats.includes('Cooldown'))
      .map(([name]) => name)
    expect(missing.sort()).toEqual([...ULTIMATE_WEAPONS_WITHOUT_COOLDOWN].sort())
  })

  it('knows every ultimate weapon has exactly three stats', () => {
    expect(Object.keys(ULTIMATE_WEAPON_STATS)).toHaveLength(9)
    for (const [name, stats] of Object.entries(ULTIMATE_WEAPON_STATS)) {
      expect(stats, `${name} does not have three stats`).toHaveLength(3)
    }
    expect(ULTIMATE_WEAPON_STONE_COST.reduce((a, b) => a + b, 0))
      .toBe(ULTIMATE_WEAPON_TOTAL_STONE_COST)
  })

  it('knows Berserker is added outside the damage product', () => {
    // The single most misleading term in the formula: every other factor
    // multiplies, so a chain that folds Berserker in is right in shape and
    // wrong at every value.
    // Split at the trailing addition, not at every '+' — the inner terms carry
    // their own, e.g. "(1 + Relics)".
    expect(DAMAGE_FORMULA).toMatch(/\+ Berserker$/)

    const product = DAMAGE_FORMULA.replace(/\+ Berserker$/, '')
    expect(product).not.toMatch(/Berserker/)
    // Everything before the addend is a product.
    expect(product).toMatch(/×/)
    expect(BERSERKER_MAX_BONUS_MULTIPLE).toBe(7)
  })

  it('knows some damage reduction is not Defense %', () => {
    // These three bypass the 98% cap AND apply after defense absolute. Summing
    // them into defense percent gets both the cap and the order wrong.
    expect(DEFENSE_PERCENT_HARD_CAP).toBe(0.98)
    expect(DAMAGE_REDUCTION_OUTSIDE_DEFENSE_PERCENT).toContain('Flame Bot')
    expect(DAMAGE_REDUCTION_OUTSIDE_DEFENSE_PERCENT).toContain('Chrono Field Damage Reduction')

    const trap = trapsFor('defensePercent').join(' ')
    expect(trap).toMatch(/after defense absolute/i)
  })

  it('knows Super Tower does not feed ultimate weapons', () => {
    const edge = relationsOf('damage.superTower')
      .find(e => e.kind === 'independentOf' && e.to === 'damage')

    expect(edge, 'Super Tower independence is not recorded').toBeDefined()
    expect(edge?.note).toMatch(/ultimate weapons/i)
  })

  it('knows death prevention is an ordered chain, not independent chances', () => {
    // Multiplying these survival odds together treats them as stacking, when in
    // fact they compete for the same lethal hit.
    expect(DEATH_PREVENTION_PRIORITY[0]).toBe('Death Defy')
    expect(DEATH_PREVENTION_PRIORITY[1]).toBe('Energy Shield')
    expect(DEATH_PREVENTION_PRIORITY.length).toBeGreaterThan(2)

    const traps = trapsFor('deathPrevention').join(' ')
    expect(traps).toMatch(/ordered, not independent/i)
  })

  it('knows the CPK enhancement double-count is intentional', () => {
    // A model that "corrects" this will disagree with the game. It must be
    // recorded loudly enough that nobody quietly removes it.
    const traps = trapsFor('coinsPerKill').join(' ')
    expect(traps).toMatch(/double counted/i)
    expect(COINS_PER_KILL_FORMULA).toMatch(/enhancement/i)

    // The trade-off term defaults to 1, never 0 — a zero collapses the product.
    expect(traps).toMatch(/is 1, NOT 0/)
  })

  it('knows packages are the only heal that exceeds max health', () => {
    expect(RECOVERY_MAX_HEALTH_MULTIPLE).toBeGreaterThan(1)
    const traps = trapsFor('recoveryPackage').join(' ')
    expect(traps).toMatch(/lifesteal and health regen cannot/i)
  })

  it('knows the same stat can be reversible or not by source', () => {
    // Bot medal cooldown respecs; bot cooldown labs do not. A tool treating
    // them as one field gets the confirmation step wrong half the time.
    expect(Object.keys(REVERSIBLE_UPGRADES).join(' ')).toMatch(/bot medal/i)
    expect(IRREVERSIBLE_UPGRADES.join(' ')).toMatch(/lab/i)

    const edge = relationsOf('upgradePermanence').find(e => e.to === 'bot.cooldown')
    expect(edge?.note).toMatch(/respecced/i)
  })

  it('records the deterministic Enemy Level Skip model without claiming independent verification', () => {
    const traps = trapsFor('enemyLevelSkip').join(' ')
    expect(traps).toMatch(/not random/i)
    expect(traps).toMatch(/deterministic/i)
    const assertion = knowledgeFor('enemyLevelSkip')?.assertions
      ?.find(a => a.predicate === 'isDeterministic')
    expect(assertion?.value).toBe(true)
    expect(assertion?.verification).toBe('unverified')
    expect(assertion?.provenance.origin).toBe('code')
  })

  it('knows a mastery is not simply a bigger card', () => {
    // Roughly half of masteries add an unrelated mechanic rather than scaling
    // the card's own stat, so a scalar model is wrong for half the deck.
    expect(MASTERIES_THAT_SCALE_THE_CARD.length)
      .toBeLessThan(Object.keys(CARD_MASTERY_STONE_COST).length / 2)

    const traps = trapsFor('cardMastery').join(' ')
    expect(traps).toMatch(/must be equipped/i)
  })

  it('disambiguates the pairs that actually get confused', () => {
    /*
     * Each of these pairs shares a name, a menu or a unit, and each has been
     * conflated in this repo. Accurate description of one does not prevent the
     * confusion — only naming it does.
     */
    const mustDisambiguate = [
      'module.economy',
      'module.upgradeCost',
      'coinsPerWave',
      'workshopEnhancement',
      'lab.boost',
    ]

    for (const id of mustDisambiguate) {
      const node = knowledgeFor(id)
      expect(node, `${id} is missing`).not.toBeNull()
      expect(node?.disambiguation, `${id} has no disambiguation`).toBeTruthy()
      // It must be a contrast, not a restatement of the summary.
      expect(node?.disambiguation, `${id} disambiguation does not contrast`)
        .toMatch(/\bnot\b/i)
    }
  })

  it('knows module shards are per type and reroll shards are not', () => {
    // The two currencies are both called shards and behave oppositely — the
    // single most confusable thing in the module system.
    const traps = trapsFor('module.economy').join(' ')
    expect(traps).toMatch(/PER TYPE/)
    expect(traps).toMatch(/REROLL SHARDS ARE NOT PER TYPE/)
    expect(Object.keys(MODULE_CURRENCIES)).toHaveLength(5)
  })

  it('knows assist efficiency is per module TYPE, not per module', () => {
    /*
     * The graph originally implied this was a per-module stat. It is one value
     * shared by every module of a type — so a planner pricing it per module
     * overstates the cost fourfold and undervalues the upgrade.
     */
    const node = knowledgeFor('assistModule.efficiency')
    expect(node?.disambiguation).toMatch(/not per module/i)
    expect(trapsFor('assistModule.efficiency').join(' ')).toMatch(/ONE VALUE PER TYPE/)
  })

  it('knows merge order decides what survives', () => {
    // The first module selected keeps its level and sub-effects; the rest are
    // fodder. Modelling a merge as symmetric loses well-rolled sub-effects and
    // no cost model sees the loss.
    const traps = trapsFor('module.merge').join(' ')
    expect(traps).toMatch(/ORDER OF SELECTION DECIDES WHAT SURVIVES/)

    // And a merge does not raise current level — only the ceiling.
    const edge = relationsOf('module.merge')
      .find(e => e.kind === 'independentOf' && e.to === 'module.level')
    expect(edge, 'merge/level independence is not recorded').toBeDefined()
  })

  it('knows a banned effect leaves the pool entirely', () => {
    // Not a weighting. Every ban in this game removes the entry, which makes
    // each successive ban worth more than the last.
    const traps = trapsFor('module.effectBan').join(' ')
    expect(traps).toMatch(/REMOVED ENTIRELY, not down-weighted/)
  })

  it('knows the caps that bound a plan', () => {
    // Each of these has been exceeded by a generated plan at least once.
    expect(CARD_MAX_LEVEL).toBe(7)
    expect(LAB_MAX_SLOTS).toBe(5)
  })

  it('knows the perk pool weights are a complete partition', () => {
    const total = Object.values(PERK_POOL_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('surfaces the traps for a mechanic without being asked for each one', () => {
    const traps = trapsFor('assistModule')

    // The point of `trapsFor`: one call before touching a mechanic returns
    // everything already known to go wrong with it and its neighbours.
    expect(traps.length).toBeGreaterThan(2)
    expect(traps.join(' ')).toMatch(/separate purchases|hard caps/i)
  })
})
