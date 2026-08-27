const oldRecord = { shortDescription: "Old", priority: "LOW" };
const newRecord = { shortDescription: "New", priority: "LOW" };

const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);
const changes = [];
for (const key of allKeys) {
  const oldVal = oldRecord[key];
  const newVal = newRecord[key];
  const oldStr = typeof oldVal === 'object' && oldVal !== null ? JSON.stringify(oldVal) : oldVal;
  const newStr = typeof newVal === 'object' && newVal !== null ? JSON.stringify(newVal) : newVal;
  if (oldStr !== newStr) {
    changes.push({ field: key, oldValue: oldVal ?? null, newValue: newVal ?? null });
  }
}
console.log(changes);
