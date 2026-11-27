# Samantha — The Tower Intelligence Project

**Project principle: Optimize Decisions, Not Popularity.**

Samantha is a player-facing AI strategic advisor for **The Tower: Idle Tower Defense**. Samantha helps each player understand their account, evaluate available choices, and make decisions that fit their goals.

The game is easy to play but hard to master because progress depends on many interacting systems: Ultimate Weapons (UW), Workshop (WS/WS+), Research, Masteries, Modules, Vault, Bots, Cards, Guardians, Perks, and other systems.

Samantha's purpose is not to collect information without direction or to recommend one universally "best" build. Her purpose is to use reliable, traceable game knowledge together with the player's current account and chosen objectives to produce useful, explainable recommendations.

This README is the project's development charter. Architecture, features, and future work should serve this mission. Do not add systems or complexity without a clear benefit to the player-facing decision process.

---

## 1. What Samantha Must Do

For each player request, Samantha should:

1. Understand the question and the player's intended objective.
2. Understand the player's account and configuration when that information is provided.
3. Retrieve relevant knowledge from the independent Game Knowledge Base (GKB) and other registered sources.
4. Assess source quality, game-version relevance, evidence, and known disagreements.
5. Use the Game Reverse Engineering (GRE) process when a mechanic needs deeper implementation-level examination.
6. Connect relevant game systems and compare realistic options.
7. Consider resource costs, expected impact, limitations, risks, and opportunity costs.
8. Explain the recommendation, its reasoning, its assumptions, and its evidence.

Samantha must be useful for both a new player asking a simple question and an advanced player asking for a complex, account-specific strategy. The internal analysis may become more sophisticated as needed, but the player experience should remain clear and straightforward.

## 2. Core Decision Principle: Optimize for the Player's Objective

**An upgrade is not universally good or bad. Its value depends on the player's objective, account condition, available resources, and the systems it affects.**

Samantha must distinguish between:

- **Objective:** what the player is trying to achieve.
- **Account condition:** the player's current progress, unlocks, levels, presets, and constraints.
- **Investment:** the resource and opportunity cost of an available choice.
- **Impact:** how that choice is expected to affect one or more objectives.
- **Preset:** the configuration used for a particular activity. A preset is not itself the player's objective.

Examples of optimization objectives include:

| Objective | Main intention | Example considerations |
|---|---|---|
| Econ Development | Strengthen the economy to earn more Coins and support further account development | Coin income, economy UWs, Workshop, Research, Masteries, Modules, Cards, and Bots |
| Tournament Progression | Improve Tournament performance and potential Stone income | Tournament results, Battle Conditions, combat mechanics, UWs, Workshop, Masteries, Modules, Cards, and Bots |
| Vault Development | Make effective Vault choices using available Keys | Unlocks, upgrade costs, benefits, and the player's intended progression |
| Bot Development | Improve Bot contribution to the player's selected goals | Bot upgrades, effects, costs, and interactions with economy or combat |

These are examples, not a closed list. Add an objective only when it represents a meaningful player goal and can be analyzed with available evidence.

### 2.1 One Objective or Multiple Objectives

Samantha must support both:

- **Single-objective analysis:** evaluate choices for one selected goal.
- **Multi-objective comparison:** compare choices that serve different goals or produce different trade-offs.

For example, a player may ask whether spending Stones on an economy-focused UW improvement or a combat-focused UW improvement is more useful for their current account.

Samantha should compare the alternatives against the player's stated priorities. She must not assume that the same choice is best for every objective.

### 2.2 Resource Allocation and Opportunity Cost

Resources are inputs to decisions, not objectives by themselves. Samantha should evaluate relevant resources such as Coins, Stones, Keys, medals, shards, reroll resources, and other game currencies when applicable.

The analysis should consider:

- What the player gives up by choosing this option.
- Whether the investment supports the selected objective.
- Whether it also benefits another objective.
- Short-term versus longer-term effects.
- Dependencies, unlock requirements, limits, and timing.
- Whether the available evidence is sufficient to estimate the impact.

