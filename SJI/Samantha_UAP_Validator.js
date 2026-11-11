
/**
 * SAMANTHA UAP VALIDATOR
 * Version: 1.2.0
 *
 * Dependency-free runtime validator.
 * Manifest-driven root field validation.
 *
 * Functions:
 *   validateAccountJSON(accountJSON, manifest)
 *   createManualUAP(manualInput, manifest)
 *   createHybridUAP(jsonResult, manualInput, manifest)
 *   createEmptyUAP(manifest)
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

  const VERSION = "1.2.0";

  // ============================================================
  // 1. BASIC UTILITIES
  // ============================================================

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
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function isValidDate(value) {
    return typeof value === "string" &&
      value.length > 0 &&
      !Number.isNaN(Date.parse(value));
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
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

  function uniqueByPath(items) {
    const seen = new Set();

    return items.filter(item => {
      const key = item && item.path
        ? item.path
        : JSON.stringify(item);

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ============================================================
  // 2. EMPTY UAP
  // ============================================================

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

  // ============================================================
  // 3. MANIFEST VALIDATION
  // ============================================================

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

      if (
        typeof name !== "string" ||
        typeof expectedType !== "string" ||
        typeof group !== "string"
      ) {
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

      if (!hasOwn(manifest.sourceGroups, group)) {
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

  // ============================================================
  // 4. ROOT FIELD VALIDATION
  // ============================================================

  function validateRootFields(account, manifest, report) {
    const declared = new Set();

    for (const [name, expectedType] of manifest.rootFields) {
      declared.add(name);
      report.checks.rootFields++;

      if (!hasOwn(account, name)) {
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
          "Expected " + expectedType +
            ", received " + actualType + "."
        );
      }
    }

    for (const key of Object.keys(account)) {
      if (!declared.has(key)) {
        report.unknown.push({
          path: key,
          value: clone(account[key]),
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

  // ============================================================
  // 5. ARRAY CONTRACT VALIDATION
  // ============================================================

  function validateArrayContracts(
    account,
    manifest,
    report,
    isKnownGameVersion
  ) {
    for (const [field, contract] of Object.entries(
      manifest.arrayContracts
    )) {
      report.checks.arrayContracts++;

      if (!hasOwn(account, field)) {
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
        const message =
          "Expected observed length " + expectedLength +
          ", received " + value.length + ".";

        if (isKnownGameVersion) {
          addError(
            report,
            "ARRAY_LENGTH_MISMATCH",
            field,
            message
          );
        } else {
          addWarning(
            report,
            "ARRAY_LENGTH_UNVERIFIED_FOR_GAME_VERSION",
            field,
            message +
              " Length mismatch is non-fatal because this game version " +
              "is not covered by the audited fixtures."
          );
        }
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

      // Generic numeric range support.
      // Manifest descriptive strings are not treated as ranges.
      if (
        typeof contract[2] === "number" &&
        typeof contract[3] === "number"
      ) {
        value.forEach((item, index) => {
          if (
            typeof item === "number" &&
            (item < contract[2] || item > contract[3])
          ) {
            addError(
              report,
              "ARRAY_ITEM_RANGE",
              field + "[" + index + "]",
              "Value must be between " +
                contract[2] + " and " + contract[3] + "."
            );
          }
        });
      }

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
          if (
            typeof n === "number" &&
            n !== -1 &&
            (n < 0 || n > 49)
          ) {
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

  // ============================================================
  // 6. MODULE RECORD VALIDATION
  // ============================================================

  function validateModuleRecord(record, path, report, manifest) {
    const contract = manifest?.nestedContracts?.ModuleRecord || {};
    const expectedKeys = Array.isArray(contract.keys)
      ? contract.keys
      : [];

    if (!isObject(record)) {
      addError(
        report,
        "MODULE_RECORD_NOT_OBJECT",
        path,
        "Module record must be an object."
      );
      return;
    }

    report.checks.nestedContracts++;

    if (expectedKeys.length) {
      const actual = Object.keys(record).sort();
      const expected = expectedKeys.slice().sort();

      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        addWarning(
          report,
          "MODULE_RECORD_KEYS_DIFFER",
          path,
          "Module record keys differ from manifest contract."
        );
      }

      for (const field of expectedKeys) {
        if (!hasOwn(record, field)) {
          addWarning(
            report,
            "MODULE_RECORD_FIELD_MISSING",
            path + "." + field,
            "Expected module field is absent."
          );
        }
      }
    }

    for (const field of ["Effects", "EffectLocked"]) {
      const rule = contract[field];

      if (!rule) continue;

      const value = record[field];

      if (!Array.isArray(value)) {
        addError(
          report,
          "MODULE_ARRAY_INVALID",
          path + "." + field,
          "Expected an array."
        );
        continue;
      }

      if (value.length !== rule.length) {
        addError(
          report,
          "MODULE_ARRAY_LENGTH",
          path + "." + field,
          "Expected " + rule.length +
            " items, received " + value.length + "."
        );
      }

      value.forEach((item, index) => {
        if (typeof item !== rule.items) {
          addError(
            report,
            "MODULE_ARRAY_ITEM_TYPE",
            path + "." + field + "[" + index + "]",
            "Expected " + rule.items +
              ", received " + typeOf(item) + "."
          );
        }
      });
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

  // ============================================================
  // 7. MODULE PRESET VALIDATION
  // ============================================================

  function validateModulePresets(account, manifest, report) {
    if (!Array.isArray(account.ModulePresets)) return;

    const contract = manifest?.nestedContracts?.ModulePreset || {};

    for (let i = 0; i < account.ModulePresets.length; i++) {
      const preset = account.ModulePresets[i];
      const path = "ModulePresets[" + i + "]";

      report.checks.nestedContracts++;

      if (!isObject(preset)) {
        addError(
          report,
          "MODULE_PRESET_INVALID",
          path,
          "Module preset must be an object."
        );
        continue;
      }

      for (const field of [
        "PrimaryModuleGuids",
        "AssistModuleGuids"
      ]) {
        const rule = contract[field];

        if (!rule) continue;

        const value = preset[field];

        if (!Array.isArray(value)) {
          addError(
            report,
            "MODULE_PRESET_ARRAY_INVALID",
            path + "." + field,
            "Expected an array."
          );
          continue;
        }

        value.forEach((guid, j) => {
          if (guid !== null && typeof guid !== "string") {
            addError(
              report,
              "MODULE_PRESET_GUID_TYPE",
              path + "." + field + "[" + j + "]",
              "GUID must be a string or null."
            );
          }
        });
      }
    }
  }

  // ============================================================
  // 8. CURRENCY DICTIONARY VALIDATION
  // ============================================================

  function validateCurrencyDictionaries(account, report) {
    for (const field of [
      "CurrencyEarnedThisCycle",
      "CurrencySpentThisCycle"
    ]) {
      const value = account[field];

      if (value === undefined) continue;

      if (!isObject(value)) {
        addError(
          report,
          "CURRENCY_RECORD_INVALID",
          field,
          "Currency record must be an object."
        );
        continue;
      }

      if (value.Currencies === undefined) continue;

      if (!isObject(value.Currencies)) {
        addError(
          report,
          "CURRENCY_DICTIONARY_INVALID",
          field + ".Currencies",
          "Currencies must be an object."
        );
        continue;
      }

      for (const [currency, amount] of Object.entries(
        value.Currencies
      )) {
        if (
          typeof amount !== "number" ||
          !Number.isFinite(amount)
        ) {
          addError(
            report,
            "CURRENCY_VALUE_INVALID",
            field + ".Currencies." + currency,
            "Currency amount must be a finite number."
          );
        }
      }
    }
  }

  // ============================================================
  // 9. OTHER NESTED CONTRACTS
  // ============================================================

  function validateNestedContracts(account, manifest, report) {
    const nested = manifest.nestedContracts || {};

    if (Array.isArray(account.ModuleInventory)) {
      account.ModuleInventory.forEach((record, i) => {
        validateModuleRecord(
          record,
          "ModuleInventory[" + i + "]",
          report,
          manifest
        );
      });
    }

    if (Array.isArray(account.ModuleEquipped)) {
      account.ModuleEquipped.forEach((record, i) => {
        validateModuleRecord(
          record,
          "ModuleEquipped[" + i + "]",
          report,
          manifest
        );
      });
    }

    if (Array.isArray(account.AssistModuleSlots)) {
      account.AssistModuleSlots.forEach((slot, i) => {
        const path = "AssistModuleSlots[" + i + "]";

        if (!isObject(slot)) {
          addError(
            report,
            "ASSIST_SLOT_INVALID",
            path,
            "Assist module slot must be an object."
          );
          return;
        }

        const module = slot.EquippedModule;

        if (module !== null && module !== undefined) {
          validateModuleRecord(
            module,
            path + ".EquippedModule",
            report,
            manifest
          );
        }
      });
    }

    validateModulePresets(account, manifest, report);

    if (Array.isArray(account.BattleHistory)) {
      account.BattleHistory.forEach((record, i) => {
        const path = "BattleHistory[" + i + "]";
        report.checks.nestedContracts++;

        if (!isObject(record)) {
          addError(
            report,
            "BATTLE_RECORD_INVALID",
            path,
            "Battle history record must be an object."
          );
          return;
        }

        const dateField =
          nested.BattleHistoryRecord?.dateField || "BattleDate";

        if (!isValidDate(record[dateField])) {
          addError(
            report,
            "BATTLE_DATE_INVALID",
            path + "." + dateField,
            "Battle date is not parseable."
          );
        }

        const expected =
          nested.BattleHistoryRecord?.observedKeyCount;

        if (
          expected &&
          Object.keys(record).length !== expected
        ) {
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
      const contract = nested.TournamentRecord || {};
      const expectedKeys = Array.isArray(contract.keys)
        ? contract.keys.slice().sort()
        : [];

      account.TournamentRecords.forEach((record, i) => {
        const path = "TournamentRecords[" + i + "]";
        report.checks.nestedContracts++;

        if (!isObject(record)) {
          addError(
            report,
            "TOURNAMENT_RECORD_INVALID",
            path,
            "Tournament record must be an object."
          );
          return;
        }

        if (
          expectedKeys.length &&
          JSON.stringify(Object.keys(record).sort()) !==
            JSON.stringify(expectedKeys)
        ) {
          addWarning(
            report,
            "TOURNAMENT_RECORD_KEYS",
            path,
            "Tournament record keys differ from observed contract."
          );
        }

        const dateField = contract.dateField || "Date";

        if (!isValidDate(record[dateField])) {
          addError(
            report,
            "TOURNAMENT_DATE_INVALID",
            path + "." + dateField,
            "Tournament date is not parseable."
          );
        }
      });
    }

    if (Array.isArray(account.CompletedLabs)) {
      account.CompletedLabs.forEach((record, i) => {
        const path = "CompletedLabs[" + i + "]";
        report.checks.nestedContracts++;

        if (
          !isObject(record) ||
          !isValidDate(record.dateCompleted) ||
          !Number.isInteger(record.labNumber) ||
          !Number.isInteger(record.level)
        ) {
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

        if (
          !isObject(record) ||
          typeof record.Wave !== "number" ||
          !Number.isFinite(record.Wave) ||
          !Number.isInteger(record.Perk) ||
          record.Perk < 0 ||
          record.Perk > 49
        ) {
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

    if (isObject(account.Vault)) {
      if (account.Vault.UpgradesLevel !== undefined) {
        if (!isObject(account.Vault.UpgradesLevel)) {
          addError(
            report,
            "VAULT_UPGRADES_INVALID",
            "Vault.UpgradesLevel",
            "UpgradesLevel must be an object."
          );
        } else {
          for (const [key, value] of Object.entries(
            account.Vault.UpgradesLevel
          )) {
            if (!/^\d+$/.test(key)) {
              addWarning(
                report,
                "VAULT_DYNAMIC_KEY",
                "Vault.UpgradesLevel." + key,
                "Vault upgrade key is not a numeric string."
              );
            }

            if (
              typeof value !== "number" ||
              !Number.isFinite(value)
            ) {
              addError(
                report,
                "VAULT_UPGRADE_VALUE_INVALID",
                "Vault.UpgradesLevel." + key,
                "Vault upgrade level must be a finite number."
              );
            }
          }
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

    validateCurrencyDictionaries(account, report);

    /*
     * WrappedStatsRecord:
     * The manifest describes its observed shape, but the exact
     * root location/container has not been established.
     * It is intentionally not validated by guessing a location.
     */
  }

  // ============================================================
  // 10. CROSS-REFERENCE VALIDATION
  // ============================================================

  function validateCrossReferences(account, report) {
    const guidSet = new Set();

    function collect(record, path) {
      if (!isObject(record) || typeof record.Guid !== "string") {
        return;
      }

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
    }

    (Array.isArray(account.ModuleInventory)
      ? account.ModuleInventory
      : []
    ).forEach((record, i) => {
      collect(record, "ModuleInventory[" + i + "]");
    });

    (Array.isArray(account.ModuleEquipped)
      ? account.ModuleEquipped
      : []
    ).forEach((record, i) => {
      collect(record, "ModuleEquipped[" + i + "]");
    });

    (Array.isArray(account.AssistModuleSlots)
      ? account.AssistModuleSlots
      : []
    ).forEach((slot, i) => {
      if (slot && slot.EquippedModule) {
        collect(
          slot.EquippedModule,
          "AssistModuleSlots[" + i + "].EquippedModule"
        );
      }
    });

    report.checks.crossReferences++;

    const presetRefs = [];

    (Array.isArray(account.ModulePresets)
      ? account.ModulePresets
      : []
    ).forEach((preset, i) => {
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
        if (
          lab &&
          Number.isInteger(lab.labNumber) &&
          (lab.labNumber < 0 || lab.labNumber > 259)
        ) {
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
        if (
          perk &&
          (!Number.isInteger(perk.Perk) ||
            perk.Perk < 0 ||
            perk.Perk > 49)
        ) {
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
        if (
          cardBool[i] === true &&
          (!Number.isInteger(cardIds[i]) ||
            cardIds[i] < 0 ||
            cardIds[i] > 39)
        ) {
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
          ? account.WorkshopPresetName.length
          : null,
        CardsIndex: Array.isArray(account.PresetName)
          ? account.PresetName.length
          : null,
        BotsIndex: Array.isArray(account.BotPresetName)
          ? account.BotPresetName.length
          : null,
        ModulesIndex: Array.isArray(account.ModulePresets)
          ? account.ModulePresets.length
          : null,
        GuardiansIndex: Array.isArray(account.GuardianPresets)
          ? account.GuardianPresets.length
          : null
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

          if (
            !Number.isInteger(value) ||
            value < 0 ||
            value >= limit
          ) {
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

      if (
        !Number.isInteger(account[field]) ||
        account[field] < 0 ||
        account[field] >= collection.length
      ) {
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

  // ============================================================
  // 11. BUILD CANONICAL UAP
  // ============================================================

  function buildUAP(account, manifest, report) {
    const uap = createEmptyUAP(manifest);

    for (const [name, expectedType, group] of manifest.rootFields) {
      if (!hasOwn(account, name)) continue;

      const config = manifest.sourceGroups[group];
      if (!config) continue;

      const domain = config.uapDomain;
      const subdomain =
        config.subdomain ||
        (domain === "account_identity" ? group : undefined);

      if (!uap[domain] || !isObject(uap[domain])) {
        uap[domain] = {};
      }

      if (subdomain) {
        if (!isObject(uap[domain][subdomain])) {
          uap[domain][subdomain] = {};
        }

        uap[domain][subdomain][name] = clone(account[name]);
      } else {
        uap[domain][name] = clone(account[name]);
      }
    }

    uap.missing_and_unknown_information = {
      missing: clone(report.missing),
      unknown: clone(report.unknown),
      unsupported: [],
      conflicting: []
    };

    uap.validation_report = {
      validatorVersion: VERSION,
      status: getStatus(report),
      errors: clone(report.errors),
      warnings: clone(report.warnings),
      checks: clone(report.checks)
    };

    return uap;
  }

  // ============================================================
  // 12. JSON VALIDATION ENTRY POINT
  // ============================================================

  function validateAccountJSON(accountJSON, manifest) {
    const report = makeReport();

    if (!validateManifest(manifest, report)) {
      return {
        validatorVersion: VERSION,
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
          validatorVersion: VERSION,
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
        validatorVersion: VERSION,
        status: "INVALID",
        report,
        uap: createEmptyUAP(manifest)
      };
    }

    validateRootFields(account, manifest, report);

    const reference = manifest.evidence?.versions;

    const knownVersions = Array.isArray(reference?.VersionNumber)
      ? reference.VersionNumber
      : [];

    const isKnownGameVersion =
      account.VersionNumber !== undefined &&
      knownVersions.includes(account.VersionNumber);

    validateArrayContracts(
      account,
      manifest,
      report,
      isKnownGameVersion
    );

    validateNestedContracts(account, manifest, report);
    validateCrossReferences(account, report);

    if (
      reference &&
      account.VersionNumber !== undefined &&
      !isKnownGameVersion
    ) {
      addWarning(
        report,
        "GAME_VERSION_NOT_IN_FIXTURES",
        "VersionNumber",
        "This game version was not represented by the audited fixtures. " +
          "Version-sensitive structural differences are treated cautiously."
      );
    }

    if (
      account.GameStartedDate !== undefined &&
      !isValidDate(account.GameStartedDate)
    ) {
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

  // ============================================================
  // 13. MANUAL INPUT MODE
  // ============================================================

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

    if (!isObject(manifest) ||
        !Array.isArray(manifest.canonicalUapDomains)) {
      report.errors.push({
        code: "MANUAL_MANIFEST_INVALID",
        path: "manifest.canonicalUapDomains",
        message: "Canonical UAP domains are unavailable."
      });

      uap.validation_report = report;

      return {
        status: "INVALID",
        report,
        uap
      };
    }

    if (!isObject(manualInput)) {
      report.errors.push({
        code: "MANUAL_INPUT_INVALID",
        path: "manualInput",
        message: "Manual input must be an object."
      });

      uap.validation_report = report;

      return {
        status: "INVALID",
        report,
        uap
      };
    }

    const excluded = [
      "validation_report",
      "missing_and_unknown_information"
    ];

    const domains = manifest.canonicalUapDomains.filter(
      domain => !excluded.includes(domain)
    );

    for (const domain of domains) {
      if (!hasOwn(manualInput, domain)) {
        addMissing(
          report,
          domain,
          "Domain has not been provided by the user."
        );
        continue;
      }

      if (!isObject(manualInput[domain])) {
        report.errors.push({
          code: "MANUAL_DOMAIN_INVALID",
          path: domain,
          message: "UAP domain must be an object."
        });
        continue;
      }

      uap[domain] = clone(manualInput[domain]);
      report.provenance[domain] = "USER_PROVIDED";
    }

    for (const key of Object.keys(manualInput)) {
      if (
        !manifest.canonicalUapDomains.includes(key)
      ) {
        report.unknown.push({
          path: key,
          value: clone(manualInput[key])
        });
      }
    }

    uap.missing_and_unknown_information = {
      missing: clone(report.missing),
      unknown: clone(report.unknown),
      unsupported: [],
      conflicting: []
    };

    report.status = getStatus(report);
    uap.validation_report = report;

    return {
      status: report.status,
      report,
      uap
    };
  }

  // ============================================================
  // 14. HYBRID INPUT MODE
  // ============================================================

  function createHybridUAP(jsonResult, manualInput, manifest) {
    if (
      !isObject(jsonResult) ||
      !isObject(jsonResult.uap) ||
      !isObject(jsonResult.report)
    ) {
      const report = {
        status: "INVALID",
        source: "HYBRID_JSON_AND_MANUAL",
        errors: [{
          code: "HYBRID_JSON_BASELINE_INVALID",
          path: "jsonResult",
          message: "A JSON validation result containing UAP and report is required."
        }],
        warnings: [],
        missing: [],
        unknown: [],
        conflicting: [],
        provenance: {}
      };

      return {
        status: "INVALID",
        report,
        uap: createEmptyUAP(manifest)
      };
    }

    if (
      !isObject(manifest) ||
      !Array.isArray(manifest.canonicalUapDomains)
    ) {
      const report = {
        status: "INVALID",
        source: "HYBRID_JSON_AND_MANUAL",
        errors: [{
          code: "HYBRID_MANIFEST_INVALID",
          path: "manifest",
          message: "Canonical UAP domains are unavailable."
        }],
        warnings: [],
        missing: [],
        unknown: [],
        conflicting: [],
        provenance: {}
      };

      return {
        status: "INVALID",
        report,
        uap: clone(jsonResult.uap)
      };
    }

    const manualResult = createManualUAP(manualInput, manifest);
    const uap = clone(jsonResult.uap);

    const report = {
      source: "HYBRID_JSON_AND_MANUAL",
      errors: [
        ...(jsonResult.report.errors || []),
        ...(manualResult.report.errors || [])
      ],
      warnings: [
        ...(jsonResult.report.warnings || []),
        ...(manualResult.report.warnings || [])
      ],
      missing: [],
      unknown: clone(manualResult.report.unknown || []),
      conflicting: [],
      provenance: {}
    };

    function equalValues(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    function mergeObject(target, incoming, path) {
      for (const key of Object.keys(incoming)) {
        const nextPath = path
          ? path + "." + key
          : key;

        const manualValue = incoming[key];

        if (!hasOwn(target, key)) {
          target[key] = clone(manualValue);
          report.provenance[nextPath] = "USER_PROVIDED";
          continue;
        }

        const jsonValue = target[key];

        if (
          isObject(jsonValue) &&
          isObject(manualValue)
        ) {
          mergeObject(jsonValue, manualValue, nextPath);
          continue;
        }

        if (equalValues(jsonValue, manualValue)) {
          report.provenance[nextPath] = "JSON_AND_USER_AGREE";
          continue;
        }

        report.conflicting.push({
          path: nextPath,
          jsonValue: clone(jsonValue),
          manualValue: clone(manualValue),
          resolution: "JSON_VALUE_PRESERVED_PENDING_USER_CONFIRMATION"
        });

        report.provenance[nextPath] = "CONFLICT";
      }
    }

    const excluded = [
      "validation_report",
      "missing_and_unknown_information"
    ];

    const domains = manifest.canonicalUapDomains.filter(
      domain => !excluded.includes(domain)
    );

    for (const domain of domains) {
      const jsonHasDomain = hasOwn(jsonResult.uap, domain);
      const manualHasDomain = hasOwn(manualResult.uap, domain) &&
        !manualResult.report.missing.some(
          item => item.path === domain
        );

      if (jsonHasDomain) {
        report.provenance[domain] = "JSON_DERIVED";
      }

      if (manualHasDomain) {
        if (
          !isObject(uap[domain]) ||
          !isObject(manualResult.uap[domain])
        ) {
          if (!jsonHasDomain) {
            uap[domain] = clone(manualResult.uap[domain]);
            report.provenance[domain] = "USER_PROVIDED";
          } else if (
            !equalValues(
              uap[domain],
              manualResult.uap[domain]
            )
          ) {
            report.conflicting.push({
              path: domain,
              jsonValue: clone(uap[domain]),
              manualValue: clone(manualResult.uap[domain]),
              resolution: "JSON_VALUE_PRESERVED_PENDING_USER_CONFIRMATION"
            });
            report.provenance[domain] = "CONFLICT";
          }
        } else {
          mergeObject(
            uap[domain],
            manualResult.uap[domain],
            domain
          );
        }
      }

      if (!jsonHasDomain && !manualHasDomain) {
        report.missing.push({
          path: domain,
          message: "Domain is unavailable from both input sources."
        });
      }
    }

    const jsonUnknown = jsonResult.report.unknown || [];

    report.unknown = [
      ...jsonUnknown.map(item => ({
        ...clone(item),
        provenance: "JSON_DERIVED"
      })),
      ...report.unknown.map(item => ({
        ...clone(item),
        provenance: "USER_PROVIDED"
      }))
    ];

    const jsonMissing = jsonResult.report.missing || [];

    uap.missing_and_unknown_information = {
      missing: uniqueByPath([
        ...jsonMissing.map(item => clone(item)),
        ...report.missing.map(item => clone(item))
      ]),
      unknown: clone(report.unknown),
      unsupported: [],
      conflicting: clone(report.conflicting)
    };

    if (report.errors.length > 0) {
      report.status = "INVALID";
    } else if (
      report.missing.length > 0 ||
      jsonMissing.length > 0 ||
      report.conflicting.length > 0 ||
      manualResult.status === "PARTIALLY_AVAILABLE"
    ) {
      report.status = "PARTIALLY_AVAILABLE";
    } else if (
      report.warnings.length > 0 ||
      report.unknown.length > 0
    ) {
      report.status = "VALID_WITH_WARNINGS";
    } else {
      report.status = "VALID";
    }

    uap.validation_report = report;

    return {
      status: report.status,
      report,
      uap
    };
  }

  // ============================================================
  // 15. PUBLIC API
  // ============================================================

  return {
    version: VERSION,
    validateAccountJSON,
    createManualUAP,
    createHybridUAP,
    createEmptyUAP
  };
});
