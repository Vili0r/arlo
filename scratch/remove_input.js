const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const inputRegex = /<input\s+type="text"\s+placeholder="Notes \(optional\)"\s+value=\{codeObj\?\.notes \|\| ""\}\s+onChange=\{\(e\) => handleImdrfCodeChange\(groupIdx, actualIndex, "notes", e\.target\.value\)\}\s+className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"\s*\/>/g;

content = content.replace(inputRegex, '');

fs.writeFileSync(filePath, content);
console.log('done remove input');
