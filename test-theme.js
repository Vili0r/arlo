const LIGHT_THEME = { name: "LIGHT" };
const DARK_THEME = { name: "DARK" };

function getRelativeLuminance(color) {
  if (!color || color === "transparent") return 1;

  const hex = color;

  if (color.startsWith("rgb")) {
    const matches = color.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length < 3) return 1;
    const r = parseInt(matches[0], 10) / 255;
    const g = parseInt(matches[1], 10) / 255;
    const b = parseInt(matches[2], 10) / 255;
    const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  if (color === "white") return 1;
  if (color === "black") return 0;

  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  
  if (clean.length < 6) return 1;
  
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return 1;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

console.log(getRelativeLuminance("rgba(0,0,0,0)"));
console.log(getRelativeLuminance("#ffffff"));
console.log(getRelativeLuminance("#000000"));
console.log(getRelativeLuminance("#141419"));
