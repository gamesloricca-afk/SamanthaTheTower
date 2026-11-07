Enemy Mechanics

Project: Samantha – The Tower
Database: Game Knowledge Base (GKB)
Document ID: GKB-ENEMY-001
Version: 1.0.0
Date: 2026-11-07
Status: Draft – Requires Owner Review

---

1. Purpose

This document defines the known enemy mechanics in The Tower: Idle Tower Defense.

It provides a structured reference for enemy attributes, behaviors, damage threats, spawn mechanics, and strategic implications.

The objective is to help Samantha identify enemy-related bottlenecks instead of making recommendations based solely on total damage or wave progression.

2. Enemy Categories

Enemies are divided into several categories:

- Basic
- Fast
- Tank
- Ranged
- Protector
- Boss
- Elite

Fleet Escort enemies are an additional encounter mechanic and must be evaluated separately from the ordinary enemy population.

3. Enemy Population Limits

The following limits are documented in the current research baseline:

Category| Simultaneous Limit
Normal enemies| 120
Elite enemies| 20
Bosses| 10
Elite of each type| 8
Protectors| 10

Important distinctions:

- The ordinary population limit is not a universal maximum for every enemy encounter.
- Fleet Escort enemies can push the total population above the ordinary 150-enemy combined limit.
- The Elite per-type limit of 8 is different from the total Elite limit of 20.
- The Protector limit of 10 must not be confused with the Elite per-type limit.

Evidence status: Source-Reported / Supported. Recheck after relevant game updates.

4. Enemy Types and Behavior

4.1 Basic

Basic enemies are the standard enemy type.

They are used as the reference point for several enemy scaling and damage comparisons.

4.2 Fast

Known characteristics:

- Approximately 2x Basic movement speed.
- Their movement speed increases pressure on crowd control and projectile coverage.
- They can reach the Tower more quickly than ordinary enemies.

Strategic implications:

- Attack Speed and projectile coverage can influence how effectively Fast enemies are eliminated.
- Knockback, Orbs, and other crowd-control mechanics can affect their approach.
- A run ending with Fast enemies does not automatically mean Tower damage is insufficient; control and enemy density must also be examined.

4.3 Tank

Known characteristics:

- Approximately 5x Basic health.
- Approximately 0.5x Basic movement speed.

Strategic implications:

- Tanks require more damage or effective damage mechanics to eliminate.
- Their slower movement provides more time for damage and control effects.
- Tank survival can contribute to crowd accumulation.

4.4 Ranged

Known characteristics:

- Can attack from outside ordinary Orb range.
- Their ranged attack behavior creates a different threat profile from enemies that must physically reach the Tower.

Strategic implications:

- Samantha must distinguish ranged damage from contact damage.
- Orb-based strategies do not automatically solve Ranged threats.
- Range, projectile damage, crowd control, and defensive mechanics should be evaluated together.

4.5 Protector

Known characteristics:

- Provides a protective effect to nearby enemies.
- The documented shield effect reduces incoming damage by approximately 60%.
- Maximum simultaneous Protectors: 10.

Strategic implications:

- Protector presence can reduce effective damage against protected enemies.
- High enemy density combined with multiple Protectors can create a substantial damage bottleneck.
- Samantha should consider Protector count and survival duration when evaluating damage efficiency.

4.6 Boss

Known characteristics:

- Bosses have a separate simultaneous population limit.
- Bosses are immune to several ordinary instant-kill and control mechanics, including Orb, Death Ray, and Shockwave.
- Black Hole does not ordinarily eliminate Bosses, but Orb Boss Hit provides a specific interaction.

Strategic implications:

- Boss damage must be evaluated separately from ordinary enemy clearing.
- Boss Orb Hit, damage amplification, and defensive survival mechanics can be relevant.
- A build that clears ordinary enemies efficiently may still lack sufficient Boss damage.

4.7 Elite

Known characteristics:

- Elites have a separate population limit.
- Each Elite type has a documented simultaneous limit of 8.
- Elites are immune to several ordinary instant-kill and control mechanics, including Orb, Death Ray, Shockwave, and Black Hole.
- Elite Cells are an important source of Lab Speed-up resources.

Known Elite types include:

Vampire

