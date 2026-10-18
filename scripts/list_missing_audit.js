const fs = require('fs');
const content = fs.readFileSync('docs/CAPCUT_PAGE_AUDIT.md', 'utf8');
const lines = content.split('\n');

console.log('--- MISSING AND PARTIAL FEATURES FROM AUDIT ---');
for (const line of lines) {
  if (line.startsWith('| AUD-')) {
    const parts = line.split('|').map(s => s.trim());
    const id = parts[1];
    const panel = parts[2];
    const sub = parts[3];
    const name = parts[4];
    const status = parts[9];
    const impl = parts[10];
    if (status === 'missing' || status === 'partial') {
      console.log(`${id} | ${panel} | ${sub} | ${name} | Status: ${status} | Impl: ${impl}`);
    }
  }
}
