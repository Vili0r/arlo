const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Revert Table width
content = content.replace('<Table className="min-w-[1400px]">', '<Table className="min-w-[1000px]">');

// Revert TableHead widths
content = content.replace('<TableHead className="w-[320px]">Annex C (Findings)</TableHead>', '<TableHead className="w-[180px]">Annex C (Findings)</TableHead>');
content = content.replace('<TableHead className="w-[320px]">Annex D (Conclusion)</TableHead>', '<TableHead className="w-[180px]">Annex D (Conclusion)</TableHead>');
content = content.replace('<TableHead className="w-[320px]">Annex G (Component)</TableHead>', '<TableHead className="w-[180px]">Annex G (Component)</TableHead>');

// Also maybe B was bumped from 180 to 200, but 200 is fine. Let's make it 180 to be safe.
content = content.replace('<TableHead className="w-[200px]">Annex B (Type)</TableHead>', '<TableHead className="w-[180px]">Annex B (Type)</TableHead>');

// Revert flex direction
content = content.replace(
  /<div className="flex gap-2">/g, 
  '<div className="flex flex-col gap-2">'
);

// Revert select className back to w-full instead of flex-1 min-w-0
content = content.replace(
  /className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"/g,
  'className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"'
);
content = content.replace(
  /className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring opacity-50"/g,
  'className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring opacity-50"'
);

fs.writeFileSync(filePath, content);
console.log('done revert');
