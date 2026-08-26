const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('import { useToast } from "@/hooks/use-toast"')) {
  content = content.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { useToast } from "@/hooks/use-toast";'
  );
  
  content = content.replace(
    '  const router = useRouter();',
    '  const router = useRouter();\n  const { toast } = useToast();'
  );

  content = content.replace(
    'setSuccessMessage("Investigation details saved successfully.");',
    'setSuccessMessage("Investigation details saved successfully.");\n      toast({ title: "Success", description: "Investigation details saved successfully." });'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('done toast');
}
