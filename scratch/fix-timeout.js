const fs = require('fs');

function addTimeout(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /await prisma\.\$transaction\(async \(tx\) => \{/,
    'await prisma.$transaction(async (tx) => {'
  );
  // Actually, I need to pass the options object to $transaction.
  // prisma.$transaction(async (tx) => { ... }, { maxWait: 5000, timeout: 20000 })
  content = content.replace(
    /const result = await prisma\.\$transaction\(async \(tx\) => \{([\s\S]*?)\}\);/g,
    'const result = await prisma.$transaction(async (tx) => {$1}, { maxWait: 5000, timeout: 20000 });'
  );
  
  // also fix return await prisma.$transaction
  content = content.replace(
    /return await prisma\.\$transaction\(async \(tx\) => \{([\s\S]*?)\}\);/g,
    'return await prisma.$transaction(async (tx) => {$1}, { maxWait: 5000, timeout: 20000 });'
  );

  // remove the bad "// ... existing code ..."
  content = content.replace(/\/\/ \.\.\. existing code \.\.\.\n/g, '');
  
  fs.writeFileSync(filePath, content);
}

['lib/actions/vigilance.ts', 'lib/actions/esignature.ts'].forEach(addTimeout);
