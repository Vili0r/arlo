const fs = require('fs');
const filePath = 'lib/actions/investigations.ts';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  '    code: string;\n    term: string;',
  '    code: string;\n    term: string;\n    notes?: string | null;'
);

content = content.replace(
  '      code: code.code,\n      term: code.term,\n    }));',
  '      code: code.code,\n      term: code.term,\n      notes: code.notes || null,\n    }));'
);

fs.writeFileSync(filePath, content);
console.log('done actions');
