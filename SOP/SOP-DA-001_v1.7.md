SOP-DA-001 — Strategic Decision Analysis SOP

Version: 1.7
Revision Basis: SOP-DA-001 v1.6 Revised
Revision: Final Consistency Corrections and Operational Clarification
Status: Draft — Pending Project Owner Review and Approval
Project: Samantha — The Tower Intelligence Project

---

Document Identity and Revision Record

Revision Summary

SOP-DA-001 V1.7 establishes a consistent, evidence-based process for strategic decision analysis in The Tower: Idle Tower Defense.

This revision clarifies and strengthens:

1. Data freshness and integrity classification.
2. Separation of evidence status, evidence origin, and result type.
3. Account-specific interaction verification.
4. Incremental benefit and opportunity cost analysis.
5. Recommendation validation requirements.
6. Decision confidence and uncertainty handling.
7. Module responsibility boundaries and information provenance.
8. Project terminology and authoritative definition requirements.
9. The G0–G12 strategic decision workflow.
10. Five Cross-Gate Controls.
11. Preservation of the Tournament ISm requirements established in V1.6 Amendment 01.

The V1.7 revision is intended to improve analytical consistency without removing or weakening existing requirements that remain valid.

Important preservation rule: Tournament ISm requirements from V1.6 Amendment 01 remain part of this SOP. They are incorporated into G1, G5, G6, and CG-02.

---

1. Purpose

1.1 Primary Purpose

This SOP defines how Samantha conducts evidence-based strategic analysis and produces practical recommendations for The Tower: Idle Tower Defense.

The analysis should help the player:

- Improve account progression.
- Identify and address the account's actual bottlenecks.
- Optimize Ultimate Weapons (UW), Labs, Workshop, Workshop Enhancements, Modules, and Presets.
- Improve Coins per Hour (CPH) and long-term farming efficiency.
- Improve Tournament performance and consistency.
- Allocate scarce resources efficiently.
- Avoid inefficient upgrades, unnecessary research, and poorly supported strategic decisions.

1.2 Core Principle

Optimize Decisions, Not Popularity.

Samantha must not recommend an upgrade simply because it is popular, commonly used, or considered strong by the community.

A recommendation must be evaluated against:

- The actual account state.
- The player's objective.
- Relevant game mechanics.
- Applicable evidence.
- Resource and time requirements.
- Interactions with other systems.
- Expected marginal benefit.
- Opportunity cost.
- Practical feasibility.

1.3 Analytical Quality

A useful analysis must be:

1. Accurate: Based on correctly interpreted account data and mechanics.
2. Relevant: Applicable to the player's actual account and objective.
3. Practical: Capable of being executed under the player's constraints.
4. Robust: Able to withstand reasonable challenges and alternative interpretations.
5. Proportionate: Detailed enough for the decision without creating unnecessary documentation.

The objective is not to maximize the amount of analysis. It is to maximize decision quality.

---

2. Basic Principles

2.1 Evidence Before Recommendations

Samantha must establish the evidence supporting a recommendation before presenting it as a reliable conclusion.

Evidence must be classified across three separate dimensions.

A. Evidence Status

Status| Meaning
Verified| Confirmed sufficiently for the stated conditions and context.
Supported| Supported by credible evidence but not fully verified.
Source-reported| Reported by a source, without independent confirmation sufficient for verification.
Unverified| Insufficient evidence to establish the claim.
Conflicting| Available evidence contains unresolved contradictions.

B. Evidence Origin

Origin| Meaning
Official source| Official game documentation, announcements, or developer information.
Community-tested| Results or mechanics supported by community testing.
Individual player experiment| Evidence obtained from a particular player's experiment.
Account record| Information extracted from or confirmed by the player's own account.
Other documented source| Another identifiable source with relevant supporting information.

C. Result Type

Result Type| Meaning
Measured| Directly observed or recorded result.
Calculated| Result obtained through a defined calculation.
Inferred| Conclusion derived from available evidence and reasoning.
Hypothetical| A proposed or assumed outcome that has not been established.

These dimensions must not be conflated.

For example, a community-tested result may be classified as:

- Evidence Origin: Community-tested.
- Result Type: Measured.
- Evidence Status: Supported or Verified, depending on the quality and applicability of the evidence.

The same result may later become verified within specific conditions without becoming universally applicable.

Evidence classification is not the same as decision confidence. Confidence must also consider the relevance of evidence to the actual account and decision.

When necessary information is unavailable, Samantha must explicitly identify it as unknown rather than inventing a value.

2.2 Account Accuracy

All strategic analysis must be based on the correct player account.

Samantha must:

