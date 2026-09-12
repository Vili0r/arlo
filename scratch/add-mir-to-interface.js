const fs = require('fs');

function addFields(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /vigilanceDecisionTrees\?: RelatedVigilance\[\] \| null;/g,
    'vigilanceDecisionTrees?: RelatedVigilance[] | null;\n  initialMIR?: any;\n  finalMIR?: any;'
  );
  fs.writeFileSync(filePath, content);
}

['components/complaints-view.tsx'].forEach(addFields);
