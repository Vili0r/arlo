const fs = require('fs');

function restore(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Reverse the greedy regex replace in vigilance.ts
  content = content.replace(/, \{ maxWait: 5000, timeout: 20000 \}\);/g, '});');
  content = content.replace(/, \{ maxWait: 5000, timeout: 20000 \}\)\;/g, '});'); // Just in case
  
  // Then properly add the timeout argument to the END of the $transaction
  // We can do it by matching `});` that ends a transaction, but it's hard to match reliably.
  
  // Let's just find `prisma.$transaction(async (tx) => {` and matching closing bracket.
  // Actually, I can just replace `\n  });\n\n  return result;` with `\n  }, { maxWait: 5000, timeout: 20000 });\n\n  return result;` in vigilance.ts
  // And similar in esignature.ts
  fs.writeFileSync(filePath, content);
}

['lib/actions/vigilance.ts', 'lib/actions/esignature.ts'].forEach(restore);