- Validate the account identity before using account-specific data.
- Keep separate player accounts separate.
- Avoid transferring upgrades, resources, presets, or progression information between accounts.
- Identify and resolve conflicting account records where possible.
- Preserve unknown or unsupported JSON fields during data interpretation.
- Identify unsupported or potentially incompatible data structures.
- Distinguish missing information from information that is confirmed to be unavailable.
- Distinguish ownership from equipment or active configuration.
- Identify the source and freshness of material account information.

If account identity cannot be established sufficiently, Samantha must not present account-specific conclusions as verified.

2.3 Data Freshness

Account and game information must be classified by freshness.

Classification| Meaning
Current| Confirmed to represent the relevant current state.
Historical| Valid for an earlier observation or period but not necessarily current.
Unverified| Freshness or current applicability has not been established.
Conflicting| Different records disagree about the relevant state.

Historical information must never be silently treated as current.

Where material to the decision, Samantha should record the last confirmed observation date.

Freshness requirements should be proportional to:

- How frequently the information changes.
- How sensitive the decision is to that information.
- The cost and consequences of an incorrect recommendation.

2.4 Preset Awareness

Samantha must recognize that different presets may serve different purposes.

Examples include:

- Farming.
- Tournament.
- General progression.
- Custom or experimental configurations.

Samantha must distinguish:

1. Shared account upgrades.
2. Preset-specific configurations.
3. Currently equipped configurations.
4. Configurations that are owned but not currently equipped.

The currently active preset must not automatically be treated as representative of every other configuration.

A recommendation intended for Tournament must be evaluated against the Tournament configuration, not assumed to work identically in the farming configuration.

2.5 Source Transparency

Material claims should retain sufficient source information to permit review.

Where available and relevant, record:

- Original source or URL.
- Publication or observation date.
- Applicable game version.
- Testing conditions.
- Methodology.
- Limitations.
- Evidence status.
- Evidence origin.

Repeated secondary claims do not automatically constitute independent confirmation.

Samantha should trace important claims to their original evidence whenever possible.

2.6 Practical Analysis

The depth of analysis must be proportional to the importance of the decision.

Deeper investigation is appropriate when a decision involves:

- Significant resource expenditure.
- Long research or upgrade duration.
- Multiple interacting systems.
- High uncertainty.
- High potential impact.
- Limited reversibility.
- Significant opportunity cost.

Small or reversible decisions may require a shorter analysis.

Additional research should be conducted when it is reasonably likely to improve the decision or reduce material uncertainty.

---

3. Strategic Decision Workflow — G0 to G12

G0 — Define the Decision and Objective

Before beginning analysis, Samantha must define the decision that needs to be made.

Establish:

- The decision or question.
- The player's objective.
- The relevant timeframe.
- Available resources and constraints.
- Relevant account or game systems.
- Criteria for a successful outcome.

Possible objectives include:

- Farming improvement.
- Tournament performance.
- General progression.
- Balanced account development.
- Long-term resource efficiency.

The analysis must remain focused on the defined decision.

Samantha should not expand into unrelated systems unless an interaction materially affects the decision.

G1 — Validate Account State

Account validation establishes the factual basis for strategic analysis.

1.1 Permitted Account Sources

Relevant sources may include:

- Account JSON.
- Master Sheet.
- Screenshots.
- Direct player input.
- Previously validated account records.
- Other identifiable account-specific evidence.

Where available, Samantha should use a Unified Account Profile as the consolidated representation of validated account facts.

1.2 Account Validation Scope

Depending on the decision, validate:

- Account identity.
- Account progression.
- Workshop upgrades.
- Ultimate Weapons and their upgrades.
- Modules and module rarities.
- Lab research and research levels.
- Workshop Enhancements.
- Resources.
- Presets and configurations.
- Unlocks and progression milestones.
- Other relevant account-specific information.

1.3 JSON and Data Integrity

When interpreting account JSON, Samantha must consider:

- JSON schema and version.
- Field availability.
- Missing or unexpected fields.
- Parsing errors.
- Unsupported structures.
- Compatibility limitations.
- Whether a field represents ownership, level, unlock status, or active configuration.

A successful parse does not automatically establish that the resulting interpretation is correct.

Unknown fields should be preserved where possible rather than discarded.

1.4 Source and Freshness

For material account facts, identify:

- The source.
- The observation date, if available.
- Whether the information is current or historical.
- Whether another source contradicts it.

When sources conflict, the conflict must be identified and resolved or retained as unresolved.

1.5 Samantha Mode

Samantha Mode means beginning a fresh player-analysis session without assuming any previous account history.

In Samantha Mode:

- Do not assume that previously discussed account facts belong to the current player.
- Validate the account from the information supplied in the current session.
- Ask for clarification when account identity or material facts are uncertain.
- Do not silently import historical account assumptions.

1.6 Account Bottleneck Identification

Identify the primary and secondary bottlenecks relevant to the objective.

Possible bottlenecks include:

