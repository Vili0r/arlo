const fs = require('fs');
const filePath = 'app/layout.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('import { Toaster } from "@/components/ui/toaster"')) {
  content = 'import { Toaster } from "@/components/ui/toaster";\n' + content;
  content = content.replace('{children}\n          </ClerkProvider>', '{children}\n            <Toaster />\n          </ClerkProvider>');
  fs.writeFileSync(filePath, content);
  console.log('done layout');
} else {
  console.log('already added');
}