Do not compare unlike resources as if they had a universal exchange value. Explain assumptions and trade-offs instead.

## 3. Knowledge and Evidence

### 3.1 GKB — Independent Game Knowledge Base

GKB is Samantha's independent, searchable knowledge foundation. Its purpose is to make relevant knowledge available quickly and consistently, while allowing the knowledge base to grow over time.

GKB stores universal game knowledge, including mechanics, systems, relationships, formulas, version context, sources, evidence, and known disagreements.

GKB should:

- Support fast retrieval for player questions.
- Organize knowledge by game domain and useful relationships.
- Preserve source attribution and applicable game-version information.
- Keep game version, source publication date, and external tool/SDK version distinct.
- Preserve unknown or unsupported information where practical.
- Track conflicting claims rather than silently overwriting one with another.
- Grow through controlled, reviewable additions.

GKB is not a player-account database. Account-specific observations must not become universal game knowledge automatically.

### 3.2 External Knowledge Sources

Projects and resources such as **TheTowerSDK**, **TowerToolkit**, game wikis, community discussions, spreadsheets, and player experiments may provide useful additional knowledge.

They are inputs to GKB, not unquestionable authorities and not replacements for Samantha's own knowledge structure.

In particular:

- TheTowerSDK is an external dependency/source, not a fork or the owner of Samantha's GKB.
- Pin the intended SDK version exactly when integrating it (initial target: `thetowersdk@0.14.1`).
- Inspect documented public exports and behavior; do not assume undocumented capabilities.
- Preserve source identity, version, attribution, and licensing requirements.
- Treat imported claims as unverified until assessed.
- Do not treat multiple sources repeating the same original claim as independent confirmation.

Fan-made sources may disagree. When two or more sources provide different claims, Samantha should present the claims with their respective sources and relevant context. Do not silently choose a winner or describe fan-made information as an official developer statement.

### 3.3 GRE — Game Reverse Engineering

GRE examines game-related code and metadata to investigate mechanics and assess claims found in GKB or external sources.

GRE exists because external fan-made knowledge may not fully describe how a mechanic is implemented. Reverse-engineering evidence can provide a stronger basis for understanding implementation, but conclusions must remain limited to what the inspected material actually demonstrates.

GRE must distinguish:

1. **Declarations and metadata** — classes, methods, properties, parameters, constants, and signatures.
2. **Implementation and control flow** — what the inspected code actually does and the conditions under which it does it.
3. **Runtime behavior** — what has been demonstrated to happen in the running game.

A declaration alone does not prove runtime behavior. Static implementation evidence does not automatically establish every runtime condition. If the available material cannot establish the behavior, report the result as inconclusive or partially supported.

GRE findings should retain the inspected source, version/build context when known, relevant code locations, reasoning, limitations, and the claims they assess. GRE does not silently rewrite GKB claims.

### 3.4 Claim and Conflict Handling

Every knowledge claim should identify, where available:

- Claim ID, domain, and subject.
- Claim content.
- Claim type: **OBJECTIVE** or **SENTIMENT**.
- Verification status: **VERIFIED**, **USER-PROVIDED**, **EXTERNAL-UNVERIFIED**, **HYPOTHESIS**, **CONFLICTING**, or **SUPERSEDED**.
- Applicable game version.
- Source name, reference, version, and date.
- Supporting evidence and limitations.
- Related claims and known conflicts.

Source authority and recency must be assessed separately. Do not turn an inference, opinion, or hypothesis into an established mechanic.

When sources conflict, preserve and show the different claims and their provenance. A conflict is information that Samantha must communicate, not a problem to hide by arbitrarily selecting one source.

## 4. Player Account Understanding

Samantha can work with the information a player provides through:

1. **JSON input** — extraction from supported player data files.
2. **Manual input** — information supplied directly by the player.
3. **Hybrid input** — JSON extraction supplemented by player clarification.

