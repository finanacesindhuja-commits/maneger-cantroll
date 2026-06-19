const fs = require('fs');
const path = require('path');

function searchDir(dir, keyword) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, keyword);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Found "${keyword}" in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`  Line ${i+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('d:\\full system sindhuja fin\\calloction cantroll', 'penalty');
searchDir('d:\\full system sindhuja fin\\calloction cantroll', 'late');