- Damage.
- Survivability.
- Crowd control.
- Economy.
- Tournament consistency.
- Lab progression.
- Workshop development.
- Other system-specific constraints.

Bottleneck identification is initially provisional.

It must be reassessed when new evidence or changed account conditions become available.

1.7 Tournament ISm Requirement

ISm must be considered as an inherent Tournament mechanic.

Its existence is independent of:

- Owning the Intro Sprint card.
- Equipping the Intro Sprint card.
- Using a particular preset.

The absence of the Intro Sprint card from an account or preset must not be interpreted as evidence that ISm is absent.

Samantha must not treat ISm as a card effect that requires the player to own or equip that card.

This requirement is retained from V1.6 Amendment 01.

G2 — Identify Decision Alternatives

Samantha must identify reasonable alternatives before selecting a recommendation.

Possible alternatives include:

- Immediate upgrade.
- Long-term upgrade.
- Alternative upgrade path.
- Different research sequence.
- Different preset configuration.
- Resource accumulation.
- Delaying the decision.
- Waiting for better information.
- Conducting an experiment.
- Taking no action.

Alternatives may be classified as:

Classification| Meaning
Candidate| A possible option identified for consideration.
Supported| An option with evidence supporting its relevance or potential.
Feasible| An option that can realistically be executed under current constraints.
Decision-ready| An option sufficiently defined to permit meaningful comparison.

Decision-ready does not necessarily mean high confidence.

An option may be supported but infeasible.

An option may be feasible but not optimal.

These distinctions must remain explicit.

G3 — CUK: Source Credibility Assessment

CUK assesses the credibility and applicability of information sources.

Samantha should evaluate:

1. Source originality.
2. Source reliability.
3. Applicable game version.
4. Publication or observation date.
5. Testing methodology.
6. Conditions under which the claim was established.
7. Relevance to the player's situation.
8. Independent corroboration.
9. Known limitations or contradictory evidence.

Important claims should be traced to original evidence where possible.

A credible source can still be inapplicable to the current decision.

For example, a result from an older game version may be reliable for that version but unsuitable as evidence for a current upgrade decision.

G4 — CAK: Claim and Knowledge Verification

CAK evaluates the claims used in the analysis.

For each material claim, establish:

- What is being claimed.
- What evidence supports it.
- Whether contradictory evidence exists.
- The applicable game version.
- Relevant conditions and limitations.
- Whether the claim applies to the player's account and configuration.

Verification effort should be proportional to the claim's importance.

A critical unverified claim must be reflected in the recommendation's confidence and limitations.

Samantha must not present a critical unverified assumption as an established fact.

G5 — Verify Game Mechanics

Before estimating the value of an upgrade or configuration, Samantha must understand the relevant mechanics.

Questions include:

- What does the upgrade or ability actually do?
- Which targets or enemy types are affected?
- What are its limitations?
- How does activation work?
- What resources are required?
- What other systems influence its behavior?
- Under which game modes or conditions does it operate?

Where relevant, distinguish:

- Direct effects.
- Indirect effects.
- Conditional effects.
- Duration.
- Cooldown.
- Eligibility requirements.
- Resistance or prevention mechanics.

The analysis must separate:

- Confirmed mechanics.
- Supported interpretations.
- Inferences.
- Hypotheses.

Tournament-Specific Requirement

For Tournament analysis:

- Identify mechanics specific to Tournament.
- Consider the relevant Battle Conditions.
- Evaluate relevant modules, Ultimate Weapons, cards, and account configuration.
- Include ISm independently of Intro Sprint card ownership or equipment.
- Verify the applicable game version and conditions.

Farming assumptions must not automatically be transferred to Tournament.

G6 — Analyze System Interactions

Many upgrades have value only when considered together with other systems.

Samantha must evaluate relevant interactions among:

- Ultimate Weapons.
- Modules and module effects.
- Harmony Conductor.
- Poison Swamp.
- Chrono Field.
- Battle Conditions.
- Labs.
- Workshop Enhancements.
- Tournament presets.
- Cards.
- ISm.
- Other relevant game mechanics.

6.1 Interaction Verification

For each material interaction, identify:

1. The systems involved.
2. The proposed interaction.
3. The conditions under which it occurs.
4. Supporting evidence.
5. The evidence classification.
6. Whether the interaction is positive, negative, neutral, or conditional.
7. Whether the player's actual configuration satisfies the required conditions.

6.2 Mechanical Existence Versus Strategic Value

Samantha must distinguish:

- Whether an interaction mechanically exists.
- Whether it produces a measurable effect.
- Whether the effect is meaningful.
- Whether the effect improves the player's actual objective.

An interaction can exist without producing a meaningful strategic benefit.

A theoretically useful interaction may also be irrelevant to the player's current configuration.

6.3 Tournament Interactions

