
/**
 * SAMANTHA UAP VALIDATOR
 * Version: 1.2.3
 * Manifest-driven validator for Samantha_UAP_Manifest.json.
 * Dependency-free; CommonJS and browser global compatible.
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SamanthaUAPValidator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "1.2.3";
  const UNKNOWN = "UNKNOWN";
  const DOMAINS = [
    "account_identity", "game_version", "research", "workshop",
    "workshop_enhancements", "ultimate_weapons", "modules", "cards",
    "bots", "guardians", "perks", "relics", "vault",
    "lifetime_statistics", "battle_history", "presets",
    "validation_report", "missing_and_unknown_information"
  ];
  const DATA_DOMAINS = DOMAINS.filter(x => ![
    "validation_report", "missing_and_unknown_information"
  ].includes(x));
  const BLOCKED = new Set(["__proto__", "prototype", "constructor"]);

  const isObject = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const typeOf = v => v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const empty = v => v === undefined || v === null || v === "";
  const clone = v => {
    if (Array.isArray(v)) return v.map(clone);
    if (!isObject(v)) return v;
    const out = {};
    Object.keys(v).forEach(k => {
      if (!BLOCKED.has(k)) out[k] = clone(v[k]);
    });
    return out;
  };
  const now = () => new Date().toISOString();

  const same = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b || a === undefined || b === undefined) return false;
    if (Array.isArray(a) || Array.isArray(b))
      return Array.isArray(a) && Array.isArray(b) &&
        a.length === b.length && a.every((v, i) => same(v, b[i]));
    if (isObject(a) || isObject(b)) {
      if (!isObject(a) || !isObject(b)) return false;
      const ak = Object.keys(a).filter(k => !BLOCKED.has(k)).sort();
      const bk = Object.keys(b).filter(k => !BLOCKED.has(k)).sort();
      return ak.length === bk.length &&
        ak.every((k, i) => k === bk[i] && same(a[k], b[k]));
    }
    return false;
  };

  function safePath(path) {
    const p = String(path || "")
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".");
    return p.length && p.every(x => x && !BLOCKED.has(x)) ? p : null;
  }

  function getPath(obj, path) {
    const parts = safePath(path);
    if (!parts) return undefined;
    let v = obj;
    for (const key of parts) {
      if (v === null || v === undefined || !has(Object(v), key))
        return undefined;
      v = v[key];
    }
    return v;
  }

  function setPath(obj, path, value) {
    const p = safePath(path);
    if (!p || !isObject(obj)) return false;
    let cur = obj;
    for (let i = 0; i < p.length - 1; i++) {
      const next = p[i + 1];
      if (!isObject(cur[p[i]]) && !Array.isArray(cur[p[i]]))
        cur[p[i]] = /^\d+$/.test(next) ? [] : {};
      cur = cur[p[i]];
    }
    cur[p[p.length - 1]] = clone(value);
    return true;
  }

  function parse(input) {
    return typeof input === "string" ? JSON.parse(input) : input;
  }

  function normalizeManifest(manifest) {
    if (!isObject(manifest)) {
      return {
        supplied: false,
        rootFields: [],
        sourceGroups: {},
        arrayContracts: {},
        nestedContracts: {},
        crossReferenceRules: []
      };
    }

    const raw = Array.isArray(manifest.rootFields)
      ? manifest.rootFields : [];
    const rootFields = [];
    const seen = new Set();

    raw.forEach(entry => {
      let item;

      if (Array.isArray(entry) && entry.length === 3) {
        item = {
          name: entry[0],
          type: entry[1],
          group: entry[2]
        };
      } else if (isObject(entry)) {
        item = {
          name: entry.name || entry.path,
          type: entry.type || entry.observedJsonType,
          group: entry.sourceGroup || entry.group
        };
      } else if (typeof entry === "string") {
        item = { name: entry, type: null, group: null };
      }

      if (!item || typeof item.name !== "string" ||
          !item.name || BLOCKED.has(item.name) ||
          seen.has(item.name)) return;

      seen.add(item.name);
      rootFields.push(item);
    });

    return {
      supplied: true,
      rootFields,
      sourceGroups: isObject(manifest.sourceGroups)
        ? manifest.sourceGroups : {},
      arrayContracts: isObject(manifest.arrayContracts)
        ? manifest.arrayContracts : {},
      nestedContracts: isObject(manifest.nestedContracts)
        ? manifest.nestedContracts : {},
      crossReferenceRules: Array.isArray(manifest.crossReferenceRules)
        ? manifest.crossReferenceRules : [],
      uapShape: isObject(manifest.uapShape)
        ? clone(manifest.uapShape) : null,
      manifestVersion: manifest.manifestVersion || UNKNOWN
    };
  }

  function emptyUAP(manifest) {
    const m = normalizeManifest(manifest);
    const u = m.uapShape ? clone(m.uapShape) : {};

    DATA_DOMAINS.forEach(d => {
      if (!has(u, d)) u[d] = {};
    });

    u.validation_report = {};
    u.missing_and_unknown_information = {
      missing: [],
      unknown: [],
      inaccessible: [],
      conflicting: []
    };
    u.provenance = {};
    DATA_DOMAINS.forEach(d => {
      u.provenance[d] = "Unknown";
    });
    u.correction_history = [];

    return u;
  }

  function add(report, kind, code, path, message) {
    report[kind].push({ code, path, message });
  }

  function validateManifest(m, report) {
    if (!m.supplied || !m.rootFields.length) {
      add(report, "errors", "MANIFEST_ROOT_FIELDS_MISSING",
        "manifest.rootFields", "Manifest must declare rootFields.");
    }

    const names = new Set();
    const groupCounts = {};

    m.rootFields.forEach(f => {
      if (names.has(f.name)) {
        add(report, "errors", "MANIFEST_DUPLICATE_FIELD",
          f.name, "Duplicate root field.");
      }

      names.add(f.name);

      if (f.group) {
        groupCounts[f.group] = (groupCounts[f.group] || 0) + 1;
      }

      if (f.group && !has(m.sourceGroups, f.group)) {
        add(report, "errors", "MANIFEST_UNKNOWN_GROUP",
          f.name, "Undeclared source group: " + f.group);
      }

      if (f.group && has(m.sourceGroups, f.group)) {
        const g = m.sourceGroups[f.group];
        if (!g || !DATA_DOMAINS.includes(g.uapDomain)) {
          add(report, "errors", "MANIFEST_DOMAIN_INVALID",
            f.name, "Source group maps to an unsupported UAP domain.");
        }
      }
    });

    Object.entries(m.sourceGroups).forEach(([name, group]) => {
      if (typeof group.count === "number" &&
          group.count !== (groupCounts[name] || 0)) {
        add(report, "errors", "MANIFEST_GROUP_COUNT_MISMATCH",
          "sourceGroups." + name,
          "Declared count " + group.count +
          ", actual root field count " + (groupCounts[name] || 0) + ".");
      }
    });

    Object.entries(m.arrayContracts).forEach(([name, rule]) => {
      if (!Array.isArray(rule) || rule.length < 2 ||
          !Number.isInteger(rule[0]) || rule[0] < 0 ||
          typeof rule[1] !== "string") {
        add(report, "errors", "MANIFEST_ARRAY_CONTRACT_INVALID",
          "arrayContracts." + name,
          "Expected [non-negative length, item type, optional min, optional max].");
      }
    });

    return report.errors.length === 0;
  }

  function knownGameVersion(data) {
    return data.VersionNumber === 1262 &&
      data.DataVersion === 32 &&
      data.ExportVersion === 1;
  }

  function extractToUAP(data, m, uap) {
    const presentGroups = new Set();

    m.rootFields.forEach(f => {
      if (!has(data, f.name)) return;

      const group = m.sourceGroups[f.group] || {};
      const domain = group.uapDomain;

      if (!DATA_DOMAINS.includes(domain)) return;

      const sub = group.subdomain ||
        (f.group === "identity_metadata" ? "identity_metadata" : null);

      const path = sub
        ? domain + "." + sub + "." + f.name
        : domain + "." + f.name;

      setPath(uap, path, data[f.name]);
      presentGroups.add(domain);
      uap.provenance[domain] = "JSON-derived";
    });

    // Preserve all source fields, including unknown fields.
    uap.raw_account_data = clone(data);

    return presentGroups;
  }

  function validateRoot(data, m, report) {
    const declared = new Set();

    m.rootFields.forEach(f => {
      declared.add(f.name);
      report.checks.root_fields++;

      if (!has(data, f.name)) {
        report.missing.push({
          path: f.name,
          message: "Manifest field is absent."
        });
        return;
      }

      report.checks.root_types++;

      if (f.type && typeOf(data[f.name]) !== f.type) {
        add(report, "errors", "ROOT_TYPE_MISMATCH",
          f.name, "Expected " + f.type +
          ", received " + typeOf(data[f.name]) + ".");
      }
    });

    Object.keys(data).forEach(k => {
      if (!declared.has(k)) {
        report.unknown.push({
          path: k,
          type: typeOf(data[k]),
          value: clone(data[k])
        });
      }
    });
  }

  function validateArrays(data, m, report, knownVersion) {
    Object.entries(m.arrayContracts).forEach(([field, c]) => {
      if (!has(data, field)) return;

      report.checks.array_contracts++;

      if (!Array.isArray(data[field])) {
        add(report, "errors", "ARRAY_EXPECTED",
          field, "Expected array.");
        return;
      }

      const [length, itemType, min, max] = c;
      const a = data[field];

      if (a.length !== length) {
        const msg = "Expected observed length " + length +
          ", received " + a.length + ".";

        if (knownVersion) {
          add(report, "errors", "ARRAY_LENGTH_MISMATCH", field, msg);
        } else {
          add(report, "warnings", "ARRAY_LENGTH_UNVERIFIED",
            field, msg + " Game version is outside audited fixture scope.");
        }
      }

      a.forEach((v, i) => {
        if (typeOf(v) !== itemType) {
          add(report, "errors", "ARRAY_ITEM_TYPE",
            field + "[" + i + "]",
            "Expected " + itemType + ", received " + typeOf(v) + ".");
        }

        if (typeof min === "number" && typeof max === "number" &&
            typeof v === "number" && (v < min || v > max)) {
          add(report, "errors", "ARRAY_ITEM_RANGE",
            field + "[" + i + "]",
            "Value outside " + min + ".." + max + ".");
        }
      });

      if (field === "PerkLevel") {
        a.forEach((v, i) => {
          if (typeof v === "number" && (v < 0 || v > 5))
            add(report, "errors", "PERK_LEVEL_RANGE",
              field + "[" + i + "]", "Expected 0..5.");
        });
      }

      if (field === "GuardianChipSlot") {
        a.forEach((v, i) => {
          if (typeof v === "number" && (v < -1 || v > 29))
            add(report, "errors", "GUARDIAN_CHIP_RANGE",
              field + "[" + i + "]", "Expected observed range -1..29.");
        });
      }

      if (field === "BannedPerksIndex") {
        a.forEach((v, i) => {
          if (typeof v === "number" && v !== -1 &&
              (v < 0 || v > 49))
            add(report, "errors", "BANNED_PERK_RANGE",
              field + "[" + i + "]", "Expected -1 or 0..49.");
        });
      }

      if (field === "ProfileRelics") {
        a.forEach((v, i) => {
          if (typeof v === "number" && (v < 0 || v > 349))
            add(report, "errors", "PROFILE_RELIC_RANGE",
              field + "[" + i + "]", "Expected 0..349.");
        });
      }

      if (field === "RelicsUnlocked") {
        a.forEach((v, i) => {
          if (typeof v === "number" && v !== 0 && v !== 2)
            add(report, "warnings", "UNKNOWN_RELIC_CODE",
              field + "[" + i + "]",
              "Code differs from observed fixture codes 0 and 2.");
        });
      }
    });
  }

  function validateNested(data, m, report) {
    const mc = m.nestedContracts.ModuleRecord || {};

    const validateModule = (r, p) => {
      report.checks.nested_contracts++;

      if (!isObject(r)) {
        add(report, "errors", "MODULE_RECORD_INVALID",
          p, "Module record must be an object.");
        return;
      }

      (mc.keys || []).forEach(k => {
        if (!has(r, k))
          add(report, "warnings", "MODULE_KEY_MISSING",
            p + "." + k, "Expected module key is missing.");
      });

      ["Effects", "EffectLocked"].forEach(k => {
        const rule = mc[k];
        if (!rule) return;

        if (!Array.isArray(r[k])) {
          add(report, "errors", "MODULE_ARRAY_INVALID",
            p + "." + k, "Expected array.");
          return;
        }

        if (r[k].length !== rule.length) {
          add(report, "errors", "MODULE_ARRAY_LENGTH",
            p + "." + k, "Expected length " + rule.length + ".");
        }

        r[k].forEach((v, i) => {
          if (typeof v !== rule.items)
            add(report, "errors", "MODULE_ARRAY_ITEM_TYPE",
              p + "." + k + "[" + i + "]",
              "Expected " + rule.items + ".");
        });
      });

      if (typeof r.Guid !== "string") {
        add(report, "errors", "MODULE_GUID_INVALID",
          p + ".Guid", "Guid must be a string.");
      }
    };

    ["ModuleInventory", "ModuleEquipped"].forEach(k => {
      if (Array.isArray(data[k]))
        data[k].forEach((r, i) => validateModule(r, k + "[" + i + "]"));
    });

    if (Array.isArray(data.AssistModuleSlots)) {
      data.AssistModuleSlots.forEach((s, i) => {
        if (!isObject(s)) {
          add(report, "errors", "ASSIST_SLOT_INVALID",
            "AssistModuleSlots[" + i + "]", "Slot must be object.");
        } else if (s.EquippedModule !== null &&
                   s.EquippedModule !== undefined) {
          validateModule(s.EquippedModule,
            "AssistModuleSlots[" + i + "].EquippedModule");
        }
      });
    }

    if (Array.isArray(data.BattleHistory)) {
      data.BattleHistory.forEach((r, i) => {
        report.checks.nested_contracts++;

        if (!isObject(r)) {
          add(report, "errors", "BATTLE_RECORD_INVALID",
            "BattleHistory[" + i + "]", "Battle record must be object.");
        } else if (typeof r.BattleDate !== "string" ||
                   Number.isNaN(Date.parse(r.BattleDate))) {
          add(report, "warnings", "BATTLE_DATE_UNVERIFIED",
            "BattleHistory[" + i + "].BattleDate",
            "Battle date is absent or not parseable.");
        }
      });
    }

    if (Array.isArray(data.CompletedLabs)) {
      data.CompletedLabs.forEach((r, i) => {
        if (!isObject(r)) {
          add(report, "errors", "COMPLETED_LAB_INVALID",
            "CompletedLabs[" + i + "]", "Record must be object.");
        } else if (typeof r.labNumber !== "number" ||
                   r.labNumber < 0 || r.labNumber > 259) {
          add(report, "errors", "COMPLETED_LAB_REFERENCE",
            "CompletedLabs[" + i + "].labNumber",
            "Expected lab number 0..259.");
        }
      });
    }

    if (Array.isArray(data.PerksPicked)) {
      data.PerksPicked.forEach((r, i) => {
        if (!isObject(r)) {
          add(report, "errors", "PERK_RECORD_INVALID",
            "PerksPicked[" + i + "]", "Record must be object.");
        } else if (typeof r.Perk !== "number" ||
                   !Number.isInteger(r.Perk) ||
                   r.Perk < 0 || r.Perk > 49) {
          add(report, "errors", "PERK_REFERENCE",
            "PerksPicked[" + i + "].Perk",
            "Expected integer 0..49.");
        }
      });
    }
  }

  function validateCrossReferences(data, report) {
    report.checks.cross_references++;

    const mods = [];

    ["ModuleInventory", "ModuleEquipped"].forEach(k => {
      if (Array.isArray(data[k]))
        data[k].forEach(x => {
          if (isObject(x)) mods.push(x);
        });
    });

    if (Array.isArray(data.AssistModuleSlots)) {
      data.AssistModuleSlots.forEach(x => {
        if (isObject(x) && isObject(x.EquippedModule))
          mods.push(x.EquippedModule);
      });
    }

    const guids = mods
      .map(x => x.Guid)
      .filter(x => typeof x === "string");

    if (new Set(guids).size !== guids.length) {
      add(report, "errors", "MODULE_GUID_DUPLICATE",
        "ModuleInventory/ModuleEquipped/AssistModuleSlots",
        "Module GUIDs must be unique.");
    }

    const ids = new Set(guids);

    if (Array.isArray(data.ModulePresets)) {
      data.ModulePresets.forEach((p, i) => {
        if (!isObject(p)) return;

        ["PrimaryModuleGuids", "AssistModuleGuids"].forEach(k => {
          if (!Array.isArray(p[k])) return;

          p[k].forEach((g, j) => {
            if (g !== null && !ids.has(g)) {
              add(report, "warnings", "MODULE_PRESET_GUID_UNRESOLVED",
                "ModulePresets[" + i + "]." + k + "[" + j + "]",
                "GUID not found in available module records.");
            }
          });
        });
      });
    }

    if (Array.isArray(data.ProfileRelics)) {
      data.ProfileRelics.forEach((v, i) => {
        if (typeof v === "number" && (v < 0 || v > 349)) {
          add(report, "errors", "PROFILE_RELIC_REFERENCE",
            "ProfileRelics[" + i + "]", "Expected 0..349.");
        }
      });
    }

    [
      ["SlotPresetCardAssignedBool", "SlotPresetCardInt"],
      ["BattleStartSlotCardAssignedBool", "BattleStartSlotCardInt"]
    ].forEach(([flags, ids]) => {
      if (Array.isArray(data[flags]) && Array.isArray(data[ids])) {
        data[flags].forEach((active, i) => {
          if (active === true) {
            const id = data[ids][i];
            if (typeof id !== "number" || !Number.isInteger(id) ||
                id < 0 || id > 39) {
              add(report, "errors", "CARD_SLOT_REFERENCE",
                ids + "[" + i + "]",
                "Assigned card ID must be an integer from 0 to 39.");
            }
          }
        });
      }
    });

    if (Array.isArray(data.GlobalPresets)) {
      data.GlobalPresets.forEach((p, i) => {
        if (!isObject(p)) return;

        const checks = [
          ["WorkshopIndex", "WorkshopPresetName"],
          ["CardsIndex", "PresetName"],
          ["BotsIndex", "BotPresetName"],
          ["ModulesIndex", "ModulePresets"],
          ["GuardiansIndex", "GuardianPresets"]
        ];

        checks.forEach(([field, target]) => {
          if (p[field] !== undefined && Array.isArray(data[target]) &&
              (typeof p[field] !== "number" ||
               !Number.isInteger(p[field]) ||
               p[field] < 0 || p[field] >= data[target].length)) {
            add(report, "errors", "GLOBAL_PRESET_INDEX",
              "GlobalPresets[" + i + "]." + field,
              "Preset index is outside the corresponding array.");
          }
        });
      });
    }

    [
      ["CurrentGlobalPreset", "GlobalPresets"],
      ["CurrentModulePreset", "ModulePresets"],
      ["CurrentGuardianPreset", "GuardianPresets"],
      ["CurrentBotPreset", "BotPresetName"],
      ["CurrentWorkshopPreset", "WorkshopPresetName"],
      ["CurrentPreset", "PresetName"]
    ].forEach(([field, target]) => {
      if (data[field] !== undefined && Array.isArray(data[target]) &&
          (typeof data[field] !== "number" ||
           !Number.isInteger(data[field]) ||
           data[field] < 0 || data[field] >= data[target].length)) {
        add(report, "errors", "CURRENT_PRESET_INDEX",
          field, "Current preset index is outside the available presets.");
      }
    });

    ["CurrencyEarnedThisCycle", "CurrencySpentThisCycle"].forEach(k => {
      const x = data[k];
      if (x === undefined) return;

      if (!isObject(x)) {
        add(report, "errors", "CURRENCY_RECORD_INVALID",
          k, "Expected object.");
      } else if (x.Currencies !== undefined) {
        if (!isObject(x.Currencies)) {
          add(report, "errors", "CURRENCY_DICTIONARY_INVALID",
            k + ".Currencies", "Expected object.");
        } else {
          Object.entries(x.Currencies).forEach(([n, v]) => {
            if (typeof v !== "number" || !Number.isFinite(v)) {
              add(report, "errors", "CURRENCY_VALUE_INVALID",
                k + ".Currencies." + n, "Expected finite number.");
            }
          });
        }
      }
    });
  }

  function reportStatus(r) {
    if (r.errors.length) return "INVALID";
    if (r.missing.length) return "PARTIALLY AVAILABLE";
    if (r.warnings.length || r.unknown.length)
      return "VALID WITH WARNINGS";
    return "VALID";
  }

  function finalize(uap, report) {
    report.status = reportStatus(report);
    uap.validation_report = clone(report);
    uap.missing_and_unknown_information = {
      missing: clone(report.missing),
      unknown: clone(report.unknown),
      inaccessible: clone(report.inaccessible),
      conflicting: clone(report.conflicting)
    };

    return {
      status: report.status,
      valid: report.status !== "INVALID",
      uap,
      report: clone(report)
    };
  }

  function validateAccountJSON(input, manifest) {
    const m = normalizeManifest(manifest);

    const r = {
      validatorVersion: VERSION,
      manifestVersion: m.manifestVersion,
      status: "INVALID",
      source: "JSON-derived",
      errors: [],
      warnings: [],
      missing: [],
      unknown: [],
      inaccessible: [],
      conflicting: [],
      checks: {
        root_fields: 0,
        root_types: 0,
        array_contracts: 0,
        nested_contracts: 0,
        cross_references: 0
      },
      totalManifestFields: m.rootFields.length,
      availableFields: 0,
      availableDomains: [],
      missingDomains: [],
      validatedAt: now()
    };

    let data;

    try {
      data = parse(input);
    } catch (e) {
      r.errors.push({
        code: "JSON_PARSE_ERROR",
        path: "$",
        message: e.message
      });
      return finalizeError(r);
    }

    if (!isObject(data)) {
      add(r, "errors", "ROOT_NOT_OBJECT",
        "$", "Account JSON root must be an object.");
      return finalizeError(r);
    }

    validateManifest(m, r);
    validateRoot(data, m, r);
    r.availableFields = r.checks.root_types;

    const u = emptyUAP(manifest);
    const groups = extractToUAP(data, m, u);

    r.availableDomains = DATA_DOMAINS.filter(d => groups.has(d));
    r.missingDomains = DATA_DOMAINS.filter(d => !groups.has(d));

    if (r.missingDomains.length) {
      r.warnings.push({
        code: "UAP_DOMAINS_NOT_EXTRACTED",
        path: "uap",
        message: "Some UAP domains have no mapped source fields in this export."
      });
    }

    if (r.unknown.length) {
      r.warnings.push({
        code: "UNKNOWN_ROOT_FIELDS",
        path: "$",
        message: "Unknown fields are preserved in raw_account_data."
      });
    }

    validateArrays(data, m, r, knownGameVersion(data));
    validateNested(data, m, r);
    validateCrossReferences(data, r);

    return finalize(u, r);
  }

  function finalizeError(r) {
    r.status = "INVALID";
    return {
      status: "INVALID",
      valid: false,
      uap: null,
      report: clone(r)
    };
  }

  function createManualUAP(manualInput, manifest) {
    const u = emptyUAP(manifest);
    const input = isObject(manualInput) ? manualInput : {};

    DATA_DOMAINS.forEach(d => {
      if (has(input, d) && !empty(input[d]) && input[d] !== UNKNOWN) {
        u[d] = clone(input[d]);
        u.provenance[d] = "User-provided";
      }
    });

    const missing = DATA_DOMAINS.filter(d =>
      u[d] === UNKNOWN ||
      (isObject(u[d]) && !Object.keys(u[d]).length)
    );

    const r = {
      validatorVersion: VERSION,
      status: "PARTIALLY AVAILABLE",
      source: "User-provided",
      errors: [],
      warnings: [{
        code: "MANUAL_UNVERIFIED",
        path: "$",
        message: "Manual input has not been independently verified."
      }],
      missing,
      unknown: [],
      inaccessible: [],
      conflicting: [],
      availableDomains: DATA_DOMAINS.filter(d => !missing.includes(d)),
      missingDomains: missing,
      validatedAt: now()
    };

    return finalize(u, r);
  }

  function createHybridUAP(jsonResult, manualInput, manifest) {
    const manual = isObject(manualInput) ? manualInput : {};

    if (!jsonResult || !isObject(jsonResult.uap)) {
      const fallback = createManualUAP(manual, manifest);

      fallback.report.warnings.push({
        code: "JSON_BASELINE_UNAVAILABLE",
        path: "$",
        message: "Manual data retained; JSON validation was not successful."
      });

      if (jsonResult && jsonResult.status === "INVALID") {
        fallback.report.errors = clone(jsonResult.report.errors || []);
        fallback.status = fallback.report.status = "INVALID";
        fallback.valid = false;
      }

      fallback.uap.validation_report = clone(fallback.report);
      return fallback;
    }

    const u = clone(jsonResult.uap);

    u.missing_and_unknown_information =
      isObject(u.missing_and_unknown_information)
        ? u.missing_and_unknown_information
        : { missing: [], unknown: [], inaccessible: [], conflicting: [] };

    const conflicts = Array.isArray(
      u.missing_and_unknown_information.conflicting
    ) ? u.missing_and_unknown_information.conflicting.slice() : [];

    u.provenance = isObject(u.provenance) ? u.provenance : {};
    u.correction_history = Array.isArray(u.correction_history)
      ? u.correction_history : [];

    Object.keys(manual).forEach(domain => {
      if (!DATA_DOMAINS.includes(domain) ||
          empty(manual[domain]) || manual[domain] === UNKNOWN) return;

      const current = u[domain] === undefined ? UNKNOWN : u[domain];

      if (current === UNKNOWN) {
        u[domain] = clone(manual[domain]);
        u.provenance[domain] = "User-provided";
        return;
      }

      if (!same(current, manual[domain])) {
        conflicts.push({
          domain,
          path: domain,
          originalValue: clone(current),
          manualValue: clone(manual[domain]),
          activeValue: clone(current),
          resolutionStatus: "UNRESOLVED",
          resolution: "JSON retained pending confirmation",
          detectedAt: now()
        });
      }
    });

    const r = clone(jsonResult.report);
    r.source = "Hybrid";
    r.conflicting = conflicts;
    r.warnings = Array.isArray(r.warnings) ? r.warnings : [];

    if (conflicts.some(c => c.resolutionStatus === "UNRESOLVED")) {
      r.warnings.push({
        code: "HYBRID_CONFLICTS",
        path: "$",
        message: "Conflicts remain unresolved; JSON values remain active."
      });
    }

    r.availableDomains = DATA_DOMAINS.filter(d => u[d] !== UNKNOWN);
    r.missingDomains = DATA_DOMAINS.filter(d => u[d] === UNKNOWN);

    return finalize(u, r);
  }

  function applyManualCorrection(result, domain, path, value, confirmed) {
    // Backward-compatible call: (result, domain, value, confirmed).
    if (arguments.length === 4) {
      const oldValue = path;
      const oldConfirmed = value;
      value = oldValue;
      confirmed = oldConfirmed;
      path = domain;
    }

    if (!result || !isObject(result.uap) ||
        !DATA_DOMAINS.includes(domain)) {
      throw new Error("Valid UAP result and domain are required.");
    }

    if (empty(value) || value === UNKNOWN) {
      throw new Error("Correction value must not be empty or UNKNOWN.");
    }

    const u = clone(result.uap);
    const target = path && path !== domain
      ? domain + "." + path
      : domain;

    const previous = getPath(u, target);
    const isConfirmed = confirmed !== false;

    u.correction_history = Array.isArray(u.correction_history)
      ? u.correction_history : [];

    u.correction_history.push({
      domain,
      path: target,
      previousValue: previous === undefined ? UNKNOWN : clone(previous),
      correctedValue: clone(value),
      source: "User-provided",
      resolutionStatus: isConfirmed ? "USER_CONFIRMED" : "UNRESOLVED",
      changedAt: now()
    });

    if (isConfirmed) {
      if (!setPath(u, target, value))
        throw new Error("Invalid correction path.");

      u.provenance[domain] = "User-confirmed";
    }

    const r = clone(result.report || {});
    r.source = "Hybrid";
    r.conflicting = Array.isArray(r.conflicting) ? r.conflicting : [];

    const idx = r.conflicting.findIndex(c =>
      c.path === target || c.domain === domain
    );

    if (isConfirmed && idx >= 0) {
      r.conflicting[idx] = Object.assign({}, r.conflicting[idx], {
        activeValue: clone(value),
        resolutionStatus: "USER_CONFIRMED",
        resolution: "Manual correction accepted",
        resolvedAt: now()
      });
    } else if (!isConfirmed && idx < 0) {
      r.conflicting.push({
        domain,
        path: target,
        originalValue: previous === undefined ? UNKNOWN : clone(previous),
        manualValue: clone(value),
        activeValue: previous === undefined ? UNKNOWN : clone(previous),
        resolutionStatus: "UNRESOLVED",
        detectedAt: now()
      });
    }

    r.warnings = (r.warnings || []).filter(w =>
      !(w && w.code === "HYBRID_CONFLICTS")
    );

    if (r.conflicting.some(c => c.resolutionStatus === "UNRESOLVED")) {
      r.warnings.push({
        code: "HYBRID_CONFLICTS",
        path: "$",
        message: "Conflicts remain unresolved; JSON values remain active."
      });
    }

    return finalize(u, r);
  }

  function resolveHybridConflict(result, domain, resolution, path) {
    if (!result || !isObject(result.uap))
      throw new Error("Valid UAP result is required.");

    const r = result.report || {};
    const target = path || domain;

    const c = (r.conflicting || []).find(x =>
      (x.path === target || x.domain === domain) &&
      x.resolutionStatus === "UNRESOLVED"
    );

    if (!c)
      throw new Error("No unresolved conflict exists for this field/domain.");

    if (resolution === "USER_CONFIRMED") {
      return applyManualCorrection(
        result,
        domain,
        target === domain ? domain : target.replace(domain + ".", ""),
        c.manualValue,
        true
      );
    }

    if (resolution === "JSON_CONFIRMED") {
      const u = clone(result.uap);
      const nr = clone(r);

      nr.conflicting = nr.conflicting.map(x =>
        (x.path === c.path && x.domain === c.domain &&
         x.resolutionStatus === "UNRESOLVED")
          ? Object.assign({}, x, {
              activeValue: clone(x.originalValue),
              resolutionStatus: "JSON_CONFIRMED",
              resolution: "JSON value retained by user",
              resolvedAt: now()
            })
          : x
      );

      nr.warnings = (nr.warnings || []).filter(w =>
        !(w && w.code === "HYBRID_CONFLICTS")
      );

      if (nr.conflicting.some(x => x.resolutionStatus === "UNRESOLVED")) {
        nr.warnings.push({
          code: "HYBRID_CONFLICTS",
          path: "$",
          message: "Conflicts remain unresolved."
        });
      }

      return finalize(u, nr);
    }

    throw new Error("Resolution must be USER_CONFIRMED or JSON_CONFIRMED.");
  }

  function exportUAP(result) {
    const u = result && result.uap ? result.uap : result;

    if (!isObject(u))
      throw new Error("Valid UAP required.");

    return JSON.stringify({
      format: "SAMANTHA_UAP",
      formatVersion: 1,
      validatorVersion: VERSION,
      exportedAt: now(),
      uap: clone(u)
    }, null, 2);
  }

  function importUAP(input) {
    let p;

    try {
      p = parse(input);
    } catch (e) {
      return finalizeError({
        validatorVersion: VERSION,
        errors: [{
          code: "UAP_IMPORT_PARSE_ERROR",
          path: "$",
          message: e.message
        }],
        warnings: [],
        missing: [],
        unknown: [],
        inaccessible: [],
        conflicting: []
      });
    }

    if (!isObject(p) ||
        p.format !== "SAMANTHA_UAP" ||
        !isObject(p.uap)) {
      return finalizeError({
        validatorVersion: VERSION,
        errors: [{
          code: "UAP_IMPORT_FORMAT_INVALID",
          path: "$",
          message: "Unsupported UAP export format."
        }],
        warnings: [],
        missing: [],
        unknown: [],
        inaccessible: [],
        conflicting: []
      });
    }

    const u = clone(p.uap);
    const warnings = [];

    DATA_DOMAINS.forEach(d => {
      if (!has(u, d)) {
        u[d] = UNKNOWN;
        warnings.push({
          code: "IMPORTED_DOMAIN_MISSING",
          path: d,
          message: "Missing domain restored as UNKNOWN."
        });
      }
    });

    u.provenance = isObject(u.provenance) ? u.provenance : {};

    DATA_DOMAINS.forEach(d => {
      if (!u.provenance[d]) u.provenance[d] = "Unknown";
    });

    u.correction_history = Array.isArray(u.correction_history)
      ? u.correction_history : [];

    const old = isObject(u.validation_report)
      ? u.validation_report : {};

    const r = Object.assign({
      validatorVersion: VERSION,
      source: "Imported UAP",
      errors: [],
      warnings: [],
      missing: [],
      unknown: [],
      inaccessible: [],
      conflicting: []
    }, old);

    r.warnings = (r.warnings || []).concat(warnings);
    r.missingDomains = DATA_DOMAINS.filter(d => u[d] === UNKNOWN);
    r.availableDomains = DATA_DOMAINS.filter(d => u[d] !== UNKNOWN);

    return finalize(u, r);
  }

  const createEmptyUAP = emptyUAP;

  return Object.freeze({
    version: VERSION,
    domains: DOMAINS.slice(),
    UNKNOWN,
    validateAccountJSON,
    createManualUAP,
    createHybridUAP,
    applyManualCorrection,
    resolveHybridConflict,
    exportUAP,
    importUAP,
    createEmptyUAP
  });
});
