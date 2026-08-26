const fs = require('fs');

function fixCalls(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // toast({ title: "...", description: "..." }) -> toast.success("...", { description: "..." })
  // We'll just replace specific strings we know we added.
  
  content = content.replace(
    'toast({ title: "Success", description: "Investigation details saved successfully." });',
    'toast.success("Success", { description: "Investigation details saved successfully." });'
  );
  
  content = content.replace(
    'toast({ title: "Draft Saved", description: "Summary draft has been successfully saved." });',
    'toast.success("Draft Saved", { description: "Summary draft has been successfully saved." });'
  );

  content = content.replace(
    'toast({ title: "Completed", description: "Investigation has been signed and completed." });',
    'toast.success("Completed", { description: "Investigation has been signed and completed." });'
  );
  
  fs.writeFileSync(filePath, content);
}

fixCalls('components/investigation-edit-form.tsx');
fixCalls('components/investigation-summary-form.tsx');

console.log('done fix calls');
