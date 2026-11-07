ENEMY MECHANICS

Project: Samantha – The Tower
Database: Game Knowledge Base (GKB)
Document ID: GKB-ENEMY-001
Version: 1.1.0
Date: 2026-11-07
Status: Draft – Evidence Review Required
Owner: Samantha Project Owner

---

1. PURPOSE

This document defines the enemy mechanics reference for The Tower: Idle Tower Defense.

Its purpose is to help Samantha understand enemy characteristics, behavior, damage threats, population limits, spawn mechanics, and their strategic implications.

This document is an evidence-managed knowledge resource. Numerical values must not automatically be treated as verified game mechanics.

Core Principle: Optimize Decisions, Not Popularity.

2. EVIDENCE GOVERNANCE

Every important mechanic claim must have two independent classifications:

2.1 Evidence Status

Status| Definition
Verified| Confirmed by sufficiently strong and relevant evidence
Supported| Supported by credible evidence but not fully verified
Source-Reported| Reported by a source but not independently confirmed
Community-Tested| Tested by players under documented conditions
Calculated| Derived mathematically from documented inputs
Inference| Reasoned interpretation of available information
Hypothesis| Proposed explanation requiring testing
Unverified| Insufficient evidence
Conflict| Conflicting evidence remains unresolved
Superseded| Replaced by newer or more applicable information
Incorrect| Demonstrated to be incorrect

2.2 Confidence Level

Level| Definition
High| Evidence is strong, consistent, and applicable
Medium| Evidence is credible but has limitations
Low| Evidence is limited, indirect, or uncertain

Evidence Status and Confidence Level must never be treated as interchangeable.

A Source-Reported claim may have Medium confidence, but it must remain Source-Reported until its evidence status is legitimately upgraded.

2.3 Claim Requirements

Important claims should record:

- Claim ID
- Mechanic or subject
- Claim description
- Evidence Status
- Confidence Level
- Source name and URL
- Source type
- Applicable game version
- Source publication date, if available
- Verification date
- Conditions and limitations
- Related claims or conflicts

Missing information must be identified as unknown, not invented.

---

3. ENEMY CLASSIFICATION

The main enemy categories are:

1. Basic
2. Fast
3. Tank
4. Ranged
5. Protector
6. Boss
7. Elite

Fleet Escort is a separate encounter mechanic and must be analyzed independently from ordinary enemy populations.

---

4. ENEMY POPULATION LIMITS

The current research baseline contains the following reported limits:

Population| Reported Limit| Claim ID
Normal enemies| 120| ENM-CAP-001
Elite enemies| 20| ENM-CAP-002
Bosses| 10| ENM-CAP-003
Each Elite type| 8| ENM-CAP-004
Protectors| 10| ENM-CAP-005

Important distinctions

- Normal enemy population is not the same as total enemy population.
- Elite total population and per-type Elite population are separate limits.
- Protector population must not be confused with the Elite per-type limit.
- Fleet Escort has a separate population allowance.
- Total visible enemies may exceed the ordinary combined population limit when special encounter mechanics are active.

Evidence classification

Claim ID| Evidence Status| Confidence
ENM-CAP-001| Source-Reported| Medium
ENM-CAP-002| Source-Reported| Medium
ENM-CAP-003| Source-Reported| Medium
ENM-CAP-004| Source-Reported| Medium
ENM-CAP-005| Verified – Historical Change| High

ENM-CAP-005 note: The Protector cap was previously reported as 8 and subsequently changed to 10 in developer patch documentation. The historical change is documented; current-version compatibility should still be checked.

These values are research baselines, not permission to assume every encounter uses all available population slots.

---

5. ENEMY TYPES AND BEHAVIOR

5.1 Basic

Basic enemies are the standard enemy category and a reference point for several enemy scaling and damage comparisons.

Claim ID| Description| Evidence Status| Confidence
ENM-BAS-001| Basic is the reference enemy category for relative comparisons| Supported| Medium

5.2 Fast

Reported characteristics:

- Approximately 2x Basic movement speed.

Strategic implications:

- Fast enemies can reach the Tower more quickly.
- Crowd control and projectile coverage may be important.
- A Fast-related death does not automatically prove insufficient Tower damage.

Claim ID| Description| Evidence Status| Confidence
ENM-FST-001| Fast movement speed is approximately 2x Basic| Source-Reported| Medium