- Drains approximately 2% of maximum Tower health per second.
- Disables health regeneration and Lifesteal while its effect is active.

Ray

- Charges its beam for approximately 30 seconds.
- Its beam deals approximately 2x Basic enemy damage.
- It is immune to Knockback.

Scatter

- Splits into 31 bodies.
- Only one of the resulting bodies provides Elite Cells.

Evidence status: Source-Reported / Supported. Individual behavior and numerical values require version-specific validation.

5. Enemy Coin Weights

The documented relative coin weights are:

Enemy| Relative Coin Weight
Basic| 1
Fast| 2
Ranged| 2
Protector| 3
Tank| 4
Boss| 5
Elite| 4

These are relative weights, not guaranteed final coin payouts.

Other coin multipliers, bonuses, and game conditions must be considered before calculating actual income.

6. Enemy Modifiers

6.1 Heat-Up

- Enemy damage increases by approximately 4% per successful hit.
- Repeated hits can make an enemy progressively more dangerous.

6.2 Coin Decay

- Enemies that remain alive for approximately 3 waves experience a 50% coin reduction.

6.3 Mass Growth

- Enemy mass increases by approximately 4% per wave alive.

Evidence status: Source-Reported / Supported. Confirm exact implementation against the applicable game version.

7. Spawn Mechanics

Enemy composition is not a fixed universal percentage throughout a run.

Research based on battle reports indicates that enemy composition changes with wave progression.

Samantha must not assume that one observed enemy distribution applies to all tiers, waves, or Battle Conditions.

Relevant variables include:

- Tier
- Wave
- Enemy type
- Spawn progression
- Battle Conditions
- Special encounter mechanics
- Fleet Escort
- Enemy population limits

A proper spawn analysis should identify its tier, wave range, and game version.

8. Fleet Escort

Fleet Escort is a special encounter mechanic.

Known research findings:

- An encounter can include approximately 10–14 matching escort enemies.
- Escort enemies use a separate population allowance.
- Their presence can push total enemy population above the ordinary 150-enemy combined limit.

Fleet Escort must therefore be tracked separately when evaluating enemy population and crowd density.

Evidence status: Source-Reported / Supported. Recheck against current patch documentation.

9. Enemy Immunity Reference

The following is a working reference, not a complete immunity specification.

Enemy| Known interactions
Boss| Immune to Orb, Death Ray, Shockwave; special Orb Boss Hit interaction
Elite| Immune to Orb, Death Ray, Shockwave, Black Hole
Ray| Immune to Knockback
Ranged| Can attack outside ordinary Orb range
Protector| Reduces damage received by protected enemies

Do not infer immunity to an unlisted mechanic from this table.

10. Enemy-Related Diagnostic Framework

When a player reports that a run ended, Samantha should investigate:

1. Which enemy caused the final damage?
2. Was the enemy a Boss, Elite, or ordinary enemy?
3. Was a Protector active?
4. Was the enemy affected by a Battle Condition?
5. Did the enemy reach the Tower through insufficient damage, insufficient crowd control, or a special mechanic?
6. Was the Tower killed by contact damage, a projectile, a beam, or another effect?
7. Were multiple enemies contributing to the failure?
8. Did the enemy population approach its simultaneous limit?

The last enemy shown in a battle report must not automatically be assumed to be the only cause of the run ending.

11. Data Required for Future Validation

The following topics require additional research or reproducible testing:

- Exact enemy spawn probability by tier and wave.
- Enemy scaling formulas and version compatibility.
- Full Elite immunity matrix.
- Protector shielding interactions with different damage sources.
- Fleet Escort population behavior under different conditions.
- Exact interaction between enemy modifiers and Battle Conditions.
- Enemy-specific damage attribution in battle reports.

12. Strategic Application

Enemy mechanics should be used by Samantha to evaluate:

- Damage requirements
- Crowd control requirements
- Survival and defensive requirements
- Elite Cell acquisition
- Boss elimination
- Tournament performance
- Farming efficiency
- Death-cause analysis

Enemy type alone is not sufficient to determine an upgrade priority.

Recommendations must consider player objectives, account configuration, active preset, available resources, and system synergies.

---

Document Principle:

An enemy is not merely a health value. Its movement, attack behavior, immunity, population limit, and interaction with other enemies determine the actual threat it presents.
