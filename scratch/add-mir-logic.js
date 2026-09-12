const fs = require('fs');

function addLogic(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add initialMIR and finalMIR variables and add to totalRelations
  content = content.replace(
    /const totalRelations =\n\s+\(investigation \? 1 : 0\) \+\n\s+\(vigilance \? 1 : 0\) \+\n\s+communications\.length \+\n\s+tasks\.length;/g,
    `const initialMIR = c.initialMIR && c.initialMIR.status !== "CANCELLED" ? c.initialMIR : null;
                    const finalMIR = c.finalMIR && c.finalMIR.status !== "CANCELLED" ? c.finalMIR : null;
                    const totalRelations =
                      (investigation ? 1 : 0) +
                      (vigilance ? 1 : 0) +
                      (initialMIR ? 1 : 0) +
                      (finalMIR ? 1 : 0) +
                      communications.length +
                      tasks.length;`
  );

  fs.writeFileSync(filePath, content);
}

['components/complaints-view.tsx'].forEach(addLogic);