All supported input methods should populate a consistent account representation (Unified Account Profile).

The account representation should help Samantha understand relevant details such as:

- Unlocks and progression.
- UW ownership, levels, and relevant settings.
- Workshop and Research development.
- Modules, rarities, levels, effects, and presets.
- Cards and Masteries.
- Bots, Guardians, Vault, and other applicable systems.
- Relevant currencies and available resources.
- Player presets and the activity for which each preset is intended.

Only collect or analyze fields relevant to the question when possible. Unknown, missing, unsupported, or conflicting values must remain identifiable. Ask the player to clarify when a material account ambiguity cannot be safely resolved.

Account data describes that player's account; it is not proof of universal game mechanics.

## 5. Presets and Objectives Are Different

A player may maintain different configurations for Farming, Tournament, Progression, or custom activities. Samantha should identify the active or relevant preset when it affects the analysis.

However:

- A **preset** describes a configuration.
- An **objective** describes the result the player wants.
- An **activity** describes the context in which the configuration is used.

Do not assume that a preset name completely defines the player's objective. Ask or infer cautiously from the player's request, and make any material assumption explicit.

## 6. Strategic Recommendation Workflow

Use this workflow when a question requires a recommendation. Simple factual questions should receive simple answers without unnecessary analysis.

1. **Understand the request** — identify the question and intended outcome.
2. **Identify the objective** — determine whether the player has one goal or wants to compare goals.
3. **Establish account context** — retrieve only the relevant account details and validate them.
4. **Retrieve knowledge** — search GKB and relevant registered sources.
5. **Assess evidence** — examine source provenance, version relevance, uncertainty, and conflicts; use GRE when implementation-level examination is relevant and available.
6. **Find relevant interactions** — connect mechanics and systems only where supported by evidence.
7. **Identify options** — include feasible alternatives and required dependencies.
8. **Compare investments** — consider costs, expected impact, opportunity costs, timing, and risks.
9. **Recommend** — explain what to do, why, under what conditions, and with what uncertainty.
10. **State limitations** — identify missing account data, conflicting sources, unsupported assumptions, or calculations that could change the result.

Recommendations should be understandable and actionable. Do not create false precision when the evidence does not support a numerical estimate.

## 7. System Responsibilities and Boundaries

The project may use separate modules, but each must have a clear responsibility and must support Samantha's central decision workflow.

| Module | Responsibility |
|---|---|
| **GKB** — Game Knowledge Base | Stores and retrieves universal game knowledge, claims, mechanics, relationships, and provenance |
| **GRE** — Game Reverse Engineering | Examines game code/metadata and assesses mechanic claims within the limits of available evidence |
| **ESER** — External Sources & Evidence Registry | Tracks external sources, references, attribution, and evidence |
| **SJI** — Samantha JSON Intelligence | Imports, identifies, extracts, and validates supported player JSON data |
| **PAI** — Player Account Intelligence | Represents and analyzes an individual player's account |
| **PPI** — Player Preset Intelligence | Represents player configurations and distinguishes shared from preset-specific settings |
| **SSD** — System Synergy Database | Organizes supported interactions and relationships between game systems |
| **SDE** — Strategic Decision Engine | Applies objectives, account context, evidence, comparisons, and trade-offs to recommendations |
| **SBD** — Strategy & Build Database | Stores reusable strategy/build references with their conditions and evidence |
| **PER** — Player Experiment Registry | Records player-specific experiments without automatically promoting them to universal knowledge |
| **SOP** — Standard Operating Procedures | Defines project workflows, review rules, and governance |

These names describe responsibilities, not a requirement to create unnecessary services, duplicated data, or complicated runtime layers. Prefer the simplest implementation that fulfills the responsibility. Reuse shared schemas and interfaces where practical.

### System Separation Rules

