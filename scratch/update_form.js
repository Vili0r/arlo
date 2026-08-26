const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Add notes?: string to ImdrfCodeInput interface
content = content.replace(
  '  code: string;\n  term: string;\n}',
  '  code: string;\n  term: string;\n  notes?: string;\n}'
);

// We need to add the input field. Where to add it?
// The user said: "add the free text input in the investigaiton annex data table dialog"
// Inside the TableCell that renders the selects for Annex B, C, D, G:
/*
  return (
    <div className="flex flex-col gap-2">
      <select ... > ... </select>
      {annex !== "ANNEX_B" && ... }
      <input type="text" placeholder="Notes (optional)" ... />
    </div>
  )
*/

// Let's replace the end of the return statement in getCodeSelects
content = content.replace(
  /                                        \)\}\n                                      <\/div>\n                                    \);\n/g,
  `                                        )}\n                                        <input\n                                          type="text"\n                                          placeholder="Notes (optional)"\n                                          value={codeObj?.notes || ""}\n                                          onChange={(e) => handleImdrfCodeChange(groupIdx, actualIndex, "notes", e.target.value)}\n                                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"\n                                        />\n                                      </div>\n                                    );\n`
);

fs.writeFileSync(filePath, content);
console.log('done form');
