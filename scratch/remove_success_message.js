const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Remove the state
content = content.replace(/  const \[successMessage, setSuccessMessage\] = React\.useState<string \| null>\(null\);\n/g, '');

// Remove setSuccessMessage(null);
content = content.replace(/    setSuccessMessage\(null\);\n/g, '');

// Remove setSuccessMessage("...");
content = content.replace(/      setSuccessMessage\("Investigation details saved successfully\."\);\n/g, '');

// Remove the render block
const renderBlock = /        \{successMessage && \([\s\S]*?        \)\}\n\n/g;
content = content.replace(renderBlock, '');

fs.writeFileSync(filePath, content);
console.log('done removing success message');
