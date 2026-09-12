const fs = require('fs');

function addTableLogic(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const insertAfterStr = `                                            ),
                                          }
                                        : null,`;

  const newRecordsStr = `
                                      initialMIR
                                        ? {
                                            id: \`table-imir-\${initialMIR.id}\`,
                                            rawId: initialMIR.id,
                                            entityType: "InitialMIR",
                                            href: \`/\${orgSlug}/complaints/\${c.id}/initial-mir\`,
                                            icon: <ShieldAlert className="h-3.5 w-3.5" />,
                                            iconColor: "bg-red-500/10 text-red-600 dark:text-red-400",
                                            title: "Initial MIR",
                                            badge: (
                                              <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-500/20 py-0">
                                                {initialMIR.status}
                                              </Badge>
                                            ),
                                            desc: \`Initial Manufacturer Incident Report\`,
                                            rightMeta: (
                                              <span className="font-mono text-[10px]">
                                                MIR #{initialMIR.id.slice(-6)}
                                              </span>
                                            ),
                                          }
                                        : null,
                                      finalMIR
                                        ? {
                                            id: \`table-fmir-\${finalMIR.id}\`,
                                            rawId: finalMIR.id,
                                            entityType: "FinalMIR",
                                            href: \`/\${orgSlug}/complaints/\${c.id}/final-mir\`,
                                            icon: <ShieldAlert className="h-3.5 w-3.5" />,
                                            iconColor: "bg-red-500/10 text-red-600 dark:text-red-400",
                                            title: "Final MIR",
                                            badge: (
                                              <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-500/20 py-0">
                                                {finalMIR.status}
                                              </Badge>
                                            ),
                                            desc: \`Final Manufacturer Incident Report\`,
                                            rightMeta: (
                                              <span className="font-mono text-[10px]">
                                                MIR #{finalMIR.id.slice(-6)}
                                              </span>
                                            ),
                                          }
                                        : null,`;

  // We need to match the second occurrence of this pattern since there are multiple `... : null,` 
  // We can match `vigilance` block end specifically.
  
  const vigilanceEndPattern = /                                            rightMeta: \(\n\s+<span className="font-mono text-\[10px\]">\n\s+Decision Tree #\{vigilance\.id\.slice\(-6\)\}\n\s+<\/span>\n\s+\),\n\s+\}\n\s+: null,/g;
  
  content = content.replace(vigilanceEndPattern, (match) => match + newRecordsStr);

  fs.writeFileSync(filePath, content);
}

['components/complaints-view.tsx'].forEach(addTableLogic);