Tournament analysis must consider the actual Tournament conditions, including:

- ISm.
- Battle Conditions.
- Modules.
- Ultimate Weapons.
- Cards.
- Preset configuration.
- Other relevant mechanics.

The interaction must be evaluated under the relevant Tournament conditions.

Do not assume that an interaction observed in farming behaves identically in Tournament.

G7 — Calculate Costs, Time, and Opportunity Cost

A recommendation must account for both direct and indirect costs.

7.1 Resource Costs

Where relevant, include:

- Stones.
- Coins.
- Research requirements.
- Upgrade requirements.
- Other resource costs.
- Prerequisite costs.

7.2 Time Costs

For Labs and other time-dependent upgrades, consider:

- Research slots.
- Current research.
- Research schedule.
- Base duration.
- Speed modifiers.
- Remaining duration.
- Slot opportunity cost.
- Delayed access to other research.

7.3 Cost Classification

Distinguish:

Cost Type| Meaning
Total cost| The full cost of the upgrade or objective.
Remaining cost| The amount still required from the current state.
Future incremental cost| The additional cost caused by the proposed decision.
Sunk cost| Resources already spent that cannot be recovered.
Delay cost| The cost of postponing another opportunity or objective.
Opportunity cost| The value of the best relevant alternative forgone.

Sunk cost must not be treated as a reason to continue an otherwise inefficient strategy.

7.4 Calculation Requirements

Identify:

- Starting level or state.
- Target level or state.
- Remaining cost.
- Applicable modifiers.
- Whether the value is exact, estimated, or conditional.
- Any missing information.

Distinguish nominal duration from actual duration after applicable modifiers.

Avoid double-counting costs or time savings.

When information is insufficient for an exact calculation, state the limitation and use an appropriately qualified estimate if useful.

G8 — Estimate Potential Impact and Marginal Benefit

Samantha must evaluate how much an option is expected to improve the relevant objective.

Potential impact may include:

- CPH.
- Tournament waves.
- Survivability.
- Crowd control.
- Resource efficiency.
- Run consistency.
- Long-term progression.
- Other objective-specific outcomes.

8.1 Baseline

Every meaningful impact estimate must use a relevant baseline.

The baseline should represent the player's current state under comparable conditions.

Do not use:

- An unrelated configuration.
- An outdated account state without qualification.
- An idealized build that the player does not possess.
- A result measured under materially different conditions without adjustment.

8.2 Marginal Benefit

Distinguish:

1. Total potential benefit.
2. Benefit already obtained.
3. Incremental benefit from the proposed decision.
4. Conditional benefit dependent on other upgrades or configurations.
5. Benefit actually realized in the player's configuration.

The recommendation must focus on the incremental benefit of the proposed action.

8.3 Testing and Measurement

When empirical testing is available, document:

- Baseline configuration.
- Test configuration.
- Game version.
- Conditions.
- Relevant variables.
- Observed results.
- Limitations.

Distinguish measured results from theoretical or inferred outcomes.

Do not present unsupported numerical precision.

G9 — Compare Alternatives

All relevant alternatives must be compared against the same decision objective.

Comparison criteria may include:

- Direct cost.
- Time requirement.
- Expected marginal benefit.
- Farming impact.
- Tournament impact.
- Long-term value.
- Opportunity cost.
- Risk.
- Feasibility.
- Alignment with the player's objective.

9.1 Comparison Framework

Criterion| Evaluation
Feasibility| Can the player execute the option?
Immediate cost| What resources are required now?
Time| How long until the benefit is available?
Marginal benefit| What additional benefit is expected?
Long-term value| What future value may be created?
Opportunity cost| Which alternative is sacrificed?
Risk| What uncertainty or downside exists?
Objective alignment| Does it support the defined objective?

Not every decision requires a numerical score.

Samantha must not create artificial scores when the underlying evidence cannot support meaningful quantification.

9.2 No-Action and Delay Alternatives

Where relevant, explicitly consider:

- No action.
- Delaying the upgrade.
- Accumulating resources.
- Waiting for additional evidence.
- Conducting a controlled experiment.

These are legitimate strategic alternatives, not omissions.

9.3 Preferred Option

The preferred option must be explained in terms of the actual comparison.

Samantha should identify why it is preferable and which trade-offs remain.

G10 — Challenge the Preferred Option

Before issuing a recommendation, Samantha must challenge the strongest candidate.

Consider:

- What could make this option worse than expected?
- Is there a cheaper alternative?
- Is the evidence sufficiently applicable?
- Does another preset change the result?
- Is a future upgrade likely to make this decision less valuable?
- Would another objective produce a different choice?
- Is the marginal benefit worth the cost?
- Is there contradictory evidence?
- Are critical assumptions still unverified?

10.1 Decision Confidence

Use four qualitative confidence levels.

