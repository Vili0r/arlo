const fs = require('fs');
let content = fs.readFileSync('components/investigation-summary-form.tsx', 'utf-8');

if (!content.includes('import { toast } from "sonner";')) {
  content = content.replace(
    'import { ShieldCheck, Save, AlertTriangle, Lock } from "lucide-react";',
    'import { ShieldCheck, Save, AlertTriangle, Lock } from "lucide-react";\nimport { toast } from "sonner";'
  );
  fs.writeFileSync('components/investigation-summary-form.tsx', content);
}
console.log('done summary fix');
