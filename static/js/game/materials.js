/** Small, repeatable material maps. No external textures or reference-image copies. */
export function createMaterials() {
  const cache = new Map();
  function texture(color, kind = "metal") {
    const key = color + kind;
    if (cache.has(key)) return cache.get(key);
    const surface = document.createElement("canvas");
    surface.width = surface.height = 64;
    const c = surface.getContext("2d");
    c.fillStyle = color;
    c.fillRect(0, 0, 64, 64);
    let seed = [...key].reduce((a, v) => a * 31 + v.charCodeAt(0), 7) >>> 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 100; i++) {
      const value = random() > 0.47 ? 150 : 0;
      c.fillStyle = `rgba(${value},${value},${value},${random() * 0.055})`;
      c.fillRect(
        Math.floor(random() * 64),
        Math.floor(random() * 64),
        1 + Math.floor(random() * 3),
        1 + Math.floor(random() * 3),
      );
    }
    if (kind === "wall") {
      for (let i = 0; i < 8; i++) {
        c.fillStyle = `rgba(8,13,10,${0.025 + random() * 0.035})`;
        c.fillRect(
          random() * 64,
          random() * 42,
          2 + random() * 6,
          12 + random() * 30,
        );
      }
      c.fillStyle = "#12181320";
      c.fillRect(0, 51, 64, 13);
    }
    if (kind === "tile") {
      c.fillStyle = "#29352f";
      c.fillRect(0, 0, 64, 2);
      c.fillRect(0, 0, 2, 64);
      c.fillStyle = "#a1a49025";
      c.fillRect(2, 2, 62, 1);
      c.fillRect(2, 2, 1, 62);
      c.strokeStyle = "#121b1640";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(37, 0);
      c.lineTo(30, 16);
      c.lineTo(36, 27);
      c.stroke();
    }
    if (kind === "metal") {
      c.fillStyle = "#c0c1a608";
      for (let y = 3; y < 64; y += 16) c.fillRect(0, y, 64, 1);
    }
    cache.set(key, surface);
    return surface;
  }
  return { texture };
}

/** Affine UV mapping intentionally retains the distortion of early 3D hardware. */
export function drawTexturedFace(ctx, points, image) {
  const triangle = (a, b, c, uv) => {
    const [u0, v0, u1, v1, u2, v2] = uv;
    const den = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
    if (!den) return;
    const coeff = (p, q, r) => [
      (p * (v1 - v2) + q * (v2 - v0) + r * (v0 - v1)) / den,
      (p * (u2 - u1) + q * (u0 - u2) + r * (u1 - u0)) / den,
      (p * (u1 * v2 - u2 * v1) +
        q * (u2 * v0 - u0 * v2) +
        r * (u0 * v1 - u1 * v0)) /
        den,
    ];
    const x = coeff(a.x, b.x, c.x),
      y = coeff(a.y, b.y, c.y);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.clip();
    ctx.transform(x[0], y[0], x[1], y[1], x[2], y[2]);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  };
  triangle(points[0], points[1], points[2], [0, 0, 64, 0, 64, 64]);
  if (points.length === 4)
    triangle(points[0], points[2], points[3], [0, 0, 64, 64, 0, 64]);
}
