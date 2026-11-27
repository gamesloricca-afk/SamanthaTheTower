# Domain 09 — Modules: Tickets, Inventory, Counters, and Drop Interfaces

## Audit scope

- **Repository:** `gamesloricca-afk/SamanthaTheTower`
- **Branch:** `TestAccount`
- **Source:** `GRE/1/09_modules.json`
- **Source blob SHA:** `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- **Batch:** findings 121–150
- **Focus:** Module Tickets, inventory access, counters, cooldown state, drop method declarations, and decoded constant candidates.

This is an additive structural audit. Original GRE files are unchanged.

## Claim classification

All direct metadata observations below are **OBJECTIVE / EXTERNAL-UNVERIFIED** as game mechanics. The JSON contains metadata declarations, not executable method bodies. Constant values are explicitly marked **DECODED_CANDIDATE** and must not be treated as confirmed live-game values or as evidence of the current game version.

## Findings 121–150

### Module Tickets

121. **The manager exposes a Module Tickets balance getter.**  
     `get_ModuleTickets()` returns `System.Int32` (method index 5960); the backing field is `moduleTickets` (token `0x04001c40`). This establishes an integer-valued balance interface, not its spending rules or display formatting.

122. **The manager declares an operation to add Module Tickets.**  
     `AddModuleTickets(amount, category, context)` accepts an integer amount, a `CurrencyCategory`, and a string-like context parameter (method index 6188). Its side effects and accepted categories are unknown.

123. **The manager declares an operation to spend Module Tickets.**  
     `SpendModuleTickets(amount, category, context)` has the same parameter structure (method index 6189). The declaration does not establish validation, insufficient-balance handling, or transaction behavior.

124. **The manager declares a Module Tickets loading method.**  
     `LoadModuleTickets(value)` accepts an integer (method index 6190). Whether this loads a save value, server value, or another source is not shown by the signature.

125. **The manager declares a ticket UI refresh method.**  
     `RefreshTicketUI()` returns void (method index 6191). The actual UI updates and refresh triggers are unknown.

126. **The manager declares a free-ticket grant method.**  
     `GiveFreeTickets()` returns void (method index 6192). The amount, eligibility, and frequency are not established.

127. **A Boolean field tracks whether free tickets have been given.**  
     `freeTicketsGiven` is a Boolean field (token `0x04001c51`). Its precise reset conditions and relationship to `GiveFreeTickets` are unknown.

### Inventory access and capacity

128. **The manager maintains an inventory collection field.**  
     `inventory` is a collection-typed field (token `0x04001c4a`); the generic element type is not inferred from this field reference alone.

129. **The manager exposes an enumerable interface for all Module Items.**  
     `GetAllModuleItems()` returns a generic enumerable whose iterator metadata identifies `ModuleItem` as the yielded type (method index 5984; iterator type index 699). Enumeration order and inclusion rules are unknown.

130. **The manager can look up an inventory Module Item by GUID.**  
     `FindInventoryModuleByGuid(guid)` accepts a string and returns `ModuleItem` (method index 6086). Missing-GUID behavior is not established.

131. **A method named TestInventory is present.**  
     `TestInventory()` returns void (method index 6078). The name alone does not establish that it is a production inventory operation or describe what it tests.

132. **An inventory limit constant has a decoded candidate value of 350.**  
     `INVENTORY_LIMIT` is an integer constant field (token `0x04001c2d`) with decoded candidate value `350`. Treat this strictly as a metadata-decoding candidate; it is not verified as a current player-facing capacity.

### Pity and acquisition counters

133. **An integer field stores the current primary pity counter.**  
     `currentPity` is an integer field (token `0x04001c52`). Its increment/reset conditions and the event it tracks are unknown.

134. **A separate integer field stores a rare pity counter.**  
     `currentRarePity` is an integer field (token `0x04001c53`). Its relationship to `currentPity` is not established.

135. **A pity threshold constant has a decoded candidate value of 150.**  
     `PITY` is an integer constant field (token `0x04001c2b`) with decoded candidate value `150`. This does not prove what is guaranteed at that count or whether it is currently active.

136. **A rare-pity threshold constant has a decoded candidate value of 10.**  
     `RARE_PITY` is an integer constant field (token `0x04001c2c`) with decoded candidate value `10`. Its guarantee semantics are not established.

137. **The manager tracks the number of Common Modules obtained.**  
     `commonModulesObtained` is an integer field (token `0x04001c5c`). The counting scope and persistence behavior are unknown.

138. **The manager tracks the number of Rare Modules obtained.**  
     `rareModulesObtained` is an integer field (token `0x04001c5d`). No assumptions are made about whether this includes upgrades or only acquisition events.

139. **The manager tracks the number of Epic Modules obtained.**  
     `epicModulesObtained` is an integer field (token `0x04001c5e`). Its counting rules are unknown.

140. **The manager tracks a total Modules-shattered counter.**  
     `totalModulesShattered` is an integer field (token `0x04001c5f`). Whether it counts individual items, stack-equivalent quantities, or special shatter events is not shown.

141. **The manager tracks a total merges-done counter.**  
     `totalMergesDone` is an integer field (token `0x04001c60`). The unit counted by one merge operation is not established.

### History and cooldown state

142. **A Module history limit constant has a decoded candidate value of 150.**  
     `MODULE_HISTORY_LIMIT` is an integer constant field (token `0x04001c30`) with decoded candidate value `150`. The retained history content and trimming policy are unknown.

143. **The manager stores a Module records collection.**  
     `moduleRecords` is a collection-typed field (token `0x04001c6b`). The record schema and whether it is the same as the history implied by the constant are unresolved.

144. **The manager stores a Module drop cooldown counter/state.**  
     `moduleDropCooldown` is an integer field (token `0x04001c6c`). Its unit (waves, time, or another counter) is unknown from metadata alone.

145. **The manager stores a shard drop cooldown counter/state separately.**  
     `shardDropCooldown` is an integer field (token `0x04001c6d`). It is distinct from `moduleDropCooldown`; the reset and decrement behavior is unknown.

146. **A standard Module drop cooldown constant has decoded candidate value 5.**  
     `MODULE_DROP_COOLDOWN` is an integer constant field (token `0x04001c2e`) with decoded candidate value `5`. The unit and application conditions are not verified.

147. **A Champion-specific Module drop cooldown constant also has decoded candidate value 5.**  
     `MODULE_DROP_COOLDOWN_CHAMPION` is a separate integer constant (token `0x04001c2f`) with decoded candidate value `5`. Equal decoded values do not prove identical runtime handling.

### Drop and shard reward interfaces

148. **A boss Module drop attempt has its own method.**  
     `TryBossDrop()` returns `ModuleItem` (method index 6106). The drop conditions, probability, and null/failure behavior are not present in the signature.

149. **A Care Package Module drop attempt has a separate method.**  
     `TryCarePackageDrop()` returns `ModuleItem` (method index 6107). The declaration does not establish its chance or how it relates to boss drops.

150. **The manager declares separate common/rare Module chance lookups and source-specific reroll-shard drop methods.**  
     `GetCommonModuleDropChance()` and `GetRareModuleDropChance()` each return `System.Single` (method indices 6108–6109). In addition, `TryRerollShardsDrop()`, `TryEliteRerollShardsDrop(chance)`, and `TryFleetsDrop(spawnedWave)` are separate declarations (indices 6110, 6111, 6117). Their names and signatures establish distinct interfaces only; no chance values, shard amounts, source eligibility, or wave cadence are inferred.

## Additional nearby declarations reviewed

The metadata also declares `GetNumberOfRerollShards(tier)`, `GetNumberOfFetchRerollShards(tier)`, and `GetNumberOfRerollShardsForFleets(tier)` (method indices 6113, 6114, 6116), each returning an integer. These were reviewed as corroborating structure but are not counted as separate findings in this batch to keep the 30-item scope focused.

The manager also has Boolean fields `autoShatter` and `autoShatterRare` (tokens `0x04001c41` and `0x04001c42`). They indicate separate stored toggles; their rarity thresholds and execution timing are unknown.

## Evidence and limitations

Primary evidence is the direct metadata record in `GRE/1/09_modules.json`, blob SHA `016cc346998a2c3fafcc945ca0d01308a74e66d5`, type `ModuleManager` (index 703), `ModuleItem` (index 704), and iterator type `<GetAllModuleItems>d__135` (index 699). Method indices and field tokens are included inline.

The decoded constants (PITY, RARE_PITY, INVENTORY_LIMIT, MODULE_HISTORY_LIMIT, MODULE_DROP_COOLDOWN, MODULE_DROP_COOLDOWN_CHAMPION) are candidate values only. They must not be copied into player-facing guidance as verified facts without independent, version-matched evidence.

Unknown: exact counter semantics; pity trigger/reset rules; drop chance values and probability basis; cooldown units and decrement rules; inventory overflow handling; history record schema; ticket source/amount; free-ticket eligibility; and auto-shatter behavior.

## GKB disposition

Keep these as source-structure observations. If future fanmade sources disagree on pity thresholds, drop odds, inventory capacity, or ticket behavior, preserve each source and its version/date separately. Do not resolve disagreements by assuming one fanmade source is authoritative.