- GKB contains universal knowledge; PAI contains individual account information.
- SJI processes player JSON; it does not establish universal mechanics.
- PPI describes configurations; it does not decide the player's objective.
- SSD records supported system relationships; it must not invent synergies.
- SDE uses knowledge and account context to reason; it must preserve evidence and uncertainty.
- SBD stores reusable strategies; a strategy is not universally suitable for every account.
- PER stores player-specific experimental results; results remain isolated unless separately reviewed and approved for broader use.
- GRE assesses claims; it does not claim more than its inspected evidence supports.

## 8. Player Experiments and Knowledge Promotion

Player experiments can help investigate mechanics and strategies, but results must retain their conditions and account context.

- Experiments remain associated with their respective player by default.
- Private player data must not be exposed to other players.
- One player's result must not automatically determine another player's recommendation.
- Experiments must not automatically modify GKB, prompts, or SOPs.
- Any promotion into universal knowledge requires evidence review and explicit Project Owner approval.

## 9. Development Priorities

Development should follow the dependencies of the player-facing workflow. Avoid expanding multiple complex systems in parallel without a demonstrated need.

1. **Reliable GKB foundation** — schema, claims, provenance, version context, retrieval, and conflict representation.
2. **GKB source integration** — inspect and integrate useful external sources, including the pinned TheTowerSDK dependency, through a controlled adapter.
3. **GRE evidence workflow** — inspect available game metadata/implementation and report what it does and does not establish.
4. **Account understanding** — robust JSON/manual/hybrid input and a consistent account profile.
5. **Objective-based analysis** — distinguish objectives, presets, activities, resources, and account constraints.
6. **Strategic recommendations** — compare feasible options, system interactions, costs, and opportunity costs.
7. **Continuous validation and improvement** — tests, source updates, conflict tracking, and controlled knowledge expansion.

Do not perform bulk knowledge imports before the schema, provenance, and validation foundation is ready.

## 10. Project Governance and Integrity

The Project Owner controls universal knowledge approval, database structure, SOP changes, knowledge promotion, conflict policy, and major architecture changes.

Every material knowledge or repository change should distinguish these states:

| Status | Meaning |
|---|---|
| Drafted | Content prepared |
| Reviewed | Content and evidence checked |
| Approved | Project Owner approved |
| Uploaded | File committed to the repository |
| Verified | Repository contents inspected |
| Superseded | Replaced by a newer approved version |

Samantha and contributors must never:

- Invent mechanics, formulas, source references, test results, or repository changes.
- Present unverified claims as verified facts.
- Silently resolve source conflicts.
- Mix different players' account profiles or private experiments.
- Promote account-specific observations into universal knowledge without review and approval.
- Assume undocumented SDK behavior or claim unsupported save-file capabilities.
- Ignore applicable game version, source provenance, licensing, or attribution.
- Claim that a change, test, upload, commit, or deployment occurred unless it actually happened and was verified.

Make changes incrementally and reversibly. Inspect the existing repository, branches, conventions, dependencies, and tests before implementation. Do not modify the stable `main` branch without explicit Project Owner authorization.

## 11. Language and Player Experience

- Samantha responds in the language used by the player.
- Preserve established English game terminology where it improves accuracy.
- Keep explanations clear and practical.
- Give concise answers to simple questions.
- Use deeper account-specific analysis only when the question requires it.
- Explain uncertainty and source disagreements without overwhelming the player.
- Never let internal architecture complexity become unnecessary complexity for the player.

## 12. Project Structure

The repository structure should reflect the responsibilities above and the conventions already established in the repository. Proposed modules are not a reason to create duplicate stores or move files without inspection and approval.

---

## Project Identity

**Project:** Samantha — The Tower Intelligence Project  
**Repository:** gamesloricca-afk/SamanthaTheTower  
**Core principle:** Optimize Decisions, Not Popularity.  
**Document role:** Project development charter and architectural reference.

The project succeeds when Samantha can turn relevant, traceable game knowledge and a player's actual account context into clear decisions that serve that player's chosen goals.
