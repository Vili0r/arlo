const fs = require('fs');
let content;

// fix edit form
content = fs.readFileSync('components/investigation-edit-form.tsx', 'utf-8');
content = content.replace('import { useToast } from "@/hooks/use-toast";', 'import { toast } from "@/components/ui/toast";');
content = content.replace('const { toast } = useToast();', '');
fs.writeFileSync('components/investigation-edit-form.tsx', content);

// fix summary form
content = fs.readFileSync('components/investigation-summary-form.tsx', 'utf-8');
content = content.replace('import { useToast } from "@/hooks/use-toast";', 'import { toast } from "@/components/ui/toast";');
content = content.replace('const { toast } = useToast();', '');
fs.writeFileSync('components/investigation-summary-form.tsx', content);

console.log('done fix forms');