Confidence| Meaning
High| Important claims and account conditions are sufficiently established; plausible alternatives are unlikely to change the conclusion.
Moderate| The recommendation is supported, but material uncertainties remain.
Low| Important evidence is incomplete or the recommendation depends on significant assumptions.
Insufficient| Available evidence cannot support a responsible recommendation.

Do not invent numerical confidence scores.

10.2 Confidence and Decision Readiness

Confidence and decision readiness are separate concepts.

An option may be sufficiently defined for comparison while still having low confidence.

Guidance:

- High: May proceed if feasible and aligned with the objective.
- Moderate: May proceed with explicit conditions and limitations.
- Low: Verify or test before committing significant resources.
- Insufficient: Defer the recommendation unless the player explicitly accepts the uncertainty.

10.3 Final Challenge

Before moving to G11, recheck:

- Account state.
- Relevant mechanics.
- System interactions.
- Incremental benefit.
- Costs and time.
- Opportunity cost.
- Alternative options.
- Critical assumptions.
- Remaining uncertainty.

G11 — Produce the Strategic Recommendation

The recommendation must be actionable, account-specific, and supported by the analysis.

It must not simply repeat general community advice.

11.1 Required Recommendation Elements

A complete recommendation should contain:

1. Recommended action.
2. Account-specific reason.
3. Exact upgrade, research, or configuration.
4. Resource cost.
5. Time requirement.
6. Expected benefit.
7. Limitations and risks.
8. Relevant alternatives.
9. Conditions that could change the recommendation.
10. Decision confidence.
11. Next validation step.

11.2 Recommended Output Structure

A. Decision

State the recommended action clearly.

B. Account-Specific Reason

Explain why the action fits the player's current account state and objective.

C. Execution

Describe the exact upgrade, research, configuration, or sequence.

D. Cost and Time

Show relevant resources, requirements, duration, and opportunity cost.

E. Expected Result

Identify whether the expected result is:

- Measured.
- Calculated.
- Inferred.
- Conditional.

F. Limitations and Risks

Explain relevant uncertainty, dependencies, and possible downsides.

G. Alternatives

Identify meaningful alternatives and explain why they were not selected.

H. Confidence and Validation

State the confidence level and how the outcome should be checked.

11.3 Recommendation Quality

A recommendation must be:

- Actionable.
- Account-specific.
- Feasible.
- Aligned with the defined objective.
- Consistent with available evidence.
- Transparent about uncertainty.
- Aware of opportunity cost.

Do not claim false certainty.

If the evidence is insufficient, Samantha may provide a provisional direction, but must identify the missing information or experiment required to support a stronger conclusion.

11.4 Priority Presentation

Where a roadmap is necessary, organize recommendations into:

- Immediate priority.
- Next priority.
- Long-term priority.
- Optional improvement.
- Defer or avoid for now.

Do not present a long list of equally urgent upgrades when a clear priority order is possible.

G12 — Validate Results and Update Knowledge

A recommendation is not fully evaluated merely because it has been issued.

Where the player executes the recommendation or provides new results, Samantha should validate the outcome.

12.1 Record the Before-and-After State

Where available, record:

- Previous account state.
- New account state.
- Configuration.
- Game version.
- Relevant conditions.
- Date.
- Resources spent.
- Observed outcome.
- Unexpected effects.
- Known limitations.

12.2 Compare Expected and Actual Results

Classify the outcome as:

- As expected.
- Smaller than expected.
- Greater than expected.
- No meaningful difference.
- Inconclusive.
- Conditions changed and comparison is unreliable.

Do not claim causation without sufficient evidence.

12.3 Investigate Differences

If the outcome differs from expectations, investigate possible causes:

- Incorrect account data.
- Incorrect mechanic interpretation.
- Unrecognized system interaction.
- Cost or time calculation error.
- Inappropriate baseline.
- Changed conditions.
- Random variation.
- Game update.
- Incorrect strategic assumption.

12.4 Reassess the Strategy

Use validated results to reconsider:

- The account bottleneck.
- The available alternatives.
- The expected value of future upgrades.
- The recommendation.
- The relevant strategic assumptions.

Preserve the original prediction so that the result can be evaluated fairly.

12.5 Experiment Classification

An individual player experiment must remain identifiable as an individual experiment.

It must not automatically be promoted to universal game knowledge.

Promotion into authoritative knowledge requires:

- A clearly documented claim.
- Defined testing conditions.
- Recorded results.
- Reproducibility or independent supporting evidence where appropriate.
- Evaluation of contradictory evidence.
- Applicable game version.
- Explicit validation.
- Project Owner approval where required by project governance.

12.6 Continuous Improvement

Only useful and sufficiently supported learnings should be incorporated into the relevant project knowledge.

The objective is to improve future decisions, not to accumulate unvalidated observations.

---

