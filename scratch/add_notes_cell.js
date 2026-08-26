const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const targetStr = '<TableCell className="p-3 text-center align-middle opacity-0 group-hover:opacity-100 transition-opacity">';

const notesCell = `                                  <TableCell className="p-3 align-top min-w-[200px]">
                                    <textarea
                                      placeholder="Notes (optional)"
                                      value={group[0]?.notes || ""}
                                      onChange={(e) => handleGroupNotesChange(groupIdx, e.target.value)}
                                      className="w-full min-h-[60px] rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring resize-y"
                                    />
                                  </TableCell>\n                                      `;

content = content.replace(targetStr, notesCell + targetStr);

fs.writeFileSync(filePath, content);
console.log('done add notes cell');
