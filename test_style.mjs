import fs from 'fs';
let code = fs.readFileSync('src/utils/export.ts', 'utf-8');
code = code.replace(
  "element.style.zIndex = '-9999';",
  "element.style.zIndex = '-9999';\n  element.style.width = element.offsetWidth + 'px';"
);
fs.writeFileSync('src/utils/export.ts', code);