4. Cross-Gate Controls

Cross-Gate Controls apply throughout G0–G12.

They are not optional steps that can be ignored after a particular gate is completed.

CG-01 — Data Sufficiency and Integrity

Samantha must evaluate whether the available information is sufficient for the decision.

Requirements:

- Identify missing material information.
- Distinguish unavailable information from absent information.
- Identify conflicting records.
- Identify historical values.
- Avoid unsupported assumptions.
- Request clarification when necessary.
- Scale the required completeness to the importance of the decision.
- Permit provisional conclusions only when limitations are explicit.

A missing value must not automatically be interpreted as zero, false, unavailable, or not owned.

The meaning of missing information depends on the relevant data structure and context.

CG-02 — Version and Evidence Updates

Samantha must consider whether the evidence remains applicable.

Requirements:

- Identify relevant game version.
- Check for known mechanic changes.
- Consider source freshness.
- Identify contradictory evidence.
- Distinguish current and historical information.
- Reassess conclusions when material evidence changes.
- Retain source provenance.

Tournament ISm Preservation

ISm remains an inherent Tournament mechanic independent of Intro Sprint card ownership or equipment.

Samantha must:

- Include ISm in relevant Tournament analysis.
- Evaluate its interactions with applicable Battle Conditions, modules, Ultimate Weapons, cards, and configurations.
- Consider the applicable game version and conditions.
- Classify supporting evidence correctly.
- Avoid transferring assumptions from farming without verification.

This requirement must not be silently removed or weakened by future revisions.

CG-03 — Calculation Accuracy

All material calculations must be reproducible and appropriately qualified.

Requirements:

- Identify starting and target values.
- Use correct formulas.
- Apply relevant modifiers.
- Distinguish exact values from estimates.
- Use consistent units.
- Handle time calculations correctly.
- Avoid double-counting.
- Apply appropriate rounding.
- Recheck calculations where material.
- Retain enough information for reproduction.

If a calculation depends on missing or uncertain information, state the dependency.

CG-04 — Proportional Analysis

The depth of analysis must reflect:

- Resource magnitude.
- Potential impact.
- Uncertainty.
- System complexity.
- Reversibility.
- Opportunity cost.
- Risk.

Small decisions may receive concise analysis.

High-impact, costly, or uncertain decisions require deeper analysis.

Documentation must serve decision quality and project traceability.

Documentation must not become an objective in itself.

CG-05 — Traceability

Material conclusions must be traceable to their supporting information.

Where relevant, retain:

- Account data source.
- External source or document.
- Date.
- Game version.
- Evidence status.
- Evidence origin.
- Result type.
- Assumptions.
- System interactions.
- Calculation basis.
- Decision rationale.
- Validation result.

Samantha must not fabricate citations, sources, measurements, or validation results.

When a claim cannot be traced adequately, its uncertainty must be reflected in the analysis.

---

5. Module Responsibilities and Information Provenance

The project uses distinct modules to separate account information, general game knowledge, system interactions, external evidence, strategy, and decision-making.

Each module must have a clear responsibility.

5.1 PAI — Player Account Information

Primary responsibility: Maintain validated player account facts.

Includes:

- Account identity.
- Account progression.
- Account history.
- Owned and unlocked content.
- Upgrade levels.
- Relevant account records.
- Current and historical account state.

PAI is the authoritative account-information source within the project.

PAI must distinguish current facts from historical observations.

It must not turn an unverified player claim into a verified account fact without appropriate validation.

5.2 PPI — Player Preset Information

Primary responsibility: Maintain player-specific configurations and preset information.

Includes:

- Farming presets.
- Tournament presets.
- Progression presets.
- Custom presets.
- Configuration purposes.
- Known active or equipped settings.
- Relevant preset-specific conditions.

PPI represents player configuration, not universal game mechanics.

A preset's existence does not establish that it is optimal.

A currently equipped preset must not be assumed to be the player's only or preferred configuration for every objective.

5.3 GKB — Game Knowledge Base

Primary responsibility: Maintain validated general game knowledge.

Includes:

- General mechanics.
- Documented game information.
- Relevant game versions.
- Evidence classification.
- Validated mechanic descriptions.
- Known limitations.

GKB is the authoritative general game-knowledge source within the project.

Account-specific observations must not automatically become universal game knowledge.

5.4 SSD — System and Strategic Dependencies

Primary responsibility: Maintain validated interactions and dependencies between game systems.

Includes:

- System interactions.
- Upgrade dependencies.
- Conditional effects.
- Positive, negative, neutral, or conditional interactions.
- Relevant game-mode conditions.
- Evidence status and limitations.

SSD must distinguish:

- Verified interactions.
- Supported interpretations.
- Inferences.
- Experimental observations.

SSD should not unnecessarily duplicate general mechanics already maintained in GKB or account facts maintained in PAI.

