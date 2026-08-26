const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const functionToAdd = `
  const handleGroupNotesChange = (groupIndex: number, notes: string) => {
    setImdrfGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const newGroup = [...newGroups[groupIndex]];
      for (let i = 0; i < newGroup.length; i++) {
        newGroup[i] = { ...newGroup[i], notes };
      }
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  };
`;

content = content.replace(
  '  const handleGroupProductChange = (groupIndex: number, productId: string) => {',
  functionToAdd + '\n  const handleGroupProductChange = (groupIndex: number, productId: string) => {'
);

// Modify Table width and TableHead
content = content.replace(
  '<Table className="min-w-[1000px]">',
  '<Table className="min-w-[1150px]">'
);
content = content.replace(
  '<TableHead className="w-[180px]">Annex G (Component)</TableHead>',
  '<TableHead className="w-[180px]">Annex G (Component)</TableHead>\n                                  <TableHead className="w-[200px]">Notes</TableHead>'
);

// Add the Notes TableCell
// The last TableCell currently is the Trash icon button
const trashCellRegex = /(<TableCell className="p-3 align-top text-center">\s*<Button\s*type="button"\s*variant="ghost"\s*size="sm"\s*onClick=\{\(\) => removeImdrfGroup\(groupIdx\)\}\s*className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"\s*>\s*<Trash2 className="h-4 w-4" \/>\s*<\/Button>\s*<\/TableCell>)/;

const notesCell = `                                  <TableCell className="p-3 align-top">
                                    <textarea
                                      placeholder="Notes (optional)"
                                      value={group[0]?.notes || ""}
                                      onChange={(e) => handleGroupNotesChange(groupIdx, e.target.value)}
                                      className="w-full min-h-[60px] rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring resize-y"
                                    />
                                  </TableCell>\n                                  `;

content = content.replace(trashCellRegex, notesCell + '$1');

fs.writeFileSync(filePath, content);
console.log('done add notes column');
