
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

  if (!range) {
    console.log(name, "- kosong");
    continue;
  }

  const size = XLSX.utils.decode_range(range);

  console.log({
    sheet: name,
    range,
    rows: size.e.r - size.s.r + 1,
    columns: size.e.c - size.s.c + 1
  });
}

console.log("XLSX READ TEST: PASS");