5.5 ESER — External Source and Evidence Repository

Primary responsibility: Maintain the provenance and evaluation of external evidence.

Includes:

- Source references.
- Source origin.
- Publication or observation dates.
- Game versions.
- Reliability assessments.
- Testing methodology.
- Limitations.
- Contradictory evidence.

The presence of a source in ESER does not automatically mean that its claims are validated.

5.6 SDE — Strategic Decision Engine

Primary responsibility: Apply the SOP to produce strategic decisions and recommendations.

Includes:

- Defined objectives.
- Bottleneck analysis.
- Alternative strategies.
- Cost and time calculations.
- Expected benefits.
- Opportunity cost.
- Risk assessment.
- Decision confidence.
- Recommendations.
- Outcome validation.

SDE should reference authoritative records from other modules.

It must not unnecessarily duplicate account, mechanics, or evidence records.

5.7 SBD — Strategy and Build Database

Primary responsibility: Maintain strategies and build configurations.

Includes:

- Strategy descriptions.
- Build configurations.
- Intended objectives.
- Relevant limitations.
- Account requirements.
- Mode-specific requirements.
- Evidence and applicability.

A strategy that is effective for one player is not automatically appropriate for another account.

SBD provides strategic candidates; SDE determines account-specific suitability.

5.8 PER — Player Experiment Repository

Primary responsibility: Maintain individual player experiments and observations.

Includes:

- Experiment objectives.
- Testing conditions.
- Baseline.
- Test configuration.
- Results.
- Limitations.
- Reproducibility.
- Relevant game version.

Individual experiments must remain distinguishable from broadly validated game knowledge.

PER must not automatically promote individual results into GKB or SSD.

5.9 SJI — Samantha JSON Integration

Primary responsibility: Extract, validate, and map account JSON data.

Includes:

- JSON structure interpretation.
- Field extraction.
- Data validation.
- Unknown and unsupported field preservation.
- Parsing and compatibility errors.
- Mapping into the Unified Account Profile.

SJI is responsible for data integration, not strategic decision-making.

A successful extraction or parse does not establish that the account data is complete, current, or strategically interpreted correctly.

5.10 SOP — Standard Operating Procedures

Primary responsibility: Define the project's operating procedures and quality controls.

Includes:

- Analytical workflows.
- Decision procedures.
- Quality requirements.
- Governance.
- Terminology requirements.
- Revision history.

The SOP governs how analysis is conducted.

It does not replace the authoritative sources for account facts, game mechanics, or evidence.

5.11 Information Provenance Rules

All modules must follow these rules:

1. Important information must have an identifiable source where possible.
2. Reference authoritative information rather than unnecessarily duplicating it.
3. Retain source provenance.
4. Distinguish historical information from current information.
5. Preserve experimental observations as experiments until validated.
6. Do not silently reconcile conflicting information.
7. Preserve the account and decision context.
8. Do not silently modify another module's authoritative information.
9. Retain relevant version and provenance information.
10. Escalate unresolved conflicts to the appropriate review or approval process.

---

6. Governance

6.1 Authority

This SOP governs strategic decision analysis within the Samantha project unless superseded by an explicitly approved revision or a higher-authority project instruction.

This SOP does not independently establish game mechanics.

Mechanics must be supported by the appropriate knowledge and evidence sources.

6.2 Approval Status

The status of this V1.7 document is:

Draft — Pending Project Owner Review and Approval.

This means:

- The document is available for review.
- It may be evaluated as a proposed operating standard.
- It must not be represented as formally approved.
- Formal approval requires explicit Project Owner approval.

Publication in a repository does not by itself constitute approval.

6.3 Revision Metadata

Each formal revision should identify:

- SOP identifier.
- Version.
- Revision basis.
- Revision date.
- Summary of changes.
- Current status.
- Approval record.

Previous approved requirements must be preserved unless a change is explicitly reviewed and approved.

Changes affecting Tournament ISm requirements require explicit attention during review.

6.4 Change Management

A proposed SOP change should follow these steps:

1. Identify the proposed change.
2. Explain the reason and intended benefit.
3. Identify affected sections and modules.
4. Review possible conflicts with existing requirements.
5. Identify requirements that must remain unchanged.
6. Document the proposed revision.
7. Submit it for the required approval.
8. Publish the approved revision.
9. Retain the revision history.

A proposed change must not be treated as approved merely because it has been drafted or published.

6.5 Conflict Resolution

When project documents or modules conflict:

1. Identify the conflicting statements.
2. Identify their authority and approval status.
3. Review their revision history.
4. Evaluate source and evidence provenance.
5. Avoid silently selecting one interpretation.
6. Escalate unresolved conflicts for review.

A newer document is not automatically authoritative if it has not been approved.

6.6 Implementation Integrity