5.3 Tank

Reported characteristics:

- Approximately 5x Basic health.
- Approximately 0.5x Basic movement speed.

Strategic implications:

- Tanks require more effective damage to eliminate.
- Their slower movement may provide more time for damage and control effects.
- Surviving Tanks can contribute to enemy accumulation.

Claim ID| Description| Evidence Status| Confidence
ENM-TNK-001| Tank health is approximately 5x Basic| Source-Reported| Medium
ENM-TNK-002| Tank movement speed is approximately 0.5x Basic| Source-Reported| Medium

5.4 Ranged

Reported characteristics:

- Ranged enemies can attack from outside ordinary Orb range.

Strategic implications:

- Orb coverage alone does not guarantee protection against Ranged attacks.
- Samantha must distinguish ranged attacks from contact damage.
- Tower range, damage, crowd control, and defense should be evaluated together.

Claim ID| Description| Evidence Status| Confidence
ENM-RNG-001| Ranged enemies can attack outside ordinary Orb range| Source-Reported| Medium

5.5 Protector

Reported characteristics:

- Protectors provide a protective effect to nearby enemies.
- The reported damage reduction is approximately 60%.
- The documented simultaneous Protector cap is 10.

Strategic implications:

- Protected enemies may require substantially more effective damage.
- Protector count and survival duration can influence enemy density.
- Samantha should evaluate whether a player's damage bottleneck is caused by Protector shielding rather than insufficient base damage.

Claim ID| Description| Evidence Status| Confidence
ENM-PRO-001| Protector provides protection to nearby enemies| Supported| Medium
ENM-PRO-002| Protection reduces incoming damage by approximately 60%| Source-Reported| Medium
ENM-PRO-003| Protector simultaneous cap is 10| Verified – Historical Change| High

The exact interaction between Protector shielding and every damage source requires further validation.

5.6 Boss

Reported characteristics:

- Bosses have a separate simultaneous population limit.
- Bosses are not ordinarily eliminated by Orb, Death Ray, or Shockwave.
- Orb Boss Hit provides a specific Boss-related interaction.

Strategic implications:

- Ordinary enemy clearing and Boss elimination must be evaluated separately.
- Boss damage, damage amplification, and survival mechanics may determine tournament progression.
- A build that clears ordinary enemies efficiently may still lack sufficient Boss damage.

Claim ID| Description| Evidence Status| Confidence
ENM-BOS-001| Boss has a separate population limit| Source-Reported| Medium
ENM-BOS-002| Boss interaction with Orb, Death Ray, and Shockwave is restricted| Source-Reported| Medium
ENM-BOS-003| Orb Boss Hit provides a specific Boss interaction| Source-Reported| Medium

Do not interpret this list as a complete Boss immunity specification.

5.7 Elite

Elite enemies have distinct behaviors and can significantly influence survival and Cell acquisition.

Reported characteristics:

- Elite enemies have a separate population limit.
- Each Elite type has a reported simultaneous limit of 8.
- Several ordinary instant-kill and crowd-control mechanics have restricted interactions with Elites.
- Elite Cells are an important source of Lab Speed-up resources.

Claim ID| Description| Evidence Status| Confidence
ENM-ELT-001| Elite has a separate population limit| Source-Reported| Medium
ENM-ELT-002| Each Elite type has a limit of 8| Source-Reported| Medium
ENM-ELT-003| Elite Cells are used for Lab Speed-up| Supported| High

5.7.1 Vampire

Reported characteristics:

- Drains approximately 2% of maximum Tower health per second.
- Disables health regeneration and Lifesteal while its effect is active.

Claim ID| Description| Evidence Status| Confidence
ENM-VMP-001| Vampire drains approximately 2% maximum Tower health per second| Source-Reported| Medium
ENM-VMP-002| Vampire disables health regeneration and Lifesteal during its effect| Source-Reported| Medium

5.7.2 Ray

Reported characteristics:

- Charges its beam for approximately 30 seconds.
- Beam damage is approximately 2x Basic enemy damage.
- Ray is immune to Knockback.

Claim ID| Description| Evidence Status| Confidence
ENM-RAY-001| Ray charge duration is approximately 30 seconds| Source-Reported| Medium
ENM-RAY-002| Ray beam damage is approximately 2x Basic damage| Source-Reported| Medium
ENM-RAY-003| Ray is immune to Knockback| Source-Reported| Medium

