// Legacy workspace styles use pixels for type. Keep their proportions while allowing
// the root font preference to scale text independently of borders and layout offsets.
module.exports = function scalableType(source) {
  const relative = (_,prefix,pixels) => prefix + String(Number(pixels)/16) + 'rem';
  return source
    .replace(/(\bfont-size\s*:\s*)(\d+(?:\.\d+)?)px\b/gi,relative)
    .replace(/(\bfont\s*:\s*(?:(?:italic|oblique|normal|bold|bolder|lighter|[1-9]00)\s+)*)(\d+(?:\.\d+)?)px\b/gi,relative);
};