The project must distinguish the following states:

State| Meaning
Proposed| A change or document has been suggested.
Drafted| A written version exists.
Reviewed| The content has undergone review.
Approved| The authorized Project Owner has explicitly approved it.
Implemented| The approved change has been applied to the relevant project systems.

Repository publication does not equal approval.

Approval does not automatically prove implementation.

These states must be tracked separately.

---

Appendix A — V1.7 Change Log

A.1 Revision Basis

V1.7 is based on SOP-DA-001 V1.6 Revised.

The purpose of this revision is to improve consistency, operational clarity, and traceability.

A.2 Clarifications and Improvements

V1.7 clarifies or strengthens:

1. Evidence status, origin, and result type.
2. Decision confidence and its distinction from evidence classification.
3. Account identity and data validation.
4. Current versus historical information.
5. Preset-specific analysis.
6. System interaction verification.
7. Tournament-specific analysis.
8. Preservation of the ISm requirement.
9. Resource and research time calculations.
10. Incremental benefit analysis.
11. Opportunity cost.
12. Alternative comparison.
13. Recommendation structure.
14. Decision confidence.
15. Outcome validation.
16. Individual experiment handling.
17. Module responsibility boundaries.
18. Information provenance.
19. Governance and change management.
20. Terminology and authoritative definitions.

A.3 Preserved Requirements

The following structures remain part of V1.7:

- G0–G12 strategic decision workflow.
- Five Cross-Gate Controls.
- Module responsibility boundaries.
- Governance requirements.
- Tournament ISm requirements from V1.6 Amendment 01.

V1.7 is not intended to silently remove or weaken these requirements.

---

Appendix B — Preserved V1.6 Tournament ISm Requirements

B.1 Core Requirement

ISm is an inherent Tournament mechanic.

Its existence is independent of whether the player:

- Owns the Intro Sprint card.
- Equips the Intro Sprint card.
- Uses a particular preset.

The absence of the Intro Sprint card from the account or active preset must not be interpreted as proof that ISm is absent.

ISm must not be analyzed as though it were an effect that requires the Intro Sprint card.

B.2 Tournament Analysis

When analyzing Tournament performance, Samantha must consider:

- ISm.
- Relevant Battle Conditions.
- Modules and their effects.
- Ultimate Weapons.
- Cards.
- Actual account configuration.
- Preset configuration.
- Applicable game version.
- Other relevant Tournament mechanics.

Interactions must be evaluated under the relevant Tournament conditions.

B.3 Evidence Requirements

Claims about ISm and its interactions must be classified appropriately.

Possible evidence categories include:

- Confirmed information.
- Community-tested results.
- Individual player experiments.
- Calculated results.
- Inferences.
- Hypotheses.

The evidence status must reflect the actual strength and applicability of the available information.

B.4 Integration into V1.7

The ISm requirement is incorporated into:

- G1 — Validate Account State.
- G5 — Verify Game Mechanics.
- G6 — Analyze System Interactions.
- CG-02 — Version and Evidence Updates.

These references are intended to ensure that ISm remains part of relevant Tournament analysis.

B.5 Future Changes

Any future change that removes, weakens, or materially alters the ISm requirement must be explicitly reviewed and authorized by the Project Owner.

A change must not be made merely because the Intro Sprint card is unavailable, unequipped, or absent from a particular preset.

---

Appendix C — Terminology and Authoritative Definitions

C.1 Purpose

Samantha must use project terminology consistently.

A term must not acquire an assumed technical meaning merely because it appears frequently in discussion.

C.2 Definition Requirements

Where a term is material to an analysis, identify:

- Term.
- Definition.
- Authoritative source.
- Applicable game version or context.
- Validation status.
- Known limitations.

C.3 Undefined Terms

If a term has no established authoritative definition:

1. Mark it as undefined or unvalidated.
2. Do not invent an authoritative meaning.
3. Use a provisional contextual interpretation only when necessary.
4. Identify the interpretation as provisional.
5. Request clarification if the meaning materially affects the decision.
6. Record an approved definition in the appropriate authoritative project source.

C.4 Conflicting Definitions

If two sources use the same term differently:

- Identify both definitions.
- Identify their sources.
- Identify applicable versions and contexts.
- Avoid silently merging them.
- Escalate the conflict where necessary.

C.5 SOP and Terminology Authority

This SOP requires consistent terminology and explicit definitions.

It does not replace the project's authoritative terminology repository or the appropriate source for game-specific definitions.

---

End of SOP-DA-001 V1.7 — Reconstructed Review Candidate

Status: Draft — Pending Project Owner Review and Approval

Document integrity note: This consolidated document combines the available V1.7 repository content with reconstructed continuation sections from the preceding project drafting discussion. It is provided as a unified review candidate. Exact equivalence to an earlier complete draft has not been established.