Samantha must distinguish Ray charge duration, beam duration, and the interval between attacks. These are not automatically the same measurement.

5.7.3 Scatter

Reported characteristics:

- Scatter splits into 31 bodies.
- Only one resulting body provides Elite Cells.

Claim ID| Description| Evidence Status| Confidence
ENM-SCT-001| Scatter splits into 31 bodies| Source-Reported| Medium
ENM-SCT-002| Only one resulting body provides Elite Cells| Source-Reported| Medium

The exact interpretation of the 31-body count should be checked against game behavior and current documentation.

---

6. ENEMY COIN WEIGHTS

The following relative coin weights are reported in existing research:

Enemy| Relative Weight| Claim ID
Basic| 1| ENM-COIN-001
Fast| 2| ENM-COIN-002
Ranged| 2| ENM-COIN-003
Protector| 3| ENM-COIN-004
Tank| 4| ENM-COIN-005
Boss| 5| ENM-COIN-006
Elite| 4| ENM-COIN-007

Evidence Status: Source-Reported
Confidence: Medium

These values represent relative coin weights, not guaranteed final coin payouts.

Actual coin income may depend on:

- Coin bonuses
- Golden Tower
- Black Hole
- Death Wave
- Golden Bot
- Themes and other applicable bonuses
- Battle Conditions
- Enemy-specific eligibility
- Game version

Samantha must not use relative weights as direct coin payout values.

---

7. ENEMY MODIFIERS

7.1 Heat-Up

Reported mechanic:

- Enemy damage increases by approximately 4% per successful hit.

Claim ID: ENM-MOD-001
Evidence Status: Source-Reported
Confidence: Medium

7.2 Coin Decay

Reported mechanic:

- Enemies remaining alive for approximately 3 waves experience a 50% coin reduction.

Claim ID: ENM-MOD-002
Evidence Status: Source-Reported
Confidence: Medium

7.3 Mass Growth

Reported mechanic:

- Enemy mass increases by approximately 4% per wave alive.

Claim ID: ENM-MOD-003
Evidence Status: Source-Reported
Confidence: Medium

The exact implementation, stacking behavior, and applicable conditions require version-specific validation.

---

8. SPAWN MECHANICS

Enemy composition is not assumed to follow one universal percentage throughout an entire run.

Existing research based on battle reports indicates that enemy composition changes with wave progression.

Relevant variables include:

- Tier
- Wave
- Enemy category
- Spawn progression
- Battle Conditions
- Special encounters
- Fleet Escort
- Enemy population limits

Samantha must not extrapolate a single observed enemy distribution to every tier, wave, or game version.

Required data for spawn analysis

Each spawn observation should include:

- Tier
- Wave or wave range
- Game version
- Enemy counts by type
- Battle Conditions
- Run duration or observation interval
- Data source
- Collection method

Claim ID: ENM-SPN-001
Evidence Status: Community-Tested / Source-Reported
Confidence: Medium

Exact spawn probability formulas remain subject to further validation.

---

9. FLEET ESCORT

Fleet Escort is a special encounter mechanic and must be distinguished from ordinary enemy spawning.

Existing research reports:

- Approximately 10–14 matching escort enemies in an encounter.
- Escort enemies use a separate population allowance.
- Their presence can push total enemy population above the ordinary combined limit.

Claim ID| Description| Evidence Status| Confidence
ENM-FLT-001| Fleet Escort has a separate population allowance| Supported| Medium
ENM-FLT-002| An encounter can contain approximately 10–14 matching escorts| Source-Reported| Medium
ENM-FLT-003| Escorts can increase total population beyond the ordinary combined limit| Supported| Medium

The exact count and behavior must be rechecked against the applicable game version.

---

10. ENEMY IMMUNITY AND INTERACTION MATRIX

The following is a working reference, not a complete immunity specification.

Enemy| Reported Interaction
Boss| Restricted interaction with Orb, Death Ray, and Shockwave
Elite| Restricted interaction with Orb, Death Ray, Shockwave, and Black Hole
Ray| Immune to Knockback
Ranged| Can attack outside ordinary Orb range
Protector| Provides protection to nearby enemies

