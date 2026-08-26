const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace Table width and TableHead widths
content = content.replace('<Table className="min-w-[1000px]">', '<Table className="min-w-[1400px]">');
content = content.replace('<TableHead className="w-[180px]">Annex B (Type)</TableHead>', '<TableHead className="w-[200px]">Annex B (Type)</TableHead>');
content = content.replace('<TableHead className="w-[180px]">Annex C (Findings)</TableHead>', '<TableHead className="w-[320px]">Annex C (Findings)</TableHead>');
content = content.replace('<TableHead className="w-[180px]">Annex D (Conclusion)</TableHead>', '<TableHead className="w-[320px]">Annex D (Conclusion)</TableHead>');
content = content.replace('<TableHead className="w-[180px]">Annex G (Component)</TableHead>', '<TableHead className="w-[320px]">Annex G (Component)</TableHead>');

// Replace flex col with flex row
content = content.replace(
  /<div className="flex flex-col gap-2">/g, 
  '<div className="flex gap-2">'
);

// Replace select className to use flex-1 min-w-0 for even split and proper truncation
content = content.replace(
  /className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"/g,
  'className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"'
);
content = content.replace(
  /className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring disabled:opacity-50"/g,
  'className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring disabled:opacity-50"'
);

// We also need to fix the min-w of TableCell to match the new TableHead widths
content = content.replace(
  /<TableCell className="p-3 align-top min-w-\[200px\]">/g,
  '<TableCell className="p-3 align-top">'
);

fs.writeFileSync(filePath, content);
console.log('done');
