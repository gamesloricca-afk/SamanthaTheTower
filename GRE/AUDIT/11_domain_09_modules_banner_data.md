# Domain 09 — Modules: Banner Data, Configuration, and Rotation Interfaces

## Audit scope

- **Repository:** `gamesloricca-afk/SamanthaTheTower`
- **Branch:** `TestAccount`
- **Source file:** `GRE/1/09_modules.json`
- **Source blob SHA:** `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- **Audit batch:** findings 91–120 (30 new findings)
- **Focus:** banner data transfer model, banner model, per-module banner entries, configuration validation, cache/loading state, and banner selection interfaces.

This note is additive. The original GRE source is unchanged.

## Claim status and interpretation

All findings are **OBJECTIVE / EXTERNAL-UNVERIFIED** as game mechanics and directly supported only as metadata declarations. The metadata does not include executable method bodies for this audit. Collection type references that are not resolved are kept opaque. A method signature does not establish its internal logic, data source, request protocol, time-zone handling, odds calculation, or UI behavior.

## Findings 91–120

### Banner configuration data model

91. **Banner configuration data carries a start date.**  
    `ModuleBannerData` declares a `startDate` backing field with a `System.DateTime` getter/setter (field token `0x04001b7a`). The time-zone interpretation and inclusivity of the start boundary are unknown.

92. **Banner configuration data carries an end date.**  
    `ModuleBannerData` declares an `endDate` backing field with a `System.DateTime` getter/setter (field token `0x04001b7b`). Whether the end date is inclusive is not established.

93. **Banner configuration data has an integer price field.**  
    The `price` backing field is exposed as `System.Int32` (field token `0x04001b7c`). The currency represented by this price is not identified by this declaration alone.

94. **Banner configuration data has a background identifier/string.**  
    The `background` backing field is exposed as `System.String` (field token `0x04001b7d`). No asset naming convention or rendering behavior is inferred.

95. **Banner configuration data has a title localization key/index.**  
    `titleLoc` is exposed as an integer (field token `0x04001b7e`). This is distinct from the banner's separate name field.

96. **Banner configuration data has a subtitle localization key/index.**  
    `subtitleLoc` is exposed as an integer (field token `0x04001b7f`), separate from `titleLoc`.

97. **Banner configuration data has a preview-visibility flag.**  
    `showModulePreview` is exposed as Boolean (field token `0x04001b80`). The exact UI controlled by this flag is not visible in the metadata.

98. **Banner configuration data has a highlighted collection.**  
    `highlighted` is exposed through a getter/setter whose collection element/type reference is not fully resolved in this audit (field token `0x04001b81`). Its exact representation is intentionally left unspecified.

99. **Banner configuration data has a rarity collection.**  
    `rarities` is exposed through a getter/setter (field token `0x04001b82`). The collection's exact generic type is not inferred from the unresolved reference.

100. **Banner configuration data has a module-entry collection.**  
     `modules` is exposed through a getter/setter (field token `0x04001b83`). The collection is distinct from the `ModuleBannerData` object itself; its exact generic type is not assumed.

### Runtime banner model

101. **The runtime banner model stores a name.**  
     `ModuleBanner.Name` is a string field (field token `0x04001d57`). This is separate from the integer localization title field in `ModuleBannerData`.

102. **The runtime banner model stores start and end dates.**  
     `ModuleBanner.StartDate` and `ModuleBanner.EndDate` are separate date fields (tokens `0x04001d58`, `0x04001d59`). These correspond by name to the date fields in the configuration data model, but conversion behavior is not established.

103. **The runtime banner model stores price as an integer.**  
     `ModuleBanner.Price` is an integer field (token `0x04001d5a`). The metadata does not identify its currency or prove that it is charged directly.

104. **The runtime banner model stores a pity rarity.**  
     `ModuleBanner.PityRarity` uses `ModuleRarity` (token `0x04001d5b`). This establishes a rarity-typed field on the banner model, not the pity trigger or guarantee rule.

105. **The runtime banner model stores a background string.**  
     `ModuleBanner.Background` is a string field (token `0x04001d5c`). Its relationship to the configuration background field is suggested by matching names, but no mapping code is available.

106. **The runtime banner model stores title and subtitle localization integers.**  
     `TitleLoc` and `SubtitleLoc` are separate integer fields (tokens `0x04001d5d`, `0x04001d5e`). The metadata does not reveal localization fallback behavior.

107. **The runtime banner model stores a preview-visibility Boolean.**  
     `ShowModulePreview` is a Boolean field (token `0x04001d5f`), corresponding by name to the configuration field.

108. **The runtime banner model stores highlighted entries separately from rarity entries.**  
     `Highlighted` and `Rarities` are distinct fields (tokens `0x04001d60`, `0x04001d61`). Their collection shapes are not resolved here.

109. **The runtime banner model stores its module entries separately.**  
     `Modules` is a distinct field (token `0x04001d62`). It is not conflated with the banner's rarity or highlighted fields.

110. **The runtime banner model has an explicit validity field.**  
     `Valid` is Boolean (token `0x04001d63`). Its criteria and whether it is set by validation or another process are unknown.

### Per-module banner entry model

111. **A banner module entry refers to the module catalog by InfoIndex.**  
     `ModuleBannerModule.InfoIndex` is an integer (token `0x04001d64`). This is a catalog-style identifier, not a ModuleItem GUID.

112. **A banner module entry stores a chance value.**  
     `ModuleBannerModule.Chance` is a floating-point field (token `0x04001d65`). No probability scale, normalization, or odds interpretation is inferred.

113. **A banner module entry stores an Adjusted flag.**  
     `ModuleBannerModule.Adjusted` is Boolean (token `0x04001d66`). Its exact meaning and relationship to odds adjustment are unknown.

114. **A banner module entry stores its own Highlighted flag.**  
     `ModuleBannerModule.Highlighted` is Boolean (token `0x04001d67`). This is distinct from the banner-level `Highlighted` field.

### Banner retrieval, validation, and selection interfaces

115. **Featured and rotating banner retrieval have separate asynchronous methods.**  
     ModuleManager declares `GetFeaturedBanners()` and `GetRotatingBanners()`, each returning `System.Collections.IEnumerator` (method indices 6202 and 6203). This establishes separate coroutine-style interfaces, not the remote endpoint or fetch schedule.

116. **A shared banner retrieval method accepts a field name.**  
     `GetBanners(banners, fieldName)` returns Boolean and accepts a banner collection plus a string field name (method index 6204). The meaning of the Boolean and accepted field names are not established.

117. **Banner construction has an explicit try-and-report interface.**  
     `TryCreateBanner(name, data, banner, problem)` returns Boolean and accepts a name, `ModuleBannerData`, and output-style banner/problem parameters (method index 6206). The success criteria and output contents are unknown.

118. **Banner data validation returns a string.**  
     `ValidateBannerData(data)` returns `System.String` (method index 6207). The returned string may carry validation information, but whether empty/null means success is not established.

119. **Banner retrieval has a cache-clear operation keyed by string.**  
     `ClearBannerCache(key)` is declared (method index 6205). The key format and cache scope are unknown.

120. **The manager exposes separate earliest-banner selectors for rotating and featured groups.**  
     `GetEarliestRotatingBanner()` and `GetEarliestFeaturedBanner()` return `ModuleBanner`; a generic `GetEarliestBanner(banners)` accepts a banner collection (method indices 6218–6220). The declarations show separate selection interfaces, but do not establish sorting direction, date comparison, or active-banner eligibility.

## Evidence and limitations

Primary evidence: direct metadata declarations in `GRE/1/09_modules.json`, blob SHA `016cc346998a2c3fafcc945ca0d01308a74e66d5`. Relevant type records:

- `ModuleBannerData` (type index 672)
- `ModuleBanner` (type index 715)
- `ModuleBannerModule` (type index 716)
- `ModuleManager` (type index 703)

Relevant ModuleManager method indices: 6202–6207 and 6218–6220. Field tokens are recorded inline with each finding.

Unknown or unresolved:

- Actual banner configuration source and transport.
- Meaning and unit of banner price and module chance.
- Whether date boundaries are inclusive and which time zone is used.
- Exact collection types for highlighted entries, rarities, and modules.
- Mapping from `ModuleBannerData` to `ModuleBanner`.
- Validation rules and the meaning of a validation string.
- Cache-key format and invalidation conditions.
- Sorting, selection, and eligibility behavior for earliest-banner methods.
- Runtime effect of the validity and adjusted flags.

## GKB disposition

Do not import these as verified banner mechanics. Retain them as source-structure observations. For player-facing banner odds, prices, schedules, and guarantees, use versioned fanmade sources and preserve disagreements side by side rather than silently choosing one.
