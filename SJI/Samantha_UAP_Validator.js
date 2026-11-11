
/**
 * SAMANTHA UAP VALIDATOR
 * Version: 1.0.0
 *
 * Dependency-free runtime validator.
 * Manifest-driven: does not hardcode the 437 root fields.
 *
 * Functions:
 *   validateAccountJSON(accountJSON, manifest)
 *   createManualUAP(manualInput, manifest)
 *
 * CommonJS and browser global compatible.
 */

(function (root, factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.SamanthaUAPValidator = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "1.0.0";

  function isObject(value) {
    return value !== null &&
      typeof value === "object" &&
      !Array.isArray(value);
  }

  function typeOf(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isValidDate(value) {
    return typeof value === "string" &&
      value.length > 0 &&
      !Number.isNaN(Date.parse(value));
  }

  function makeReport() {
    return {
      errors: [],
      warnings: [],
      missing: [],
      unknown: [],
      checks: {
        rootFields: 0,
        rootTypes: 0,
        arrayContracts: 0,
        nestedContracts: 0,
        crossReferences: 0
      }
    };
  }

  function addError(report, code, path, message) {
    report.errors.push({ code, path, message });
  }

  function addWarning(report, code, path, message) {
    report.warnings.push({ code, path, message });
  }

  function addMissing(report, path, message) {
    report.missing.push({ path, message });
  }

  function getStatus(report) {
    if (report.errors.length > 0) return "INVALID";

    if (report.missing.length > 0) {
      return "PARTIALLY_AVAILABLE";
    }

    if (report.warnings.length > 0 ||
        report.unknown.length > 0) {
      return "VALID_WITH_WARNINGS";
    }

    return "VALID";
  }

  function createEmptyUAP(manifest) {
    if (manifest && isObject(manifest.uapShape)) {
      return clone(manifest.uapShape);
    }

    return {
      account_identity: {},
      game_version: {},
      research: {},
      workshop: {},
      workshop_enhancements: {},
      ultimate_weapons: {},
      modules: {},
      cards: {},
      bots: {},
      guardians: {},
      perks: {},
      relics: {},
      vault: {},
      lifetime_statistics: {
        aggregate: {},
        active_round_snapshot: {}
      },
      battle_history: {},
      presets: {},
      validation_report: {},
      missing_and_unknown_information: {
        missing: [],
        unknown: [],
        unsupported: [],
        conflicting: []
      }
    };
  }

  function validateManifest(manifest, report) {
    if (!isObject(manifest)) {
      addError(
        report,
        "MANIFEST_INVALID",
        "manifest",
        "Manifest must be a JSON object."
      );
      return false;
    }

    if (!Array.isArray(manifest.rootFields)) {
      addError(
        report,
        "MANIFEST_ROOT_FIELDS_MISSING",
        "manifest.rootFields",
        "Manifest rootFields must be an array."
      );
      return false;
    }

    if (!isObject(manifest.sourceGroups)) {
      addError(
        report,
        "MANIFEST_GROUPS_MISSING",
        "manifest.sourceGroups",
        "Manifest sourceGroups must be an object."
      );
      return false;
    }

    if (!isObject(manifest.arrayContracts)) {
      addError(
        report,
        "MANIFEST_ARRAY_CONTRACTS_MISSING",
        "manifest.arrayContracts",
        "Manifest arrayContracts must be an object."
      );
      return false;
    }

    const names = new Set();

    for (const entry of manifest.rootFields) {
      if (!Array.isArray(entry) || entry.length !== 3) {
        addError(
          report,
          "MANIFEST_FIELD_FORMAT",
          "manifest.rootFields",
          "Each root field must be [fieldName, observedJsonType, sourceGroup]."
        );
        continue;
      }

      const [name, expectedType, group] = entry;

      if (typeof name !== "string" ||
          typeof expectedType !== "string" ||
          typeof group !== "string") {
        addError(
          report,
          "MANIFEST_FIELD_VALUE",
          "manifest.rootFields",
          "Root field tuple contains invalid values."
        );
        continue;
      }

      if (names.has(name)) {
        addError(
          report,
          "MANIFEST_DUPLICATE_FIELD",
          "manifest.rootFields." + name,
          "Duplicate root field declaration."
        );
      }

      names.add(name);

      if (!manifest.sourceGroups[group]) {
        addError(
          report,
          "MANIFEST_UNKNOWN_GROUP",
          "manifest.rootFields." + name,
          "Source group is not declared: " + group
        );
      }
    }

    return report.errors.length === 0;
  }

  function validateRootFields(account, manifest, report) {
    const declared = new Set();

    for (const [name, expectedType, group] of manifest.rootFields) {
      declared.add(name);
      report.checks.rootFields++;

      if (!Object.prototype.hasOwnProperty.call(account, name)) {
        addMissing(
          report,
          name,
          "Field is declared in the manifest but absent from this export."
        );
        continue;
      }

      const actualType = typeOf(account[name]);

      report.checks.rootTypes++;

      if (actualType !== expectedType) {
        addError(
          report,
          "ROOT_TYPE_MISMATCH",
          name,
          "Expected " + expectedType + ", received " + actualType + "."
        );
      }
    }

    for (const key of Object.keys(account)) {
      if (!declared.has(key)) {
        report.unknown.push({
          path: key,
          value: account[key],
          type: typeOf(account[key])
        });

        addWarning(
          report,
          "UNKNOWN_ROOT_FIELD",
          key,
          "Unknown field preserved; it is not discarded."
        );
      }
    }
  }

  function validateArrayContracts(account, manifest, report) {
    for (const [field, contract] of Object.entries(
      manifest.arrayContracts
    )) {
      report.checks.arrayContracts++;

      if (!Object.prototype.hasOwnProperty.call(account, field)) {
        continue;
      }

      const value = account[field];

      if (!Array.isArray(value)) {
        addError(
          report,
          "ARRAY_EXPECTED",
          field,
          "Expected an array."
        );
        continue;
      }

      const expectedLength = contract[0];
      const expectedType = contract[1];

      if (value.length !== expectedLength) {
        addError(
          report,
          "ARRAY_LENGTH_MISMATCH",
          field,
          "Expected length " + expectedLength +
          ", received " + value.length + "."
        );
      }

      value.forEach((item, index) => {
        if (typeOf(item) !== expectedType) {
          addError(
            report,
            "ARRAY_ITEM_TYPE",
            field + "[" + index + "]",
            "Expected " + expectedType +
            ", received " + typeOf(item) + "."
          );
        }
      });

      if (field === "ResearchPercentComplete") {
        value.forEach((n, i) => {
          if (typeof n === "number" && (n < 0 || n > 1)) {
            addError(
              report,
              "RESEARCH_PERCENT_RANGE",
              field + "[" + i + "]",
              "Value must be between 0 and 1."
            );
          }
        });
      }

      if (field === "PerkLevel") {
        value.forEach((n, i) => {
          if (typeof n === "number" && (n < 0 || n > 5)) {
            addError(
              report,
              "PERK_LEVEL_RANGE",
              field + "[" + i + "]",
              "Observed range is 0 to 5."
            );
          }
        });
      }

      if (field === "RelicsUnlocked") {
        value.forEach((n, i) => {
          if (typeof n === "number" && n !== 0 && n !== 2) {
            addWarning(
              report,
              "UNKNOWN_RELIC_CODE",
              field + "[" + i + "]",
              "Value differs from observed fixture codes 0 and 2."
            );
          }
        });
      }

      if (field === "GuardianChipSlot") {
        value.forEach((n, i) => {
          if (typeof n === "number" && (n < -1 || n > 29)) {
            addError(
              report,
              "GUARDIAN_CHIP_RANGE",
              field + "[" + i + "]",
              "Value outside observed range -1 to 29."
            );
          }
        });
      }

      if (field === "BannedPerksIndex") {
        value.forEach((n, i) => {
          if (typeof n === "number" &&
              n !== -1 && (n < 0 || n > 49)) {
            addError(
              report,
              "BANNED_PERK_RANGE",
              field + "[" + i + "]",
              "Expected -1 or a perk ID from 0 to 49."
            );
          }
        });
      }

      if (field === "ProfileRelics") {
        value.forEach((n, i) => {
          if (typeof n === "number" && (n < 0 || n > 349)) {
            addError(
              report,
              "PROFILE_RELIC_RANGE",
              field + "[" + i + "]",
              "Relic reference outside 0 to 349."
            );
          }
        });
      }
    }
  }

  function validateModuleRecord(record, path, report) {
    const contract = [
      "Guid",
      "InfoIndex",
      "CurrentRarity",
      "Level",
      "MaxLevelReached",
      "Effects",
      "EffectLocked",
      "IsNew",
      "CoinsSpent",
      "ShardsSpent",
      "Favorite",
      "RerollCounter"
    ];

    if (!isObject(record)) {
      addError(
        report,
        "MODULE_RECORD_NOT_OBJECT",
        path,
        "Module record must be an object."
      );
      return;
    }

    const actual = Object.keys(record).sort();
    const expected = contract.slice().sort();

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      addWarning(
        report,
        "MODULE_RECORD_KEYS_DIFFER",
        path,
        "Module record keys differ from the observed 12-key structure."
      );
    }

    if (!Array.isArray(record.Effects) ||
        record.Effects.length !== 8 ||
        record.Effects.some(x => typeof x !== "number")) {
      addError(
        report,
        "MODULE_EFFECTS_INVALID",
        path + ".Effects",
        "Effects must contain exactly 8 numbers."
      );
    }

    if (!Array.isArray(record.EffectLocked) ||
        record.EffectLocked.length !== 8 ||
        record.EffectLocked.some(x => typeof x !== "boolean")) {
      addError(
        report,
        "MODULE_EFFECT_LOCKS_INVALID",
        path + ".EffectLocked",
        "EffectLocked must contain exactly 8 booleans."
      );
    }

    if (typeof record.Guid !== "string") {
      addError(
        report,
        "MODULE_GUID_INVALID",
        path + ".Guid",
        "Module GUID must be a string."
      );
    }
  }

  function validateNestedContracts(account, manifest, report) {
    const nested = manifest.nestedContracts || {};

    if (Array.isArray(account.ModuleInventory)) {
      account.ModuleInventory.forEach((record, i) => {
        validateModuleRecord(
          record,
          "ModuleInventory[" + i + "]",
          report
        );
      });
    }

    if (Array.isArray(account.ModuleEquipped)) {
      account.ModuleEquipped.forEach((record, i) => {
        validateModuleRecord(
          record,
          "ModuleEquipped[" + i + "]",
          report
        );
      });
    }

    if (Array.isArray(account.AssistModuleSlots)) {
      account.AssistModuleSlots.forEach((slot, i) => {
        if (!isObject(slot)) {
          addError(
            report,
            "ASSIST_SLOT_INVALID",
            "AssistModuleSlots[" + i + "]",
            "Assist module slot must be an object."
          );
          return;
        }

        const module = slot.EquippedModule;

        if (module !== null && module !== undefined) {
          validateModuleRecord(
            module,
            "AssistModuleSlots[" + i + "].EquippedModule",
            report
          );
        }
      });
    }

    if (Array.isArray(account.BattleHistory)) {
      account.BattleHistory.forEach((record, i) => {
        const path = "BattleHistory[" + i + "]";
        report.checks.nestedContracts++;

        if (!isObject(record)) {
          addError(report, "BATTLE_RECORD_INVALID", path,
            "Battle history record must be an object.");
          return;
        }

        if (!isValidDate(record.BattleDate)) {
          addError(report, "BATTLE_DATE_INVALID",
            path + ".BattleDate", "BattleDate is not parseable.");
        }

        const expected = nested.BattleHistoryRecord?.observedKeyCount;
        if (expected && Object.keys(record).length !== expected) {
          addWarning(
            report,
            "BATTLE_RECORD_KEY_COUNT",
            path,
            "Observed key count differs from fixture contract."
          );
        }
      });
    }

    if (Array.isArray(account.TournamentRecords)) {
      const expectedKeys = [
        "TournamentNumber", "Date", "LeagueID", "Wave", "Rank"
      ].sort();

      account.TournamentRecords.forEach((record, i) => {
        const path = "TournamentRecords[" + i + "]";
        report.checks.nestedContracts++;

        if (!isObject(record)) {
          addError(report, "TOURNAMENT_RECORD_INVALID", path,
            "Tournament record must be an object.");
          return;
        }

        if (JSON.stringify(Object.keys(record).sort()) !==
            JSON.stringify(expectedKeys)) {
          addWarning(
            report,
            "TOURNAMENT_RECORD_KEYS",
            path,
            "Tournament record keys differ from observed contract."
          );
        }

        if (!isValidDate(record.Date)) {
          addError(report, "TOURNAMENT_DATE_INVALID",
            path + ".Date", "Tournament date is not parseable.");
        }
      });
    }

    if (Array.isArray(account.CompletedLabs)) {
      account.CompletedLabs.forEach((record, i) => {
        const path = "CompletedLabs[" + i + "]";
        report.checks.nestedContracts++;

        if (!isObject(record) ||
            !isValidDate(record.dateCompleted) ||
            !Number.isInteger(record.labNumber) ||
            !Number.isInteger(record.level)) {
          addError(
            report,
            "COMPLETED_LAB_INVALID",
            path,
            "Expected dateCompleted, integer labNumber and integer level."
          );
        }
      });
    }

    if (Array.isArray(account.PerksPicked)) {
      let previousWave = -Infinity;

      account.PerksPicked.forEach((record, i) => {
        const path = "PerksPicked[" + i + "]";
        report.checks.nestedContracts++;

        if (!isObject(record) ||
            typeof record.Wave !== "number" ||
            !Number.isInteger(record.Perk) ||
            record.Perk < 0 || record.Perk > 49) {
          addError(
            report,
            "PERK_PICK_INVALID",
            path,
            "Expected numeric Wave and integer Perk ID 0..49."
          );
          return;
        }

        if (record.Wave < previousWave) {
          addError(
            report,
            "PERK_WAVE_ORDER",
            path + ".Wave",
            "Wave values must be nondecreasing."
          );
        }

        previousWave = record.Wave;
      });
    }

    if (isObject(account.Vault) &&
        isObject(account.Vault.UpgradesLevel)) {
      for (const key of Object.keys(account.Vault.UpgradesLevel)) {
        if (!/^\d+$/.test(key)) {
          addWarning(
            report,
            "VAULT_DYNAMIC_KEY",
            "Vault.UpgradesLevel." + key,
            "Vault upgrade key is not a numeric string."
          );
        }
      }

      const date = account.Vault.LastRespecDate;

      if (typeof date === "string" && date.startsWith("0001-")) {
        addWarning(
          report,
          "VAULT_UNSET_DATE_CANDIDATE",
          "Vault.LastRespecDate",
          "Year 0001 is treated as a candidate unset sentinel."
        );
      } else if (date && !isValidDate(date)) {
        addWarning(
          report,
          "VAULT_DATE_UNPARSEABLE",
          "Vault.LastRespecDate",
          "LastRespecDate is not parseable."
        );
      }
    }

    for (const field of [
      "CurrencyEarnedThisCycle",
      "CurrencySpentThisCycle"
    ]) {
      const value = account[field];

      if (isObject(value) && value.Currencies !== undefined &&
          !isObject(value.Currencies)) {
        addError(
          report,
          "CURRENCY_DICTIONARY_INVALID",
          field + ".Currencies",
          "Currencies must be an object."
        );
      }
    }
  }

  function validateCrossReferences(account, report) {
    const guidRecords = [];
    const guidSet = new Set();

    function collect(record, path) {
      if (!isObject(record) || typeof record.Guid !== "string") return;

      if (guidSet.has(record.Guid)) {
        addError(
          report,
          "MODULE_GUID_DUPLICATE",
          path + ".Guid",
          "Duplicate module GUID detected."
        );
      } else {
        guidSet.add(record.Guid);
      }

      guidRecords.push(record.Guid);
    }

    (account.ModuleInventory || []).forEach((r, i) =>
      collect(r, "ModuleInventory[" + i + "]")
    );

    (account.ModuleEquipped || []).forEach((r, i) =>
      collect(r, "ModuleEquipped[" + i + "]")
    );

    (account.AssistModuleSlots || []).forEach((slot, i) => {
      if (slot && slot.EquippedModule) {
        collect(
          slot.EquippedModule,
          "AssistModuleSlots[" + i + "].EquippedModule"
        );
      }
    });

    report.checks.crossReferences++;

    const presetRefs = [];

    (account.ModulePresets || []).forEach((preset, i) => {
      if (!isObject(preset)) return;

      for (const field of [
        "PrimaryModuleGuids",
        "AssistModuleGuids"
      ]) {
        if (!Array.isArray(preset[field])) continue;

        preset[field].forEach((guid, j) => {
          if (guid === null) return;

          if (typeof guid !== "string") {
            addError(
              report,
              "MODULE_PRESET_GUID_TYPE",
              "ModulePresets[" + i + "]." + field + "[" + j + "]",
              "Module preset GUID must be string or null."
            );
            return;
          }

          presetRefs.push(guid);
        });
      }
    });

    for (const guid of presetRefs) {
      if (!guidSet.has(guid)) {
        addWarning(
          report,
          "MODULE_PRESET_GUID_UNRESOLVED",
          "ModulePresets",
          "A preset GUID does not resolve against available module records."
        );
      }
    }

    report.checks.crossReferences++;

    if (Array.isArray(account.ProfileRelics)) {
      account.ProfileRelics.forEach((id, i) => {
        if (!Number.isInteger(id) || id < 0 || id > 349) {
          addError(
            report,
            "PROFILE_RELIC_REFERENCE",
            "ProfileRelics[" + i + "]",
            "Relic ID must be an integer from 0 to 349."
          );
        }
      });
    }

    report.checks.crossReferences++;

    if (Array.isArray(account.CompletedLabs)) {
      account.CompletedLabs.forEach((lab, i) => {
        if (lab && Number.isInteger(lab.labNumber) &&
            (lab.labNumber < 0 || lab.labNumber > 259)) {
          addError(
            report,
            "COMPLETED_LAB_REFERENCE",
            "CompletedLabs[" + i + "].labNumber",
            "Lab number must be in range 0..259."
          );
        }
      });
    }

    report.checks.crossReferences++;

    if (Array.isArray(account.PerksPicked)) {
      account.PerksPicked.forEach((perk, i) => {
        if (perk && (!Number.isInteger(perk.Perk) ||
            perk.Perk < 0 || perk.Perk > 49)) {
          addError(
            report,
            "PERK_REFERENCE",
            "PerksPicked[" + i + "].Perk",
            "Perk ID must be in range 0..49."
          );
        }
      });
    }

    report.checks.crossReferences++;

    const cardBool = account.SlotPresetCardAssignedBool;
    const cardIds = account.SlotPresetCardInt;

    if (Array.isArray(cardBool) && Array.isArray(cardIds)) {
      const length = Math.min(cardBool.length, cardIds.length);

      for (let i = 0; i < length; i++) {
        if (cardBool[i] === true &&
            (!Number.isInteger(cardIds[i]) ||
             cardIds[i] < 0 || cardIds[i] > 39)) {
          addError(
            report,
            "CARD_SLOT_REFERENCE",
            "SlotPresetCardInt[" + i + "]",
            "Assigned card ID must be an integer from 0 to 39."
          );
        }
      }
    }

    report.checks.crossReferences++;

    const globalPresets = account.GlobalPresets;

    if (Array.isArray(globalPresets)) {
      const limits = {
        WorkshopIndex: Array.isArray(account.WorkshopPresetName)
          ? account.WorkshopPresetName.length : null,
        CardsIndex: Array.isArray(account.PresetName)
          ? account.PresetName.length : null,
        BotsIndex: Array.isArray(account.BotPresetName)
          ? account.BotPresetName.length : null,
        ModulesIndex: Array.isArray(account.ModulePresets)
          ? account.ModulePresets.length : null,
        GuardiansIndex: Array.isArray(account.GuardianPresets)
          ? account.GuardianPresets.length : null
      };

      globalPresets.forEach((preset, i) => {
        if (!isObject(preset)) return;

        for (const [field, limit] of Object.entries(limits)) {
          const value = preset[field];

          if (limit === null) {
            addWarning(
              report,
              "PRESET_TARGET_UNAVAILABLE",
              "GlobalPresets[" + i + "]." + field,
              "Destination preset collection could not be determined."
            );
            continue;
          }

          if (!Number.isInteger(value) || value < 0 || value >= limit) {
            addError(
              report,
              "GLOBAL_PRESET_INDEX",
              "GlobalPresets[" + i + "]." + field,
              "Index must be between 0 and " + (limit - 1) + "."
            );
          }
        }
      });
    }

    report.checks.crossReferences++;

    const currentIndexes = [
      ["CurrentGlobalPreset", "GlobalPresets"],
      ["CurrentModulePreset", "ModulePresets"],
      ["CurrentGuardianPreset", "GuardianPresets"],
      ["CurrentBotPreset", "BotPresetName"],
      ["CurrentWorkshopPreset", "WorkshopPresetName"],
      ["CurrentPreset", "PresetName"]
    ];

    for (const [field, target] of currentIndexes) {
      if (account[field] === undefined) continue;

      const collection = account[target];

      if (!Array.isArray(collection)) {
        addWarning(
          report,
          "CURRENT_PRESET_TARGET_UNAVAILABLE",
          field,
          "Cannot validate index because " + target + " is unavailable."
        );
        continue;
      }

      if (!Number.isInteger(account[field]) ||
          account[field] < 0 ||
          account[field] >= collection.length) {
        addError(
          report,
          "CURRENT_PRESET_INDEX",
          field,
          "Index is outside " + target + " bounds."
        );
      }
    }

    report.checks.crossReferences++;
  }

  function buildUAP(account, manifest, report) {
    const uap = createEmptyUAP(manifest);

    for (const [name, expectedType, group] of manifest.rootFields) {
      if (!Object.prototype.hasOwnProperty.call(account, name)) continue;

      const config = manifest.sourceGroups[group];
      if (!config) continue;

      const domain = config.uapDomain;
      const subdomain = config.subdomain;

      if (!uap[domain] || !isObject(uap[domain])) {
        uap[domain] = {};
      }

      if (subdomain) {
        if (!isObject(uap[domain][subdomain])) {
          uap[domain][subdomain] = {};
        }

        uap[domain][subdomain][name] = account[name];
      } else {
        uap[domain][name] = account[name];
      }
    }

    uap.missing_and_unknown_information = {
      missing: report.missing,
      unknown: report.unknown,
      unsupported: [],
      conflicting: []
    };

    uap.validation_report = {
      validatorVersion: VERSION,
      status: getStatus(report),
      errors: report.errors,
      warnings: report.warnings,
      checks: report.checks
    };

    return uap;
  }

  function validateAccountJSON(accountJSON, manifest) {
    const report = makeReport();

    if (!validateManifest(manifest, report)) {
      return {
        status: "INVALID",
        report,
        uap: createEmptyUAP(manifest)
      };
    }

    let account = accountJSON;

    if (typeof accountJSON === "string") {
      try {
        account = JSON.parse(accountJSON);
      } catch (error) {
        addError(
          report,
          "JSON_PARSE_ERROR",
          "accountJSON",
          error.message
        );

        return {
          status: "INVALID",
          report,
          uap: createEmptyUAP(manifest)
        };
      }
    }

    if (!isObject(account)) {
      addError(
        report,
        "ACCOUNT_ROOT_INVALID",
        "accountJSON",
        "Account JSON root must be an object."
      );

      return {
        status: "INVALID",
        report,
        uap: createEmptyUAP(manifest)
      };
    }

    validateRootFields(account, manifest, report);
    validateArrayContracts(account, manifest, report);
    validateNestedContracts(account, manifest, report);
    validateCrossReferences(account, report);

    const reference = manifest.evidence?.versions;

    if (reference && account.VersionNumber !== undefined) {
      const known = reference.VersionNumber || [];

      if (!known.includes(account.VersionNumber)) {
        addWarning(
          report,
          "GAME_VERSION_NOT_IN_FIXTURES",
          "VersionNumber",
          "This game version was not represented by the four audited fixtures."
        );
      }
    }

    if (account.ExportVersion !== undefined &&
        account.GameStartedDate !== undefined &&
        !isValidDate(account.GameStartedDate)) {
      addWarning(
        report,
        "GAME_STARTED_DATE_UNPARSEABLE",
        "GameStartedDate",
        "GameStartedDate is not parseable."
      );
    }

    const uap = buildUAP(account, manifest, report);
    const status = getStatus(report);

    return {
      validatorVersion: VERSION,
      status,
      report,
      uap
    };
  }

  /**
   * Manual input does not invoke JSON validation.
   * It populates the same canonical UAP structure.
   *
   * Expected input:
   * - A partial canonical UAP object, OR
   * - Explicit domain objects using manifest UAP names.
   *
   * Unavailable values remain unknown.
   */
  function createManualUAP(manualInput, manifest) {
    const uap = createEmptyUAP(manifest);

    const report = {
      status: "PARTIALLY_AVAILABLE",
      source: "USER_PROVIDED_MANUAL_INPUT",
      errors: [],
      warnings: [],
      missing: [],
      unknown: [],
      provenance: {}
    };

    if (!isObject(manualInput)) {
      report.errors.push({
        code: "MANUAL_INPUT_INVALID",
        message: "Manual input must be an object."
      });

      uap.validation_report = report;
      return { status: "INVALID", report, uap };
    }

    const domains = manifest?.canonicalUapDomains || [];

    for (const domain of domains) {
      if (domain === "validation_report" ||
          domain === "missing_and_unknown_information") {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(manualInput, domain)) {
        uap[domain] = clone(manualInput[domain]);
        report.provenance[domain] = "USER_PROVIDED";
      }
    }

    const unknownKeys = Object.keys(manualInput)
      .filter(key => !domains.includes(key));

    for (const key of unknownKeys) {
      report.unknown.push({
        path: key,
        value: manualInput[key]
      });
    }

    uap.missing_and_unknown_information = {
      missing: [],
      unknown: report.unknown,
      unsupported: [],
      conflicting: []
    };

    uap.validation_report = report;

    return {
      status: report.errors.length ? "INVALID" : "PARTIALLY_AVAILABLE",
      report,
      uap
    };
  }

  return {
    version: VERSION,
    validateAccountJSON,
    createManualUAP,
    createEmptyUAP
  };
});
