/** A steady pixel density avoids a character-size jump at a responsive breakpoint. */
export function canvasSize(rect) {
  if (rect.width < 1 || rect.height < 1) return null;
  const width = Math.max(
    360,
    Math.min(800, Math.round(rect.width / 1.6 / 8) * 8),
  );
  return {
    width,
    height: Math.max(1, Math.round((width * rect.height) / rect.width)),
  };
}
export function worldUnit(width) {
  return Math.max(32, Math.min(40, 32 + (width - 400) / 30));
}
