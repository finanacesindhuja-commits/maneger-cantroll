const fs = require('fs');
const path = require('path');

function searchDir(dir, keyword) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch(e) { return; }
  for (const file of entries) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, keyword);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`\nFound in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`  L${i+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('d:\\full system sindhuja fin\\calloction cantroll', 'penalty');
