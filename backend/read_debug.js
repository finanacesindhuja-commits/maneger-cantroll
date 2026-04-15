const fs = require('fs');
try {
    const data = fs.readFileSync('debug_output.txt', 'utf16le');
    console.log(data);
} catch (err) {
    console.error(err);
}
process.exit(0);
