
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const workbookPath = path.resolve(
  __dirname,
  "../Master Sheet with JSON.xlsx"
);

const outputDir = path.resolve(__dirname, "output");
const outputPath = path.join(outputDir, "workbook-data.json");

function countPopulatedCells(sheet) {
  return Object.keys(sheet).filter((address) => {
    if (address.startsWith("!")) return false;

    const cell = sheet[address];

    return (
      cell &&
      cell.v !== undefined &&
      cell.v !== null &&
      cell.v !== ""
    );
  }).length;
}

function extractFormulas(sheet) {
  const formulas = {};

  for (const address of Object.keys(sheet)) {
    if (address.startsWith("!")) continue;

    const cell = sheet[address];

    if (typeof cell?.f !== "string" || !cell.f) continue;

    formulas[address] = {
      formula: cell.f,
      value: cell.v ?? null,
      type: cell.t ?? null
    };
  }

  return formulas;
}

function readWorkbook() {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${workbookPath}`);
  }

  const workbook = XLSX.readFile(workbookPath, {
    cellFormula: true,
    cellText: true,
    cellNF: true,
    cellDates: true
  });

  if (!workbook.SheetNames.length) {
    throw new Error("Workbook has no worksheets.");
  }

  const result = {
    schemaVersion: "1.0.0",
    source: {
      file: path.basename(workbookPath),
      reader: "Samantha XLSX Reader",
      sheetjsVersion: XLSX.version
    },
    generatedAt: new Date().toISOString(),
    sheetNames: workbook.SheetNames,
    sheets: {}
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const range = sheet["!ref"] ?? null;

    if (!range) {
      result.sheets[sheetName] = {
        range: null,
        rows: [],
        formulas: {},
        statistics: {
          rowCount: 0,
          columnCount: 0,
          populatedCells: 0,
          formulaCells: 0
        }
      };

      continue;
    }

    const bounds = XLSX.utils.decode_range(range);

    // Membaca seluruh used range tanpa batas baris atau kolom.
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      range,
      raw: true,
      defval: null,
      blankrows: true
    });

    const formulas = extractFormulas(sheet);

    result.sheets[sheetName] = {
      range,
      rows,
      formulas,
      statistics: {
        rowCount: bounds.e.r - bounds.s.r + 1,
        columnCount: bounds.e.c - bounds.s.c + 1,
        populatedCells: countPopulatedCells(sheet),
        formulaCells: Object.keys(formulas).length
      }
    };
  }

  return result;
}

function validateOutput(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid extraction output.");
  }

  if (!Array.isArray(data.sheetNames)) {
    throw new Error("Missing sheetNames.");
  }

  if (data.sheetNames.length !== Object.keys(data.sheets).length) {
    throw new Error("Worksheet count mismatch.");
  }

  for (const name of data.sheetNames) {
    const sheet = data.sheets[name];

    if (!sheet) {
      throw new Error(`Missing worksheet: ${name}`);
    }

    if (!Array.isArray(sheet.rows)) {
      throw new Error(`Invalid rows in worksheet: ${name}`);
    }

    if (
      typeof sheet.statistics.formulaCells !== "number" ||
      typeof sheet.statistics.populatedCells !== "number"
    ) {
      throw new Error(`Invalid statistics in worksheet: ${name}`);
    }
  }

  return true;
}

function main() {
  const data = readWorkbook();

  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  // Baca ulang file hasil ekstraksi untuk memastikan JSON valid.
  const savedData = JSON.parse(
    fs.readFileSync(outputPath, "utf8")
  );

  validateOutput(savedData);

  const summary = Object.entries(savedData.sheets).map(
    ([name, sheet]) => ({
      sheet: name,
      range: sheet.range,
      rows: sheet.statistics.rowCount,
      columns: sheet.statistics.columnCount,
      populatedCells: sheet.statistics.populatedCells,
      formulaCells: sheet.statistics.formulaCells
    })
  );

  console.log("SheetJS:", XLSX.version);
  console.log("Workbook:", savedData.source.file);
  console.log("Worksheets:", savedData.sheetNames.length);
  console.log("Output:", outputPath);

  console.log("\nExtraction summary:");
  console.table(summary);

  console.log("\nXLSX READ: PASSED");
  console.log("JSON VALIDATION: PASSED");
}

try {
  main();
} catch (error) {
  console.error("XLSX READER FAILED");
  console.error(error);
  process.exitCode = 1;
}