Evidence Status: Source-Reported / Supported
Confidence: Medium

Important rules:

- Do not infer immunity to an unlisted mechanic.
- Distinguish immunity, resistance, protection, and targeting restrictions.
- Record special exceptions separately.
- Recheck interactions after relevant patches.

---

11. ENEMY-RELATED DIAGNOSTIC FRAMEWORK

When a player reports a failed run, Samantha should investigate:

1. Which enemy caused the final damage?
2. Was it a Boss, Elite, or ordinary enemy?
3. Was a Protector active?
4. Was the enemy affected by a Battle Condition?
5. Was the failure caused by insufficient damage, insufficient crowd control, or a special mechanic?
6. Did the Tower die from contact damage, a projectile, a beam, or another effect?
7. Were multiple enemies contributing to the failure?
8. Did the enemy population approach its simultaneous limit?
9. Was the active preset appropriate for the run objective?
10. Is the reported death cause supported by battle-report evidence?

The last enemy shown in a battle report must not automatically be assumed to be the only cause of the run ending.

---

12. VALIDATION PRIORITIES

The following claims require further research, direct evidence, or reproducible testing.

Priority| Subject| Claim IDs
High| Enemy population limits| ENM-CAP-001 to ENM-CAP-004
High| Protector damage reduction| ENM-PRO-002
High| Ray damage and charge behavior| ENM-RAY-001 to ENM-RAY-003
High| Elite immunity interactions| ENM-ELT-001 to ENM-ELT-002
Medium| Scatter body count and Cell attribution| ENM-SCT-001 to ENM-SCT-002
Medium| Enemy coin weights| ENM-COIN-001 to ENM-COIN-007
Medium| Enemy modifiers| ENM-MOD-001 to ENM-MOD-003
Medium| Fleet Escort population| ENM-FLT-001 to ENM-FLT-003
Medium| Enemy spawn distribution| ENM-SPN-001

A claim must not be upgraded solely because it appears on multiple websites if those websites rely on the same original source.

---

13. STRATEGIC APPLICATION

Enemy mechanics support Samantha's analysis of:

- Damage requirements
- Crowd-control requirements
- Survival and defensive requirements
- Elite Cell acquisition
- Boss elimination
- Tournament performance
- Farming efficiency
- Death-cause analysis
- Enemy density and population pressure

Enemy type alone is insufficient to determine an upgrade priority.

Recommendations must also consider:

- Player objective
- Account progression
- Active preset
- Module configuration
- UW configuration
- System synergies
- Available resources
- Opportunity cost
- Evidence confidence

---

14. SOURCE REGISTRY REQUIREMENTS

Every important claim must eventually be linked to an entry in the External Sources & Evidence Registry (ESER).

Relevant source categories include:

1. Official developer patch notes and announcements.
2. Structured technical references such as TheTowerSDK.
3. Established community databases such as Tower Hub and Game Vault Wiki.
4. Reproducible player experiments.
5. Community guides and documented player experience.

A source reference must include its URL, source type, applicable version, and access or verification date whenever available.

Do not invent source URLs, publication dates, or verification results.

---

15. CHANGE MANAGEMENT

Every significant change must record:

- Claim ID
- Previous value or description
- New value or description
- Previous Evidence Status
- New Evidence Status
- Previous Confidence Level
- New Confidence Level
- Supporting evidence
- Game version
- Change date
- Review or approval status

Superseded information should remain traceable.

Only the Project Owner may approve promotion of player experiments into universal GKB knowledge.

---

16. DOCUMENT GOVERNANCE

This document is a structured research baseline.

Its numerical values are not all Verified.

Samantha must:

- Preserve the stated Evidence Status.
- Preserve the stated Confidence Level.
- Disclose uncertainty when answering users.
- Avoid presenting Source-Reported information as official fact.
- Avoid silently resolving conflicts.
- Revalidate version-sensitive claims.
- Request additional information when a mechanic depends on unknown conditions.

Guiding Principle:

An enemy is not merely a health value. Its movement, attack behavior, immunity, population limit, and interaction with other enemies determine the actual threat it presents.

Knowledge Integrity Rule:

Evidence determines what Samantha may claim. Confidence determines how strongly Samantha may express that claim. Neither may be replaced by popularity, repetition, or assumption.
