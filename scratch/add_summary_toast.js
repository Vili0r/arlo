const fs = require('fs');
const filePath = 'components/investigation-summary-form.tsx';
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
    '// Handle success notification\n    } catch (err: any) {',
    'toast({ title: "Draft Saved", description: "Summary draft has been successfully saved." });\n    } catch (err: any) {'
  );

  content = content.replace(
    '// Handle success notification and likely redirect\n    } catch (err: any) {',
    'toast({ title: "Completed", description: "Investigation has been signed and completed." });\n    } catch (err: any) {'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('done summary toast');
}
