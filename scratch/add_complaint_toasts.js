const fs = require('fs');

// 1. Process new-complaint-form.tsx
let newForm = fs.readFileSync('components/new-complaint-form.tsx', 'utf-8');
if (!newForm.includes('import { toast } from "sonner";')) {
  newForm = newForm.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { toast } from "sonner";'
  );
  
  newForm = newForm.replace(
    'router.push("/complaints");\n      router.refresh();',
    'toast.success("Complaint Created", { description: "The new complaint has been successfully created." });\n      router.push("/complaints");\n      router.refresh();'
  );
  fs.writeFileSync('components/new-complaint-form.tsx', newForm);
}

// 2. Process complaint-edit-form.tsx
let editForm = fs.readFileSync('components/complaint-edit-form.tsx', 'utf-8');
if (!editForm.includes('import { toast } from "sonner";')) {
  editForm = editForm.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { toast } from "sonner";'
  );
  
  // Remove successMessage state
  editForm = editForm.replace(/  const \[successMessage, setSuccessMessage\] = React\.useState<string \| null>\(null\);\n/g, '');
  
  // Remove clearing it
  editForm = editForm.replace(/    setSuccessMessage\(null\);\n/g, '');
  
  // Replace setSuccessMessage with toast.success
  editForm = editForm.replace(
    /      setSuccessMessage\("Complaint details updated successfully\."\);\n/g,
    '      toast.success("Success", { description: "Complaint details updated successfully." });\n'
  );
  
  editForm = editForm.replace(
    /      setSuccessMessage\("Customer communication logged successfully\."\);\n/g,
    '      toast.success("Success", { description: "Customer communication logged successfully." });\n'
  );
  
  editForm = editForm.replace(
    /      setSuccessMessage\("Sample & RMA management updated successfully\."\);\n/g,
    '      toast.success("Success", { description: "Sample & RMA management updated successfully." });\n'
  );

  // Remove the inline rendering block of success message
  const renderBlock = /        \{successMessage && \([\s\S]*?        \)\}\n\n/g;
  editForm = editForm.replace(renderBlock, '');

  fs.writeFileSync('components/complaint-edit-form.tsx', editForm);
}

console.log('done complaint toasts');
