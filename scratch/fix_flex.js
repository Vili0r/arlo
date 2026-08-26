const fs = require('fs');
const filePath = 'components/investigation-edit-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// The block to replace:
/*
                                    return (
                                      <div className="flex flex-col gap-2">
                                        <select
                                          required
...
                                      </div>
*/
const startIndex = content.indexOf('return (', content.indexOf('const subCodes = getSubCodeOptions();'));
const endIndex = content.indexOf('};', startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find block!");
  process.exit(1);
}

const newBlock = `return (
                                      <div className="flex gap-2">
                                        <select
                                          required
                                          value={codeObj?.category || ""}
                                          onChange={(e) => {
                                            const selectedCat = e.target.value;
                                            const categoryOption = categories.find(o => o.value === selectedCat);
                                            
                                            handleImdrfCodeChange(groupIdx, actualIndex, "category", selectedCat);
                                            
                                            // Check if this category has subcodes
                                            let catSubCodes = [];
                                            if (annex === "ANNEX_C") catSubCodes = IMDRF_ANNEX_C_SUBCAT_MAP[selectedCat] || [];
                                            if (annex === "ANNEX_D") catSubCodes = IMDRF_ANNEX_D_SUBCAT_MAP[selectedCat] || [];
                                            if (annex === "ANNEX_G") catSubCodes = IMDRF_ANNEX_G_SUBCAT_MAP[selectedCat] || [];

                                            if (annex === "ANNEX_B" || (selectedCat && catSubCodes.length === 0)) {
                                              handleImdrfCodeChange(groupIdx, actualIndex, "code", selectedCat);
                                              handleImdrfCodeChange(groupIdx, actualIndex, "term", categoryOption ? categoryOption.label.split(" - ")[1] || categoryOption.label : "");
                                            } else {
                                              handleImdrfCodeChange(groupIdx, actualIndex, "code", "");
                                              handleImdrfCodeChange(groupIdx, actualIndex, "term", "");
                                            }
                                          }}
                                          className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"
                                        >
                                          <option value="">{annex === "ANNEX_B" ? "Code..." : "Category..."}</option>
                                          {categories.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                        
                                        {annex !== "ANNEX_B" && codeObj?.category && subCodes.length > 0 && (
                                          <select
                                            required
                                            value={codeObj?.code || ""}
                                            onChange={(e) => {
                                              const selectedVal = e.target.value;
                                              const option = subCodes.find(o => o.value === selectedVal);
                                              handleImdrfCodeChange(groupIdx, actualIndex, "code", selectedVal);
                                              handleImdrfCodeChange(groupIdx, actualIndex, "term", option ? option.label.split(" - ")[1] || option.label : "");
                                            }}
                                            className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring"
                                          >
                                            <option value="">Code...</option>
                                            {subCodes.map(opt => (
                                              <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                        
                                        {annex !== "ANNEX_B" && !codeObj?.category && (
                                          <select
                                            required
                                            disabled
                                            value=""
                                            className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring opacity-50"
                                          >
                                            <option value="">Code...</option>
                                          </select>
                                        )}
                                      </div>
                                    );
                                  `;

const before = content.slice(0, startIndex);
const after = content.slice(endIndex);

fs.writeFileSync(filePath, before + newBlock + after);
console.log('done flex');
