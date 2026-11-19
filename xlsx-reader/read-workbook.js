const path = require("node:path");
const XLSX = require("xlsx");

const file = path.resolve(__dirname, "../Master Sheet with JSON.xlsx");

const workbook = XLSX.readFile(file, {
  cellFormula: true,
  cellText: true,
  cellNF: true,
  cellDates: true
});

console.log("SheetJS:", XLSX.version);
console.log("Workbook:", path.basename(file));
console.log("Jumlah sheet:", workbook.SheetNames.length);

const workbookData = {};

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const range = sheet["!ref"];

  console.log("\n================================");
  console.log("SHEET:", name);
  console.log("================================");

  if (!range) {
    console.log("Sheet kosong");

    workbookData[name] = {
      range: null,
      rows: [],
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

  // Read the entire used range, without row or column limits.
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range,
    raw: true,
    defval: null,
    blankrows: true
  });

  const populatedCells = Object.keys(sheet).filter(key => {
    if (key.startsWith("!")) return false;

    const cell = sheet[key];

    return cell && cell.v !== undefined && cell.v !== null && cell.v !== "";
  }).length;

  const formulaCells = Object.keys(sheet).filter(key => {
    if (key.startsWith("!")) return false;

    return Boolean(sheet[key]?.f);
  }).length;

  const rowCount = bounds.e.r - bounds.s.r + 1;
  const columnCount = bounds.e.c - bounds.s.c + 1;

  workbookData[name] = {
    range,
    rows,
    statistics: {
      rowCount,
      columnCount,
      populatedCells,
      formulaCells
    }
  };

  console.log("Range:", range);
  console.log("Jumlah baris:", rowCount);
  console.log("Jumlah kolom:", columnCount);
  console.log("Sel terisi:", populatedCells);
  console.log("Sel berformula:", formulaCells);
  console.log("Data berhasil dibaca:", rows.length, "baris");
}

console.log("\n================================");
console.log("WORKBOOK SUMMARY");
console.log("================================");

console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(workbookData).map(([name, data]) => [
        name,
        {
          range: data.range,
          ...data.statistics
        }
      ])
    ),
    null,
    2
  )
);

console.log("\nXLSX FULL READ TEST: PASS");
