
const path = require("node:path");
const XLSX = require("xlsx");

const file = path.resolve(__dirname, "../Master Sheet with JSON.xlsx");
const workbook = XLSX.readFile(file);

console.log("SheetJS:", XLSX.version);
console.log("Workbook:", path.basename(file));
console.log("Jumlah sheet:", workbook.SheetNames.length);

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const range = sheet["!ref"];

  console.log("\n================================");
  console.log("SHEET:", name);
  console.log("================================");

  if (!range) {
    console.log("Sheet kosong");
    continue;
  }

  const bounds = XLSX.utils.decode_range(range);

  console.log("Range:", range);

  const maxRows = Math.min(bounds.e.r, bounds.s.r + 7);
  const maxCols = Math.min(bounds.e.c, bounds.s.c + 11);

  for (let r = bounds.s.r; r <= maxRows; r++) {
    const values = [];

    for (let c = bounds.s.c; c <= maxCols; c++) {
      const address = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[address];

      if (!cell) continue;

      let value = String(cell.w ?? cell.v ?? "");

      if (value.length > 100) {
        value = value.slice(0, 100) + "...";
      }

      values.push(`${address}: ${value}`);
    }

    if (values.length > 0) {
      console.log(values.join(" | "));
    }
  }
}

console.log("\nXLSX CELL READ TEST: PASS");
